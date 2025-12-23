"""Rate limiter for Alpha Vantage API."""
import time
from datetime import datetime, date
from threading import Lock
import logging

logger = logging.getLogger(__name__)


class AlphaVantageRateLimiter:
    """
    Thread-safe rate limiter for Alpha Vantage API.
    
    Free tier limits:
    - 5 API calls per minute
    - 500 API calls per day
    """
    
    def __init__(self):
        """Initialize rate limiter."""
        self.lock = Lock()
        self.minute_tokens = 5
        self.daily_calls = 0
        self.last_minute_reset = time.time()
        self.last_day_reset = date.today()
        
        logger.info("Alpha Vantage rate limiter initialized (5/min, 500/day)")
    
    def can_make_request(self) -> bool:
        """
        Check if we can make a request without consuming a token.
        
        Returns:
            True if request is allowed, False if rate limited
        """
        with self.lock:
            self._reset_if_needed()
            return self.minute_tokens > 0 and self.daily_calls < 500
    
    def acquire(self) -> bool:
        """
        Try to acquire permission for an API call.
        Consumes a token if successful.
        
        Returns:
            True if request is allowed and token consumed, False if rate limited
        """
        with self.lock:
            self._reset_if_needed()
            
            if self.minute_tokens > 0 and self.daily_calls < 500:
                self.minute_tokens -= 1
                self.daily_calls += 1
                
                logger.debug(
                    f"Alpha Vantage token acquired "
                    f"(minute: {self.minute_tokens}/5, daily: {self.daily_calls}/500)"
                )
                return True
            
            logger.warning(
                f"Alpha Vantage rate limit reached "
                f"(minute: {self.minute_tokens}/5, daily: {self.daily_calls}/500)"
            )
            return False
    
    def _reset_if_needed(self):
        """Reset tokens if time windows have elapsed."""
        now = time.time()
        today = date.today()
        
        # Reset minute tokens every 60 seconds
        if now - self.last_minute_reset >= 60:
            self.minute_tokens = 5
            self.last_minute_reset = now
            logger.debug("Alpha Vantage minute tokens reset to 5")
        
        # Reset daily counter at midnight
        if today > self.last_day_reset:
            self.daily_calls = 0
            self.last_day_reset = today
            logger.info(f"Alpha Vantage daily counter reset (was {self.daily_calls})")
    
    def get_stats(self) -> dict:
        """Get current rate limiter statistics."""
        with self.lock:
            self._reset_if_needed()
            return {
                'minute_tokens_remaining': self.minute_tokens,
                'daily_calls_used': self.daily_calls,
                'daily_calls_remaining': 500 - self.daily_calls,
                'can_make_request': self.minute_tokens > 0 and self.daily_calls < 500
            }
