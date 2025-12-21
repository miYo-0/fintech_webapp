"""Stock data service for fetching market data from multiple sources."""
import yfinance as yf
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class StockDataService:
    """Service for fetching stock market data."""
    
    def __init__(self, config=None):
        """Initialize stock data service."""
        self.config = config or {}
        self.alpha_vantage_key = self.config.get('ALPHA_VANTAGE_API_KEY', '')
        self.finnhub_key = self.config.get('FINNHUB_API_KEY', '')
        self.polygon_key = self.config.get('POLYGON_API_KEY', '')
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for stocks by symbol or name.
        
        Args:
            query: Search query string
            limit: Maximum number of results
            
        Returns:
            List of stock dictionaries with symbol, name, exchange info
        """
        try:
            # Using yfinance Ticker search via direct lookup for now
            # For production, consider using a dedicated search API
            
            results = []
            
            # Try exact symbol match first
            try:
                ticker = yf.Ticker(query.upper())
                info = ticker.info
                
                if info and 'symbol' in info:
                    results.append({
                        'symbol': info.get('symbol', query.upper()),
                        'name': info.get('longName', info.get('shortName', '')),
                        'exchange': info.get('exchange', 'UNKNOWN'),
                        'type': info.get('quoteType', 'EQUITY'),
                        'currency': info.get('currency', 'USD')
                    })
            except Exception as e:
                logger.debug(f"Symbol lookup failed for {query}: {e}")
            
            # For better search, use Alpha Vantage if available
            if self.alpha_vantage_key and len(results) == 0:
                results = self._search_alpha_vantage(query, limit)
            
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Error searching stocks: {e}")
            return []
    
    def _search_alpha_vantage(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search using Alpha Vantage API."""
        try:
            url = 'https://www.alphavantage.co/query'
            params = {
                'function': 'SYMBOL_SEARCH',
                'keywords': query,
                'apikey': self.alpha_vantage_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for match in data.get('bestMatches', [])[:limit]:
                results.append({
                    'symbol': match.get('1. symbol', ''),
                    'name': match.get('2. name', ''),
                    'type': match.get('3. type', ''),
                    'region': match.get('4. region', ''),
                    'currency': match.get('8. currency', 'USD'),
                    'exchange': match.get('4. region', 'US')
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Alpha Vantage search error: {e}")
            return []
    
    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get real-time quote for a stock.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dictionary with quote data including price, change, volume
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info or 'symbol' not in info:
                return None
            
            # Get current price data
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
            
            if not current_price:
                return None
            
            # Calculate change
            price_change = current_price - previous_close if previous_close else 0
            price_change_percent = (price_change / previous_close * 100) if previous_close and previous_close > 0 else 0
            
            quote = {
                'symbol': symbol.upper(),
                'name': info.get('longName', info.get('shortName', '')),
                'price': round(current_price, 2),
                'change': round(price_change, 2),
                'change_percent': round(price_change_percent, 2),
                'open': info.get('regularMarketOpen', info.get('open')),
                'high': info.get('dayHigh', info.get('regularMarketDayHigh')),
                'low': info.get('dayLow', info.get('regularMarketDayLow')),
                'previous_close': previous_close,
                'volume': info.get('volume', info.get('regularMarketVolume')),
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'dividend_yield': info.get('dividendYield'),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                'avg_volume': info.get('averageVolume'),
                'exchange': info.get('exchange', 'UNKNOWN'),
                'currency': info.get('currency', 'USD'),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            return quote
            
        except Exception as e:
            logger.error(f"Error getting quote for {symbol}: {e}")
            return None
    
    def get_historical_data(
        self,
        symbol: str,
        period: str = '1y',
        interval: str = '1d'
    ) -> List[Dict[str, Any]]:
        """
        Get historical price data for a stock.
        
        Args:
            symbol: Stock symbol
            period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
            
        Returns:
            List of historical price dictionaries
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                return []
            
            # Convert DataFrame to list of dictionaries
            data = []
            for date, row in hist.iterrows():
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'open': round(float(row['Open']), 2),
                    'high': round(float(row['High']), 2),
                    'low': round(float(row['Low']), 2),
                    'close': round(float(row['Close']), 2),
                    'volume': int(row['Volume'])
                })
            
            return data
            
        except Exception as e:
            logger.error(f"Error getting historical data for {symbol}: {e}")
            return []
    
    def get_company_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed company information.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dictionary with company details
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info or 'symbol' not in info:
                return None
            
            company_info = {
                'symbol': symbol.upper(),
                'name': info.get('longName', info.get('shortName', '')),
                'sector': info.get('sector'),
                'industry': info.get('industry'),
                'description': info.get('longBusinessSummary', info.get('description', '')),
                'website': info.get('website'),
                'employees': info.get('fullTimeEmployees'),
                'country': info.get('country'),
                'city': info.get('city'),
                'state': info.get('state'),
                'address': info.get('address1'),
                'zip': info.get('zip'),
                'phone': info.get('phone'),
                'market_cap': info.get('marketCap'),
                'enterprise_value': info.get('enterpriseValue'),
                'exchange': info.get('exchange'),
                'currency': info.get('currency', 'USD'),
                'ipo_date': info.get('ipoDate')
            }
            
            return company_info
            
        except Exception as e:
            logger.error(f"Error getting company info for {symbol}: {e}")
            return None
    
    def get_market_indices(self) -> List[Dict[str, Any]]:
        """
        Get major market indices quotes.
        
        Returns:
            List of index quotes
        """
        indices_symbols = {
            '^GSPC': 'S&P 500',
            '^DJI': 'Dow Jones',
            '^IXIC': 'NASDAQ',
            '^RUT': 'Russell 2000',
            '^VIX': 'VIX',
            '^NSEI': 'Nifty 50',
            '^BSESN': 'Sensex'
        }
        
        indices = []
        for symbol, name in indices_symbols.items():
            quote = self.get_quote(symbol)
            if quote:
                quote['name'] = name
                indices.append(quote)
        
        return indices
    
    def get_top_gainers_losers(
        self,
        market: str = 'US',
        limit: int = 10
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get top gainers and losers.
        
        Args:
            market: Market to query (US, IN)
            limit: Number of stocks to return
            
        Returns:
            Dictionary with 'gainers' and 'losers' lists
        """
        # Note: This would typically use a dedicated API
        # For demo purposes, returning sample structure
        return {
            'gainers': [],
            'losers': []
        }
    
    def validate_symbol(self, symbol: str) -> bool:
        """
        Validate if a stock symbol exists.
        
        Args:
            symbol: Stock symbol to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return bool(info and 'symbol' in info)
        except Exception:
            return False
