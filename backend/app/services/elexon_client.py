import httpx
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta
from backend.app.config import FUELHH_STREAM_URL, WINDFOR_STREAM_URL

logger = logging.getLogger(__name__)

async def fetch_actuals_fuelhh(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    Fetches actual half-hourly generation from Elexon FUELHH stream.
    Filters for fuelType == 'WIND'.
    """
    params = {
        "settlementDateFrom": start_date,
        "settlementDateTo": end_date
    }
    headers = {"User-Agent": "EnergyUtilityDashboard/1.0"}
    logger.info(f"Fetching FUELHH actuals from {start_date} to {end_date}...")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(FUELHH_STREAM_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
    wind_records = [r for r in data if r.get("fuelType") == "WIND"]
    logger.info(f"Fetched {len(data)} FUELHH records, filtered to {len(wind_records)} WIND records.")
    return wind_records

async def fetch_forecasts_windfor_chunk(publish_from: str, publish_to: str) -> List[Dict[str, Any]]:
    """
    Fetches wind generation forecasts from Elexon WINDFOR stream for a given publication window.
    """
    params = {
        "publishDateTimeFrom": publish_from,
        "publishDateTimeTo": publish_to
    }
    headers = {"User-Agent": "EnergyUtilityDashboard/1.0"}
    logger.info(f"Fetching WINDFOR chunk: publish from {publish_from} to {publish_to}...")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(WINDFOR_STREAM_URL, params=params, headers=headers)
        response.raise_for_status()
        return response.json()

async def fetch_all_january_2026_forecasts(chunk_days: int = 5) -> List[Dict[str, Any]]:
    """
    Fetches all WINDFOR forecasts published between 2025-12-30T00:00:00Z and 2026-02-01T23:59:59Z
    in chunk_days intervals to ensure reliable streaming.
    """
    start_dt = datetime(2025, 12, 30, 0, 0, 0)
    end_dt = datetime(2026, 2, 2, 0, 0, 0)
    
    current_dt = start_dt
    all_forecasts: List[Dict[str, Any]] = []
    
    while current_dt < end_dt:
        next_dt = min(current_dt + timedelta(days=chunk_days), end_dt)
        pub_from = current_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        pub_to = next_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        try:
            records = await fetch_forecasts_windfor_chunk(pub_from, pub_to)
            all_forecasts.extend(records)
            logger.info(f"Chunk [{pub_from} -> {pub_to}]: retrieved {len(records)} forecasts.")
        except Exception as e:
            logger.error(f"Error fetching chunk {pub_from} to {pub_to}: {e}")
            raise e
        
        current_dt = next_dt
        
    logger.info(f"Completed fetching WINDFOR. Total records: {len(all_forecasts)}")
    return all_forecasts
