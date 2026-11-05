import { describe, expect, it } from 'vitest'
import { freezeLeague, scoreLeague } from './scoring'

describe('saved league scoring', () => {
  it('freezes the baseline and keeps a combined result pending until all sports have results', () => {
    const draft = { teams: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], picks: [
      { teamId: 'a', playerKey: 'FPL:1', sport: 'FPL' }, { teamId: 'b', playerKey: 'FPL:2', sport: 'FPL' },
      { teamId: 'a', playerKey: 'F1:1', sport: 'F1' }, { teamId: 'b', playerKey: 'F1:2', sport: 'F1' },
      { teamId: 'a', playerKey: 'NFL:1', sport: 'NFL' }, { teamId: 'b', playerKey: 'NFL:2', sport: 'NFL' },
    ] }
    const players = [
      { key: 'FPL:1', sport: 'FPL', points: 10 }, { key: 'FPL:2', sport: 'FPL', points: 10 },
      { key: 'F1:1', sport: 'F1', points: 20 }, { key: 'F1:2', sport: 'F1', points: 20 },
      { key: 'NFL:1', sport: 'NFL', adp: 1 }, { key: 'NFL:2', sport: 'NFL', adp: 2 },
    ]
    const league = freezeLeague(draft, players)
    expect(scoreLeague(league, players).teams[0].sports.FPL.score).toBeNull()
    const updated = players.map((p) => ({ ...p, points: p.sport === 'NFL' ? undefined : p.points + (p.key.endsWith('1') ? 10 : 5) }))
    const scored = scoreLeague(league, updated)
    expect(scored.teams[0].sports.FPL.score).toBe(100)
    expect(scored.teams[1].sports.FPL.score).toBe(50)
    expect(scored.teams[0].total).toBeNull()
    expect(scoreLeague(league, [{ ...updated[0], points: 0 }, ...updated.slice(1)]).teams[0].sports.FPL.score).toBeNull()
  })
})
