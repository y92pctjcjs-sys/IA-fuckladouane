import {shuffled} from "./core.js?v=5";

export const DROP_COLS = 10, DROP_ROWS = 18;
// Pixel cuts are actual silhouettes: sleeve gaps, trouser legs and cropped bodies.
// Every cut occupies at most four rows, so a placement can clear up to four lines.
export const GARMENTS = [
  {name: "TEE FLD", color: "#c4a0ff", cells: [[1,1,1],[0,1,0],[0,1,0]], detail: "tee"},
  {name: "ZIP COURT", color: "#9cbcff", cells: [[1,1,1,1],[1,1,1,1],[1,0,0,1]], detail: "zip"},
  {name: "DENIM", color: "#8b95df", cells: [[1,1,1],[1,0,1],[1,0,1]], detail: "denim"},
  {name: "ÉCHARPE", color: "#dbcbb5", cells: [[1,1,1,1]], detail: "scarf"},
  {name: "COLIS FLD", color: "#b8d99f", cells: [[1,1],[1,1]], detail: "parcel"},
  {name: "TOP CROP", color: "#ed9aaf", cells: [[1,1,1,1],[0,1,1,0]], detail: "tee"},
  {name: "MANCHES", color: "#deb777", cells: [[1,0],[1,1],[0,1]], detail: "knit"}
];

function replenish(state, random) {
  while (state.queue.length < 7) state.queue.push(...shuffled(GARMENTS.map((_, i) => i), random));
}
function spawn(state, random) {
  replenish(state, random);
  const type = state.queue.shift(), cells = GARMENTS[type].cells.map(row => [...row]);
  state.current = {type, cells, x: Math.floor((DROP_COLS - cells[0].length) / 2), y: -2, group: ++state.pieces};
  state.gravity = state.lock = state.resets = 0;
  if (!fitsDrop(state, state.current)) state.over = true;
}
export function createDrop(random = Math.random) {
  const state = {
    board: Array.from({length: DROP_ROWS}, () => Array(DROP_COLS).fill(null)),
    queue: [], current: null, pieces: 0, score: 0, lines: 0, level: 1,
    combo: -1, gravity: 0, soft: false, lock: 0, resets: 0, clearing: [], clearTime: 0, over: false
  };
  spawn(state, random);
  return state;
}
export function fitsDrop(state, piece, dx = 0, dy = 0, cells = piece.cells) {
  return cells.every((row, y) => row.every((filled, x) => {
    if (!filled) return true;
    const px = piece.x + x + dx, py = piece.y + y + dy;
    return px >= 0 && px < DROP_COLS && py >= -4 && py < DROP_ROWS && (py < 0 || !state.board[py][px]);
  }));
}
function resetLock(state, wasGrounded) {
  if (wasGrounded && state.resets < 15) { state.lock = 0; state.resets++; }
}
export function moveDrop(state, direction) {
  if (state.over || state.clearing.length || ![-1,1].includes(direction)) return false;
  const grounded = !fitsDrop(state, state.current, 0, 1);
  if (!fitsDrop(state, state.current, direction)) return false;
  state.current.x += direction;
  resetLock(state, grounded);
  return true;
}
export function rotateDrop(state) {
  if (state.over || state.clearing.length) return false;
  const piece = state.current, old = piece.cells;
  const cells = Array.from({length: old[0].length}, (_, y) => old.map(row => row[y]).reverse());
  const grounded = !fitsDrop(state, piece, 0, 1);
  for (const [dx, dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[-3,0],[3,0],[0,-1],[0,-2],[0,-3]]) {
    if (!fitsDrop(state, piece, dx, dy, cells)) continue;
    piece.x += dx; piece.y += dy; piece.cells = cells;
    resetLock(state, grounded);
    return true;
  }
  return false;
}
export function landingY(state) {
  let distance = 0;
  while (fitsDrop(state, state.current, 0, distance + 1)) distance++;
  return state.current.y + distance;
}
function lockDrop(state, random) {
  const piece = state.current;
  // A garment protruding from the warehouse ends the run without corrupting the pile.
  if (piece.cells.some((row, y) => row.some(filled => filled && piece.y + y < 0))) {
    state.over = true;
    return;
  }
  piece.cells.forEach((row, y) => row.forEach((filled, x) => {
    if (filled) state.board[piece.y + y][piece.x + x] = {type: piece.type, group: piece.group};
  }));
  state.clearing = state.board.flatMap((row, y) => row.every(Boolean) ? [y] : []);
  if (state.clearing.length) {
    state.clearTime = .24;
    state.combo++;
    state.score += ([0,100,300,500,800][state.clearing.length] + Math.max(0, state.combo) * 50) * state.level;
    state.lines += state.clearing.length;
    state.level = 1 + Math.floor(state.lines / 8);
  } else { state.combo = -1; spawn(state, random); }
}
export function hardDrop(state, random = Math.random) {
  if (state.over || state.clearing.length) return 0;
  const y = landingY(state), distance = y - state.current.y;
  state.current.y = y;
  state.score += distance * 2;
  lockDrop(state, random);
  return distance;
}
export function softDrop(state) {
  if (state.over || state.clearing.length || !fitsDrop(state, state.current, 0, 1)) return false;
  state.current.y++;
  state.gravity = state.lock = 0;
  state.score++;
  return true;
}
export function stepDrop(state, dt, soft = false, random = Math.random) {
  if (state.over || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, .1);
  if (state.clearing.length) {
    state.clearTime -= dt;
    if (state.clearTime <= 0) {
      state.board = state.board.filter((_, y) => !state.clearing.includes(y));
      while (state.board.length < DROP_ROWS) state.board.unshift(Array(DROP_COLS).fill(null));
      state.clearing = [];
      spawn(state, random);
    }
    return;
  }
  if (state.soft !== soft) state.gravity = 0;
  state.soft = soft;
  const interval = soft ? .045 : Math.max(.095, .8 * Math.pow(.82, state.level - 1));
  state.gravity += dt;
  while (state.gravity >= interval) {
    state.gravity -= interval;
    if (!fitsDrop(state, state.current, 0, 1)) break;
    state.current.y++;
    if (soft) state.score++;
  }
  if (!fitsDrop(state, state.current, 0, 1)) {
    state.lock += dt;
    if (state.lock >= .45) lockDrop(state, random);
  } else state.lock = 0;
}
