import asyncio
import logging
from backend.app.services.cache_service import (
    init_db,
    store_actuals,
    store_forecasts,
    get_actuals_count,
    get_forecasts_count,
    get_available_dates
)
from backend.app.services.elexon_client import (
    fetch_actuals_fuelhh,
    fetch_all_january_2026_forecasts
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

async def sync_january_2026_data():
    init_db()
    logger.info("Database initialized.")

    # 1. Sync Actuals (FUELHH for Jan 2026)
    actual_count = get_actuals_count()
    logger.info(f"Current actuals in DB: {actual_count}")
    if actual_count < 1488:  # 31 days * 48 periods = 1488
        logger.info("Fetching January 2026 actuals (FUELHH)...")
        actuals = await fetch_actuals_fuelhh("2026-01-01", "2026-01-31")
        inserted = store_actuals(actuals)
        logger.info(f"Successfully stored {inserted} wind actuals records.")
    else:
        logger.info("January 2026 actuals already fully cached.")

    # 2. Sync Forecasts (WINDFOR)
    fc_count = get_forecasts_count()
    logger.info(f"Current forecasts in DB: {fc_count}")
    if fc_count < 1000:
        logger.info("Fetching January 2026 forecasts (WINDFOR)...")
        forecasts = await fetch_all_january_2026_forecasts(chunk_days=5)
        inserted = store_forecasts(forecasts)
        logger.info(f"Successfully stored {inserted} forecast records.")
    else:
        logger.info("January 2026 forecasts already cached.")

    dates = get_available_dates()
    logger.info(f"Data sync complete. Available delivery dates: {len(dates)} ({dates[0]} to {dates[-1]})")

if __name__ == "__main__":
    asyncio.run(sync_january_2026_data())
