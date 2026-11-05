"""Export the SQLite FPL snapshot for the deployable web client."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATABASE_PATH = ROOT / "data" / "fpl.db"
OUTPUT_PATH = ROOT / "frontend" / "public" / "data" / "fpl.json"


def rows_as_dicts(connection: sqlite3.Connection, table: str) -> list[dict]:
    cursor = connection.execute(f"SELECT * FROM {table}")
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def export_snapshot() -> None:
    if not DATABASE_PATH.exists():
        raise FileNotFoundError(
            f"Database not found at {DATABASE_PATH}. Run src/load_fpl_db.py first."
        )

    connection = sqlite3.connect(DATABASE_PATH)
    try:
        players = rows_as_dicts(connection, "players")
        teams = rows_as_dicts(connection, "teams")
        gameweeks = rows_as_dicts(connection, "gameweeks")
        fixtures = rows_as_dicts(connection, "fixtures")
    finally:
        connection.close()

    position_order = ["GKP", "DEF", "MID", "FWD"]
    positions = sorted(
        {player["position"] for player in players if player.get("position")},
        key=position_order.index,
    )

    payload = {
        "generated_at": datetime.fromtimestamp(
            DATABASE_PATH.stat().st_mtime, tz=timezone.utc
        ).isoformat(),
        "source": "FPL SQLite snapshot",
        "players": players,
        "teams": teams,
        "positions": positions,
        "gameweeks": gameweeks,
        "fixtures": fixtures,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    print(
        "Exported "
        f"{len(players)} players, {len(teams)} teams, "
        f"{len(gameweeks)} gameweeks and {len(fixtures)} fixtures to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    export_snapshot()
