const stage = document.getElementById("stage");
const resetBtn = document.getElementById("resetBtn");
const doneBtn = document.getElementById("doneBtn");
const pieces = document.querySelectorAll(".piece");

let isCompleted = false;

const IDEAL = {
  house:   { x:   0, y:  40, rot: 0 },
  roof:    { x:   0, y: -80, rot: 0 },
  chimney: { x:  60, y: -90, rot: 0 },
  window:  { x:  50, y:  40, rot: 0 },
  door:    { x: -15, y:  80, rot: 0 },
};

scatter(true);
setupPieces();

resetBtn.addEventListener("click", () => {
  isCompleted = false;
  stage.classList.remove("is-complete");
  scatter(false);
});

doneBtn.addEventListener("click", () => {
  isCompleted = true;
  stage.classList.add("is-complete");
  snapToIdeal();
});

window.addEventListener("resize", () => {
  if (isCompleted) snapToIdeal();
});

function setupPieces() {
  pieces.forEach(piece => {
    piece.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (isCompleted) return;
      rotate90(piece);
    });
    makeDraggable(piece);
  });
}

function rotate90(piece) {
  const rot = (getRot(piece) + 90) % 360;
  setRot(piece, rot);
}

function getRot(piece) {
  return Number(piece.dataset.rot || 0);
}

function setRot(piece, rot) {
  piece.dataset.rot = String(rot);
  piece.style.setProperty("--rot", rot + "deg");
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

    const r = piece.getBoundingClientRect();
    grabDx = e.clientX - (r.left + r.width / 2);
    grabDy = e.clientY - (r.top + r.height / 2);
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

    piece.style.left = cx + "px";
    piece.style.top = cy + "px";
  });

  piece.addEventListener("pointerup", endDrag);
  piece.addEventListener("pointercancel", endDrag);

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    setZByType(piece);
  }
}

function setZByType(piece) {
  const zMap = { house: 1, roof: 2, chimney: 3, window: 4, door: 5 };
  piece.style.zIndex = String(zMap[piece.dataset.piece] || 1);
}

function scatter(firstTime) {
  const rect = stage.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  pieces.forEach(p => {
    p.style.left = (cx + rand(-160, 160)) + "px";
    p.style.top  = (cy + rand(-120, 120)) + "px";
    setRot(p, randomRot());
    setZByType(p);
  });

  if (firstTime) {
    pieces.forEach(p => p.style.transition = "none");
    requestAnimationFrame(() => {
      pieces.forEach(p => p.style.transition = "");
    });
  }
}

function snapToIdeal() {
  const rect = stage.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  pieces.forEach(p => {
    const target = IDEAL[p.dataset.piece];
    if (!target) return;

    p.style.left = (cx + target.x) + "px";
    p.style.top  = (cy + target.y) + "px";
    setRot(p, target.rot);
    setZByType(p);
  });
}

function randomRot() {
  const arr = [0, 90, 180, 270];
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}