# Multisport Fantasy

A draft prototype using the FPL, NFL, and F1 data already loaded by this project. A league has 2–8 teams, a randomized snake draft, and 14 picks per team: **6 FPL players, 6 NFL players, and 2 F1 drivers**. Browse the combined athlete pool, filter by sport and position, and inspect each team’s roster and pick history.

## Architecture

```text
FPL / Sleeper / F1 APIs -> existing Python loaders -> data/fpl.db (SQLite)
                                                   -> local FastAPI -> React (local)
                                                   -> build-time catalog -> React (private preview)
```

The hosted draft is a **same-browser simulation**. Picks and the completed league (including a frozen scoring baseline) are saved in browser local storage and are not shared between people or written to the database. Download teams from the saved-league panel to keep a JSON backup. Starting a new draft replaces the league on this device. Existing completed drafts get a baseline when first opened with this version; past results cannot be reconstructed. The catalog is a snapshot taken at build time; refresh the SQLite tables and redeploy to update the hosted athlete pool.

Scoring uses each FPL/F1 athlete's change in cumulative season points since the saved baseline. For each sport, divide every drafted athlete's gain by the largest gain among drafted athletes of that sport (maximum 100), then average the team's roster slots. Average the three sport scores for an overall score, giving each sport equal weight despite the 6/6/2 roster. Scores stay pending when a baseline/result is missing, a season total resets, or no athlete has gained points. The NFL loader currently only saves ADP, **not actual game points**: NFL and the overall score remain pending until a results pipeline is added. A season change requires a new baseline; the current implementation does not account for corrections to historical totals. This normalization is relative to the drafted pool and can change when other athletes gain points.

For a shared league, the next data flow is `React -> FastAPI POST /picks -> hosted PostgreSQL`. The server must check turn order, duplicate athlete keys, and per-sport roster limits in a transaction. A separate data job updates athlete results without deleting league picks, recording individual dated events and scoring baselines. This is necessary for durable shared team storage and an automatically updating leaderboard.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src\load_fpl_db.py
python src\load_nfl_db.py
python src\load_f1_db.py
cd frontend
npm install
npm run dev
```

`npm run dev` and `npm run build` both export all three athlete tables from the current SQLite file. The production build is placed in `frontend/dist`. To read the existing FastAPI endpoints instead of the exported file during local development, start `uvicorn src.api:app --reload` from the repository root and set `VITE_API_BASE_URL=http://localhost:8000` for Vite. For PowerShell:

```powershell
$env:VITE_API_BASE_URL = 'http://localhost:8000'
npm run dev
```

The FastAPI endpoints currently read the local SQLite database. The draft simulation is browser state; a hosted write API and database are future work.
