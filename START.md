# SmartContainer Risk Engine – Quick Start

## Run the full website (3 steps)

Use **3 terminals**. Start in this order:

| Order | Terminal 1 | Terminal 2 | Terminal 3 |
|-------|-------------|-------------|-------------|
| 1 | **ML API** (port 8001) | — | — |
| 2 | (keep running) | **Backend** (port 5000) | — |
| 3 | (keep running) | (keep running) | **Frontend** (port 5173) |

**Terminal 1 – ML API:**
```bash
cd SmartContainerRiskEngine
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 – Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 3 – Frontend:**
```bash
cd Frontend
npm run dev
```

Then open **http://localhost:5173** in your browser. Register or log in, then use the dashboard to upload CSV and view risk results.

---

## Services & Ports

| Service | Port | URL |
|---------|------|-----|
| **Frontend** (React + Vite) | 3000 / 5173 | http://localhost:5173 or http://localhost:5174 |
| **Backend** (Node.js + Express) | 5000 | http://localhost:5000 |
| **ML API** (Python FastAPI) | 8001 | http://localhost:8001 |

## Run All Services (One Command)

From the project root:

```bash
npm run dev
```

This starts Backend, Frontend, and ML API together (requires `concurrently`).

## Run Services Individually

**1. ML API (start first):**
```bash
cd SmartContainerRiskEngine
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```
Or from that folder: `npm run dev` (uses `python -m uvicorn` under the hood).

**2. Backend:**
```bash
cd Backend
npm run dev
```

**3. Frontend:**
```bash
cd Frontend
npm run dev
```

## First-Time Setup

1. **Install root deps:** `npm install` (in project root)
2. **Install Backend deps:** `cd Backend && npm install`
3. **Install Frontend deps:** `cd Frontend && npm install`
4. **Install ML API deps:** `cd SmartContainerRiskEngine && pip install -r requirements.txt`

## Environment

- **Backend** `.env`: `PORT=5000`, `ML_API_URL=http://localhost:8001`, MongoDB URI, JWT secrets, Cloudinary
- **SmartContainerRiskEngine** `.env`: `GOOGLE_API_KEY` (for LLM explanations)

## Flow

1. User uploads CSV → Frontend → Backend (`POST /api/v1/container/upload`)
2. Backend forwards CSV to ML API (`POST http://localhost:8001/predict/`)
3. ML API returns risk scores, levels, and explanations
4. Backend saves containers with risk data to MongoDB
5. Dashboard shows results with summary cards and charts
