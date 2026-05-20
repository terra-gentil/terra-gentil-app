import asyncio
import logging
from contextlib import asynccontextmanager

import asyncpg

from app.core.config import settings

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None
_pool_lock: asyncio.Lock | None = None


def _get_lock() -> asyncio.Lock:
    global _pool_lock
    if _pool_lock is None:
        _pool_lock = asyncio.Lock()
    return _pool_lock


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool
    async with _get_lock():
        if _pool is None:
            logger.info("Criando pool asyncpg para Supabase")
            _pool = await asyncpg.create_pool(
                settings.DATABASE_URL,
                min_size=1,
                max_size=10,
                command_timeout=30,
            )
    return _pool


@asynccontextmanager
async def get_conn():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
