from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Multi-Sport Fantasy API is running"}


@app.get("/players")
def get_players():
    connection = sqlite3.connect("data/fpl.db")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            player_name,
            team_name,
            position,
            price,
            total_points,
            event_points
        FROM players
        ORDER BY total_points DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    players = []

    for row in rows:
        players.append({
            "id": row[0],
            "player_name": row[1],
            "team_name": row[2],
            "position": row[3],
            "price": row[4],
            "total_points": row[5],
            "event_points": row[6]
        })

    return players

@app.get("/f1/players")
def get_f1_players():
    connection = sqlite3.connect("data/fpl.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            driver_number,
            driver_name,
            team_name,
            position_current,
            points_current,
            points_gained
        FROM f1_players
        ORDER BY position_current ASC
    """)

    rows = cursor.fetchall()
    connection.close()

    drivers = []

    for row in rows:
        drivers.append({
            "id": row[0],
            "driver_name": row[1],
            "team_name": row[2],
            "position": row[3],
            "points_current": row[4],
            "points_gained": row[5]
        })

    return drivers

@app.get("/nfl/players")
def get_nfl_players():

    connection = sqlite3.connect("data/fpl.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            player_id,
            player_name,
            team,
            position,
            adp
        FROM nfl_players
        ORDER BY
            CASE WHEN adp IS NULL THEN 1 ELSE 0 END,
            adp ASC
    """)

    rows = cursor.fetchall()

    connection.close()

    players = []

    for row in rows:
        players.append({
            "id": row[0],
            "player_name": row[1],
            "team_name": row[2],
            "position": row[3],
            "adp": row[4]
        })

    return players