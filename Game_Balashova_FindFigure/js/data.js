export const LEVELS = {
  1: {
    title: "Уровень 1 — Наведение",
    rule: "Наведи курсор на все подходящие фигуры. За каждую правильную фигуру начисляются очки и добавляется немного времени. Ошибка завершает раунд.",
    rounds: 3,
    timeSec: 20,
    points: { ok: 10, bad: -5, bonusFirstTry: 0 },
    mechanic: "hover",
  },
  2: {
    title: "Уровень 2 — Двойной клик",
    rule: "Сделай двойной клик по всем подходящим фигурам. Каждая правильная фигура даёт очки и дополнительное время. Ошибка завершает раунд.",
    rounds: 3,
    timeSec: 16,
    points: { ok: 20, bad: -10, bonusFirstTry: 0 },
    mechanic: "dblclick",
  },
  3: {
    title: "Уровень 3 — Перетаскивание",
    rule: "Перетащи все подходящие фигуры в зелёную зону. За каждую правильную фигуру начисляются очки и добавляется время. Ошибка завершает раунд.",
    rounds: 3,
    timeSec: 12,
    points: { ok: 30, bad: -15, bonusFirstTry: 0 },
    mechanic: "drag",
  },
};

export const SHAPES = [
  { id: "circle",   label: "Круг",       cls: "circle",   color: "#9de7f2" },
  { id: "square",   label: "Квадрат",    cls: "square",   color: "#ff6b6b" },
  { id: "triangle", label: "Треугольник",cls: "triangle", color: "#8b5a2b" },
  { id: "star",     label: "Звезда",     cls: "star",     color: "#f59e0b" },
];

export function buildQuestions() {
  return [
    { id: "q1", text: "Найди круг",              answer: "circle" },
    { id: "q2", text: "Найди квадрат",           answer: "square" },
    { id: "q3", text: "Найди треугольник",       answer: "triangle" },
    { id: "q4", text: "Найди звезду",            answer: "star" },
    { id: "q5", text: "Найди фигуру без углов",  answer: "circle" },
    { id: "q6", text: "Найди фигуру с 4 углами", answer: "square" },
    { id: "q7", text: "Найди фигуру с 3 углами", answer: "triangle" },
  ];
}
