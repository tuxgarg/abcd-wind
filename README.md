# UK Wind Day-Ahead Market Intelligence

A full-stack web application evaluating Elexon BMRS Day-Ahead wind generation forecasts (`WINDFOR`) against actual outturn (`FUELHH`) for January 2026 in the UK wholesale electricity market, featuring an **Imbalance Financial Risk Exposure Engine (£ GBP)**.

---

## 🏛 System Architecture

The application uses a **Unified Single-Server Architecture**: the FastAPI backend serves both the analytical REST API and the compiled React single-page application (SPA), fully containerized using **Docker**.

```
                               ┌──────────────────────────────────────────────┐
                               │         Elexon BMRS Public Streams           │
                               │  • FUELHH (Actual Half-Hourly Outturn)       │
                               │  • WINDFOR (Hourly Day-Ahead Forecasts)      │
                               └──────────────────────┬───────────────────────┘
                                                      │ (HTTP Stream Ingestion)
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Docker Container (Multi-Stage Build)                               │
│                                                                                                     │
│   FastAPI (Python Runtime)                                                                          │
│   ├── Ingestion & Cache (SQLite: backend/data/elexon_wind.db)                                       │
│   │   └── Fast local store of 1,488 actuals & 19,856 forecasts                                      │
│   │                                                                                                 │
│   ├── Day-Ahead Point-in-Time Alignment Engine                                                      │
│   │   └── Bi-temporal query: freezes forecast snapshot to publishTime <= D-1 at 11:00 UTC          │
│   │                                                                                                 │
│   ├── Quantitative & Financial Analytics Engine                                                     │
│   │   ├── Statistical Metrics: MAE (MW), RMSE (MW), MAPE (%), Directional Bias                      │
│   │   └── Financial Imbalance Engine: Cash-Out Penalty Exposure (£ GBP) at configurable            │
│   │       System Buy Price (£75 - £150/MWh) based on half-hourly deficit volumes                    │
│   │                                                                                                 │
│   ├── REST API Routes                                                                               │
│   │   ├── GET /api/available-dates                                                                  │
│   │   ├── GET /api/day-ahead?date=YYYY-MM-DD&cutoff_hour=11&imbalance_price=95                      │
│   │   ├── GET /api/monthly-metrics?cutoff_hour=11&imbalance_price=95                                │
│   │   └── GET /api/health                                                                           │
│   │                                                                                                 │
│   └── Static SPA Mount (React Production Bundle)                                                    │
│       └── Directly serves compiled React assets from frontend/dist/ at root (/)                     │
└──────────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       React Frontend Dashboard                                      │
│                                                                                                     │
│   React 18 + TypeScript + Tailwind CSS + Recharts                                                   │
│   ├── Decision Control Bar                                                                          │
│   │   ├── January 2026 Date Navigation                                                              │
│   │   ├── D-1 Gate-Closure Cutoff Selector (09:00, 10:00, 11:00, 12:00 UTC)                         │
│   │   └── Interactive System Cash-Out Price Selector (£75, £95 Baseload, £125 Peak, £150 Stress)    │
│   │                                                                                                 │
│   ├── KPI Metric Cards                                                                              │
│   │   ├── Outturn Generation (GWh) & Energy Variance                                                │
│   │   ├── Day-Ahead MAE (MW) & Net Model Bias Badge                                                 │
│   │   ├── Day-Ahead RMSE (MW) & MAPE (%)                                                            │
│   │   └── ★ Financial Imbalance Cash-Out Risk (£ GBP Penalty Exposure)                              │
│   │                                                                                                 │
│   ├── Procurement Trading Recommendation Banner (Quantified MW hedge buffer & £ financial impact)   │
│   ├── Forecast vs Actual Interactive Area & Line Time Series Chart                                  │
│   ├── Residuals & Deviation Profile (Surplus vs Deficit Bar Chart)                                  │
│   └── 31-Day January 2026 Audit (Diurnal Error Curve & Daily Cash-Out Penalty Breakdown)            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Highlights
1. **Multi-Stage Docker Containerization**: Multi-stage build (Node.js 20 Alpine builds frontend; Python 3.11 slim runs the unified service). Produces a lightweight, self-contained container with built-in health checks (`HEALTHCHECK`).
2. **Financial Imbalance Exposure Engine (£ GBP)**: Translates technical forecast errors (MW) into commercial trading risk (£ Sterling). When wind under-delivers, the utility is exposed to the UK System Buy Price / cash-out penalty. Traders can toggle cash-out prices (£75–£150/MWh) to assess balance-sheet exposure under different market conditions.
3. **Bi-Temporal Point-in-Time Modeling**: Eliminates look-ahead bias by decoupling Knowledge Time (`publishTime`) from Delivery Time (`startTime`), simulating the exact market conditions at auction gate closure.
4. **Local SQLite Ingestion Cache**: Pre-indexes all January 2026 records. Query latency is under 5ms, preventing Elexon API rate-limiting.
5. **Resolution Harmonization**: Bridges the granularity gap between 1-hour `WINDFOR` forecasts and 30-minute `FUELHH` settlement periods.

---

## 📁 Directory Structure

```
.
├── Dockerfile                   # Multi-stage production container definition
├── .dockerignore                # Optimized build context filter
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + static SPA hosting
│   │   ├── config.py            # API endpoints & database paths
│   │   ├── routers/
│   │   │   └── energy.py        # REST endpoints (/api/day-ahead, /api/monthly-metrics)
│   │   └── services/
│   │       ├── analytics.py     # Alignment logic, MAE, RMSE, MAPE, Bias & £ Financial Engine
│   │       ├── cache_service.py # SQLite schema, indexing & point-in-time SQL queries
│   │       ├── elexon_client.py # Elexon BMRS API streaming client
│   │       └── sync_data.py     # Ingestion & synchronization script
│   ├── data/
│   │   └── elexon_wind.db       # Indexed SQLite database
│   ├── tests/
│   │   └── test_api.py          # Pytest suite
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── dist/                    # Compiled production build
│   ├── src/                     # React components, charts, and API client
│   ├── package.json
│   └── vite.config.ts
├── run.py                       # Single-command launcher (for local development)
└── README.md
```

---

## 🚀 How to Start

### Option A: Deploy to Vercel (Recommended Cloud Deployment)
This repository is pre-configured with [`vercel.json`](vercel.json) and [`api/index.py`](api/index.py) for 1-click Vercel deployment:

1. **Push your code to a public/anonymous GitHub repo**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of UK Wind Day-Ahead Market Intelligence"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
   - Keep default settings (`vercel.json` automatically configures the build and routing).
   - Click **Deploy**. Your app will be live at `https://<your-project>.vercel.app` in under 2 minutes!

---

### Option B: Using Docker (Specified in Requirements)

1. **Build the Docker image:**
   ```bash
   docker build -t gridbricks-wind-app .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8080:8080 --name wind-app gridbricks-wind-app
   ```
   Open **`http://localhost:8080`** in your browser.

---

### Option C: Running Locally (Without Docker)

1. **Backend setup:**
   ```bash
   python3 -m venv backend/venv
   source backend/venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. **Frontend build (done once):**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Start unified server:**
   ```bash
   python3 run.py
   ```
   Open **`http://localhost:8080`**.

---

## 🧪 Tests
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests
```

---

## 🤖 AI Disclosure
AI tools (Google Gemini / Antigravity) were used to assist in scaffolding the project architecture, backend services, and UI components.
