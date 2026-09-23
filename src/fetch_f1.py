import requests
import pandas as pd


SESSIONS_URL = "https://api.openf1.org/v1/sessions"
DRIVERS_URL = "https://api.openf1.org/v1/drivers"
STANDINGS_URL = "https://api.openf1.org/v1/championship_drivers"


def get_latest_race_with_standings():
    response = requests.get(SESSIONS_URL)
    response.raise_for_status()

    sessions = pd.DataFrame(response.json())

    races = sessions[
        sessions["session_name"] == "Race"
    ].copy()

    races["date_start"] = pd.to_datetime(
        races["date_start"]
    )

    races = races.sort_values(
        "date_start",
        ascending=False
    )

    for _, race in races.iterrows():
        session_key = int(race["session_key"])

        standings_response = requests.get(
            STANDINGS_URL,
            params={"session_key": session_key}
        )

        if standings_response.status_code == 200:
            return race, standings_response.json()

    raise Exception(
        "Could not find a race with championship standings."
    )


def fetch_f1_data():
    race, standings_data = get_latest_race_with_standings()

    session_key = int(race["session_key"])

    drivers_response = requests.get(
        DRIVERS_URL,
        params={"session_key": session_key}
    )

    drivers_response.raise_for_status()

    drivers = pd.DataFrame(
        drivers_response.json()
    )

    drivers = drivers[
        [
            "driver_number",
            "full_name",
            "team_name"
        ]
    ].copy()

    drivers = drivers.rename(
        columns={
            "full_name": "driver_name"
        }
    )

    standings = pd.DataFrame(
        standings_data
    )

    standings["points_gained"] = (
        standings["points_current"]
        - standings["points_start"]
    )

    standings = standings[
        [
            "driver_number",
            "position_current",
            "points_start",
            "points_current",
            "points_gained"
        ]
    ].copy()

    f1_players = standings.merge(
        drivers,
        on="driver_number",
        how="left"
    )

    f1_players = f1_players[
        [
            "driver_number",
            "driver_name",
            "team_name",
            "position_current",
            "points_start",
            "points_current",
            "points_gained"
        ]
    ]

    f1_players = f1_players.sort_values(
        "position_current"
    )

    race_info = {
        "session_key": session_key,
        "meeting_key": int(race["meeting_key"]),
        "race_name": race["location"],
        "date_start": str(race["date_start"])
    }

    return f1_players, race_info


if __name__ == "__main__":
    f1_players, race_info = fetch_f1_data()

    print("\nLATEST RACE")
    print(race_info)

    print("\nF1 PLAYERS")
    print(f1_players)