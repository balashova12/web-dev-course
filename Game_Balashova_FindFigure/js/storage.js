const KEY_PLAYER = "ff_playerName";
const KEY_SCORES = "ff_scores";
const KEY_CURRENT = "ff_currentGame";

export function setPlayerName(name) {
  localStorage.setItem(KEY_PLAYER, name);
}

export function getPlayerName() {
  return localStorage.getItem(KEY_PLAYER) || "";
}

export function addScoreEntry(entry) {
  const list = getScores();
  list.unshift(entry);
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(KEY_SCORES, JSON.stringify(list));
}

export function getScores() {
  try {
    const raw = localStorage.getItem(KEY_SCORES);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function setCurrentGame(data) {
  localStorage.setItem(KEY_CURRENT, JSON.stringify(data));
}

export function getCurrentGame() {
  try {
    const raw = localStorage.getItem(KEY_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCurrentGame() {
  localStorage.removeItem(KEY_CURRENT);
}
