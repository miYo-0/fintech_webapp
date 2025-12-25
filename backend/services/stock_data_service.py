"""Stock data service - Finnhub PRIMARY + Alpha Vantage for historical ONLY"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class StockDataService:
    """Service for fetching stock market data using Finnhub + Alpha Vantage (historical only)"""
    
    def __init__(self, config=None, cache_service=None):
        """Initialize stock data service"""
        self.config = config or {}
        self.cache_service = cache_service
        self.finnhub_key = self.config.get('FINNHUB_API_KEY', '')
        self.alpha_vantage_key = self.config.get('ALPHA_VANTAGE_API_KEY', '')
        
        # Initialize Finnhub (PRIMARY for quotes)
        self.finnhub = None
        if self.finnhub_key:
            from services.finnhub_service import FinnhubService
            self.finnhub = FinnhubService(self.finnhub_key, cache_service)
            logger.info("✅ Finnhub PRIMARY (quotes, 60/min)")
        else:
            logger.error("❌ NO FINNHUB API KEY!")
        
        # Initialize Alpha Vantage (SECONDARY for historical data ONLY)
        self.alpha_vantage = None
        if self.alpha_vantage_key:
            from services.alpha_vantage_service import AlphaVantageService
            self.alpha_vantage = AlphaVantageService(self.alpha_vantage_key, cache_service)
            logger.info("✅ Alpha Vantage SECONDARY (historical only, 5/min)")
        else:
            logger.warning("⚠️ No Alpha Vantage - historical data limited")
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search stocks - simplified version"""
        return [{'symbol': query.upper(), 'name': query.upper(), 'exchange': 'US', 'type': 'EQUITY'}]
    
    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get quote - FINNHUB ONLY"""
        if not self.finnhub:
            logger.error(f"❌ No Finnhub: {symbol}")
            return None
        try:
            quote = self.finnhub.get_quote(symbol)
            if quote:
                logger.debug(f"✅ Finnhub quote: {symbol}")
            return quote
        except Exception as e:
            logger.error(f"❌ Quote error {symbol}: {e}")
            return None
    
    def get_historical_data(self, symbol: str, period: str = '1y', interval: str = '1d') -> List[Dict[str, Any]]:
        """
        Get historical data - Finnhub FIRST, Alpha Vantage FALLBACK
        
        Strategy:
        1. Try Finnhub candles (fast, 60/min)
        2. If Finnhub returns no data, try Alpha Vantage (slower, 5/min)
        3. Cache aggressively to minimize API usage
        """
        # Try Finnhub first (FREE tier, 60 calls/min)
        if self.finnhub:
            try:
                from datetime import datetime, timedelta
                days = {'1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730}.get(period, 365)
                to_ts = int(datetime.now().timestamp())
                from_ts = int((datetime.now() - timedelta(days=days)).timestamp())
                
                data = self.finnhub.get_candles(symbol, 'D', from_ts, to_ts)
                
                if data and len(data) > 0:
                    logger.info(f"✅ Finnhub historical {symbol}: {len(data)} records")
                    return data
                else:
                    logger.debug(f"⚠️ Finnhub no data for {symbol}, trying Alpha Vantage...")
            except Exception as e:
                logger.warning(f"Finnhub historical error {symbol}: {e}")
        
        # Fallback to Alpha Vantage for historical (ONLY if Finnhub fails)
        if self.alpha_vantage:
            try:
                # Determine output size based on period
                outputsize = 'full' if period in ['1y', '2y', '5y'] else 'compact'
                
                data = self.alpha_vantage.get_historical_data(symbol, outputsize)
                
                if data and len(data) > 0:
                    logger.info(f"✅ Alpha Vantage historical {symbol}: {len(data)} records")
                    # Limit to requested period
                    if period != 'full':
                        days = {'1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730}.get(period, 365)
                        data = data[:days]
                    return data
                else:
                    logger.warning(f"⚠️ No Alpha Vantage data for {symbol}")
            except Exception as e:
                logger.error(f"❌ Alpha Vantage error {symbol}: {e}")
        
        logger.error(f"❌ No historical data available for {symbol}")
        return []
    
    def get_company_info(self, symbol: str):
        """Company info DISABLED"""
        return None
    
    def get_market_indices(self) -> List[Dict[str, Any]]:
        """Get market indices with caching"""
        cache_key = "market:indices:full"
        if self.cache_service:
            cached = self.cache_service.get(cache_key)
            if cached:
                logger.debug("✅ Market indices from cache")
                return cached
        
        logger.info("Fetching fresh market indices...")
        symbols = {'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corp.', 'GOOGL': 'Alphabet Inc.', 'AMZN': 'Amazon.com Inc.'}
        
        indices = []
        for symbol, name in symbols.items():
            quote = self.get_quote(symbol)
            if quote:
                quote['name'] = name
                quote['category'] = 'market_leader'
                indices.append(quote)
        
        if self.cache_service and indices:
            self.cache_service.set(cache_key, indices, 3600)
            logger.info(f"Cached {len(indices)} indices (1hr)")
        
        return indices
    
    def get_top_gainers_losers(self, market: str = 'US', limit: int = 10) -> Dict[str, List[Dict[str, Any]]]:
        """Get top movers - uses cached quotes from popular stocks"""
        try:
            # Check cache first (1 hour TTL)
            cache_key = f"market:movers:{market}:{limit}"
            if self.cache_service:
                cached = self.cache_service.get(cache_key)
                if cached:
                    logger.debug("✅ Top movers from cache")
                    return cached
            
            logger.info("Calculating top movers...")
            symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'DIS', 
                      'PYPL', 'INTC', 'CSCO', 'ADBE', 'CRM', 'ORCL']
            
            stocks = []
            for symbol in symbols[:limit * 3]:  # Fetch 3x to ensure enough data
                quote = self.get_quote(symbol)
                if quote and quote.get('change_percent') is not None:
                    stocks.append(quote)
            
            stocks.sort(key=lambda x: x['change_percent'], reverse=True)
            gainers = [s for s in stocks if s['change_percent'] > 0][:limit]
            losers = [s for s in stocks if s['change_percent'] < 0][-limit:]
            losers.reverse()
            
            result = {'gainers': gainers, 'losers': losers}
            
            # Cache for 1 hour
            if self.cache_service:
                self.cache_service.set(cache_key, result, 3600)
                logger.info(f"Cached top movers (1hr): {len(gainers)} gainers, {len(losers)} losers")
            
            return result
        except Exception as e:
            logger.error(f"Error getting movers: {e}")
            return {'gainers': [], 'losers': []}
    
    def validate_symbol(self, symbol: str) -> bool:
        """Validate symbol"""
        if not self.finnhub:
            return False
        try:
            quote = self.finnhub.get_quote(symbol)
            return quote is not None
        except:
            return False
