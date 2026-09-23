import requests
import pandas as pd


# --------------------------------------------------
# API URLS
# --------------------------------------------------

PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl"

ADP_URL = "https://api.sleeper.com/projections/nfl/2026/1"


def fetch_nfl_data():

    # ==================================================
    # 1. FETCH PLAYER METADATA
    # ==================================================

    players_response = requests.get(PLAYERS_URL)

    players_response.raise_for_status()

    players_data = players_response.json()

    players = pd.DataFrame.from_dict(
        players_data,
        orient="index"
    )

    players.index.name = "sleeper_player_id"

    players = players.reset_index()

    # Sleeper already sometimes contains player_id
    # so remove it to avoid duplicate columns
    if "player_id" in players.columns:
        players = players.drop(
            columns=["player_id"]
        )

    players = players.rename(
        columns={
            "sleeper_player_id": "player_id",
            "full_name": "player_name"
        }
    )

    # Keep fantasy-relevant offensive players
    players = players[
        players["position"].isin(
            ["QB", "RB", "WR", "TE"]
        )
    ].copy()

    # Remove free agents / players with no team
    players = players[
        players["team"].notna()
    ].copy()

    # Keep only useful columns
    players = players[
        [
            "player_id",
            "player_name",
            "team",
            "position"
        ]
    ].copy()

    # Use string IDs for safe merging
    players["player_id"] = (
        players["player_id"].astype(str)
    )


    # ==================================================
    # 2. FETCH ADP DATA
    # ==================================================

    positions = [
        "QB",
        "RB",
        "WR",
        "TE"
    ]

    adp_rows = []


    # Sleeper only handles one position reliably
    # so fetch each position separately
    for position in positions:

        response = requests.get(
            ADP_URL,
            params={
                "season_type": "regular",
                "position[]": position,
                "order_by": "adp_dd_ppr"
            },
            headers={
                "User-Agent": "Mozilla/5.0"
            }
        )

        response.raise_for_status()

        data = response.json()

        print(
            f"{position}: {len(data)} rows returned"
        )


        # ----------------------------------------------
        # 3. EXTRACT PLAYER ID + ADP
        # ----------------------------------------------

        for record in data:

            player_id = record.get(
                "player_id"
            )

            # Sleeper stores projection values
            # inside the nested "stats" dictionary
            stats = record.get(
                "stats",
                {}
            )

            adp = stats.get(
                "adp_dd_ppr"
            )

            # Only keep rows that actually have ADP
            if (
                player_id is not None
                and adp is not None
                and adp != 1000
            ):

                adp_rows.append({
                    "player_id": str(player_id),
                    "adp": adp
                })


    # ==================================================
    # 4. CREATE ADP DATAFRAME
    # ==================================================

    adp_df = pd.DataFrame(
        adp_rows
    )


    print("\nADP PLAYERS FOUND:")
    print(len(adp_df))

    print("\nADP SAMPLE:")
    print(adp_df.head(20))


    # ==================================================
    # 5. MERGE PLAYERS + ADP
    # ==================================================

    nfl_players = players.merge(
        adp_df,
        on="player_id",
        how="left"
    )


    # ==================================================
    # 6. SORT BY ADP
    # ==================================================

    nfl_players = nfl_players.sort_values(
        "adp",
        ascending=True,
        na_position="last"
    )


    # ==================================================
    # 7. PRINT RESULT
    # ==================================================

    print("\nNFL PLAYERS SORTED BY ADP")

    print(
        nfl_players[
            [
                "player_name",
                "team",
                "position",
                "adp"
            ]
        ].head(50)
    )


    print("\nTotal NFL players:")
    print(len(nfl_players))


    print("\nPlayers with ADP:")
    print(
        nfl_players["adp"]
        .notna()
        .sum()
    )


    return nfl_players


# --------------------------------------------------
# TEST BLOCK
# --------------------------------------------------

if __name__ == "__main__":

    nfl_players = fetch_nfl_data()