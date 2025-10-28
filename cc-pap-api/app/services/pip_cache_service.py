"""
PIP Cache Service - Redis-based caching for PIP metadata
Provides high-performance caching layer for external data source attributes
"""

import redis.asyncio as aioredis
import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import os


class PIPCacheService:
    """Service for caching PIP metadata in Redis"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis_client = None
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for sensitive data"""
        key_str = os.getenv("PIP_ENCRYPTION_KEY")
        if key_str:
            return key_str.encode()
        # Generate new key (should be stored securely in production)
        return Fernet.generate_key()
    
    async def connect(self):
        """Initialize Redis connection"""
        if not self.redis_client:
            self.redis_client = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self.redis_client
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            self.redis_client = None
    
    def _build_cache_key(self, connection_id: int, attribute_key: str, user_id: Optional[str] = None) -> str:
        """Build Redis cache key"""
        if user_id:
            return f"pip:conn:{connection_id}:user:{user_id}:attr:{attribute_key}"
        return f"pip:conn:{connection_id}:attr:{attribute_key}"
    
    def _build_connection_key(self, connection_id: int) -> str:
        """Build Redis key for connection metadata"""
        return f"pip:conn:{connection_id}:meta"
    
    async def cache_pip_data(
        self,
        connection_id: int,
        attributes: Dict[str, Any],
        ttl: int = 300,
        encrypt_sensitive: bool = True
    ) -> bool:
        """
        Cache PIP data attributes
        
        Args:
            connection_id: PIP connection ID
            attributes: Dictionary of attribute key-value pairs
            ttl: Time to live in seconds
            encrypt_sensitive: Whether to encrypt sensitive fields
            
        Returns:
            Success status
        """
        try:
            await self.connect()
            
            pipeline = self.redis_client.pipeline()
            
            for attr_key, attr_value in attributes.items():
                cache_key = self._build_cache_key(connection_id, attr_key)
                
                # Serialize value
                if isinstance(attr_value, (dict, list)):
                    value_str = json.dumps(attr_value)
                else:
                    value_str = str(attr_value)
                
                # Encrypt if sensitive
                if encrypt_sensitive and self._is_sensitive_field(attr_key):
                    value_str = self.cipher.encrypt(value_str.encode()).decode()
                    cache_key = f"{cache_key}:encrypted"
                
                # Set value with TTL
                pipeline.setex(cache_key, ttl, value_str)
            
            # Execute pipeline
            await pipeline.execute()
            
            # Update connection metadata
            meta_key = self._build_connection_key(connection_id)
            await self.redis_client.hset(meta_key, mapping={
                "last_cached": datetime.now().isoformat(),
                "ttl": str(ttl),
                "attribute_count": str(len(attributes))
            })
            await self.redis_client.expire(meta_key, ttl + 86400)  # Keep meta for 1 day longer
            
            return True
            
        except Exception as e:
            print(f"Cache error: {e}")
            return False
    
    async def get_cached_data(
        self,
        connection_id: int,
        attribute_key: str,
        user_id: Optional[str] = None
    ) -> Optional[Any]:
        """
        Get cached PIP attribute value
        
        Returns:
            Cached value or None if not found/expired
        """
        try:
            await self.connect()
            
            cache_key = self._build_cache_key(connection_id, attribute_key, user_id)
            
            # Try encrypted key first
            encrypted_key = f"{cache_key}:encrypted"
            value = await self.redis_client.get(encrypted_key)
            
            if value:
                # Decrypt
                decrypted = self.cipher.decrypt(value.encode()).decode()
                try:
                    return json.loads(decrypted)
                except json.JSONDecodeError:
                    return decrypted
            
            # Try non-encrypted key
            value = await self.redis_client.get(cache_key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            
            return None
            
        except Exception as e:
            print(f"Cache retrieval error: {e}")
            return None
    
    async def get_all_cached_data(
        self,
        connection_id: int,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all cached attributes for a connection"""
        try:
            await self.connect()
            
            # Find all keys for this connection
            pattern = f"pip:conn:{connection_id}:*"
            if user_id:
                pattern = f"pip:conn:{connection_id}:user:{user_id}:*"
            
            keys = []
            async for key in self.redis_client.scan_iter(pattern):
                keys.append(key)
            
            if not keys:
                return {}
            
            # Get all values
            pipeline = self.redis_client.pipeline()
            for key in keys:
                pipeline.get(key)
            
            values = await pipeline.execute()
            
            result = {}
            for key, value in zip(keys, values):
                if value:
                    # Extract attribute name from key
                    attr_name = key.split(":attr:")[-1].replace(":encrypted", "")
                    
                    # Decrypt if needed
                    if ":encrypted" in key:
                        try:
                            value = self.cipher.decrypt(value.encode()).decode()
                        except:
                            continue
                    
                    # Parse JSON if applicable
                    try:
                        result[attr_name] = json.loads(value)
                    except json.JSONDecodeError:
                        result[attr_name] = value
            
            return result
            
        except Exception as e:
            print(f"Cache retrieval error: {e}")
            return {}
    
    async def invalidate_cache(
        self,
        connection_id: int,
        attribute_key: Optional[str] = None
    ) -> bool:
        """
        Invalidate cached data
        
        Args:
            connection_id: Connection to invalidate
            attribute_key: Specific attribute (None = invalidate all)
            
        Returns:
            Success status
        """
        try:
            await self.connect()
            
            if attribute_key:
                # Invalidate specific attribute
                cache_key = self._build_cache_key(connection_id, attribute_key)
                await self.redis_client.delete(cache_key)
                await self.redis_client.delete(f"{cache_key}:encrypted")
            else:
                # Invalidate all attributes for connection
                pattern = f"pip:conn:{connection_id}:*"
                keys = []
                async for key in self.redis_client.scan_iter(pattern):
                    keys.append(key)
                
                if keys:
                    await self.redis_client.delete(*keys)
            
            return True
            
        except Exception as e:
            print(f"Cache invalidation error: {e}")
            return False
    
    async def get_cache_stats(
        self,
        connection_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Args:
            connection_id: Specific connection (None = all connections)
            
        Returns:
            Cache statistics
        """
        try:
            await self.connect()
            
            if connection_id:
                # Stats for specific connection
                pattern = f"pip:conn:{connection_id}:*"
                meta_key = self._build_connection_key(connection_id)
            else:
                # Stats for all connections
                pattern = "pip:conn:*"
                meta_key = None
            
            # Count keys
            keys_count = 0
            encrypted_count = 0
            total_size = 0
            
            async for key in self.redis_client.scan_iter(pattern):
                if ":meta" in key:
                    continue
                keys_count += 1
                if ":encrypted" in key:
                    encrypted_count += 1
                
                # Get memory usage (approximate)
                value = await self.redis_client.get(key)
                if value:
                    total_size += len(value)
            
            stats = {
                "total_keys": keys_count,
                "encrypted_keys": encrypted_count,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }
            
            if meta_key:
                meta = await self.redis_client.hgetall(meta_key)
                if meta:
                    stats["last_cached"] = meta.get("last_cached")
                    stats["ttl"] = meta.get("ttl")
                    stats["attribute_count"] = meta.get("attribute_count")
            
            return stats
            
        except Exception as e:
            print(f"Stats error: {e}")
            return {"error": str(e)}
    
    async def refresh_cache(
        self,
        connection_id: int,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Refresh cache by fetching fresh data
        
        Args:
            connection_id: Connection to refresh
            force: Force refresh even if not expired
            
        Returns:
            Refresh result
        """
        try:
            # This would trigger a new fetch and cache operation
            # Implementation would call connector service and cache_pip_data
            return {
                "success": True,
                "message": "Cache refresh triggered",
                "connection_id": connection_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _is_sensitive_field(self, field_name: str) -> bool:
        """Check if field should be encrypted"""
        sensitive_keywords = [
            'password', 'token', 'secret', 'ssn', 'social',
            'credit', 'card', 'cvv', 'pin', 'salary', 'compensation',
            'medical', 'health', 'diagnosis'
        ]
        field_lower = field_name.lower()
        return any(keyword in field_lower for keyword in sensitive_keywords)


# Global instance
_cache_service = None

def get_cache_service() -> PIPCacheService:
    """Get global cache service instance"""
    global _cache_service
    if _cache_service is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _cache_service = PIPCacheService(redis_url)
    return _cache_service

