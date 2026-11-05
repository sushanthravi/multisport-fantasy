export const LIMITS = { FPL: 6, NFL: 6, F1: 2 };
export const ROUNDS = Object.values(LIMITS).reduce((sum, count) => sum + count, 0);

export function snakeTeam(order, pickNumber) {
  const round = Math.floor(pickNumber / order.length);
  const slot = pickNumber % order.length;
  return order[round % 2 ? order.length - 1 - slot : slot];
}

export function createDraft(names, random = Math.random) {
  const teams = names.map((name, index) => ({ id: `team-${index + 1}`, name: name.trim() }));
  const order = teams.map((team) => team.id);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { version: 1, teams, order, picks: [], createdAt: new Date().toISOString() };
}

export function roster(draft, teamId, playersByKey) {
  return draft.picks
    .filter((pick) => pick.teamId === teamId)
    .map((pick) => playersByKey.get(pick.playerKey))
    .filter(Boolean);
}

export function canPick(draft, player, playersByKey) {
  if (!draft || !player || draft.picks.length >= draft.teams.length * ROUNDS) return false;
  if (draft.picks.some((pick) => pick.playerKey === player.key)) return false;
  const teamId = snakeTeam(draft.order, draft.picks.length);
  return roster(draft, teamId, playersByKey).filter((athlete) => athlete.sport === player.sport).length < LIMITS[player.sport];
}

export function makePick(draft, player, playersByKey) {
  if (!canPick(draft, player, playersByKey)) throw new Error("This pick is unavailable or the roster slot is full.");
  const pickNumber = draft.picks.length;
  return {
    ...draft,
    picks: [...draft.picks, {
      number: pickNumber + 1,
      teamId: snakeTeam(draft.order, pickNumber),
      playerKey: player.key,
      sport: player.sport,
      pickedAt: new Date().toISOString(),
    }],
  };
}

export function restoreDraft(raw, playersByKey) {
  try {
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.teams) || !Array.isArray(saved.order) || !Array.isArray(saved.picks)) return null;
    if (saved.teams.length < 2 || saved.teams.length > 8 || saved.order.length !== saved.teams.length) return null;
    if (saved.picks.length > saved.teams.length * ROUNDS) return null;
    const names = new Set(saved.teams.map((team) => team.id));
    if (names.size !== saved.teams.length || new Set(saved.order).size !== names.size || saved.order.some((id) => !names.has(id))) return null;
    let valid = { ...saved, picks: [] };
    for (const pick of saved.picks) {
      const player = playersByKey.get(pick.playerKey);
      if (!player || pick.teamId !== snakeTeam(saved.order, valid.picks.length) || !canPick(valid, player, playersByKey)) return null;
      valid = { ...valid, picks: [...valid.picks, pick] };
    }
    return valid;
  } catch {
    return null;
  }
}
