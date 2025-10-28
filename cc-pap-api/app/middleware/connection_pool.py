"""
Production Connection Pool Management for Control Core PAP API
Implements connection pooling, health monitoring, and failover
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import aiohttp
import redis
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
import psycopg2
from psycopg2 import pool as psycopg2_pool
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class ConnectionStatus(Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"

@dataclass
class ConnectionMetrics:
    """Connection performance metrics"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    last_health_check: Optional[float] = None
    status: ConnectionStatus = ConnectionStatus.UNKNOWN
    error_count: int = 0
    consecutive_failures: int = 0

class DatabaseConnectionPool:
    """Production-grade database connection pool"""
    
    def __init__(self, database_url: str, pool_size: int = 20, max_overflow: int = 30):
        self.database_url = database_url
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.engine = None
        self.session_factory = None
        self.metrics = ConnectionMetrics()
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize database connection pool"""
        try:
            # Create engine with connection pooling
            self.engine = create_engine(
                self.database_url,
                poolclass=QueuePool,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_pre_ping=True,  # Validate connections before use
                pool_recycle=3600,   # Recycle connections every hour
                pool_timeout=30,     # Timeout for getting connection
                echo=False
            )
            
            # Create session factory
            self.session_factory = sessionmaker(
                bind=self.engine,
                autocommit=False,
                autoflush=False
            )
            
            self.metrics.status = ConnectionStatus.HEALTHY
            logger.info(f"Database connection pool initialized: {self.pool_size} connections")
            
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            self.metrics.status = ConnectionStatus.UNHEALTHY
            raise
    
    def get_session(self):
        """Get database session from pool"""
        try:
            session = self.session_factory()
            self.metrics.total_requests += 1
            return session
        except Exception as e:
            self.metrics.failed_requests += 1
            self.metrics.consecutive_failures += 1
            logger.error(f"Failed to get database session: {e}")
            raise
    
    def return_session(self, session, success: bool = True):
        """Return session to pool"""
        try:
            if success:
                self.metrics.successful_requests += 1
                self.metrics.consecutive_failures = 0
            else:
                self.metrics.failed_requests += 1
                self.metrics.consecutive_failures += 1
            
            session.close()
            
        except Exception as e:
            logger.error(f"Error returning session: {e}")
    
    async def health_check(self) -> bool:
        """Perform health check on database pool"""
        try:
            start_time = time.time()
            session = self.get_session()
            
            # Simple query to test connection
            session.execute("SELECT 1")
            session.close()
            
            response_time = time.time() - start_time
            self.metrics.average_response_time = response_time
            self.metrics.last_health_check = time.time()
            self.metrics.status = ConnectionStatus.HEALTHY
            
            return True
            
        except Exception as e:
            self.metrics.status = ConnectionStatus.UNHEALTHY
            self.metrics.error_count += 1
            logger.error(f"Database health check failed: {e}")
            return False
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get current pool status and metrics"""
        pool_status = self.engine.pool.status() if self.engine else {}
        
        return {
            "status": self.metrics.status.value,
            "total_requests": self.metrics.total_requests,
            "successful_requests": self.metrics.successful_requests,
            "failed_requests": self.metrics.failed_requests,
            "success_rate": (
                self.metrics.successful_requests / max(1, self.metrics.total_requests)
            ),
            "average_response_time": self.metrics.average_response_time,
            "consecutive_failures": self.metrics.consecutive_failures,
            "pool_size": self.pool_size,
            "pool_status": pool_status,
            "last_health_check": self.metrics.last_health_check
        }

class RedisConnectionPool:
    """Production-grade Redis connection pool"""
    
    def __init__(self, redis_url: str, max_connections: int = 50):
        self.redis_url = redis_url
        self.max_connections = max_connections
        self.pool = None
        self.metrics = ConnectionMetrics()
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize Redis connection pool"""
        try:
            # Create Redis connection pool
            self.pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=self.max_connections,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            
            self.metrics.status = ConnectionStatus.HEALTHY
            logger.info(f"Redis connection pool initialized: {self.max_connections} connections")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis pool: {e}")
            self.metrics.status = ConnectionStatus.UNHEALTHY
            raise
    
    def get_connection(self):
        """Get Redis connection from pool"""
        try:
            connection = redis.Redis(connection_pool=self.pool)
            self.metrics.total_requests += 1
            return connection
        except Exception as e:
            self.metrics.failed_requests += 1
            self.metrics.consecutive_failures += 1
            logger.error(f"Failed to get Redis connection: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Perform health check on Redis pool"""
        try:
            start_time = time.time()
            connection = self.get_connection()
            
            # Simple ping to test connection
            connection.ping()
            
            response_time = time.time() - start_time
            self.metrics.average_response_time = response_time
            self.metrics.last_health_check = time.time()
            self.metrics.status = ConnectionStatus.HEALTHY
            
            return True
            
        except Exception as e:
            self.metrics.status = ConnectionStatus.UNHEALTHY
            self.metrics.error_count += 1
            logger.error(f"Redis health check failed: {e}")
            return False
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get current pool status and metrics"""
        return {
            "status": self.metrics.status.value,
            "total_requests": self.metrics.total_requests,
            "successful_requests": self.metrics.successful_requests,
            "failed_requests": self.metrics.failed_requests,
            "success_rate": (
                self.metrics.successful_requests / max(1, self.metrics.total_requests)
            ),
            "average_response_time": self.metrics.average_response_time,
            "consecutive_failures": self.metrics.consecutive_failures,
            "max_connections": self.max_connections,
            "last_health_check": self.metrics.last_health_check
        }

class HTTPConnectionPool:
    """Production-grade HTTP connection pool for external APIs"""
    
    def __init__(self, max_connections: int = 100, max_keepalive: int = 30):
        self.max_connections = max_connections
        self.max_keepalive = max_keepalive
        self.connector = None
        self.metrics = ConnectionMetrics()
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize HTTP connection pool"""
        try:
            # Create aiohttp connector with connection pooling
            self.connector = aiohttp.TCPConnector(
                limit=self.max_connections,
                limit_per_host=30,
                keepalive_timeout=self.max_keepalive,
                enable_cleanup_closed=True,
                ttl_dns_cache=300,  # 5 minutes DNS cache
                use_dns_cache=True
            )
            
            self.metrics.status = ConnectionStatus.HEALTHY
            logger.info(f"HTTP connection pool initialized: {self.max_connections} connections")
            
        except Exception as e:
            logger.error(f"Failed to initialize HTTP pool: {e}")
            self.metrics.status = ConnectionStatus.UNHEALTHY
            raise
    
    async def get_session(self) -> aiohttp.ClientSession:
        """Get HTTP session from pool"""
        try:
            session = aiohttp.ClientSession(
                connector=self.connector,
                timeout=aiohttp.ClientTimeout(total=30, connect=10)
            )
            self.metrics.total_requests += 1
            return session
        except Exception as e:
            self.metrics.failed_requests += 1
            self.metrics.consecutive_failures += 1
            logger.error(f"Failed to get HTTP session: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Perform health check on HTTP pool"""
        try:
            start_time = time.time()
            session = await self.get_session()
            
            # Test with a simple request
            async with session.get("https://httpbin.org/get") as response:
                if response.status == 200:
                    self.metrics.status = ConnectionStatus.HEALTHY
                else:
                    self.metrics.status = ConnectionStatus.DEGRADED
            
            await session.close()
            
            response_time = time.time() - start_time
            self.metrics.average_response_time = response_time
            self.metrics.last_health_check = time.time()
            
            return True
            
        except Exception as e:
            self.metrics.status = ConnectionStatus.UNHEALTHY
            self.metrics.error_count += 1
            logger.error(f"HTTP health check failed: {e}")
            return False
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get current pool status and metrics"""
        return {
            "status": self.metrics.status.value,
            "total_requests": self.metrics.total_requests,
            "successful_requests": self.metrics.successful_requests,
            "failed_requests": self.metrics.failed_requests,
            "success_rate": (
                self.metrics.successful_requests / max(1, self.metrics.total_requests)
            ),
            "average_response_time": self.metrics.average_response_time,
            "consecutive_failures": self.metrics.consecutive_failures,
            "max_connections": self.max_connections,
            "last_health_check": self.metrics.last_health_check
        }

class ConnectionPoolManager:
    """Centralized connection pool management"""
    
    def __init__(self):
        self.database_pool: Optional[DatabaseConnectionPool] = None
        self.redis_pool: Optional[RedisConnectionPool] = None
        self.http_pool: Optional[HTTPConnectionPool] = None
        self.health_check_interval = 60  # 1 minute
        self._health_check_task = None
    
    def initialize_pools(
        self,
        database_url: str,
        redis_url: str,
        db_pool_size: int = 20,
        redis_pool_size: int = 50,
        http_pool_size: int = 100
    ):
        """Initialize all connection pools"""
        try:
            # Initialize database pool
            self.database_pool = DatabaseConnectionPool(
                database_url, db_pool_size
            )
            
            # Initialize Redis pool
            self.redis_pool = RedisConnectionPool(
                redis_url, redis_pool_size
            )
            
            # Initialize HTTP pool
            self.http_pool = HTTPConnectionPool(http_pool_size)
            
            # Start health monitoring
            self._start_health_monitoring()
            
            logger.info("All connection pools initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize connection pools: {e}")
            raise
    
    def _start_health_monitoring(self):
        """Start background health monitoring"""
        async def health_monitor():
            while True:
                try:
                    await self._perform_health_checks()
                    await asyncio.sleep(self.health_check_interval)
                except Exception as e:
                    logger.error(f"Health monitoring error: {e}")
                    await asyncio.sleep(self.health_check_interval)
        
        self._health_check_task = asyncio.create_task(health_monitor())
    
    async def _perform_health_checks(self):
        """Perform health checks on all pools"""
        if self.database_pool:
            await self.database_pool.health_check()
        
        if self.redis_pool:
            await self.redis_pool.health_check()
        
        if self.http_pool:
            await self.http_pool.health_check()
    
    def get_database_session(self):
        """Get database session with error handling"""
        if not self.database_pool:
            raise RuntimeError("Database pool not initialized")
        return self.database_pool.get_session()
    
    def get_redis_connection(self):
        """Get Redis connection with error handling"""
        if not self.redis_pool:
            raise RuntimeError("Redis pool not initialized")
        return self.redis_pool.get_connection()
    
    async def get_http_session(self) -> aiohttp.ClientSession:
        """Get HTTP session with error handling"""
        if not self.http_pool:
            raise RuntimeError("HTTP pool not initialized")
        return await self.http_pool.get_session()
    
    def get_all_pool_status(self) -> Dict[str, Any]:
        """Get status of all connection pools"""
        status = {
            "database": self.database_pool.get_pool_status() if self.database_pool else None,
            "redis": self.redis_pool.get_pool_status() if self.redis_pool else None,
            "http": self.http_pool.get_pool_status() if self.http_pool else None
        }
        
        return status
    
    async def close_all_pools(self):
        """Close all connection pools"""
        try:
            if self._health_check_task:
                self._health_check_task.cancel()
            
            if self.database_pool and self.database_pool.engine:
                self.database_pool.engine.dispose()
            
            if self.redis_pool and self.redis_pool.pool:
                self.redis_pool.pool.disconnect()
            
            if self.http_pool and self.http_pool.connector:
                await self.http_pool.connector.close()
            
            logger.info("All connection pools closed")
            
        except Exception as e:
            logger.error(f"Error closing connection pools: {e}")

# Global connection pool manager
pool_manager: Optional[ConnectionPoolManager] = None

def get_pool_manager() -> ConnectionPoolManager:
    """Get or create connection pool manager"""
    global pool_manager
    if pool_manager is None:
        pool_manager = ConnectionPoolManager()
    return pool_manager

@asynccontextmanager
async def get_database_session():
    """Context manager for database sessions"""
    manager = get_pool_manager()
    session = None
    try:
        session = manager.get_database_session()
        yield session
    except Exception as e:
        if session:
            manager.database_pool.return_session(session, success=False)
        raise
    finally:
        if session:
            manager.database_pool.return_session(session, success=True)

@asynccontextmanager
async def get_http_session():
    """Context manager for HTTP sessions"""
    manager = get_pool_manager()
    session = None
    try:
        session = await manager.get_http_session()
        yield session
    except Exception as e:
        raise
    finally:
        if session:
            await session.close()
