# Multisport Fantasy

## The idea

Most fantasy games revolve around one sport. Multisport Fantasy brings football (FPL), American football (NFL), and Formula 1 into **one league and one draft**. Friends build teams across all three sports and compete on a single leaderboard as real events happen.

The goal is a simple game you can play with friends: start a league, draft athletes, follow your team, and see who wins across the season.

## How a league works

1. Create a league with 2–8 teams.
2. Draft in a random snake order: the picking order reverses each round.
3. Build a 14-athlete team: **6 FPL players, 6 NFL players, and 2 F1 drivers**.
4. Earn points from what those athletes do after the draft. Each sport contributes equally to the eventual overall score, even though the roster sizes differ.

For example, a strong F1 weekend can help offset a poor FPL gameweek. The idea is to reward good decisions across sports, rather than let the sport with the biggest raw point totals dominate.

## What you can try today

- Browse, search, filter, and sort athletes from all three sports.
- Run a full draft on one device and view every team's roster and pick history.
- Keep a completed league in that browser and download a backup of the teams.
- View a scoring preview for FPL and F1 based on points earned since the league was saved.

**This is an early prototype.** The draft is stored in the browser you use. Friends cannot yet join from their own devices, and the hosted athlete data is updated when a new version of the site is deployed. The NFL data currently helps you draft players but does not include their game results, so the complete three-sport leaderboard is still pending. The scoring formula is a starting point that we can tune after trying the game.

## What comes next

1. **Shared leagues:** Save teams and picks in an online database so friends can join the same draft from different devices.
2. **Live results:** Add NFL game points and regularly update results for all three sports.
3. **A complete leaderboard:** Compare teams as new games and races finish, with scoring that stays understandable and fair across sports.

The data already starts with the FPL, NFL, and F1 loaders in this repository. They collect athlete information into a local SQLite database. The local API reads that database for the web app. The private hosted version currently uses a data snapshot made during deployment. An online database and write API are the next pieces needed for a shared game.

## Run it on your computer

From the project folder in PowerShell, set up Python and load the data:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src\load_fpl_db.py
python src\load_nfl_db.py
python src\load_f1_db.py
```

Open a PowerShell terminal in the project folder for the API:

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn src.api:app --reload
```

In a second terminal, start the website:

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL = 'http://localhost:8000'
npm run dev
```

Open the local website address printed by `npm run dev` (usually `http://localhost:5173`). The API is at `http://localhost:8000/docs`.
