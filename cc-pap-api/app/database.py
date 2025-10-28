import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import redis.asyncio as aioredis
from typing import Optional

# Get database URL from environment or use PostgreSQL default for local development
database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/control_core_db")
print(f"Using database: {database_url}")

engine = create_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Redis connection for PIP caching
_redis_client: Optional[aioredis.Redis] = None

async def get_redis() -> aioredis.Redis:
    """Get Redis client for caching"""
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _redis_client = await aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50
        )
    return _redis_client

async def close_redis():
    """Close Redis connection"""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
