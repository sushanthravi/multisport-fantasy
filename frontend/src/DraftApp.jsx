import { useEffect, useMemo, useState } from 'react'
import { loadCatalog } from './services/draftCatalog'
import { canPick, createDraft, LIMITS, makePick, restoreDraft, roster, ROUNDS, snakeTeam } from './draft/model'
import { freezeLeague, scoreLeague } from './draft/scoring'
import './DraftApp.css'

const STORAGE = 'multisport-fantasy-draft-v1'
const LEAGUE_STORAGE = 'multisport-fantasy-league-v1'
const SPORTS = ['ALL', 'FPL', 'NFL', 'F1']
const BATCH = 75

function detail(p) {
  if (p.sport === 'FPL') return `£${Number(p.price).toFixed(1)}m · ${p.points ?? 0} pts`
  if (p.sport === 'NFL') return p.adp == null ? 'ADP unavailable' : `ADP ${Number(p.adp).toFixed(1)}`
  return `P${p.rank ?? '—'} · ${p.points ?? 0} pts`
}

function Badge({ sport }) { return <span className={`sport-badge badge-${sport.toLowerCase()}`}>{sport}</span> }

function Setup({ onCreate }) {
  const [count, setCount] = useState(4)
  const [names, setNames] = useState(['My team', 'Team 2', 'Team 3', 'Team 4'])
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    const clean = names.map((name) => name.trim())
    if (clean.some((name) => !name) || new Set(clean.map((name) => name.toLowerCase())).size !== clean.length) {
      setError('Give each team a different name.')
      return
    }
    onCreate(clean)
  }
  return <div className="setup-layout"><section className="setup-panel"><p className="eyebrow">NEW DRAFT</p><h1>Set your league.<br/><em>Then start picking.</em></h1><p className="section-copy">Choose the teams. The order is randomized and reverses every round.</p><form onSubmit={submit}><label htmlFor="team-count">Number of teams</label><select id="team-count" value={count} onChange={(event) => { const next = Number(event.target.value); setCount(next); setNames(Array.from({ length: next }, (_, i) => names[i] ?? `Team ${i+1}`)) }}>{[2,3,4,5,6,7,8].map((n) => <option value={n} key={n}>{n} teams</option>)}</select><div className="team-inputs">{names.map((name,i) => <label key={i}>Team {i+1}<input value={name} maxLength={32} onChange={(event) => setNames(names.map((value,index) => index === i ? event.target.value : value))}/></label>)}</div>{error && <p role="alert" className="error-message">{error}</p>}<button className="primary-action" type="submit">Randomize order & start draft ↗</button></form></section><aside className="setup-note"><span className="decorative-ball">↝</span><p className="eyebrow">THE FORMAT</p><h2>One league.<br/>Three sports.</h2><div className="rule"><b>01</b><span><strong>Random snake order</strong><small>First round forward, next round in reverse.</small></span></div><div className="rule"><b>02</b><span><strong>Pick across sports</strong><small>Choose any undrafted athlete on your turn.</small></span></div><div className="rule"><b>03</b><span><strong>14 roster slots</strong><small>Each team: 6 FPL, 6 NFL and 2 F1.</small></span></div><p className="notice">Same-browser simulation: picks are saved on this device. Shared online drafts need a hosted API and database.</p></aside></div>
}

function Room({ draft, players, league, onPick, onRestart, onRefresh }) {
  const [sport, setSport] = useState('ALL')
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('ALL')
  const [sort, setSort] = useState('ranking')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [inspected, setInspected] = useState('')
  const [visible, setVisible] = useState(BATCH)
  const byKey = useMemo(() => new Map(players.map((p) => [p.key,p])), [players])
  const total = draft.teams.length * ROUNDS
  const currentId = draft.picks.length < total ? snakeTeam(draft.order,draft.picks.length) : null
  const currentTeam = draft.teams.find((team) => team.id === currentId)
  const viewedId = inspected || currentId || draft.order[0]
  const viewedTeam = draft.teams.find((team) => team.id === viewedId)
  const viewedRoster = roster(draft,viewedId,byKey)
  const taken = useMemo(() => new Set(draft.picks.map((pick) => pick.playerKey)), [draft.picks])
  const round = Math.floor(draft.picks.length / draft.teams.length) + 1
  const positions = [...new Set(players.filter((p) => sport === 'ALL' || p.sport === sport).map((p) => p.position))].sort()
  const filtered = useMemo(() => players.filter((p) =>
    (sport === 'ALL' || p.sport === sport) &&
    (position === 'ALL' || p.position === position) &&
    (!onlyAvailable || !taken.has(p.key)) &&
    `${p.name} ${p.team}`.toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a,b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'points') return (b.points ?? -1) - (a.points ?? -1)
    if (sort === 'sport') return a.sport.localeCompare(b.sport) || a.name.localeCompare(b.name)
    const rank = (p) => p.sport === 'NFL' ? p.adp ?? Infinity : p.sport === 'F1' ? p.rank ?? Infinity : -(p.points ?? 0)
    return a.sport.localeCompare(b.sport) || rank(a)-rank(b)
  }), [players,sport,position,onlyAvailable,taken,search,sort])

  return <div className="room"><div className="room-header"><div><p className="eyebrow">THE DRAFT ROOM</p><h1>{currentTeam ? <>{currentTeam.name} <em>is on the clock.</em></> : <>Draft <em>complete.</em></>}</h1><p>{currentTeam ? `Round ${round} of ${ROUNDS} · Pick ${draft.picks.length+1} of ${total}` : `All ${total} picks are in.`}</p></div><div className="room-actions"><span className="mode-chip">◉ Same-browser simulation</span><button className="secondary-action" onClick={onRestart}>New draft</button></div></div>{league && <Leaderboard league={league} players={players} onRefresh={onRefresh}/>}<div className="room-grid"><section className="pool-panel"><div className="panel-heading"><div><p className="eyebrow">ATHLETE POOL</p><h2>Draft across every sport</h2></div><span className="count-pill">{filtered.length.toLocaleString()} athletes</span></div><div className="sport-tabs" aria-label="Sport filters">{SPORTS.map((item) => <button className={sport === item ? 'active' : ''} key={item} onClick={() => { setSport(item);setPosition('ALL');setVisible(BATCH) }}>{item === 'ALL' ? 'All sports' : item}</button>)}</div><div className="pool-controls"><label><span className="sr-only">Search athletes</span><input placeholder="Search athlete or team" value={search} onChange={(event)=>{setSearch(event.target.value);setVisible(BATCH)}}/></label><label><span className="sr-only">Position</span><select value={position} onChange={(event)=>{setPosition(event.target.value);setVisible(BATCH)}}><option value="ALL">All positions</option>{positions.map((p)=><option value={p} key={p}>{p}</option>)}</select></label><label><span className="sr-only">Sort athletes</span><select value={sort} onChange={(event)=>setSort(event.target.value)}><option value="ranking">Sport ranking</option><option value="name">Name A–Z</option><option value="sport">Sport A–Z</option><option value="points">Points*</option></select></label></div><label className="available-toggle"><input type="checkbox" checked={onlyAvailable} onChange={(event)=>setOnlyAvailable(event.target.checked)}/> Show undrafted athletes only</label><div className="pool-list">{filtered.slice(0,visible).map((p)=>{const selected=taken.has(p.key),allowed=canPick(draft,p,byKey);return <article className="athlete" key={p.key}><Badge sport={p.sport}/><div className="athlete-name"><strong>{p.name}</strong><small>{p.team} · {p.position || '—'}</small></div><span className="athlete-detail">{detail(p)}</span><button disabled={!allowed} aria-label={`Draft ${p.name} (${p.sport})`} onClick={()=>{onPick(p,byKey);setInspected('')}}>{selected?'Taken':!currentId?'Done':allowed?'Draft +':'Full'}</button></article>})}{filtered.length===0&&<p className="empty-pool">No athletes match these filters.</p>}</div>{filtered.length>visible&&<button className="more-button" onClick={()=>setVisible(visible+BATCH)}>Show more athletes ↓</button>}<p className="metric-note">* Athlete pool shows season totals; league scores use gains since draft completion. NFL ranking uses ADP.</p></section><aside className="draft-sidebar"><section className="side-card"><div className="side-heading"><p className="eyebrow">ROSTER</p><select aria-label="View roster for team" value={viewedId} onChange={(event)=>setInspected(event.target.value)}>{draft.teams.map((team)=><option key={team.id} value={team.id}>{team.name}</option>)}</select></div><h2>{viewedTeam.name}</h2>{Object.entries(LIMITS).map(([name,limit])=>{const rosterPlayers=viewedRoster.filter((p)=>p.sport===name);return <div className="roster-sport" key={name}><div className="roster-heading"><Badge sport={name}/><strong>{rosterPlayers.length} / {limit}</strong></div>{Array.from({length:limit},(_,i)=><div className={`roster-slot ${rosterPlayers[i]?'filled':''}`} key={i}><span>{String(i+1).padStart(2,'0')}</span><strong>{rosterPlayers[i]?.name??'Open slot'}</strong>{rosterPlayers[i]&&<small>{rosterPlayers[i].position}</small>}</div>)}</div>})}</section><section className="side-card order-card"><p className="eyebrow">SNAKE ORDER</p><h2>Round {Math.min(round,ROUNDS)}</h2>{draft.order.map((id,i)=>{const teamId=round%2===0?draft.order[draft.order.length-1-i]:id;return <div className={teamId===currentId?'current':''} key={teamId}><span>{i+1}</span><strong>{draft.teams.find((team)=>team.id===teamId).name}</strong>{teamId===currentId&&<small>On the clock</small>}</div>})}</section><section className="side-card history-card"><p className="eyebrow">LATEST PICKS</p>{draft.picks.length===0?<p>No picks yet. Choose an athlete to start.</p>:[...draft.picks].slice(-5).reverse().map((pick)=><div className="history-pick" key={pick.number}><span>#{pick.number}</span><Badge sport={pick.sport}/><div><strong>{byKey.get(pick.playerKey)?.name}</strong><small>{draft.teams.find((team)=>team.id===pick.teamId)?.name}</small></div></div>)}</section></aside></div></div>
}

function Leaderboard({ league, players, onRefresh }) {
  const result = scoreLeague(league, players)
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(league, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'multisport-league.json'; anchor.click()
    URL.revokeObjectURL(url)
  }
  return <section className="league-board"><div className="league-heading"><div><p className="eyebrow">SAVED LEAGUE</p><h2>Standings since draft completion</h2><small>Baseline saved {new Date(league.completedAt).toLocaleString()}</small></div><div><button className="secondary-action" onClick={onRefresh}>Refresh data</button> <button className="secondary-action" onClick={download}>Download teams</button></div></div><div className="league-table-wrap"><table><thead><tr><th>Team</th><th>FPL / 100</th><th>NFL / 100</th><th>F1 / 100</th><th>Total / 100</th></tr></thead><tbody>{result.teams.sort((a,b)=>(b.total??-1)-(a.total??-1)).map((team)=><tr key={team.id}><th>{team.name}</th>{['FPL','NFL','F1'].map((sport)=><td key={sport}>{team.sports[sport].score == null ? 'Pending' : team.sports[sport].score.toFixed(1)}</td>)}<td>{team.total == null ? 'Pending' : team.total.toFixed(1)}</td></tr>)}</tbody></table></div><p className="metric-note">Each athlete’s points gained since the saved baseline are divided by the highest drafted gain in that sport; the team averages its athletes per sport, then averages all three sports equally. Zero gains and missing results stay pending. NFL results are not in the current data pipeline, so overall standings remain pending. Refresh reads the latest deployed catalog; it does not fetch live results from the static site.</p></section>
}

export default function DraftApp() {
  const [catalog,setCatalog] = useState(null)
  const [error,setError] = useState('')
  const [draft,setDraft] = useState(null)
  const [league,setLeague] = useState(null)
  const [restart,setRestart] = useState(false)
  const [reload,setReload] = useState(0)
  useEffect(()=>{
    let cancelled=false
    loadCatalog().then((data)=>{
      if(cancelled)return
      setCatalog(data)
      const restored = restoreDraft(localStorage.getItem(STORAGE),new Map(data.players.map((p)=>[p.key,p])))
      setDraft(restored)
      let saved = null
      try { saved = JSON.parse(localStorage.getItem(LEAGUE_STORAGE)) } catch { /* ignore invalid browser storage */ }
      if (!saved && restored?.picks.length === restored?.teams.length * ROUNDS) {
        saved = freezeLeague(restored,data.players)
        localStorage.setItem(LEAGUE_STORAGE,JSON.stringify(saved))
      }
      if(saved?.version===1 && saved?.draft?.picks?.length === saved?.draft?.teams?.length * ROUNDS) setLeague(saved)
    }).catch((reason)=>{if(!cancelled)setError(reason.message)})
    return ()=>{cancelled=true}
  },[reload])
  function start(names){const next=createDraft(names);localStorage.setItem(STORAGE,JSON.stringify(next));localStorage.removeItem(LEAGUE_STORAGE);setLeague(null);setDraft(next);setRestart(false)}
  function pick(player,byKey){const next=makePick(draft,player,byKey);localStorage.setItem(STORAGE,JSON.stringify(next));setDraft(next);if(next.picks.length===next.teams.length*ROUNDS){const saved=freezeLeague(next,catalog.players);localStorage.setItem(LEAGUE_STORAGE,JSON.stringify(saved));setLeague(saved)}}
  return <div className="app-shell"><header className="site-header"><div className="brand"><span className="brand-mark">M<span>•</span></span><span>MULTISPORT<br/><strong>FANTASY</strong></span></div><span className="header-right"><i/> THREE SPORTS. ONE DRAFT.</span></header><main><div className="hero-strip"><span>FPL <b>×</b> NFL <b>×</b> F1</span><strong>6 + 6 + 2</strong><span>ONE 14-ATHLETE ROSTER</span></div>{error?<section className="load-state"><h2>Could not load the athlete pool</h2><p>{error}</p><button className="primary-action" onClick={()=>{setError('');setReload((key)=>key+1)}}>Retry</button></section>:!catalog?<section className="load-state"><h2>Loading FPL, NFL and F1…</h2></section>:!draft||restart?<Setup onCreate={start}/>:<Room draft={draft} players={catalog.players} league={league} onPick={pick} onRestart={()=>setRestart(true)} onRefresh={()=>setReload((key)=>key+1)}/>}</main><footer><span>Multisport Fantasy · Draft prototype</span><span>{catalog?`${catalog.players.length.toLocaleString()} athletes · ${catalog.source}`:'Loading player pool'}</span></footer></div>
}
