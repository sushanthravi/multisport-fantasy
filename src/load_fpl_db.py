import sqlite3
from pathlib import Path

from fetch_fpl import fetch_fpl_data


# -----------------------------
# 1. Fetch cleaned FPL data
# -----------------------------

players, teams, gameweeks, fixtures = fetch_fpl_data()


# -----------------------------
# 2. Create data folder
# -----------------------------

data_folder = Path("data")
data_folder.mkdir(exist_ok=True)

database_path = data_folder / "fpl.db"


# -----------------------------
# 3. Connect to SQLite
# -----------------------------

connection = sqlite3.connect(database_path)


# -----------------------------
# 4. Load tables into database
# -----------------------------

players.to_sql(
    "players",
    connection,
    if_exists="replace",
    index=False
)

teams.to_sql(
    "teams",
    connection,
    if_exists="replace",
    index=False
)

gameweeks.to_sql(
    "gameweeks",
    connection,
    if_exists="replace",
    index=False
)

fixtures.to_sql(
    "fixtures",
    connection,
    if_exists="replace",
    index=False
)


# -----------------------------
# 5. Close database
# -----------------------------

connection.close()

print("FPL database updated successfully.")
print(f"Database location: {database_path}")