const KEY_PLAYER = "ff_playerName";
const KEY_SCORES = "ff_scores";
const KEY_CURRENT = "ff_currentGame";

window.setPlayerName = function(name) {
  localStorage.setItem(KEY_PLAYER, name);
}

window.getPlayerName = function() {
  return localStorage.getItem(KEY_PLAYER) || "";
}

window.addScoreEntry = function(entry) {
  const list = getScores();
  list.unshift(entry);
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(KEY_SCORES, JSON.stringify(list));
}

window.getScores = function() {
  try {
    const raw = localStorage.getItem(KEY_SCORES);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

window.setCurrentGame = function(data) {
  localStorage.setItem(KEY_CURRENT, JSON.stringify(data));
}

window.getCurrentGame = function() {
  try {
    const raw = localStorage.getItem(KEY_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

window.clearCurrentGame = function() {
  localStorage.removeItem(KEY_CURRENT);
}
