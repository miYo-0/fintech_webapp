"""Rate limiter for Finnhub API - 60 calls per minute free tier"""
import time
import logging
from collections import deque

logger = logging.getLogger(__name__)


class FinnhubRateLimiter:
    """Rate limiter for Finnhub API (60 calls/minute)"""
    
    def __init__(self, calls_per_minute=60):
        self.calls_per_minute = calls_per_minute
        self.window_size = 60  # seconds
        self.call_timestamps = deque()
        self.total_calls = 0
        self.blocked_calls = 0
        
        logger.info(f"Finnhub rate limiter: {calls_per_minute} calls/min")
    
    def can_make_call(self):
        """Check if we can make an API call"""
        current_time = time.time()
        cutoff = current_time - self.window_size
        
        # Remove old timestamps
        while self.call_timestamps and self.call_timestamps[0] < cutoff:
            self.call_timestamps.popleft()
        
        # Check limit
        if len(self.call_timestamps) < self.calls_per_minute:
            self.call_timestamps.append(current_time)
            self.total_calls += 1
            return True
        
        self.blocked_calls += 1
        wait_time = self.call_timestamps[0] + self.window_size - current_time
        logger.warning(f"Rate limit reached. Wait {wait_time:.1f}s")
        return False
    
    def get_stats(self):
        """Get rate limiter statistics"""
        current_time = time.time()
        cutoff = current_time - self.window_size
        
        while self.call_timestamps and self.call_timestamps[0] < cutoff:
            self.call_timestamps.popleft()
        
        return {
            'calls_this_minute': len(self.call_timestamps),
            'remaining': self.calls_per_minute - len(self.call_timestamps),
            'total_calls': self.total_calls,
            'blocked_calls': self.blocked_calls
        }
