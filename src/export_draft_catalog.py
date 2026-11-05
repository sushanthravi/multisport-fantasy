"""Build a compact three-sport draft catalog from the existing SQLite pipelines."""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "fpl.db"
OUTPUT = ROOT / "frontend" / "public" / "data" / "draft-catalog.json"


def export_catalog():
    if not DB.exists():
        raise FileNotFoundError(f"Run the data loaders before exporting: {DB}")

    connection = sqlite3.connect(DB)
    connection.row_factory = sqlite3.Row
    try:
        fpl = [
            {
                "key": f"FPL:{row['id']}", "sport": "FPL", "id": row["id"],
                "name": row["player_name"], "team": row["team_name"],
                "position": row["position"], "price": row["price"],
                "points": row["total_points"],
            }
            for row in connection.execute(
                "SELECT id, player_name, team_name, position, price, total_points FROM players"
            )
        ]
        nfl = [
            {
                "key": f"NFL:{row['player_id']}", "sport": "NFL",
                "id": row["player_id"], "name": row["player_name"],
                "team": row["team"] or "Free agent", "position": row["position"],
                "adp": row["adp"],
            }
            for row in connection.execute(
                "SELECT player_id, player_name, team, position, adp FROM nfl_players "
                "WHERE player_name IS NOT NULL AND position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DEF')"
            )
        ]
        f1 = [
            {
                "key": f"F1:{row['driver_number']}", "sport": "F1",
                "id": row["driver_number"], "name": row["driver_name"],
                "team": row["team_name"], "position": "Driver",
                "points": row["points_current"], "rank": row["position_current"],
            }
            for row in connection.execute(
                "SELECT driver_number, driver_name, team_name, "
                "position_current, points_current FROM f1_players"
            )
        ]
    finally:
        connection.close()

    if not all((fpl, nfl, f1)):
        raise ValueError("All three sport tables must contain athletes before export")

    keys = [player["key"] for player in fpl + nfl + f1]
    if len(keys) != len(set(keys)):
        raise ValueError("Duplicate athlete keys in draft catalog")

    payload = {
        "generated_at": datetime.fromtimestamp(DB.stat().st_mtime, timezone.utc).isoformat(),
        "source": "Local SQLite pipeline snapshot",
        "roster_limits": {"FPL": 6, "NFL": 6, "F1": 2},
        "players": fpl + nfl + f1,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Exported {len(fpl)} FPL, {len(nfl)} NFL, {len(f1)} F1 athletes")


if __name__ == "__main__":
    export_catalog()
