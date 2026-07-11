export function getPlayerId() {
  let id = sessionStorage.getItem("tabuPlayerId");

  if (!id) {
    id = globalThis.crypto?.randomUUID?.()
      ?? `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem("tabuPlayerId", id);
  }

  return id;
}

export function cleanPlayerName(value) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  return name.slice(0, 24);
}

export function nextPlayerIndex(players, currentIndex) {
  if (!Array.isArray(players) || players.length === 0) return 0;
  return (Number(currentIndex ?? 0) + 1) % players.length;
}

export function findPlayer(players, playerId) {
  return Array.isArray(players)
    ? players.find((player) => player.id === playerId)
    : undefined;
}
