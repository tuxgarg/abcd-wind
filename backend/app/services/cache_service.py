import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.config import get_db_path

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS actuals (
                startTime TEXT PRIMARY KEY,
                settlementDate TEXT NOT NULL,
                settlementPeriod INTEGER NOT NULL,
                generation REAL NOT NULL,
                publishTime TEXT
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_actuals_date 
            ON actuals(settlementDate);
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                startTime TEXT NOT NULL,
                publishTime TEXT NOT NULL,
                generation REAL NOT NULL,
                UNIQUE(startTime, publishTime)
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_forecasts_lookup 
            ON forecasts(startTime, publishTime);
        """)
    conn.close()

def store_actuals(records: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    inserted = 0
    with conn:
        for r in records:
            if r.get("fuelType") != "WIND":
                continue
            conn.execute("""
                INSERT OR REPLACE INTO actuals (startTime, settlementDate, settlementPeriod, generation, publishTime)
                VALUES (?, ?, ?, ?, ?)
            """, (
                r.get("startTime"),
                r.get("settlementDate"),
                r.get("settlementPeriod"),
                float(r.get("generation", 0)),
                r.get("publishTime")
            ))
            inserted += 1
    conn.close()
    return inserted

def store_forecasts(records: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    inserted = 0
    with conn:
        for r in records:
            start_time = r.get("startTime")
            pub_time = r.get("publishTime")
            gen = r.get("generation")
            if not start_time or not pub_time or gen is None:
                continue
            conn.execute("""
                INSERT OR REPLACE INTO forecasts (startTime, publishTime, generation)
                VALUES (?, ?, ?)
            """, (start_time, pub_time, float(gen)))
            inserted += 1
    conn.close()
    return inserted

def get_actuals_count() -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM actuals")
    count = cur.fetchone()[0]
    conn.close()
    return count

def get_forecasts_count() -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM forecasts")
    count = cur.fetchone()[0]
    conn.close()
    return count

def get_available_dates() -> List[str]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT settlementDate 
        FROM actuals 
        WHERE settlementDate LIKE '2026-01-%'
        ORDER BY settlementDate ASC
    """)
    dates = [row[0] for row in cur.fetchall()]
    conn.close()
    return dates

def get_actuals_for_date(date_str: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT startTime, settlementDate, settlementPeriod, generation, publishTime
        FROM actuals
        WHERE settlementDate = ?
        ORDER BY settlementPeriod ASC
    """, (date_str,))
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows

def get_latest_forecasts_for_date(date_str: str, cutoff_iso: str) -> Dict[str, Dict[str, Any]]:
    """
    Returns a dictionary mapping hourly startTime (e.g. 2026-01-15T12:00:00Z)
    to {generation, publishTime} for the most recent forecast published on or before cutoff_iso.
    """
    conn = get_connection()
    cur = conn.cursor()
    
    start_prefix = f"{date_str}T00:00:00Z"
    end_prefix = f"{date_str}T23:59:59Z"

    query = """
        WITH ranked AS (
            SELECT startTime, publishTime, generation,
                   ROW_NUMBER() OVER (PARTITION BY startTime ORDER BY publishTime DESC) as rn
            FROM forecasts
            WHERE startTime >= ? AND startTime <= ?
              AND publishTime <= ?
        )
        SELECT startTime, publishTime, generation
        FROM ranked
        WHERE rn = 1
    """
    cur.execute(query, (start_prefix, end_prefix, cutoff_iso))
    result = {}
    for row in cur.fetchall():
        result[row["startTime"]] = {
            "generation": row["generation"],
            "publishTime": row["publishTime"]
        }
    conn.close()
    return result
