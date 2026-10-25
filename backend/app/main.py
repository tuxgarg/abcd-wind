import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.routers.energy import router as energy_router
from backend.app.services.cache_service import init_db, get_actuals_count, get_forecasts_count
from backend.app.services.sync_data import sync_january_2026_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database is initialized
    init_db()
    actuals = get_actuals_count()
    forecasts = get_forecasts_count()
    if actuals < 1488 or forecasts < 1000:
        print("[Startup] Database cache is incomplete. Synchronizing January 2026 data from Elexon API...")
        try:
            await sync_january_2026_data()
            print("[Startup] Data sync complete.")
        except Exception as e:
            print(f"[Startup Warning] Could not auto-sync: {e}")
    else:
        print(f"[Startup] Cache ready ({actuals} actuals, {forecasts} forecasts).")
    yield

app = FastAPI(
    title="UK Wind Day-Ahead Market Intelligence API",
    description="Elexon BMRS Wind Generation Forecast vs Actuals Analytics for UK Wholesale Electricity Procurement",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# Enable CORS for local dev (Vite on :5173 / :3000) and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount with /api prefix (standard)
app.include_router(energy_router, prefix="/api")
# Also mount without prefix (in case Vercel rewrite forwards stripped path like /day-ahead)
app.include_router(energy_router)

# Mount static build of frontend if present (for local single-server and non-serverless deployment)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Never serve index.html for API paths
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail=f"API route /{full_path} not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8080, reload=True)
