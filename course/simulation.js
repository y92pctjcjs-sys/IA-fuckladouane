import {LENGTH, HALF_WIDTH, BLOCKADES, curvature, sectorAt} from './track.js';
import {drawEnding} from './ending.js';
export const FIXED_DT = 1 / 120;
export const emptyInput = () => ({steer: 0, brake: false, drift: false, nitro: false});
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export function createRace(ending = drawEnding) {
  return {state: 'MENU', previous: null, countdown: 3, time: 0, cinematic: 0,
    s: 0, x: 0, vx: 0, speed: 0, yaw: 0, steer: 0, nitro: 100, health: 100,
    pressure: 0, capture: 0, invulnerable: 0, impact: 0, drifts: 0, driftTime: 0,
    drifting: false, boosting: false, result: null, ending,
    contacts: new Set(), obstacles: BLOCKADES.flatMap((row, r) => row.xs.map((x, i) => ({id: `b${r}-${i}`, s: row.s, x, type: 'barrier'}))),
    traffic: Array.from({length: 9}, (_, i) => ({id: `t${i}`, s: 340 + i * 480, x: [-4.9, 0, 4.9][i % 3], speed: 20 + i % 4 * 2, type: 'traffic'})),
    cops: Array.from({length: 3}, (_, i) => ({id: `c${i}`, s: -38 - i * 32, x: (i - 1) * 4, speed: 0, active: i === 0, type: 'cop'}))};
}
export function start(r) { if (r.state === 'MENU') r.state = 'COUNTDOWN'; }
export function pause(r) {
  if (['COUNTDOWN', 'RACE', 'ARRIVAL', 'INTERCEPTION'].includes(r.state)) { r.previous = r.state; r.state = 'PAUSE'; }
}
export function resume(r) { if (r.state === 'PAUSE') { r.state = r.previous; r.previous = null; } }
export function finish(r, won, reason = '') {
  if (r.state !== 'RACE' || r.result) return false;
  r.result = Object.freeze({won, reason, time: r.time, health: r.health, drifts: r.drifts,
    score: Math.max(0, Math.round((won ? 10000 : r.s) + r.health * 30 + r.drifts * 150 - r.time * 12)),
    ending: won ? r.ending() : 'caught'});
  r.state = won ? 'ARRIVAL' : 'INTERCEPTION';
  r.cinematic = 0; r.boosting = false;
  return true;
}
export function hit(r, damage, impulse = 0) {
  if (r.state !== 'RACE' || r.invulnerable > 0) return false;
  r.health = Math.max(0, r.health - damage);
  r.speed *= .62; r.vx += impulse; r.invulnerable = .9; r.impact = 1;
  return true;
}
export function overlaps(r, object) {
  const longitudinal = object.type === 'barrier' ? 3 : 4.1;
  const lateral = object.type === 'barrier' ? 2.55 : 1.85;
  return Math.abs(r.s - object.s) < longitudinal && Math.abs(r.x - object.x) < lateral;
}
export function step(r, dt, input = emptyInput()) {
  if (r.state === 'MENU' || r.state === 'PAUSE' || r.state === 'RESULTS') return;
  dt = clamp(dt, 0, .05);
  if (r.state === 'COUNTDOWN') {
    r.countdown -= dt;
    if (r.countdown <= 0) { r.state = 'RACE'; r.countdown = 0; }
    return;
  }
  if (r.state === 'ARRIVAL' || r.state === 'INTERCEPTION') {
    r.cinematic += dt;
    if (r.cinematic >= (r.result.ending === 'love' ? 13 : 4.5)) r.state = 'RESULTS';
    return;
  }
  r.time += dt; r.invulnerable = Math.max(0, r.invulnerable - dt); r.impact = Math.max(0, r.impact - dt * 2);
  const section = sectorAt(r.s);
  r.steer += (clamp(input.steer, -1, 1) - r.steer) * Math.min(1, dt * 8);
  r.drifting = Boolean(input.drift && Math.abs(r.steer) > .18 && r.speed > 18);
  r.boosting = Boolean(input.nitro && r.nitro > .8 && !input.brake);
  const targetSpeed = input.brake ? (input.drift ? 27 : 0) : r.boosting ? 69 : 48;
  const acceleration = r.speed < targetSpeed ? (r.boosting ? 19 : 10) : input.brake ? 24 : 12;
  r.speed += clamp(targetSpeed - r.speed, -acceleration * dt, acceleration * dt);
  r.nitro = clamp(r.nitro + (r.boosting ? -26 : 5) * dt, 0, 100);
  const grip = r.drifting ? 2.5 : 6.5;
  const targetVx = r.steer * (r.drifting ? 11 : 8.5) * Math.min(1, r.speed / 18);
  r.vx += (targetVx - r.vx) * Math.min(1, dt * grip);
  r.vx -= curvature(r.s) * r.speed * r.speed * dt * (r.drifting ? .7 : .42);
  r.x += r.vx * dt;
  r.yaw = Math.atan2(r.vx, Math.max(r.speed, 10)) + (r.drifting ? r.steer * .26 : 0);
  if (r.drifting && Math.abs(r.x) < 7) { r.driftTime += dt; r.nitro = Math.min(100, r.nitro + dt * 12); }
  else if (r.driftTime > 0) { if (r.driftTime > .65) { r.drifts++; r.nitro = Math.min(100, r.nitro + 9); } r.driftTime = 0; }
  if (Math.abs(r.x) > HALF_WIDTH - .5) {
    r.speed = Math.max(0, r.speed - 13 * dt);
    if (Math.abs(r.x) > HALF_WIDTH + .25) hit(r, 7, -Math.sign(r.x) * 3);
    r.x = clamp(r.x, -HALF_WIDTH - 1.5, HALF_WIDTH + 1.5);
  }
  r.s += r.speed * dt;
  for (const t of r.traffic) { t.s += t.speed * dt; if (t.s < r.s - 90 && r.s < LENGTH - 500) { t.s = r.s + 520; r.contacts.delete(t.id); } }
  let close = 0;
  for (let i = 0; i < r.cops.length; i++) {
    const c = r.cops[i];
    if (!c.active && section >= i) { c.active = true; c.s = r.s - 80 - i * 12; c.speed = r.speed; }
    if (!c.active) continue;
    const gap = r.s - c.s;
    const attacking = (r.time + i * 3.2) % 12 < 2.4;
    const followingGap = attacking ? -1 : 15 + i * 5;
    const wanted = gap > 30 ? clamp(r.speed + 4 + section, 25, 59) : clamp(r.speed + (gap - followingGap) * .6, 0, 58);
    c.speed += clamp(wanted - c.speed, -20 * dt, 12 * dt);
    c.s += c.speed * dt;
    const flank = (i - 1) * 2.3;
    const wantedX = clamp(r.x + (gap < 12 ? flank : Math.sin(r.time * .5 + i) * 2), -6.5, 6.5);
    c.x += clamp(wantedX - c.x, -3.4 * dt, 3.4 * dt);
    if (Math.abs(gap) < 18) close++;
    if (overlaps(r, c)) { hit(r, 8, Math.sign(r.x - c.x || (i % 2 ? 1 : -1)) * 4); c.speed *= .65; c.s = Math.min(c.s, r.s - 4.2); }
  }
  r.pressure = clamp(r.cops.filter(c => c.active).reduce((p, c) => p + Math.max(0, 1 - Math.abs(r.s - c.s) / 95) * 36, 0), 0, 100);
  for (let n = 0; n < r.obstacles.length + r.traffic.length; n++) {
    const o = n < r.obstacles.length ? r.obstacles[n] : r.traffic[n - r.obstacles.length];
    if (!r.contacts.has(o.id) && overlaps(r, o)) {
      if (hit(r, o.type === 'barrier' ? 17 : 12, (r.x >= o.x ? 1 : -1) * 4)) r.contacts.add(o.id);
    }
  }
  r.capture = r.speed < 3 && close >= 2 ? Math.min(4, r.capture + dt) : Math.max(0, r.capture - dt * 2);
  if (r.health <= 0) finish(r, false, 'VÉHICULE HORS SERVICE');
  else if (r.capture >= 4) finish(r, false, 'IMMOBILISÉ ET ENCERCLÉ');
  else if (r.s >= LENGTH && r.speed > 3) finish(r, true);
}
export function createClock(race, input) {
  let accumulated = 0;
  return { advance(elapsed) {
    if (race.state === 'PAUSE' || race.state === 'MENU' || race.state === 'RESULTS') { accumulated = 0; return; }
    accumulated += clamp(elapsed, 0, .25);
    while (accumulated + 1e-10 >= FIXED_DT) { step(race, FIXED_DT, input()); accumulated -= FIXED_DT; }
  }};
}
