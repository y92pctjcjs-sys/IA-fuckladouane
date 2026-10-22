import test from "node:test";
import assert from "node:assert/strict";
import {SCAN_DURATION, SCAN_STEPS, scanState, shuffled, runnerRow, createRunner, stepRunner, createBreaker, launchBreaker, stepBreaker, improvedRecord} from "../core.js";

test("scan clamps bounds and reaches its final phase exactly at completion", () => {
  assert.equal(scanState(-100).progress, 0);
  assert.equal(scanState(0).phase, 0);
  assert.equal(scanState(SCAN_DURATION - 1).done, false);
  assert.deepEqual(scanState(SCAN_DURATION * 3), {ratio: 1, progress: 100, index: SCAN_STEPS.length - 1, phase: 3, done: true});
});
test("every scan threshold is reachable and progression never runs backwards", () => {
  let previous = -1;
  SCAN_STEPS.forEach((step, i) => {
    const state = scanState(step[0] * SCAN_DURATION + .001);
    assert.equal(state.index, i);
    assert.ok(state.progress >= previous);
    previous = state.progress;
  });
});
test("shuffle preserves a complete eight-pair deck without mutating its input", () => {
  const original = ["IA","FLD","404","QR","€€","0%","Ø","88"].flatMap(x => [x, x]);
  const copy = [...original];
  const deck = shuffled(original, () => .2);
  assert.deepEqual(original, copy);
  assert.deepEqual([...deck].sort(), [...original].sort());
  assert.notDeepEqual(deck, original);
});
test("every runner row leaves exactly one navigable lane", () => {
  for (const r of [0, .333, .5, .99999]) {
    const row = runnerRow(() => r);
    assert.equal(row.blocked.length, 2);
    assert.equal(row.blocked.includes(row.safe), false);
    assert.deepEqual([...row.blocked, row.safe].sort(), [0, 1, 2]);
  }
});
test("runner collisions cost one life, are not repeatedly charged, and respect invulnerability", () => {
  const state = createRunner();
  state.nextRow = 100;
  state.rows = [{safe: 0, blocked: [1,2], y: 333, hit: false, collected: false}];
  stepRunner(state, .016);
  assert.equal(state.lives, 2);
  stepRunner(state, .016);
  assert.equal(state.lives, 2);
  state.rows.push({safe: 0, blocked: [1,2], y: 333, hit: false, collected: false});
  stepRunner(state, .016);
  assert.equal(state.lives, 2);
});
test("a runner safe-lane pickup scores once and cannot damage the player", () => {
  const state = createRunner();
  state.nextRow = 100;
  state.rows = [{safe: 1, blocked: [0,2], y: 333, hit: false, collected: false}];
  stepRunner(state, .016);
  const first = state.score;
  stepRunner(state, .016);
  assert.ok(first >= 40);
  assert.ok(state.score - first < 1);
  assert.equal(state.lives, 3);
});
test("runner collisions follow the rendered x coordinate during a late lane change", () => {
  const state = createRunner();
  state.nextRow = 100;
  state.lane = 0;
  state.rows = [{safe: 0, blocked: [1,2], y: 333, hit: false, collected: false}];
  stepRunner(state, .001);
  assert.equal(state.lives, 2);
});
test("runner terminal state stops scoring and motion", () => {
  const state = createRunner();
  state.over = true;
  const before = structuredClone(state);
  stepRunner(state, .04);
  assert.deepEqual(state, before);
});
test("breaker paddle keeps the ball above the loss line and deflects it upward", () => {
  const state = createBreaker();
  launchBreaker(state);
  state.ball = {x: 180, y: 379, vx: 0, vy: 230};
  stepBreaker(state, .04);
  assert.ok(state.ball.vy < 0);
  assert.equal(state.lives, 3);
  assert.ok(state.ball.y < 388);
});
test("breaker brick collision removes one brick and reverses ball direction", () => {
  const state = createBreaker();
  launchBreaker(state);
  const brick = state.bricks[28];
  state.ball = {x: brick.x + brick.w / 2, y: brick.y + brick.h + 8, vx: 0, vy: -220};
  stepBreaker(state, .025);
  assert.equal(state.score, 10);
  assert.equal(state.bricks.filter(x => !x.alive).length, 1);
  assert.ok(state.ball.vy > 0);
});
test("breaker final brick ends the game as a victory", () => {
  const state = createBreaker();
  state.bricks.forEach((brick, i) => {brick.alive = i === 28;});
  launchBreaker(state);
  const brick = state.bricks[28];
  state.ball = {x: brick.x + 22, y: brick.y + brick.h + 8, vx: 0, vy: -220};
  stepBreaker(state, .025);
  assert.equal(state.over, true);
  assert.equal(state.won, true);
});
test("breaker lost ball requires a new launch and exhausts exactly three lives", () => {
  const state = createBreaker();
  for (let life = 2; life >= 0; life--) {
    launchBreaker(state);
    state.ball = {x: 20, y: 439, vx: 0, vy: 220};
    stepBreaker(state, .04);
    assert.equal(state.lives, life);
    assert.equal(state.over, life === 0);
    if (life > 0) assert.equal(state.waiting, true);
  }
});
test("breaker wall bounce and paddle clamping work at the maximum frame step", () => {
  const state = createBreaker();
  launchBreaker(state);
  state.ball = {x: 354, y: 300, vx: 240, vy: -200};
  stepBreaker(state, .04, 1);
  assert.ok(state.ball.vx < 0);
  assert.ok(state.ball.x >= 5 && state.ball.x <= 355);
  for (let i = 0; i < 100; i++) stepBreaker(state, .04, 1);
  assert.ok(state.paddle <= 317);
});
test("records prefer high scores but low memory move counts", () => {
  assert.equal(improvedRecord("runner", 500, 100), 500);
  assert.equal(improvedRecord("breaker", 20, 30), 30);
  assert.equal(improvedRecord("memory", 0, 20), 20);
  assert.equal(improvedRecord("memory", 20, 16), 16);
  assert.equal(improvedRecord("memory", 16, 25), 16);
  assert.equal(improvedRecord("memory", 16, undefined), 16);
  assert.equal(improvedRecord("memory", 16, 0), 16);
});
