export const SPORTS = ['FPL', 'NFL', 'F1']

// The baseline is frozen when the final pick is made. Draft-day history cannot be
// reconstructed from a later catalog refresh.
export function freezeLeague(draft, players, at = new Date().toISOString()) {
  const byKey = new Map(players.map((player) => [player.key, player]))
  return {
    version: 1,
    completedAt: at,
    draft: structuredClone(draft),
    athletes: Object.fromEntries(draft.picks.map((pick) => {
      const athlete = byKey.get(pick.playerKey)
      return [pick.playerKey, { name: athlete?.name ?? pick.playerKey, sport: pick.sport,
        baseline: Number.isFinite(Number(athlete?.points)) && athlete?.points != null && pick.sport !== 'NFL'
          ? Number(athlete.points) : null }]
    })),
  }
}

export function scoreLeague(league, players) {
  const current = new Map(players.map((player) => [player.key, player]))
  const gains = new Map()
  for (const [key, athlete] of Object.entries(league.athletes)) {
    const value = current.get(key)?.points
    if (athlete.baseline == null || value == null || !Number.isFinite(Number(value)) || Number(value) < athlete.baseline) {
      gains.set(key, null)
    } else {
      gains.set(key, Number(value) - athlete.baseline)
    }
  }
  // Use the same per-sport ceiling across every team. It is based only on the
  // drafted athletes, so each athlete earns 0..100 points within their sport.
  const ceiling = Object.fromEntries(SPORTS.map((sport) => [sport,
    Math.max(0, ...league.draft.picks.filter((pick) => pick.sport === sport)
      .map((pick) => gains.get(pick.playerKey) ?? 0))]))
  const teams = league.draft.teams.map((team) => {
    const sports = Object.fromEntries(SPORTS.map((sport) => {
      const picks = league.draft.picks.filter((pick) => pick.teamId === team.id && pick.sport === sport)
      const available = picks.every((pick) => gains.get(pick.playerKey) !== null) && ceiling[sport] > 0
      return [sport, { available, raw: available ? picks.reduce((sum, pick) => sum + gains.get(pick.playerKey), 0) : null,
        score: available ? Math.round(1000 * picks.reduce((sum, pick) => sum + gains.get(pick.playerKey) / ceiling[sport], 0) / picks.length) / 10 : null }]
    }))
    return { id: team.id, name: team.name, sports,
      total: SPORTS.every((sport) => sports[sport].available)
        ? Math.round(SPORTS.reduce((sum, sport) => sum + sports[sport].score, 0) / SPORTS.length * 10) / 10 : null }
  })
  return { teams, ceiling, complete: teams.every((team) => team.total !== null) }
}
