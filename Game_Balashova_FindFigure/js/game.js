import { LEVELS, SHAPES, buildQuestions } from "./data.js";
import { getPlayerName, addScoreEntry, setCurrentGame } from "./storage.js";

const arena = document.getElementById("arena");
const dropZone = document.getElementById("dropZone");

if (!arena || !dropZone) {
  console.warn("game.js: not on game page, script skipped");
} else {
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

  if (
    !playerLine || !levelView || !roundView || !roundTotal || !scoreView ||
    !timeView || !questionText || !ruleText || !quitBtn || !nextBtn ||
    !restartBtn || !toast
  ) {
    console.warn("game.js: required HUD nodes not found — script skipped");
  } else {
    const params = new URLSearchParams(location.search);
    let level = Number(params.get("level") || 1);
    if (![1, 2, 3].includes(level)) level = 1;

    const TEST_MODE = params.get("test") === "1";

    const name = (getPlayerName() || "").trim() || "Игрок";
    playerLine.textContent = `Игрок: ${name}`;

    let score = 0;
    let round = 0;
    let correct = 0;
    let timerId = 0;
    let remaining = 0;
    let currentQ = null;
    let answered = false;
    let qPool = [];

    let targetsTotal = 0;
    let targetsFound = 0;

    // NEW: очки, заработанные за текущий раунд
    let roundScore = 0;

    const BONUS_SEC_PER_CORRECT_PICK = 2;

    function getCfg() {
      const base = LEVELS[level];
      return {
        ...base,
        points: { ...base.points },
        rounds: TEST_MODE ? 1 : base.rounds
      };
    }

    let cfg = getCfg();
    if (TEST_MODE) cfg.rounds = 1;

    levelView.textContent = String(level);
    roundTotal.textContent = String(cfg.rounds);
    ruleText.textContent = cfg.rule;

    startLevel();

    quitBtn.addEventListener("click", () => finishGame(false));
    restartBtn.addEventListener("click", () => restartLevel());

    nextBtn.addEventListener("click", () => {
      if (!answered) return;

      if (TEST_MODE) {
        const nextLevel = level + 1;
        if (nextLevel <= 3) location.href = `./game.html?level=${nextLevel}&test=1`;
        else finishGame(true);
        return;
      }

      nextRound();
    });

    function restartLevel() {
      clearInterval(timerId);
      score = 0;
      round = 0;
      correct = 0;
      targetsTotal = 0;
      targetsFound = 0;
      roundScore = 0;

      scoreView.textContent = String(score);
      hideToast();

      cfg = getCfg();
      roundTotal.textContent = String(cfg.rounds);
      ruleText.textContent = cfg.rule;

      startLevel();
    }

    function startLevel() {
      arena.classList.remove("level-1", "level-2", "level-3");
      arena.classList.add(`level-${level}`);

      qPool = shuffle(buildQuestions()).slice(0, cfg.rounds);
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

      targetsTotal = 0;
      targetsFound = 0;

      // NEW: сброс счётчика очков раунда
      roundScore = 0;

      renderRound();
      startTimer();
      hideToast();
      nextBtn.classList.add("hidden");
    }

    function startTimer() {
      clearInterval(timerId);
      remaining = cfg.timeSec;
      timeView.textContent = String(remaining);

      timerId = setInterval(() => {
        remaining--;
        timeView.textContent = String(remaining);

        if (remaining <= 0) {
          clearInterval(timerId);
          lockRound();
          revealAllCorrect();

          // (опционально) показываем очки раунда и при таймауте
          const sign = roundScore > 0 ? "+" : "";
          showToast(`Время вышло. Очки за раунд: ${sign}${roundScore}`, false);

          answered = true;
          nextBtn.classList.remove("hidden");
        }
      }, 1000);
    }

    function renderRound() {
      arena.innerHTML = "";
      dropZone.classList.add("hidden");
      answered = false;

      const base = shuffle(SHAPES);
      const all = shuffle([...base, ...shuffle(SHAPES).slice(0, 2)]);
      const placed = [];

      const w = arena.clientWidth;
      const h = arena.clientHeight;

      const forbidden = [];
      if (level === 3) {
        const dzW = 160, dzH = 140, dzRight = 14, dzBottom = 14;
        const extra = 16;
        forbidden.push({
          x: w - dzRight - dzW - extra,
          y: h - dzBottom - dzH - extra,
          w: dzW + extra,
          h: dzH + extra
        });
      }

      all.forEach((s) => {
        const el = document.createElement("div");
        el.className = `shape ${s.cls}`;
        el.dataset.shape = s.id;

        if (s.cls !== "triangle" && s.cls !== "star") {
          el.style.background = s.color;
        } else {
          const span = document.createElement("span");
          el.appendChild(span);
        }

        const pos = randomPosNoOverlap(w, h, s.cls, placed, forbidden);
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        placed.push(pos.rect);

        if (level === 3) {
          el.style.setProperty("--dx", `${rand(-60, 60)}px`);
          el.style.setProperty("--dy", `${rand(-45, 45)}px`);
          el.style.setProperty("--driftDur", `${rand(1, 2)}s`);
        }

        if (cfg.mechanic === "hover") {
          el.addEventListener("mouseenter", () => {
            if (answered) return;
            handlePick(el);
          });
        }

        if (cfg.mechanic === "dblclick") {
          el.addEventListener("dblclick", (e) => {
            e.preventDefault();
            if (answered) return;
            handlePick(el);
          });
        }

        if (cfg.mechanic === "drag") {
          dropZone.classList.remove("hidden");
          el.style.cursor = "grab";
          makeDraggable(el);
        }

        arena.appendChild(el);
      });

      targetsTotal = arena.querySelectorAll(`.shape[data-shape="${currentQ.answer}"]`).length;
      targetsFound = 0;
    }

    function handlePick(el) {
      if (answered) return;

      if (el.classList.contains("selected-ok")) return;

      const picked = el.dataset.shape;
      const isOk = picked === currentQ.answer;

      if (!isOk) {
        clearHighlights();
        el.classList.add("selected-bad");
        revealAllCorrect();
        lockRound();

        score += cfg.points.bad;
        roundScore += cfg.points.bad; // NEW
        scoreView.textContent = String(score);

        const sign = roundScore > 0 ? "+" : "";
        showToast(`Неверно. Очки за раунд: ${sign}${roundScore}`, false);

        answered = true;
        clearInterval(timerId);
        nextBtn.classList.remove("hidden");
        return;
      }

      el.classList.add("selected-ok");
      el.style.pointerEvents = "none";
      targetsFound++;

      score += cfg.points.ok;
      roundScore += cfg.points.ok; // NEW
      scoreView.textContent = String(score);

      if (BONUS_SEC_PER_CORRECT_PICK > 0) {
        remaining += BONUS_SEC_PER_CORRECT_PICK;
        timeView.textContent = String(remaining);
      }

      if (targetsFound < targetsTotal) {
        showToast(
          `Верно! ${targetsFound}/${targetsTotal} (+${cfg.points.ok}${BONUS_SEC_PER_CORRECT_PICK ? `, +${BONUS_SEC_PER_CORRECT_PICK}с` : ""})`,
          true
        );
        return;
      }

      lockRound();
      confettiBurst();
      correct++;

      const sign = roundScore > 0 ? "+" : "";
      showToast(
        `Отлично! Собрано ${targetsFound}/${targetsTotal}. Очки за раунд: ${sign}${roundScore}`,
        true
      );

      answered = true;
      clearInterval(timerId);
      nextBtn.classList.remove("hidden");
    }

    function revealAllCorrect() {
      arena.querySelectorAll(`.shape[data-shape="${currentQ.answer}"]`)
        .forEach(el => el.classList.add("correct"));
    }

    function clearHighlights() {
      arena.querySelectorAll(".shape").forEach(s => {
        s.classList.remove("selected-ok", "selected-bad", "correct");
      });
    }

    function lockRound() {
      arena.querySelectorAll(".shape").forEach(s => {
        s.style.pointerEvents = "none";
      });
    }

    function makeDraggable(el) {
      let dragging = false;
      let offsetX = 0, offsetY = 0;
      let arenaLeft = 0, arenaTop = 0;

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
        arenaLeft = a.left;
        arenaTop = a.top;
      });

      el.addEventListener("pointermove", (e) => {
        if (!dragging || answered) return;

        const rect = el.getBoundingClientRect();
        const left = e.clientX - arenaLeft - offsetX;
        const top  = e.clientY - arenaTop  - offsetY;

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

        const okDrop = isInsideDropZone(el);
        if (!okDrop) return;

        handlePick(el);
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

    function confettiBurst() {
      const cx = window.innerWidth * 0.5;
      const cy = 100;

      for (let i = 0; i < 40; i++) {
        const c = document.createElement("div");
        c.className = "confetti";
        const x = cx + rand(-40, 40);
        const y = cy + rand(-10, 10);

        c.style.setProperty("--x", `${x}px`);
        c.style.setProperty("--y", `${y}px`);
        c.style.setProperty("--vx", `${rand(-140, 140)}px`);
        c.style.setProperty("--vy", `${rand(220, 420)}px`);
        c.style.background = `hsl(${rand(0, 360)} 90% 60%)`;
        c.style.borderRadius = `${rand(0, 6)}px`;
        c.style.transform = `translate(${x}px, ${y}px)`;

        document.body.appendChild(c);
        setTimeout(() => c.remove(), 1000);
      }
    }

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function sizeByKind(kind) {
      let bw = 80, bh = 80;
      if (kind === "triangle") { bw = 100; bh = 90; }
      if (kind === "star") { bw = 90; bh = 80; }
      return { bw, bh };
    }

    function randomPosNoOverlap(w, h, kind, placed, forbidden = []) {
      const pad = 18;
      const { bw, bh } = sizeByKind(kind);

      for (let t = 0; t < 140; t++) {
        const x = pad + Math.random() * (w - bw - pad * 2);
        const y = pad + Math.random() * (h - bh - pad * 2);

        const rect = { x, y, w: bw, h: bh };

        const hitPlaced = placed.some(r => !(
          rect.x + rect.w + 10 < r.x ||
          rect.x > r.x + r.w + 10 ||
          rect.y + rect.h + 10 < r.y ||
          rect.y > r.y + r.h + 10
        ));

        const hitForbidden = forbidden.some(fr => !(
          rect.x + rect.w < fr.x ||
          rect.x > fr.x + fr.w ||
          rect.y + rect.h < fr.y ||
          rect.y > fr.y + fr.h
        ));

        if (!hitPlaced && !hitForbidden) {
          return { x, y, rect };
        }
      }

      for (let t = 0; t < 80; t++) {
        const x = pad + Math.random() * (w - bw - pad * 2);
        const y = pad + Math.random() * (h - bh - pad * 2);
        const rect = { x, y, w: bw, h: bh };

        const hitForbidden = forbidden.some(fr => !(
          rect.x + rect.w < fr.x ||
          rect.x > fr.x + fr.w ||
          rect.y + rect.h < fr.y ||
          rect.y > fr.y + fr.h
        ));

        if (!hitForbidden) return { x, y, rect };
      }

      const x = pad + Math.random() * (w - bw - pad * 2);
      const y = pad + Math.random() * (h - bh - pad * 2);
      return { x, y, rect: { x, y, w: bw, h: bh } };
    }

    function rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }
}
