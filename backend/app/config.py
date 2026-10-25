import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DEFAULT_DB_PATH = DATA_DIR / "elexon_wind.db"

def get_db_path() -> Path:
    # On Vercel / AWS Lambda, the deployment directory is strictly read-only.
    # /tmp is the only writable directory. Copying the pre-seeded SQLite DB (3.4MB)
    # into /tmp gives SQLite full read-write lock capabilities and prevents OperationalErrors.
    is_serverless = os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    
    if is_serverless:
        tmp_db = Path("/tmp/elexon_wind.db")
        if not tmp_db.exists() and DEFAULT_DB_PATH.exists():
            try:
                shutil.copy2(DEFAULT_DB_PATH, tmp_db)
            except Exception as e:
                print(f"[Warning] Failed to copy DB to /tmp: {e}")
        if tmp_db.exists():
            return tmp_db
            
    return DEFAULT_DB_PATH

DB_PATH = get_db_path()

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

DEFAULT_CUTOFF_HOUR = 11
DEFAULT_CUTOFF_MINUTE = 0

TARGET_YEAR = 2026
TARGET_MONTH = 1
