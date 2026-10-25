from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.app.services.cache_service import get_available_dates, get_actuals_count, get_forecasts_count
from backend.app.services.analytics import calculate_day_ahead_metrics, calculate_monthly_summary
from backend.app.services.sync_data import sync_january_2026_data

router = APIRouter(prefix="/api", tags=["Energy Analytics"])

@router.get("/health")
def health_check():
    actuals = get_actuals_count()
    forecasts = get_forecasts_count()
    return {
        "status": "healthy",
        "cachedActuals": actuals,
        "cachedForecasts": forecasts,
        "databaseReady": actuals >= 1488 and forecasts >= 1000
    }

@router.get("/available-dates")
def available_dates():
    dates = get_available_dates()
    return {
        "dates": dates,
        "defaultDate": dates[0] if dates else "2026-01-01",
        "total": len(dates)
    }

@router.get("/day-ahead")
def get_day_ahead_analysis(
    date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$", description="Delivery date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(11, ge=0, le=23, description="Decision cutoff hour on Day D-1 (UTC)"),
    cutoff_minute: int = Query(0, ge=0, le=59, description="Decision cutoff minute (UTC)"),
    imbalance_price: float = Query(95.0, ge=10.0, le=1000.0, description="UK System Buy Price / Cash-Out Price in £/MWh")
):
    try:
        data = calculate_day_ahead_metrics(date, cutoff_hour, cutoff_minute, imbalance_price)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate day-ahead metrics: {str(e)}")

@router.get("/monthly-metrics")
def get_monthly_metrics(
    cutoff_hour: int = Query(11, ge=0, le=23, description="Decision cutoff hour on Day D-1 (UTC)"),
    cutoff_minute: int = Query(0, ge=0, le=59, description="Decision cutoff minute (UTC)"),
    imbalance_price: float = Query(95.0, ge=10.0, le=1000.0, description="UK System Buy Price / Cash-Out Price in £/MWh")
):
    try:
        data = calculate_monthly_summary(cutoff_hour, cutoff_minute, imbalance_price)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate monthly summary: {str(e)}")

@router.post("/sync")
async def trigger_sync():
    try:
        await sync_january_2026_data()
        return {"status": "success", "message": "January 2026 data synchronization complete."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
