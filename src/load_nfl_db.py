import sqlite3
from pathlib import Path

from fetch_nfl import fetch_nfl_data


nfl_players = fetch_nfl_data()

data_folder = Path("data")
data_folder.mkdir(exist_ok=True)

database_path = data_folder / "fpl.db"

connection = sqlite3.connect(database_path)

nfl_players.to_sql(
    "nfl_players",
    connection,
    if_exists="replace",
    index=False
)

connection.close()

print("NFL database updated successfully.")
print(f"Database location: {database_path}")