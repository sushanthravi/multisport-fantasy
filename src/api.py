import os
import sqlite3
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


ROOT = Path(__file__).resolve().parents[1]
DATABASE_PATH = ROOT / "data" / "fpl.db"

app = FastAPI(title="Multisport Fantasy API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def query(sql: str) -> list[dict]:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        return [dict(row) for row in connection.execute(sql).fetchall()]
    finally:
        connection.close()


@app.get("/")
def home():
    return {"message": "Multisport Fantasy API is running", "sport": "FPL"}


@app.get("/players")
def get_players():
    return query(
        """
        SELECT id, player_name, team_name, position, price, total_points,
               event_points, minutes, goals_scored, assists
        FROM players
        ORDER BY total_points DESC
        """
    )


@app.get("/teams")
def get_teams():
    return query("SELECT id, name, short_name FROM teams ORDER BY name")


@app.get("/positions")
def get_positions():
    order = {"GKP": 1, "DEF": 2, "MID": 3, "FWD": 4}
    positions = [row["position"] for row in query("SELECT DISTINCT position FROM players")]
    return sorted(positions, key=order.get)


@app.get("/gameweeks")
def get_gameweeks():
    return query(
        """
        SELECT id, name, deadline_time, average_entry_score, finished,
               is_previous, is_current, is_next
        FROM gameweeks
        ORDER BY id
        """
    )


@app.get("/fixtures")
def get_fixtures():
    return query(
        """
        SELECT id, event, kickoff_time, finished, home_team, away_team,
               team_h_score, team_a_score, team_h_difficulty, team_a_difficulty
        FROM fixtures
        ORDER BY event, kickoff_time
        """
    )


# Other sports retain separate namespaces so future modules do not affect FPL.
@app.get("/f1/players")
def get_f1_players():
    return query(
        """
        SELECT driver_number AS id, driver_name, team_name,
               position_current AS position, points_current, points_gained
        FROM f1_players
        ORDER BY position_current
        """
    )


@app.get("/nfl/players")
def get_nfl_players():
    return query(
        """
        SELECT player_id AS id, player_name, team AS team_name, position, adp
        FROM nfl_players
        ORDER BY CASE WHEN adp IS NULL THEN 1 ELSE 0 END, adp
        """
    )
