import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_PATH = DATA_DIR / "elexon_wind.db"

# On Vercel serverless functions, the file system is read-only except /tmp
def get_db_path() -> Path:
    if os.environ.get("VERCEL"):
        tmp_db = Path("/tmp/elexon_wind.db")
        if not tmp_db.exists() and DEFAULT_DB_PATH.exists():
            shutil.copy2(DEFAULT_DB_PATH, tmp_db)
        return tmp_db if tmp_db.exists() else DEFAULT_DB_PATH
    return DEFAULT_DB_PATH

DB_PATH = get_db_path()

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

# Default UK Day-Ahead gate closure is 11:00 UTC on D-1
DEFAULT_CUTOFF_HOUR = 11
DEFAULT_CUTOFF_MINUTE = 0

TARGET_YEAR = 2026
TARGET_MONTH = 1
