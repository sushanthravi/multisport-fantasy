import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { loadFplData } from "./services/fplData";

const PAGE_SIZE = 60;
const POSITION_LABELS = { GKP: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };
const SORT_OPTIONS = [
  ["total_points", "Total points"], ["event_points", "Gameweek points"],
  ["price", "Price"], ["minutes", "Minutes"], ["goals_scored", "Goals"],
  ["assists", "Assists"], ["player_name", "Player name"],
];

function formatDate(value, includeTime = false) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function formatNumber(value) { return new Intl.NumberFormat("en-US").format(value ?? 0); }
function difficultyLabel(value) { return value <= 2 ? "Favourable" : value === 3 ? "Balanced" : "Tough"; }

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/></>,
    compare: <><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    refresh: <><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 5.5L4 8M5.5 15A7 7 0 0 0 18 18.5l2-2.5"/></>,
    football: <><circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-1 4h-4L9 9l3-2ZM10 13l-3 2M14 13l3 2M9 9 6 8M15 9l3-1M12 7V3M7 15l1 4M17 15l-1 4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function LoadingState() {
  return <main className="state-page"><div className="loader"/><h2>Loading the FPL player pool</h2><p>Connecting players, clubs, positions, gameweeks and fixtures.</p></main>;
}

function ErrorState({ error, onRetry }) {
  return <main className="state-page"><span className="state-icon">!</span><h2>The FPL data did not load</h2><p>{error}</p><button className="primary-button" onClick={onRetry}><Icon name="refresh"/> Try again</button></main>;
}

function Stat({ label, value, accent }) {
  return <div className={`hero-stat${accent ? " hero-stat--accent" : ""}`}><strong>{value}</strong><span>{label}</span></div>;
}

function PlayerExplorer({ data, selectedIds, setSelectedIds, onOpenCompare }) {
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("ALL");
  const [position, setPosition] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState("ALL");
  const [sortBy, setSortBy] = useState("total_points");
  const [sortDirection, setSortDirection] = useState("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = data.players.filter((player) => {
      const matchesSearch = !term || `${player.player_name} ${player.team_name}`.toLowerCase().includes(term);
      const matchesTeam = team === "ALL" || player.team_name === team;
      const matchesPosition = position === "ALL" || player.position === position;
      const matchesPrice = maxPrice === "ALL" || Number(player.price) <= Number(maxPrice);
      return matchesSearch && matchesTeam && matchesPosition && matchesPrice;
    });
    return result.sort((a, b) => {
      const first = a[sortBy] ?? 0;
      const second = b[sortBy] ?? 0;
      const comparison = typeof first === "string" ? first.localeCompare(second) : Number(first) - Number(second);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data.players, maxPrice, position, search, sortBy, sortDirection, team]);

  function togglePlayer(id) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((playerId) => playerId !== id);
      return current.length === 3 ? current : [...current, id];
    });
  }

  function resetFilters() { setSearch(""); setTeam("ALL"); setPosition("ALL"); setMaxPrice("ALL"); setVisibleCount(PAGE_SIZE); }

  return (
    <section className="workspace" aria-labelledby="players-title">
      <div className="section-heading">
        <div><span className="eyebrow">PLAYER EXPLORER</span><h2 id="players-title">Find the value others miss.</h2><p>Search the full player pool, narrow the field, then compare up to three picks.</p></div>
        <span className="result-count">{formatNumber(filteredPlayers.length)} matches</span>
      </div>

      <div className="filter-panel">
        <label className="search-field"><span>Search</span><Icon name="search"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Player or club"/></label>
        <label><span>Club</span><select value={team} onChange={(event) => setTeam(event.target.value)}><option value="ALL">All clubs</option>{data.teams.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
        <label><span>Position</span><select value={position} onChange={(event) => setPosition(event.target.value)}><option value="ALL">All positions</option>{data.positions.map((item) => <option key={item} value={item}>{POSITION_LABELS[item] ?? item}</option>)}</select></label>
        <label><span>Maximum price</span><select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="ALL">Any price</option>{[4.5, 5.5, 6.5, 8, 10, 12].map((price) => <option key={price} value={price}>£{price.toFixed(1)}m</option>)}</select></label>
        <button className="text-button" onClick={resetFilters}>Reset</button>
      </div>

      <div className="table-toolbar">
        <div className="position-chips" aria-label="Position filters">{["ALL", ...data.positions].map((item) => <button key={item} className={position === item ? "active" : ""} onClick={() => setPosition(item)}>{item === "ALL" ? "All" : item}</button>)}</div>
        <div className="sort-controls"><label><span>Sort</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="direction-button" onClick={() => setSortDirection((value) => value === "desc" ? "asc" : "desc")} aria-label={`Sort ${sortDirection === "desc" ? "ascending" : "descending"}`}>{sortDirection === "desc" ? "↓" : "↑"}</button></div>
      </div>

      <div className="player-table-wrap">
        <table className="player-table">
          <thead><tr><th>Player</th><th>Price</th><th>Total</th><th>GW</th><th>Minutes</th><th>G</th><th>A</th><th><span className="sr-only">Compare</span></th></tr></thead>
          <tbody>{filteredPlayers.slice(0, visibleCount).map((player, index) => {
            const selected = selectedIds.includes(player.id);
            const disabled = selectedIds.length === 3 && !selected;
            return <tr key={player.id} className={selected ? "selected-row" : ""}>
              <td><div className="player-cell"><span className="rank">{index + 1}</span><span className={`position-badge position-${player.position.toLowerCase()}`}>{player.position}</span><span><strong>{player.player_name}</strong><small>{player.team_name}</small></span></div></td>
              <td><strong>£{Number(player.price).toFixed(1)}m</strong></td><td><strong>{player.total_points}</strong></td><td>{player.event_points}</td><td>{formatNumber(player.minutes)}</td><td>{player.goals_scored}</td><td>{player.assists}</td>
              <td><button className={`compare-button${selected ? " selected" : ""}`} onClick={() => togglePlayer(player.id)} disabled={disabled} aria-label={`${selected ? "Remove" : "Add"} ${player.player_name} ${selected ? "from" : "to"} comparison`}>{selected ? "✓" : "+"}<span>{selected ? "Added" : "Compare"}</span></button></td>
            </tr>;
          })}</tbody>
        </table>
        {filteredPlayers.length === 0 && <div className="empty-state"><Icon name="search" size={28}/><strong>No players match those filters.</strong><button className="text-button" onClick={resetFilters}>Clear filters</button></div>}
      </div>
      {visibleCount < filteredPlayers.length && <button className="load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Show more players <Icon name="chevron"/></button>}
      {selectedIds.length > 0 && <CompareTray players={data.players.filter((player) => selectedIds.includes(player.id))} onRemove={togglePlayer} onClear={() => setSelectedIds([])} onCompare={onOpenCompare}/>}
    </section>
  );
}

function CompareTray({ players, onRemove, onClear, onCompare }) {
  return <aside className="compare-tray" aria-label="Selected players"><div className="tray-label"><Icon name="compare"/><span><strong>{players.length}/3 selected</strong><small>Choose at least two players</small></span></div><div className="tray-players">{players.map((player) => <span className="tray-player" key={player.id}>{player.player_name}<button onClick={() => onRemove(player.id)} aria-label={`Remove ${player.player_name}`}><Icon name="close" size={14}/></button></span>)}</div><button className="text-button" onClick={onClear}>Clear</button><button className="primary-button" disabled={players.length < 2} onClick={onCompare}>Compare now</button></aside>;
}

function ComparisonModal({ players, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const metrics = [
    ["Price", (player) => `£${Number(player.price).toFixed(1)}m`], ["Total points", (player) => player.total_points],
    ["Gameweek points", (player) => player.event_points], ["Minutes", (player) => formatNumber(player.minutes)],
    ["Goals", (player) => player.goals_scored], ["Assists", (player) => player.assists],
    ["Points / £m", (player) => (player.total_points / player.price).toFixed(1)],
  ];
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title"><div className="modal-header"><div><span className="eyebrow">SIDE BY SIDE</span><h2 id="compare-title">Player comparison</h2></div><button className="icon-button" onClick={onClose} aria-label="Close comparison"><Icon name="close"/></button></div><div className="comparison-grid" style={{ "--players": players.length }}><span/>{players.map((player) => <div className="comparison-player" key={player.id}><span className={`position-badge position-${player.position.toLowerCase()}`}>{player.position}</span><strong>{player.player_name}</strong><small>{player.team_name}</small></div>)}{metrics.flatMap(([label, getValue]) => [<span className="metric-label" key={`${label}-label`}>{label}</span>, ...players.map((player) => <strong className="metric-value" key={`${label}-${player.id}`}>{getValue(player)}</strong>)])}</div></section></div>;
}

function FixturesView({ data }) {
  const initialGameweek = data.gameweeks.find((gameweek) => gameweek.is_current)?.id ?? data.gameweeks.find((gameweek) => gameweek.is_next)?.id ?? 1;
  const [gameweekId, setGameweekId] = useState(String(initialGameweek));
  const selectedGameweek = data.gameweeks.find((gameweek) => String(gameweek.id) === gameweekId);
  const fixtures = data.fixtures.filter((fixture) => String(fixture.event) === gameweekId);
  return <section className="workspace" aria-labelledby="fixtures-title"><div className="section-heading fixture-heading"><div><span className="eyebrow">FIXTURE PLANNER</span><h2 id="fixtures-title">See the gameweek ahead.</h2><p>Review matchups, kickoff times and official fixture difficulty.</p></div><label className="gameweek-select"><span>Gameweek</span><select value={gameweekId} onChange={(event) => setGameweekId(event.target.value)}>{data.gameweeks.map((gameweek) => <option value={gameweek.id} key={gameweek.id}>{gameweek.name}</option>)}</select></label></div><div className="gameweek-summary"><div><span>Deadline</span><strong>{formatDate(selectedGameweek?.deadline_time, true)}</strong></div><div><span>Average score</span><strong>{selectedGameweek?.average_entry_score || "—"}</strong></div><div><span>Status</span><strong>{selectedGameweek?.finished ? "Complete" : selectedGameweek?.is_current ? "In progress" : "Upcoming"}</strong></div><div><span>Fixtures</span><strong>{fixtures.length}</strong></div></div><div className="fixtures-list">{fixtures.map((fixture) => <article className="fixture-card" key={fixture.id}><div className="fixture-date">{formatDate(fixture.kickoff_time, true)}</div><div className="fixture-team"><span>{fixture.home_team}</span><small className={`difficulty d${fixture.team_h_difficulty}`}>{difficultyLabel(fixture.team_h_difficulty)} · {fixture.team_h_difficulty}</small></div><div className="fixture-score">{fixture.finished ? `${fixture.team_h_score} — ${fixture.team_a_score}` : "vs"}</div><div className="fixture-team away"><span>{fixture.away_team}</span><small className={`difficulty d${fixture.team_a_difficulty}`}>{difficultyLabel(fixture.team_a_difficulty)} · {fixture.team_a_difficulty}</small></div></article>)}</div></section>;
}

function DataView({ data }) {
  const resources = [["Players", data.players.length, "Filterable player metrics"], ["Teams", data.teams.length, "Club names and short codes"], ["Positions", data.positions.length, "FPL squad roles"], ["Gameweeks", data.gameweeks.length, "Deadlines and score context"], ["Fixtures", data.fixtures.length, "Matchups and difficulty"]];
  return <section className="workspace" aria-labelledby="data-title"><div className="section-heading"><div><span className="eyebrow">DATA HEALTH</span><h2 id="data-title">One source, five connected tables.</h2><p>The interface is reading the deployable snapshot produced by your existing SQLite pipeline.</p></div><span className="status-pill"><i/> Ready</span></div><div className="resource-grid">{resources.map(([name, count, description]) => <article className="resource-card" key={name}><span>{name}</span><strong>{formatNumber(count)}</strong><p>{description}</p></article>)}</div><div className="pipeline-card"><div><span className="eyebrow">CURRENT FLOW</span><h3>FPL API <b>→</b> Python cleanup <b>→</b> SQLite <b>→</b> Web snapshot</h3></div><div className="snapshot-meta"><span>Source</span><strong>{data.source}</strong><span>Generated</span><strong>{new Date(data.generated_at).toLocaleString()}</strong></div></div></section>;
}

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("players");
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadFplData().then((payload) => !cancelled && setData(payload)).catch((reason) => !cancelled && setError(reason.message));
    return () => { cancelled = true; };
  }, [loadKey]);

  if (error) return <ErrorState error={error} onRetry={() => { setError(""); setData(null); setLoadKey((key) => key + 1); }}/>;
  if (!data) return <LoadingState/>;

  const currentGameweek = data.gameweeks.find((gameweek) => gameweek.is_current) ?? data.gameweeks.find((gameweek) => gameweek.is_next);
  const selectedPlayers = data.players.filter((player) => selectedIds.includes(player.id));

  return <div className="app-shell"><header className="site-header"><a className="brand" href="#top" aria-label="Multisport Fantasy home"><span className="brand-mark"><Icon name="football"/></span><span>Multisport<strong>Fantasy</strong></span></a><nav aria-label="Primary navigation"><button className={activeView === "players" ? "active" : ""} onClick={() => setActiveView("players")}><Icon name="users"/> Players</button><button className={activeView === "fixtures" ? "active" : ""} onClick={() => setActiveView("fixtures")}><Icon name="calendar"/> Fixtures</button><button className={activeView === "data" ? "active" : ""} onClick={() => setActiveView("data")}><Icon name="database"/> Data</button></nav><span className="season-chip">FPL · 26/27</span></header><main id="top"><section className="hero"><div><span className="eyebrow"><i/> FPL DATA WORKSPACE</span><h1>Make the smarter<br/><em>fantasy pick.</em></h1><p>Your FPL pipeline, turned into a decision-ready player explorer.</p></div><div className="hero-stats"><Stat label="Players" value={formatNumber(data.players.length)} accent/><Stat label="Clubs" value={data.teams.length}/><Stat label="Current round" value={currentGameweek ? `GW ${currentGameweek.id}` : "—"}/><Stat label="Fixtures" value={formatNumber(data.fixtures.length)}/></div></section>{activeView === "players" && <PlayerExplorer data={data} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpenCompare={() => setCompareOpen(true)}/>} {activeView === "fixtures" && <FixturesView data={data}/>} {activeView === "data" && <DataView data={data}/>}</main><footer><span>Multisport Fantasy</span><span>FPL first. Built to expand.</span></footer>{compareOpen && <ComparisonModal players={selectedPlayers} onClose={() => setCompareOpen(false)}/>}</div>;
}

export default App;
