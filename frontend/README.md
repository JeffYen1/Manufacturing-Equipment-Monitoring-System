# Manufacturing Equipment Monitoring System — Frontend (React + Vite)

This is the React frontend for the Manufacturing Equipment Monitoring System.  
It displays a fleet view of tools, per-tool detail pages (readings/alerts), and a dashboard summary.

## Features
- **Equipment List**: view all tools (name, type, location)
- **Equipment Detail**: drill down into a single tool and view:
  - recent sensor readings (temperature/pressure/vibration)
  - recent alerts (NORMAL/WARNING/FAILURE)
  - health level (LOW / MED / HIGH) based on recent window
- **Dashboard**: system overview including counts and health status per tool
- **Resilient UI states**: Loading / Error (with Retry) / Empty state (no data yet)

## Tech Stack
- React + Vite
- React Router
- Fetch API
- Vite dev proxy for backend calls (avoids CORS during development)

## API / Backend Integration
During development, the frontend calls the backend through a proxy:
- Frontend requests use: `/api/...`
- Vite forwards `/api` → `http://127.0.0.1:8000`

Make sure `vite.config.js` contains a proxy like:
- `/api` → `http://127.0.0.1:8000` with rewrite removing `/api`

## Run Locally

### 1) Start backend first
From the repo root:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
