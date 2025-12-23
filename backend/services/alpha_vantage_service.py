"""Alpha Vantage API service wrapper with aggressive caching."""
import requests
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from services.alpha_vantage_limiter import AlphaVantageRateLimiter

logger = logging.getLogger(__name__)

# Ultra-aggressive cache TTLs to minimize API calls
CACHE_TTL = {
    'quote': 3600,      # 1 hour - real-time not critical
    'indices': 7200,    # 2 hours - changes slowly 
    'search': 86400,    # 24 hours - names don't change
    'intraday': 1800,   # 30 minutes
}


class AlphaVantageService:
    """
    Alpha Vantage API wrapper with rate limiting and caching.
    
    Strategy:
    1. ALWAYS check cache first
    2. Only call API if cache miss AND rate limit allows
    3. If rate limited, return stale cache or None
    4. Cache ALL successful responses aggressively
    """
    
    def __init__(self, api_key: str, cache_service=None):
        """
        Initialize Alpha Vantage service.
        
        Args:
            api_key: Alpha Vantage API key
            cache_service: Optional cache service for caching
        """
        self.api_key = api_key
        self.cache_service = cache_service
        self.rate_limiter = AlphaVantageRateLimiter()
        self.base_url = 'https://www.alphavantage.co/query'
        
        logger.info("Alpha Vantage service initialized with cache-first strategy")
    
    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get real-time quote with cache-first strategy.
        
        CACHE-FIRST: API is ONLY called if:
        1. Cache is completely empty
        2. Rate limiter allows request
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Quote data or None if unavailable
        """
        cache_key = f"av:quote:{symbol}"
        
        # STEP 1: Check cache first (ALWAYS)
        if self.cache_service:
            cached = self.cache_service.get(cache_key)
            if cached:
                logger.debug(f"Cache HIT for {symbol} (no API call)")
                return cached
        
        # STEP 2: Cache miss - try API if rate limit allows
        if not self.rate_limiter.acquire():
            logger.warning(f"Rate limit reached for {symbol}, checking stale cache")
            
            # Try stale cache as fallback
            if self.cache_service:
                stale = self.cache_service.get(f"{cache_key}:stale")
                if stale:
                    logger.info(f"Returning stale cache for {symbol}")
                    return stale
            
            logger.error(f"No data available for {symbol} (rate limited, no cache)")
            return None
        
        # STEP 3: Make API call
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Check for API error
            if 'Error Message' in data:
                logger.error(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                return None
            
            if 'Note' in data:
                logger.warning(f"Alpha Vantage note for {symbol}: {data['Note']}")
                return None
            
            quote_data = data.get('Global Quote', {})
            if not quote_data:
                logger.warning(f"No quote data returned for {symbol}")
                return None
            
            # Parse quote
            quote = {
                'symbol': symbol.upper(),
                'name': symbol,  # Alpha Vantage doesn't return name in quote
                'price': float(quote_data.get('05. price', 0)),
                'change': float(quote_data.get('09. change', 0)),
                'change_percent': float(quote_data.get('10. change percent', '0').replace('%', '')),
                'open': float(quote_data.get('02. open', 0)),
                'high': float(quote_data.get('03. high', 0)),
                'low': float(quote_data.get('04. low', 0)),
                'previous_close': float(quote_data.get('08. previous close', 0)),
                'volume': int(quote_data.get('06. volume', 0)),
                'updated_at': datetime.utcnow().isoformat(),
                'source': 'alpha_vantage'
            }
            
            # STEP 4: Cache aggressively
            if self.cache_service:
                # Regular cache (1 hour)
                self.cache_service.set(cache_key, quote, CACHE_TTL['quote'])
                
                # Stale backup (10 hours)
                self.cache_service.set(f"{cache_key}:stale", quote, CACHE_TTL['quote'] * 10)
                
                logger.info(f"Cached quote for {symbol} (1h fresh, 10h stale)")
            
            return quote
            
        except Exception as e:
            logger.error(f"Alpha Vantage API error for {symbol}: {e}")
            
            # Try stale cache on error
            if self.cache_service:
                stale = self.cache_service.get(f"{cache_key}:stale")
                if stale:
                    logger.info(f"Returning stale cache after error for {symbol}")
                    return stale
            
            return None
    
    def search_symbol(self, keywords: str) -> List[Dict[str, Any]]:
        """
        Search for symbols with cache-first strategy.
        
        Args:
            keywords: Search keywords
            
        Returns:
            List of matching symbols
        """
        cache_key = f"av:search:{keywords.lower()}"
        
        # Check cache first
        if self.cache_service:
            cached = self.cache_service.get(cache_key)
            if cached:
                logger.debug(f"Cache HIT for search '{keywords}' (no API call)")
                return cached
        
        # Try API if rate limit allows
        if not self.rate_limiter.acquire():
            logger.warning(f"Rate limit reached for search '{keywords}'")
            return []
        
        try:
            params = {
                'function': 'SYMBOL_SEARCH',
                'keywords': keywords,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            matches = data.get('bestMatches', [])
            results = []
            
            for match in matches:
                results.append({
                    'symbol': match.get('1. symbol', ''),
                    'name': match.get('2. name', ''),
                    'type': match.get('3. type', ''),
                    'region': match.get('4. region', ''),
                    'currency': match.get('8. currency', 'USD')
                })
            
            # Cache for 24 hours (names don't change)
            if self.cache_service and results:
                self.cache_service.set(cache_key, results, CACHE_TTL['search'])
                logger.info(f"Cached search results for '{keywords}' (24h)")
            
            return results
            
        except Exception as e:
            logger.error(f"Search error for '{keywords}': {e}")
            return []
    
    def get_rate_limit_stats(self) -> Dict[str, Any]:
        """Get current rate limiter statistics."""
        return self.rate_limiter.get_stats()
    def get_historical_data(self, symbol: str, outputsize: str = 'compact') -> List[Dict[str, Any]]:
        """
        Get historical daily data from Alpha Vantage.
        
        Args:
            symbol: Stock symbol
            outputsize: 'compact' (100 days) or 'full' (20+ years)
            
        Returns:
            List of historical price dictionaries
        """
        cache_key = f"av:historical:{symbol}:{outputsize}"
        
        # Check cache first
        if self.cache_service:
            cached = self.cache_service.get(cache_key)
            if cached:
                logger.debug(f"Cache HIT for historical {symbol}")
                return cached
        
        # Try API if rate limit allows
        if not self.rate_limiter.acquire():
            logger.warning(f"Rate limit reached for historical {symbol}")
            # Try stale cache
            if self.cache_service:
                stale = self.cache_service.get(f"{cache_key}:stale")
                if stale:
                    return stale
            return []
        
        try:
            params = {
                'function': 'TIME_SERIES_DAILY',
                'symbol': symbol,
                'outputsize': outputsize,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            # Check for errors
            if 'Error Message' in data or 'Note' in data:
                logger.warning(f"Alpha Vantage error for historical {symbol}")
                return []
            
            time_series = data.get('Time Series (Daily)', {})
            if not time_series:
                return []
            
            # Convert to list format
            historical_data = []
            for date_str, values in sorted(time_series.items()):
                historical_data.append({
                    'date': date_str,
                    'open': float(values['1. open']),
                    'high': float(values['2. high']),
                    'low': float(values['3. low']),
                    'close': float(values['4. close']),
                    'volume': int(values['5. volume'])
                })
            
            # Cache for 1 day (historical data doesn't change)
            if self.cache_service and historical_data:
                self.cache_service.set(cache_key, historical_data, 86400)  # 24 hours
                self.cache_service.set(f"{cache_key}:stale", historical_data, 864000)  # 10 days
                logger.info(f"Cached historical data for {symbol}")
            
            return historical_data
            
        except Exception as e:
            logger.error(f"Error getting historical data for {symbol}: {e}")
            return []
