import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["cachedActuals"] >= 1488
    assert data["cachedForecasts"] >= 1000

def test_available_dates():
    response = client.get("/api/available-dates")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 31
    assert "2026-01-01" in data["dates"]
    assert "2026-01-31" in data["dates"]

def test_day_ahead_metrics():
    response = client.get("/api/day-ahead?date=2026-01-15&cutoff_hour=11&cutoff_minute=0&imbalance_price=105.0")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert data["decisionDay"] == "2026-01-14"
    assert "metrics" in data
    m = data["metrics"]
    assert m["validPeriods"] == 48
    assert m["maeMw"] > 0
    assert m["rmseMw"] >= m["maeMw"]
    assert "financial" in m
    assert m["financial"]["imbalancePriceGbp"] == 105.0
    assert m["financial"]["cashoutPenaltyExposureGbp"] > 0
    assert "recommendation" in data
    assert len(data["periods"]) == 48
    assert len(data["hourlyData"]) == 24

def test_monthly_metrics():
    response = client.get("/api/monthly-metrics?cutoff_hour=11&imbalance_price=95.0")
    assert response.status_code == 200
    data = response.json()
    assert data["datesCount"] == 31
    assert "overall" in data
    assert data["overall"]["maeMw"] > 0
    assert data["overall"]["totalPenaltyExposureGbp"] > 0
    assert len(data["dailyMetrics"]) == 31
    assert len(data["diurnalProfile"]) == 48

def test_vercel_path_rewrite():
    """Simulates how Vercel rewrites /api/day-ahead to /api/index.py?__vercel_route__=day-ahead."""
    response = client.get("/api/index.py?__vercel_route__=day-ahead&date=2026-01-01&cutoff_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-01"
    assert "metrics" in data

    response_health = client.get("/api/index.py?__vercel_route__=health")
    assert response_health.status_code == 200
    assert response_health.json()["status"] == "healthy"
