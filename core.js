// Pure game and timeline rules. Canvas, audio and persistence live elsewhere.
export const SCAN_DURATION = 16200;
export const SCAN_STEPS = [
  [0, 0, "Étiquette reconnue.", "CONTACT"],
  [.08, 0, "Dépliage du swag en cours.", "OK"],
  [.17, 0, "Coupe courte. Intentions longues.", "OK"],
  [.25, 1, "Lecture des coutures suspectes.", "OK"],
  [.34, 1, "Recherche d’un alibi humain…", "DOUTE"],
  [.43, 1, "Le coton refuse de témoigner.", "OMERTA"],
  [.52, 2, "Connexion au cadastre du Swagistan.", "OK"],
  [.61, 2, "Frontière introuvable. Tant mieux.", "404"],
  [.70, 2, "Excès de confiance : non réglementaire.", "ALERTE"],
  [.79, 3, "L’étiquette a demandé un avocat.", "REFUS"],
  [.88, 3, "Calcul des frais : votre dignité.", "0 €"],
  [.96, 3, "L’IA nie avoir touché à cette veste.", "LOL"],
  [1, 3, "Dossier classé. Vous pouvez circuler.", "SCELLÉ"]
];

export function scanState(elapsed) {
  const ratio = Math.min(1, Math.max(0, elapsed / SCAN_DURATION));
  let index = 0;
  SCAN_STEPS.forEach((step, i) => { if (ratio >= step[0]) index = i; });
  return {ratio, progress: Math.floor(ratio * 100), index, phase: SCAN_STEPS[index][1], done: ratio === 1};
}

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function runnerRow(random = Math.random) {
  const safe = Math.floor(random() * 3);
  return {safe, blocked: [0, 1, 2].filter(lane => lane !== safe), y: -35, hit: false, collected: false};
}

export function createRunner() {
  return {lane: 1, x: 180, time: 0, score: 0, lives: 3, invincible: 0, nextRow: .65, rows: [], over: false};
}

export function stepRunner(state, dt, random = Math.random) {
  if (state.over) return;
  state.time += dt;
  state.invincible = Math.max(0, state.invincible - dt);
  state.x += ((60 + state.lane * 120) - state.x) * Math.min(1, dt * 17);
  state.score += dt * 12;
  state.nextRow -= dt;
  const speed = Math.min(240, 112 + state.time * 2.5);
  if (state.nextRow <= 0) {
    state.rows.push(runnerRow(random));
    state.nextRow += Math.max(.91, 1.65 - state.time * .009);
  }
  for (const row of state.rows) {
    row.y += speed * dt;
    // Use the displayed player position so a late lane change cannot teleport through a barrier.
    const playerLane = Math.max(0, Math.min(2, Math.round((state.x - 60) / 120)));
    if (!row.hit && row.y >= 333 && row.y <= 380) {
      if (row.blocked.includes(playerLane)) {
        row.hit = true;
        if (state.invincible === 0) {
          state.lives--;
          state.invincible = 1;
          if (state.lives === 0) state.over = true;
        }
      } else if (!row.collected) {
        row.collected = true;
        state.score += 40;
      }
    }
  }
  state.rows = state.rows.filter(row => row.y < 470);
}

export function createBreaker() {
  const bricks = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) bricks.push({x: 16 + col * 47, y: 64 + row * 25, w: 44, h: 20, alive: true});
  }
  return {paddle: 180, ball: {x: 180, y: 378, vx: 112, vy: -208}, bricks, lives: 3, score: 0, waiting: true, over: false, won: false};
}

export function launchBreaker(state) {
  if (!state.over) state.waiting = false;
}

export function stepBreaker(state, dt, direction = 0) {
  if (state.over) return;
  state.paddle = Math.max(43, Math.min(317, state.paddle + direction * dt * 325));
  if (state.waiting) {
    state.ball.x = state.paddle;
    state.ball.y = 378;
    return;
  }
  const steps = Math.max(1, Math.ceil(dt / .008));
  const tick = dt / steps, ball = state.ball, r = 5;
  for (let i = 0; i < steps; i++) {
    const oldX = ball.x, oldY = ball.y;
    ball.x += ball.vx * tick;
    ball.y += ball.vy * tick;
    if (ball.x < r || ball.x > 360 - r) {
      ball.x = Math.max(r, Math.min(360 - r, ball.x));
      ball.vx *= -1;
    }
    if (ball.y < r) { ball.y = r; ball.vy = Math.abs(ball.vy); }
    if (ball.vy > 0 && oldY <= 388 - r && ball.y >= 388 - r && Math.abs(ball.x - state.paddle) < 43 + r) {
      const offset = (ball.x - state.paddle) / 43;
      const speed = Math.min(360, Math.hypot(ball.vx, ball.vy) + 3);
      ball.vx = offset * speed * .83;
      ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
      ball.y = 388 - r;
    }
    for (const brick of state.bricks) {
      if (!brick.alive || ball.x + r < brick.x || ball.x - r > brick.x + brick.w ||
        ball.y + r < brick.y || ball.y - r > brick.y + brick.h) continue;
      brick.alive = false;
      state.score += 10;
      if (oldX + r <= brick.x || oldX - r >= brick.x + brick.w) ball.vx *= -1;
      else ball.vy *= -1;
      ball.x = oldX;
      ball.y = oldY;
      break;
    }
    if (state.bricks.every(brick => !brick.alive)) {
      state.won = state.over = true;
      break;
    }
    if (ball.y > 440) {
      state.lives--;
      if (state.lives === 0) state.over = true;
      else {
        state.waiting = true;
        ball.x = state.paddle;
        ball.y = 378;
        ball.vx = 112;
        ball.vy = -208;
      }
      break;
    }
  }
}

export function improvedRecord(game, oldValue, newValue) {
  const next = Math.max(0, Math.floor(Number(newValue) || 0));
  const previous = Math.max(0, Math.floor(Number(oldValue) || 0));
  if (!next) return previous;
  if (game === "memory") return previous === 0 ? next : Math.min(previous, next);
  return Math.max(previous, next);
}
