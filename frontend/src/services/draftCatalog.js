const SNAPSHOT = `${import.meta.env.BASE_URL}data/draft-catalog.json`;

async function read(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return response.json();
}

export async function loadCatalog() {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return read(SNAPSHOT);

  const [fpl, nfl, f1] = await Promise.all([
    read(`${base}/players`), read(`${base}/nfl/players`), read(`${base}/f1/players`),
  ]);
  return {
    source: "Local FastAPI → SQLite",
    generated_at: new Date().toISOString(),
    players: [
      ...fpl.map((p) => ({ key: `FPL:${p.id}`, sport: "FPL", id: p.id, name: p.player_name, team: p.team_name, position: p.position, price: p.price, points: p.total_points })),
      ...nfl.filter((p) => ["QB", "RB", "WR", "TE", "K", "DEF"].includes(p.position)).map((p) => ({ key: `NFL:${p.id}`, sport: "NFL", id: p.id, name: p.player_name, team: p.team_name || "Free agent", position: p.position, adp: p.adp })),
      ...f1.map((p) => ({ key: `F1:${p.id}`, sport: "F1", id: p.id, name: p.driver_name, team: p.team_name, position: "Driver", points: p.points_current, rank: p.position })),
    ],
  };
}
