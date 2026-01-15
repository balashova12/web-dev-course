const stage = document.getElementById("stage");
const pieces = Array.from(document.querySelectorAll(".piece"));
const resetBtn = document.getElementById("resetBtn");
const doneBtn = document.getElementById("doneBtn");

const state = new Map();
let isCompleted = false;

const IDEAL = {
  house:   { x:   0, y:  40, rot: 0 },
  roof:    { x:   0, y: -80, rot: 0 },
  chimney: { x:  60, y: -90, rot: 0 },
  window:  { x:  50, y:  40, rot: 0 },
  door:    { x: -15, y:  80, rot: 0 },
};

initScatter(true);

resetBtn.addEventListener("click", () => {
  isCompleted = false;
  stage.classList.remove("is-complete");
  initScatter(false);
});

doneBtn.addEventListener("click", () => {
  isCompleted = true;
  stage.classList.add("is-complete");
  snapToIdeal();
});

pieces.forEach(p => {
  const randomRot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
  state.set(p, { rot: randomRot });
  applyRotation(p);

  p.addEventListener("dblclick", (e) => {
    e.preventDefault();
    if (isCompleted) return;
    rotatePiece(p);
  });

  makeDraggable(p);
});

function rotatePiece(piece) {
  const st = state.get(piece) || { rot: 0 };
  st.rot = (st.rot + 90) % 360;
  state.set(piece, st);
  applyRotation(piece);
}

function applyRotation(piece) {
  const st = state.get(piece) || { rot: 0 };
  piece.style.setProperty("--rot", `${st.rot}deg`);
}

function makeDraggable(piece) {
  let dragging = false;

  let grabDx = 0;
  let grabDy = 0;

  piece.addEventListener("pointerdown", (e) => {
    if (isCompleted) return;

    dragging = true;
    piece.setPointerCapture(e.pointerId);
    piece.style.zIndex = "100";

    const rect = piece.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    grabDx = e.clientX - centerX;
    grabDy = e.clientY - centerY;
  });

  piece.addEventListener("pointermove", (e) => {
    if (!dragging || isCompleted) return;

    const stageRect = stage.getBoundingClientRect();

    let cx = (e.clientX - stageRect.left) - grabDx;
    let cy = (e.clientY - stageRect.top) - grabDy;

    const r = piece.getBoundingClientRect();
    const halfW = r.width / 2;
    const halfH = r.height / 2;

    cx = clamp(cx, halfW, stageRect.width - halfW);
    cy = clamp(cy, halfH, stageRect.height - halfH);

    piece.style.left = `${cx}px`;
    piece.style.top = `${cy}px`;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    setZByType(piece);
  };

  piece.addEventListener("pointerup", endDrag);
  piece.addEventListener("pointercancel", endDrag);
}

function setZByType(piece) {
  const t = piece.dataset.piece;
  const z = { house: 1, roof: 2, chimney: 3, window: 4, door: 5 }[t] || 1;
  piece.style.zIndex = String(z);
}

function initScatter(firstTime) {
  const rect = stage.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  pieces.forEach(p => {
    const x = cx + rand(-160, 160);
    const y = cy + rand(-120, 120);

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const randomRot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    state.set(p, { rot: randomRot });
    applyRotation(p);

    setZByType(p);
  });

  if (firstTime) {
    pieces.forEach(p => {
      p.style.transition = "none";
    });
    requestAnimationFrame(() => {
      pieces.forEach(p => {
        p.style.transition = "";
      });
    });
  }
}

function snapToIdeal() {
  const rect = stage.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  pieces.forEach(p => {
    const name = p.dataset.piece;
    const target = IDEAL[name];
    if (!target) return;

    p.style.left = `${centerX + target.x}px`;
    p.style.top = `${centerY + target.y}px`;

    state.set(p, { rot: target.rot });
    applyRotation(p);
    setZByType(p);
  });
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

window.addEventListener("resize", () => {
  if (isCompleted) snapToIdeal();
});
