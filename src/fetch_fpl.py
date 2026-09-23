import requests
import pandas as pd

BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"


def fetch_fpl_data():
    # -----------------------------
    # 1. Pull API data
    # -----------------------------

    bootstrap_response = requests.get(BOOTSTRAP_URL)
    bootstrap_response.raise_for_status()
    bootstrap_data = bootstrap_response.json()

    fixtures_response = requests.get(FIXTURES_URL)
    fixtures_response.raise_for_status()
    fixtures_data = fixtures_response.json()

    # -----------------------------
    # 2. Convert API data to DataFrames
    # -----------------------------

    players = pd.DataFrame(bootstrap_data["elements"])
    teams = pd.DataFrame(bootstrap_data["teams"])
    gameweeks = pd.DataFrame(bootstrap_data["events"])
    positions = pd.DataFrame(bootstrap_data["element_types"])
    fixtures = pd.DataFrame(fixtures_data)

    # -----------------------------
    # 3. Create team lookup
    # -----------------------------

    teams_lookup = teams[
        ["id", "name"]
    ].rename(
        columns={
            "id": "team",
            "name": "team_name"
        }
    )

    # -----------------------------
    # 4. Create position lookup
    # -----------------------------

    positions_lookup = positions[
        ["id", "singular_name_short"]
    ].rename(
        columns={
            "id": "element_type",
            "singular_name_short": "position"
        }
    )

    # -----------------------------
    # 5. Join team + position onto players
    # -----------------------------

    players = players.merge(
        teams_lookup,
        on="team",
        how="left"
    )

    players = players.merge(
        positions_lookup,
        on="element_type",
        how="left"
    )

    # -----------------------------
    # 6. Create cleaner player fields
    # -----------------------------

    players["player_name"] = (
        players["first_name"]
        + " "
        + players["second_name"]
    )

    players["price"] = players["now_cost"] / 10

    # -----------------------------
    # 7. Keep only fields we need for MVP
    # -----------------------------

    player_columns = [
        "id",
        "player_name",
        "team_name",
        "position",
        "price",
        "total_points",
        "event_points",
        "minutes",
        "goals_scored",
        "assists"
    ]

    players = players[player_columns].copy()

    # -----------------------------
    # 8. Make fixtures readable
    # -----------------------------

    home_team_lookup = teams[
        ["id", "name"]
    ].rename(
        columns={
            "id": "team_h",
            "name": "home_team"
        }
    )

    away_team_lookup = teams[
        ["id", "name"]
    ].rename(
        columns={
            "id": "team_a",
            "name": "away_team"
        }
    )

    fixtures = fixtures.merge(
        home_team_lookup,
        on="team_h",
        how="left"
    )

    fixtures = fixtures.merge(
        away_team_lookup,
        on="team_a",
        how="left"
    )

    # -----------------------------
    # 9. Keep only useful fixture fields
    # -----------------------------

    fixture_columns = [
        "id",
        "event",
        "kickoff_time",
        "finished",
        "home_team",
        "away_team",
        "team_h_score",
        "team_a_score",
        "team_h_difficulty",
        "team_a_difficulty"
    ]

    fixtures = fixtures[fixture_columns].copy()

    # -----------------------------
    # 10. Simplify teams table
    # -----------------------------

    teams = teams[
        [
            "id",
            "name",
            "short_name"
        ]
    ].copy()

    # -----------------------------
    # 11. Simplify gameweeks table
    # -----------------------------

    gameweeks = gameweeks[
        [
            "id",
            "name",
            "deadline_time",
            "average_entry_score",
            "finished",
            "is_previous",
            "is_current",
            "is_next"
        ]
    ].copy()

    return players, teams, gameweeks, fixtures