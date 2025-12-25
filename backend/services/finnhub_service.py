"""Finnhub API service with ultra-aggressive caching"""
import requests
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from services.finnhub_limiter import FinnhubRateLimiter

logger = logging.getLogger(__name__)

# Ultra-aggressive cache TTLs to minimize API calls
CACHE_TTL = {
    'quote': 7200,      # 2 hours
    'candles': 14400,   # 4 hours  
    'profile': 86400,   # 24 hours
}


class FinnhubService:
    """Finnhub API wrapper with aggressive caching and rate limiting"""
    
    def __init__(self, api_key, cache_service=None):
        self.api_key = api_key
        self.cache = cache_service
        self.limiter = FinnhubRateLimiter(60)
        self.base_url = 'https://finnhub.io/api/v1'
        logger.info("Finnhub service initialized (60/min, cache-first)")
    
    def get_quote(self, symbol):
        """Get stock quote with cache-first strategy"""
        cache_key = f"finnhub:quote:{symbol}"
        
        # ALWAYS check cache first
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                logger.debug(f"Cache HIT: {symbol}")
                return cached
        
        # Cache miss - try API if rate limit allows
        if not self.limiter.can_make_call():
            # Rate limited - try stale cache
            if self.cache:
                stale = self.cache.get(f"{cache_key}:stale")
                if stale:
                    logger.info(f"Stale cache: {symbol}")
                    stale['stale'] = True
                    return stale
            logger.error(f"No data for {symbol} (rate limited)")
            return None
        
        # Make API call
        try:
            params = {'symbol': symbol, 'token': self.api_key}
            resp = requests.get(f"{self.base_url}/quote", params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get('c'):
                return None
            
            quote = {
                'symbol': symbol.upper(),
                'name': symbol,
                'price': round(float(data['c']), 2),
                'change': round(float(data['c'] - data.get('pc', data['c'])), 2),
                'change_percent': round(float((data['c'] - data.get('pc', data['c'])) / data.get('pc', 1) * 100), 2),
                'open': round(float(data.get('o', 0)), 2),
                'high': round(float(data.get('h', 0)), 2),
                'low': round(float(data.get('l', 0)), 2),
                'previous_close': round(float(data.get('pc', 0)), 2),
                'updated_at': datetime.utcnow().isoformat(),
                'source': 'finnhub'
            }
            
            # Cache aggressively
            if self.cache:
                self.cache.set(cache_key, quote, CACHE_TTL['quote'])
                self.cache.set(f"{cache_key}:stale", quote, CACHE_TTL['quote'] * 20)
                logger.info(f"API call + cached: {symbol}")
            
            return quote
            
        except Exception as e:
            logger.error(f"Finnhub error {symbol}: {e}")
            # Try stale cache on error
            if self.cache:
                stale = self.cache.get(f"{cache_key}:stale")
                if stale:
                    stale['stale'] = True
                    return stale
            return None
    
    def get_candles(self, symbol, resolution='D', from_ts=None, to_ts=None):
        """Get historical candles data"""
        if not to_ts:
            to_ts = int(datetime.now().timestamp())
        if not from_ts:
            from_ts = int((datetime.now() - timedelta(days=180)).timestamp())
        
        cache_key = f"finnhub:candles:{symbol}:{resolution}:{from_ts}:{to_ts}"
        
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                return cached
        
        if not self.limiter.can_make_call():
            logger.warning(f"Rate limited (historical {symbol})")
            return []
        
        try:
            params = {
                'symbol': symbol,
                'resolution': resolution,
                'from': from_ts,
                'to': to_ts,
                'token': self.api_key
            }
            
            resp = requests.get(f"{self.base_url}/stock/candle", params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            
            if data.get('s') != 'ok':
                return []
            
            historical = []
            for i in range(len(data.get('t', []))):
                historical.append({
                    'date': datetime.fromtimestamp(data['t'][i]).strftime('%Y-%m-%d'),
                    'open': round(data['o'][i], 2),
                    'high': round(data['h'][i], 2),
                    'low': round(data['l'][i], 2),
                    'close': round(data['c'][i], 2),
                    'volume': int(data['v'][i]) if i < len(data.get('v', [])) else 0
                })
            
            if self.cache and historical:
                self.cache.set(cache_key, historical, CACHE_TTL['candles'])
            
            return historical
            
        except Exception as e:
            logger.error(f"Error getting candles {symbol}: {e}")
            return []
