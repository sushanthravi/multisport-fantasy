const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/fpl.json`;

async function readJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load ${url} (${response.status})`);
  }

  return response.json();
}

async function loadFromApi(apiBase) {
  const [players, teams, positions, gameweeks, fixtures] = await Promise.all([
    readJson(`${apiBase}/players`),
    readJson(`${apiBase}/teams`),
    readJson(`${apiBase}/positions`),
    readJson(`${apiBase}/gameweeks`),
    readJson(`${apiBase}/fixtures`),
  ]);

  return {
    generated_at: new Date().toISOString(),
    source: "FPL API",
    players,
    teams,
    positions,
    gameweeks,
    fixtures,
  };
}

export async function loadFplData() {
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  return apiBase ? loadFromApi(apiBase) : readJson(SNAPSHOT_URL);
}
