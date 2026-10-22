import test from "node:test";
import assert from "node:assert/strict";
import {createDrop, fitsDrop, moveDrop, rotateDrop, hardDrop, softDrop, stepDrop, landingY, GARMENTS, DROP_COLS, DROP_ROWS} from "../drop.js";

const random = () => .37;
function piece(state, cells, x, y, type = 0) {
  state.current = {type, cells, x, y, group: ++state.pieces};
  state.gravity = state.lock = state.resets = 0;
}
const fabric = {type: 2, group: 999};

test("the first seven arrivals contain every garment exactly once", () => {
  const state = createDrop(random);
  const types = [state.current.type, ...state.queue.slice(0,6)];
  assert.deepEqual(types.sort(), GARMENTS.map((_, i) => i));
  assert.equal(state.board.length, DROP_ROWS);
  assert.equal(state.board[0].length, DROP_COLS);
  state.board[0][0] = fabric;
  assert.equal(state.board[1][0], null);
});
test("hard drop lands exactly on the ghost, preserves every fabric panel and spawns once", () => {
  const state = createDrop(random), previous = structuredClone(state.current);
  const y = landingY(state), distance = y - previous.y;
  assert.equal(hardDrop(state, random), distance);
  assert.equal(state.score, distance * 2);
  assert.equal(state.board.flat().filter(Boolean).length, previous.cells.flat().filter(Boolean).length);
  assert.equal(state.pieces, 2);
  for (const [row, line] of previous.cells.entries()) for (const [col, value] of line.entries()) {
    if (value) assert.equal(state.board[y + row][previous.x + col].group, previous.group);
  }
});
test("four rotations preserve the garment and its position in an empty region", () => {
  const state = createDrop(random);
  piece(state, GARMENTS[0].cells.map(row => [...row]), 3, 5);
  const before = structuredClone(state.current);
  for (let i = 0; i < 4; i++) assert.equal(rotateDrop(state), true);
  assert.deepEqual(state.current, before);
});
test("the long scarf rotates at the right wall and kicks above the floor", () => {
  const state = createDrop(random);
  piece(state, [[1],[1],[1],[1]], 9, 12, 3);
  assert.equal(rotateDrop(state), true);
  assert.equal(state.current.x, 6);
  assert.equal(fitsDrop(state, state.current), true);
  piece(state, [[1,1,1,1]], 3, 17, 3);
  assert.equal(rotateDrop(state), true);
  assert.equal(state.current.y, 14);
});
test("collisions reject a blocked move or rotation without overwriting the pile", () => {
  const state = createDrop(random);
  piece(state, [[1,1,1],[0,1,0]], 3, 5);
  state.board = state.board.map((row, y) => row.map((_, x) =>
    y >= 2 && y <= 9 && !(state.current.cells[y - 5]?.[x - 3]) ? fabric : null));
  const before = structuredClone(state);
  assert.equal(moveDrop(state, -1), false);
  assert.equal(rotateDrop(state), false);
  assert.deepEqual(state, before);
});
test("a four-line clearance scores, waits for its animation, then compacts without aliasing rows", () => {
  const state = createDrop(random);
  for (let y = 14; y < 18; y++) state.board[y] = state.board[y].map((_, x) => x === 4 ? null : fabric);
  piece(state, [[1],[1],[1],[1]], 4, 0, 3);
  hardDrop(state, random);
  assert.equal(state.lines, 4);
  assert.equal(state.score, 828);
  assert.equal(state.clearing.length, 4);
  const frozen = structuredClone(state.current);
  assert.equal(rotateDrop(state), false);
  assert.equal(moveDrop(state, -1), false);
  hardDrop(state, random);
  assert.deepEqual(state.current, frozen);
  stepDrop(state, .1, false, random);
  assert.equal(state.board.flat().filter(Boolean).length, 40);
  stepDrop(state, .1, false, random); stepDrop(state, .1, false, random);
  assert.equal(state.board.flat().filter(Boolean).length, 0);
  assert.equal(state.current.group, state.pieces);
});
test("double lines remove only completed rows and retain the row above", () => {
  const state = createDrop(random);
  state.board[15][0] = fabric;
  for (let y = 16; y < 18; y++) state.board[y] = state.board[y].map((_, x) => [4,5].includes(x) ? null : fabric);
  piece(state, [[1,1],[1,1]], 4, 0, 4);
  hardDrop(state, random);
  assert.equal(state.lines, 2);
  assert.equal(state.score, 332);
  for (let i = 0; i < 3; i++) stepDrop(state, .1, false, random);
  assert.deepEqual(state.board[17][0], fabric);
  assert.equal(state.board.flat().filter(Boolean).length, 1);
});
test("grounded garments keep a 450ms placement window, with finite move resets", () => {
  const state = createDrop(random);
  piece(state, [[1,1],[1,1]], 4, 16, 4);
  for (let i = 0; i < 4; i++) stepDrop(state, .1);
  stepDrop(state, .04);
  assert.equal(state.board.flat().filter(Boolean).length, 0);
  for (let i = 0; i < 16; i++) { state.lock = .3; moveDrop(state, i % 2 ? 1 : -1); }
  assert.equal(state.resets, 15);
  assert.equal(state.lock, .3);
  stepDrop(state, .1); stepDrop(state, .06);
  assert.equal(state.board.flat().filter(Boolean).length, 4);
});
test("soft drop accelerates gravity and awards one point per moved row", () => {
  const normal = createDrop(random), soft = createDrop(random), y = soft.current.y;
  stepDrop(normal, .1); stepDrop(soft, .1, true);
  assert.equal(normal.current.y, y);
  assert.equal(soft.current.y, y + 2);
  assert.equal(soft.score, 2);
});
test("switching to soft drop cannot spend accumulated slow gravity as an instant teleport", () => {
  const state = createDrop(random), y = state.current.y;
  state.gravity = .79;
  stepDrop(state, .05, true);
  assert.equal(state.current.y, y + 1);
  assert.equal(state.score, 1);
});
test("a manual downward tap moves one row and cannot force a blocked garment to lock", () => {
  const state = createDrop(random), y = state.current.y;
  assert.equal(softDrop(state), true);
  assert.equal(state.current.y, y + 1);
  assert.equal(state.score, 1);
  state.current.y = landingY(state);
  const before = structuredClone(state);
  assert.equal(softDrop(state), false);
  assert.deepEqual(state, before);
});
test("the eighth cleared line increases the level and consecutive clears add a combo", () => {
  const state = createDrop(random);
  state.lines = 7; state.combo = 0;
  state.board[17] = state.board[17].map((_, x) => [3,4,5,6].includes(x) ? null : fabric);
  piece(state, [[1,1,1,1]], 3, 17, 3);
  hardDrop(state, random);
  assert.equal(state.lines, 8);
  assert.equal(state.level, 2);
  assert.equal(state.score, 150);
});
test("overflow ends the run without writing above the board, and terminal state freezes", () => {
  const state = createDrop(random);
  state.board[0].fill(fabric);
  const board = structuredClone(state.board);
  hardDrop(state, random);
  assert.equal(state.over, true);
  assert.deepEqual(state.board, board);
  const frozen = structuredClone(state);
  stepDrop(state, 1, true); hardDrop(state); rotateDrop(state); moveDrop(state, 1);
  assert.deepEqual(state, frozen);
});
test("hundreds of arbitrary moves preserve boundaries and terminate without exceptions", () => {
  const state = createDrop(random);
  for (let i = 0; i < 500 && !state.over; i++) {
    moveDrop(state, i % 2 ? 1 : -1);
    if (i % 3 === 0) rotateDrop(state);
    if (i % 7 === 0) hardDrop(state, random);
    stepDrop(state, .1, true, random);
    assert.equal(state.board.length, 18);
    assert.ok(state.board.every(row => row.length === 10));
    if (!state.over && !state.clearing.length) assert.equal(fitsDrop(state, state.current), true);
  }
  assert.equal(state.over, true);
});
