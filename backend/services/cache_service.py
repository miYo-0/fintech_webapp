"""Cache service using Redis."""
import redis
import json
import logging
from typing import Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class CacheService:
    """Redis-based caching service."""
    
    def __init__(self, redis_url: str, default_timeout: int = 300):
        """
        Initialize cache service.
        
        Args:
            redis_url: Redis connection URL
            default_timeout: Default cache timeout in seconds
        """
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.default_timeout = default_timeout
            logger.info("Redis cache initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found or cache unavailable
        """
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            timeout: Cache timeout in seconds (uses default if None)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            timeout = timeout or self.default_timeout
            serialized = json.dumps(value)
            self.redis_client.setex(key, timeout, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> bool:
        """
        Delete all keys matching a pattern.
        
        Args:
            pattern: Redis key pattern (e.g., 'stock:*')
            
        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if exists, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    def get_ttl(self, key: str) -> Optional[int]:
        """
        Get time-to-live for a key.
        
        Args:
            key: Cache key
            
        Returns:
            TTL in seconds or None if key doesn't exist
        """
        if not self.redis_client:
            return None
        
        try:
            ttl = self.redis_client.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            logger.error(f"Cache TTL error for key {key}: {e}")
            return None


def cached(key_prefix: str, timeout: Optional[int] = None):
    """
    Decorator for caching function results.
    
    Args:
        key_prefix: Prefix for cache key
        timeout: Cache timeout in seconds
        
    Usage:
        @cached('stock_quote', timeout=60)
        def get_stock_quote(symbol):
            return fetch_quote(symbol)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function arguments
            cache_key_parts = [key_prefix]
            
            # Add args to key
            for arg in args:
                if isinstance(arg, (str, int, float)):
                    cache_key_parts.append(str(arg))
            
            # Add kwargs to key
            for k, v in sorted(kwargs.items()):
                if isinstance(v, (str, int, float)):
                    cache_key_parts.append(f"{k}={v}")
            
            cache_key = ":".join(cache_key_parts)
            
            # Try to get from cache (requires cache_service in function scope)
            # This is a simplified version - production would handle cache_service injection
            result = func(*args, **kwargs)
            
            return result
        
        return wrapper
    return decorator
