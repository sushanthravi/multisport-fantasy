import sqlite3
from pathlib import Path
from datetime import datetime

from fetch_f1 import fetch_f1_data


f1_players, race_info = fetch_f1_data()

data_folder = Path("data")
data_folder.mkdir(exist_ok=True)

database_path = data_folder / "fpl.db"

connection = sqlite3.connect(database_path)

# ---------------------------------
# 1. CURRENT DRIVER STATE
# ---------------------------------

f1_players.to_sql(
    "f1_players",
    connection,
    if_exists="replace",
    index=False
)


# ---------------------------------
# 2. CREATE HISTORY TABLE
# ---------------------------------

connection.execute("""
    CREATE TABLE IF NOT EXISTS f1_points_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_number INTEGER,
        driver_name TEXT,
        team_name TEXT,
        session_key INTEGER,
        race_name TEXT,
        points_total REAL,
        points_gained REAL,
        recorded_at TEXT
    )
""")


# ---------------------------------
# 3. CHECK IF THIS RACE IS ALREADY SAVED
# ---------------------------------

session_key = race_info["session_key"]

cursor = connection.cursor()

cursor.execute(
    """
    SELECT COUNT(*)
    FROM f1_points_history
    WHERE session_key = ?
    """,
    (session_key,)
)

race_already_saved = cursor.fetchone()[0] > 0


# ---------------------------------
# 4. IF NEW RACE, APPEND HISTORY
# ---------------------------------

if not race_already_saved:

    for _, driver in f1_players.iterrows():

        connection.execute(
            """
            INSERT INTO f1_points_history (
                driver_number,
                driver_name,
                team_name,
                session_key,
                race_name,
                points_total,
                points_gained,
                recorded_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(driver["driver_number"]),
                driver["driver_name"],
                driver["team_name"],
                session_key,
                race_info["race_name"],
                float(driver["points_current"]),
                float(driver["points_gained"]),
                datetime.now().isoformat()
            )
        )

    print("New F1 race history saved.")

else:
    print("This F1 race is already in history.")


connection.commit()
connection.close()

print("F1 database updated successfully.")
print(f"Database location: {database_path}")