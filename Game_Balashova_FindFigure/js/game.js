import { LEVELS, SHAPES, buildQuestions } from "./data.js";
import { getPlayerName, addScoreEntry, setCurrentGame } from "./storage.js";

const arena = document.getElementById("arena");
const dropZone = document.getElementById("dropZone");

const playerLine = document.getElementById("playerLine");
const levelView = document.getElementById("levelView");
const roundView = document.getElementById("roundView");
const roundTotal = document.getElementById("roundTotal");
const scoreView = document.getElementById("scoreView");
const timeView = document.getElementById("timeView");
const questionText = document.getElementById("questionText");
const ruleText = document.getElementById("ruleText");

const quitBtn = document.getElementById("quitBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const toast = document.getElementById("toast");

const params = new URLSearchParams(location.search);
let level = Number(params.get("level") || 1);
if (![1,2,3].includes(level)) level = 1;

const name = getPlayerName().trim() || "Игрок";
playerLine.textContent = `Игрок: ${name}`;

let score = 0;
let round = 0;
let correct = 0;
let timerId = 0;
let remaining = 0;
let currentQ = null;
let answered = false;
let qPool = [];
let speedClass = "";

const cfg = LEVELS[level];
levelView.textContent = String(level);
roundTotal.textContent = String(cfg.rounds);
ruleText.textContent = cfg.rule;

startLevel();

quitBtn.addEventListener("click", () => finishGame(false));
nextBtn.addEventListener("click", () => nextRound());

restartBtn.addEventListener("click", () => restartLevel());

function restartLevel() {
  clearInterval(timerId);
  score = 0;
  round = 0;
  correct = 0;
  scoreView.textContent = String(score);
  toast.className = "toast hidden";
  startLevel();
}

function startLevel() {
  qPool = shuffle(buildQuestions()).slice(0, cfg.rounds);
  speedClass = level >= 2 ? "fast" : "";
  nextRound();
}

function nextRound() {
  if (answered === false && round > 0) return;
  if (round >= cfg.rounds) return finishLevel();

  answered = false;
  round++;
  roundView.textContent = String(round);

  currentQ = qPool[round - 1];
  questionText.textContent = currentQ.text;

  renderRound();
  startTimer();
  hideToast();
  nextBtn.classList.add("hidden");
}

function startTimer() {
  clearInterval(timerId);
  remaining = cfg.timeSec - Math.max(0, round - 1) * (level === 3 ? 1 : 0);
  if (remaining < 6) remaining = 6;
  timeView.textContent = String(remaining);

  timerId = setInterval(() => {
    remaining--;
    timeView.textContent = String(remaining);
    if (remaining <= 0) {
      clearInterval(timerId);
      onWrong("Время вышло");
    }
  }, 1000);
}

function renderRound() {
  arena.innerHTML = "";
  dropZone.classList.add("hidden");
  answered = false;

  const shapes = shuffle(SHAPES).slice(0, 4);
  const extras = shuffle(SHAPES).slice(0, 2);
  const all = shuffle([...shapes, ...extras]);

  const arenaRect = arena.getBoundingClientRect();
  const w = arenaRect.width;
  const h = arenaRect.height;

  all.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = `shape ${s.cls} ${speedClass}`;
    el.dataset.shape = s.id;

    if (s.cls !== "triangle" && s.cls !== "star") {
      el.style.background = s.color;
      el.textContent = s.label[0];
    } else {
      const span = document.createElement("span");
      span.textContent = s.label[0];
      el.appendChild(span);
    }

    const pos = randomPos(w, h, s.cls);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;

    if (cfg.mechanic === "hover") {
      el.addEventListener("mouseenter", () => {
        if (answered) return;
        checkAnswer(el.dataset.shape);
      }, { once: false });

      el.addEventListener("pointerdown", () => {
        if (answered) return;
        onWrong("Не то действие");
      });
    }

    if (cfg.mechanic === "dblclick") {
      el.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (answered) return;
        checkAnswer(el.dataset.shape);
      });

      el.addEventListener("mouseenter", () => {
        if (answered) return;
        el.classList.add("shake");
        setTimeout(() => el.classList.remove("shake"), 180);
      });
    }

    if (cfg.mechanic === "drag") {
      dropZone.classList.remove("hidden");
      el.style.cursor = "grab";
      makeDraggable(el);
    }

    arena.appendChild(el);
  });
}

function makeDraggable(el) {
  let dragging = false;
  let offsetX = 0, offsetY = 0;
  let stageLeft = 0, stageTop = 0;

  let nextX = 0, nextY = 0;
  let rafId = 0;

  const apply = () => {
    rafId = 0;
    el.style.left = `${nextX}px`;
    el.style.top = `${nextY}px`;
  };

  el.addEventListener("pointerdown", (e) => {
    if (answered) return;
    dragging = true;
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = "10";
    el.style.cursor = "grabbing";

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    const a = arena.getBoundingClientRect();
    stageLeft = a.left;
    stageTop = a.top;
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging || answered) return;

    const rect = el.getBoundingClientRect();
    const left = e.clientX - stageLeft - offsetX;
    const top  = e.clientY - stageTop  - offsetY;

    nextX = left + rect.width / 2;
    nextY = top + rect.height / 2;

    if (!rafId) rafId = requestAnimationFrame(apply);
  });

  el.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    el.style.cursor = "grab";
    el.style.zIndex = "";

    const ok = isInsideDropZone(el);
    if (!ok) return onWrong("Перетащи в зону");

    checkAnswer(el.dataset.shape);
  });

  el.addEventListener("pointercancel", () => {
    dragging = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    el.style.cursor = "grab";
    el.style.zIndex = "";
  });
}

function isInsideDropZone(el) {
  const dz = dropZone.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const cx = (r.left + r.right) / 2;
  const cy = (r.top + r.bottom) / 2;
  return cx >= dz.left && cx <= dz.right && cy >= dz.top && cy <= dz.bottom;
}

function checkAnswer(shapeId) {
  if (shapeId === currentQ.answer) onCorrect();
  else onWrong("Неверно");
}

function onCorrect() {
  answered = true;
  clearInterval(timerId);
  correct++;
  score += cfg.points.ok;
  scoreView.textContent = String(score);
  showToast(`Верно! +${cfg.points.ok}`, true);
  nextBtn.classList.remove("hidden");
}

function onWrong(reason) {
  if (answered) return;
  answered = true;
  clearInterval(timerId);
  score += cfg.points.bad;
  scoreView.textContent = String(score);
  showToast(`${reason}. ${cfg.points.bad}`, false);
  nextBtn.classList.remove("hidden");
}

function finishLevel() {
  const passed = correct >= Math.ceil(cfg.rounds * 0.67);
  const nextLevel = level + 1;

  if (passed && nextLevel <= 3) {
    showToast(`Уровень пройден. Переход на уровень ${nextLevel}`, true);
    nextBtn.classList.remove("hidden");
    nextBtn.onclick = () => location.href = `./game.html?level=${nextLevel}`;
  } else {
    finishGame(passed);
  }
}

function finishGame(passed) {
  clearInterval(timerId);

  const result = {
    name,
    score,
    level,
    rounds: cfg.rounds,
    correct,
    passed,
  };

  setCurrentGame(result);

  addScoreEntry({
    name,
    score,
    level,
    date: new Date().toISOString(),
  });

  location.href = "./rating.html";
}

function showToast(text, ok) {
  toast.textContent = text;
  toast.className = `toast ${ok ? "ok" : "bad"}`;
}

function hideToast() {
  toast.className = "toast hidden";
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomPos(w, h, kind) {
  const pad = 18;
  let bw = 80, bh = 80;
  if (kind === "triangle") { bw = 100; bh = 90; }
  if (kind === "star") { bw = 90; bh = 80; }

  const x = pad + Math.random() * (w - bw - pad * 2);
  const y = pad + Math.random() * (h - bh - pad * 2);
  return { x, y };
}
