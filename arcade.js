import {createRunner, stepRunner, createBreaker, launchBreaker, stepBreaker} from "./core.js?v=5";
import {createDrop, stepDrop, moveDrop, rotateDrop, hardDrop, softDrop, landingY, GARMENTS, DROP_COLS, DROP_ROWS} from "./drop.js?v=5";

const $ = id => document.getElementById(id);
const GAME_INFO = {
  runner: {name: "DOUANE RUN", title: "PASSEZ\nENTRE LES LIGNES.", copy: "Flèches, boutons ou toucher une voie.\nVisez les losanges. Évitez les barrières.", help: "3 vies · Touchez une voie ou utilisez ← →"},
  breaker: {name: "CASSE-FRONTIÈRE", title: "LA FRONTIÈRE\nEST FRAGILE.", copy: "Déplacez la raquette avec le doigt ou ← →.\n35 briques. Trois vies. Aucune douane.", help: "Glissez ou ← → · Touchez le terrain / espace pour relancer"},
  drop: {name: "FLD DROP", title: "TASSEZ\nLE STOCK.", copy: "Des vêtements, pas des briques. Emboîtez les coupes.\nUne ligne pleine disparaît. Si la pile déborde : saisie.", help: "← → déplacer · ↻ tourner · ↓ descendre · ⇓ poser"}
};

export class Arcade {
  constructor({onRecord, onUnlock, onSound, notify}) {
    Object.assign(this, {onRecord, onUnlock, onSound, notify});
    this.canvas = $("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.game = "runner";
    this.active = false;
    this.running = false;
    this.paused = false;
    this.frame = 0;
    this.last = 0;
    this.keys = new Set();
    this.hold = 0;
    this.holdTime = 0;
    this.touch = null;
    this.soft = false;
    this.lastLines = 0;
    this.state = createRunner();
    document.querySelectorAll("[data-game]").forEach(button => {
      button.addEventListener("click", () => this.select(button.dataset.game));
    });
    $("playBtn").addEventListener("click", () => this.play());
    $("pauseBtn").addEventListener("click", () => this.togglePause());
    for (const [id, direction] of [["leftBtn", -1], ["rightBtn", 1]]) {
      const button = $(id);
      button.addEventListener("click", event => {
        if (this.game !== "drop" || event.detail === 0) this.move(direction);
      });
      button.addEventListener("pointerdown", event => {
        if (!["breaker", "drop"].includes(this.game) || !this.running || this.paused) return;
        this.hold = direction;
        if (this.game === "drop") { this.move(direction); this.holdTime = -.2; }
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointerup", () => { this.hold = 0; });
      button.addEventListener("pointercancel", () => { this.hold = 0; });
      button.addEventListener("lostpointercapture", () => { this.hold = 0; });
    }
    this.canvas.addEventListener("pointerdown", event => {
      if (!this.running || this.paused) return;
      this.canvas.setPointerCapture(event.pointerId);
      const x = this.localX(event);
      if (this.game === "drop") {
        this.touch = {x: event.clientX, y: event.clientY, lastX: event.clientX, moved: false};
      }
      if (this.game === "runner") this.state.lane = Math.min(2, Math.floor(x / 120));
      else if (this.game === "breaker") {
        this.state.paddle = Math.max(43, Math.min(317, x));
        launchBreaker(this.state);
      }
    });
    this.canvas.addEventListener("pointerup", event => {
      if (this.game === "drop" && this.touch && this.running && !this.paused) {
        const rect = this.canvas.getBoundingClientRect();
        const dy = (event.clientY - this.touch.y) * 360 / rect.width;
        if (dy > 65) this.slam();
        else if (!this.touch.moved && Math.abs(dy) < 12) this.rotate();
      }
      this.touch = null;
    });
    this.canvas.addEventListener("pointercancel", () => { this.touch = null; });
    $("rotateBtn").addEventListener("click", () => this.rotate());
    $("slamBtn").addEventListener("click", () => this.slam());
    $("softBtn").addEventListener("pointerdown", event => {
      if (!this.running || this.paused || this.game !== "drop") return;
      this.soft = true; $("softBtn").setPointerCapture(event.pointerId);
      softDrop(this.state); this.draw(); this.hud();
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
      $("softBtn").addEventListener(event, () => { this.soft = false; });
    }
    $("softBtn").addEventListener("click", event => {
      if (event.detail === 0 && this.game === "drop" && this.running && !this.paused) {
        softDrop(this.state); this.draw(); this.hud();
      }
    });
    this.canvas.addEventListener("pointermove", event => {
      if (this.game === "drop" && this.touch && this.running && !this.paused) {
        const size = this.canvas.getBoundingClientRect().width / 360 * 20;
        const dx = event.clientX - this.touch.lastX;
        if (Math.abs(dx) >= size) {
          const direction = Math.sign(dx), count = Math.min(10, Math.floor(Math.abs(dx) / size));
          for (let i = 0; i < count; i++) this.move(direction);
          this.touch.lastX += direction * count * size;
          this.touch.moved = true;
        }
        if (Math.abs(event.clientY - this.touch.y) > 12) this.touch.moved = true;
      }
      if (this.game === "breaker" && this.running && !this.paused && (event.buttons || event.pointerType === "touch")) {
        this.state.paddle = Math.max(43, Math.min(317, this.localX(event)));
      }
    });
    document.addEventListener("keydown", event => {
      if (!this.active || event.target.closest("input,textarea,select")) return;
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        if (this.running && !event.repeat) { event.preventDefault(); this.togglePause(); }
        return;
      }
      if (!this.running || this.paused) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        this.keys.add(event.key);
        if (this.game === "drop" || (!event.repeat && this.game === "runner")) this.move(event.key === "ArrowLeft" ? -1 : 1);
      }
      if (this.game === "drop" && ["ArrowUp", "ArrowDown", "x", "X"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowDown") this.keys.add(event.key);
        else if (!event.repeat) this.rotate();
      }
      if (event.code === "Space" && event.target === this.canvas) {
        event.preventDefault();
        if (this.game === "breaker") launchBreaker(this.state);
        if (this.game === "drop" && !event.repeat) this.slam();
      }
    });
    document.addEventListener("keyup", event => this.keys.delete(event.key));
    window.addEventListener("blur", () => this.pause());
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.pause(); });
    this.loop = this.loop.bind(this);
    this.select("runner", true);
  }
  localX(event) {
    const rect = this.canvas.getBoundingClientRect();
    return Math.max(0, Math.min(359, (event.clientX - rect.left) * 360 / rect.width));
  }
  setActive(active) {
    if (!active) this.pause();
    this.active = active;
  }
  select(game, force = false) {
    if (!GAME_INFO[game] || (!force && this.game === game)) return;
    cancelAnimationFrame(this.frame);
    this.keys.clear();
    this.hold = 0;
    this.running = this.paused = false;
    this.game = game;
    this.state = this.freshState();
    this.lastLines = 0;
    this.soft = false;
    this.touch = null;
    $("gameName").textContent = GAME_INFO[game].name;
    $("gameHelp").textContent = GAME_INFO[game].help;
    $("gameStatus").textContent = "PRÊT";
    this.canvas.hidden = false;
    $("dropControls").hidden = game !== "drop";
    this.canvas.setAttribute("aria-label", game === "runner"
      ? "Douane Run. Flèches gauche et droite pour changer de voie."
      : game === "drop" ? "FLD Drop. Flèches gauche droite pour déplacer, haut pour tourner, bas pour descendre, espace pour poser."
      : "Casse-frontière. Flèches ou doigt pour déplacer la raquette. Espace pour lancer.");
    document.querySelectorAll("[data-game]").forEach(button => {
      const selected = button.dataset.game === game;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    $("leftBtn").disabled = $("rightBtn").disabled = false;
    $("pauseBtn").disabled = true;
    this.overlay("ZONE FRANCHE / " + GAME_INFO[game].name, GAME_INFO[game].title, GAME_INFO[game].copy, "JOUER");
    this.hud();
    this.draw();
  }
  freshState() {
    return this.game === "drop" ? createDrop() : this.game === "breaker" ? createBreaker() : createRunner();
  }
  rotate() {
    if (this.game !== "drop" || !this.running || this.paused || !this.active) return;
    if (rotateDrop(this.state)) this.onSound(360);
    this.draw();
  }
  slam() {
    if (this.game !== "drop" || !this.running || this.paused || !this.active) return;
    hardDrop(this.state); this.onSound(180); this.draw(); this.hud();
  }
  overlay(eyebrow, title, copy, action) {
    $("overlayEyebrow").textContent = eyebrow;
    $("overlayTitle").textContent = title;
    $("overlayTitle").style.whiteSpace = "pre-line";
    $("overlayCopy").textContent = copy;
    $("playBtn").textContent = action + " ↗";
    $("gameOverlay").hidden = false;
  }
  play() {
    if (!this.active) return;
    if (!this.ctx) {
      this.notify("Le navigateur ne rend pas le terrain. Ouvrez le site dans Safari ou Chrome.");
      return;
    }
    const resume = this.paused;
    if (resume) this.paused = false;
    else {
      this.state = this.freshState();
      this.lastLines = 0;
      this.running = true;
      if (this.game === "breaker") launchBreaker(this.state);
    }
    $("gameOverlay").hidden = true;
    $("pauseBtn").disabled = false;
    $("gameStatus").textContent = "EN JEU";
    $("pauseBtn").textContent = "PAUSE";
    $("pauseBtn").setAttribute("aria-label", "Mettre le jeu en pause");
    this.onSound(440);
    this.last = 0;
    this.hud();
    if (matchMedia("(max-width: 700px)").matches) $("cabinet").scrollIntoView({block: "start", behavior: "instant"});
    this.canvas.focus({preventScroll: true});
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(this.loop);
  }
  move(direction) {
    if (!this.running || this.paused || !this.active) return;
    if (this.game === "drop") moveDrop(this.state, direction);
    if (this.game === "runner") this.state.lane = Math.max(0, Math.min(2, this.state.lane + direction));
    if (this.game === "breaker") this.state.paddle = Math.max(43, Math.min(317, this.state.paddle + direction * 25));
  }
  pause() {
    this.keys.clear();
    this.hold = 0; this.soft = false; this.touch = null;
    if (!this.running || this.paused) return;
    cancelAnimationFrame(this.frame);
    this.paused = true;
    $("gameStatus").textContent = "EN PAUSE";
    $("pauseBtn").textContent = "REPRENDRE";
    $("pauseBtn").setAttribute("aria-label", "Reprendre le jeu");
    this.overlay("LE BUREAU PEUT ATTENDRE.", "PAUSE\nDÉCLARÉE.", "Le jeu reprend exactement ici.", "REPRENDRE");
  }
  togglePause() {
    if (!this.running) return;
    if (this.paused) this.play();
    else this.pause();
  }
  loop(now) {
    if (!this.running || this.paused || !this.active) return;
    const dt = this.last ? Math.min(.04, (now - this.last) / 1000) : 0;
    this.last = now;
    if (this.game === "runner") stepRunner(this.state, dt);
    else if (this.game === "drop") {
      if (this.hold) {
        this.holdTime += dt;
        if (this.holdTime >= .08) { this.move(this.hold); this.holdTime = 0; }
      }
      stepDrop(this.state, dt, this.soft || this.keys.has("ArrowDown"));
      if (this.state.lines > this.lastLines) { this.onSound(600); this.lastLines = this.state.lines; }
      if (this.state.lines >= 8) this.onUnlock("drop");
    }
    else stepBreaker(this.state, dt, this.hold || Number(this.keys.has("ArrowRight")) - Number(this.keys.has("ArrowLeft")));
    this.draw();
    this.hud();
    if (this.game === "runner" && this.state.score >= 600) this.onUnlock("runner");
    if (this.state.over) {
      const score = Math.floor(this.state.score);
      this.onRecord(this.game, score);
      if (this.game === "breaker" && this.state.won) this.onUnlock("breaker");
      if (this.game === "drop") {
        this.finish("STOCK\nSAISI.", score + " points · " + this.state.lines + " lignes expédiées. Le dépôt déborde, la douane jubile."); return;
      }
      this.finish(this.state.won ? "FRONTIÈRE ABOLIE." : "COLIS INTERCEPTÉ.", "Score : " + score + (this.state.won ? ". Les 35 briques ont disparu." : ". Le bureau vous attend au prochain passage."));
      return;
    }
    this.frame = requestAnimationFrame(this.loop);
  }
  finish(title, copy) {
    this.running = this.paused = false;
    this.keys.clear();
    this.hold = 0; this.soft = false; this.touch = null;
    cancelAnimationFrame(this.frame);
    $("gameStatus").textContent = this.state.won ? "TERMINÉ" : "INTERCEPTÉ";
    $("pauseBtn").disabled = true;
    this.overlay("DOSSIER SANS SUITE", title, copy, "REJOUER");
    $("playBtn").focus({preventScroll: true});
    this.onSound(220);
  }
  hud() {
    const scoreLabel = String(Math.floor(this.state.score)).padStart(5, "0");
    if ($("gameScore").textContent !== scoreLabel) $("gameScore").textContent = scoreLabel;
    const lives = this.game === "drop" ? this.state.lines + " L / NIV " + this.state.level : Array.from({length: this.state.lives}, () => "●").join(" ");
    if ($("gameLives").textContent !== lives) {
      $("gameLives").textContent = lives;
      $("gameLives").setAttribute("aria-label", this.game === "drop" ? this.state.lines + " lignes, niveau " + this.state.level : this.state.lives + " vies");
    }
    if (this.game === "breaker") {
      const help = this.state.waiting && this.running ? "Balle perdue · Touchez le terrain ou espace pour relancer" : GAME_INFO.breaker.help;
      if ($("gameHelp").textContent !== help) $("gameHelp").textContent = help;
    }
  }
  fabric(points, type, x, y, size, ghost = false) {
    const ctx = this.ctx, garment = GARMENTS[type];
    const contains = (a, b) => points.some(([px, py]) => px === a && py === b);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = garment.color;
    ctx.strokeStyle = ghost ? "#d3b6ff" : "#120c1c";
    ctx.lineWidth = ghost ? 1 : 1.2;
    if (ghost) { ctx.globalAlpha = .38; ctx.setLineDash([3,3]); }
    for (const [px, py] of points) {
      const a = px * size, b = py * size;
      if (!ghost) {
        ctx.fillStyle = garment.color; ctx.fillRect(a, b, size, size);
        ctx.fillStyle = "#ffffff16"; ctx.fillRect(a + 2, b + 2, size - 4, 2);
        ctx.strokeStyle = "#150b2338"; ctx.setLineDash([1,2]);
        ctx.strokeRect(a + 3, b + 3, size - 6, size - 6);
        ctx.setLineDash([]); ctx.strokeStyle = "#160e24";
      }
      ctx.beginPath();
      if (!contains(px, py - 1)) { ctx.moveTo(a, b); ctx.lineTo(a + size, b); }
      if (!contains(px + 1, py)) { ctx.moveTo(a + size, b); ctx.lineTo(a + size, b + size); }
      if (!contains(px, py + 1)) { ctx.moveTo(a + size, b + size); ctx.lineTo(a, b + size); }
      if (!contains(px - 1, py)) { ctx.moveTo(a, b + size); ctx.lineTo(a, b); }
      ctx.stroke();
      if (!ghost && size >= 14) {
        ctx.strokeStyle = "#1c113c75"; ctx.lineWidth = .8;
        ctx.beginPath();
        if (garment.detail === "zip") {
          ctx.moveTo(a + size / 2, b + 1); ctx.lineTo(a + size / 2, b + size - 1);
          ctx.strokeRect(a + size / 2 - 1, b + 5, 3, 4);
        } else if (garment.detail === "denim") {
          ctx.moveTo(a + 4, b + 3); ctx.lineTo(a + size - 4, b + 3);
          ctx.lineTo(a + size - 5, b + size / 2); ctx.lineTo(a + 5, b + size / 2); ctx.closePath();
        } else if (garment.detail === "parcel") {
          ctx.moveTo(a + size / 2, b); ctx.lineTo(a + size / 2, b + size);
        } else if (garment.detail === "scarf" || garment.detail === "knit") {
          for (let line = 5; line < size - 2; line += 4) {
            ctx.moveTo(a + 3, b + line); ctx.lineTo(a + size - 3, b + line);
          }
        }
        ctx.stroke();
      }
    }
    if (!ghost && points.length >= 3 && size >= 14) {
      const top = Math.min(...points.map(([,y]) => y)), topRow = points.filter(([,y]) => y === top);
      if (["tee","zip"].includes(garment.detail) && topRow.length > 1) {
        const mid = (Math.min(...topRow.map(([x]) => x)) + Math.max(...topRow.map(([x]) => x)) + 1) / 2;
        ctx.strokeStyle = "#180c2b"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(mid * size, top * size + 1, size * .32, 0, Math.PI); ctx.stroke();
      }
      const [px, py] = points[Math.floor(points.length / 2)];
      ctx.fillStyle = "#100b1e"; ctx.font = "italic bold " + Math.round(size * .39) + "px Arial";
      ctx.textAlign = "center"; ctx.fillText("fld", (px + .5) * size, (py + .7) * size);
    }
    ctx.restore();
  }
  piecePoints(cells) {
    return cells.flatMap((row, y) => row.flatMap((filled, x) => filled ? [[x,y]] : []));
  }
  drawDrop() {
    const ctx = this.ctx, state = this.state, size = 20, ox = 15, oy = 36;
    ctx.textAlign = "left"; ctx.font = "8px monospace"; ctx.fillStyle = "#b89bcf";
    ctx.fillText("ENTREPÔT 04 / SANS INVENTAIRE", 15, 19);
    ctx.strokeStyle = "#54376c"; ctx.strokeRect(ox - 1, oy - 1, 202, 362);
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, 200, 360); ctx.clip();
    ctx.fillStyle = "#130c1f"; ctx.fillRect(ox, oy, 200, 360);
    ctx.strokeStyle = "#a67bdc13"; ctx.lineWidth = .5;
    for (let x = 0; x <= DROP_COLS; x++) { ctx.beginPath(); ctx.moveTo(ox + x * size, oy); ctx.lineTo(ox + x * size, oy + 360); ctx.stroke(); }
    for (let y = 0; y <= DROP_ROWS; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * size); ctx.lineTo(ox + 200, oy + y * size); ctx.stroke(); }
    const groups = new Map();
    state.board.forEach((row, y) => row.forEach((cell, x) => {
      if (!cell) return;
      if (!groups.has(cell.group)) groups.set(cell.group, {type: cell.type, points: []});
      groups.get(cell.group).points.push([x,y]);
    }));
    groups.forEach(group => this.fabric(group.points, group.type, ox, oy, size));
    if (!state.over && !state.clearing.length) {
      const piece = state.current, points = this.piecePoints(piece.cells);
      this.fabric(points, piece.type, ox + piece.x * size, oy + landingY(state) * size, size, true);
      this.fabric(points, piece.type, ox + piece.x * size, oy + piece.y * size, size);
    }
    if (state.clearing.length) {
      ctx.fillStyle = "#e5d4ff99";
      state.clearing.forEach(row => ctx.fillRect(ox, oy + row * size, 200, size));
    }
    ctx.restore();
    ctx.fillStyle = "#d6b9ff"; ctx.font = "8px monospace"; ctx.fillText("ARRIVAGES", 235, 43);
    state.queue.slice(0, 3).forEach((type, i) => {
      const garment = GARMENTS[type], y = 63 + i * 75;
      this.fabric(this.piecePoints(garment.cells), type, 238, y, 16);
      ctx.fillStyle = "#bfaacc"; ctx.font = "7px monospace"; ctx.fillText(garment.name, 235, y + 51);
    });
    ctx.fillStyle = "#8e749f"; ctx.font = "7px monospace"; ctx.fillText("LIGNES", 235, 308);
    ctx.fillStyle = "#e2ccff"; ctx.font = "26px monospace"; ctx.fillText(String(state.lines).padStart(2,"0"), 233, 336);
    ctx.fillStyle = "#8e749f"; ctx.font = "7px monospace"; ctx.fillText("NIVEAU " + state.level, 235, 356);
    ctx.fillStyle = "#c6a1ff"; ctx.fillText(state.clearing.length ? "STOCK ÉVACUÉ" : "NE RIEN DÉCLARER", 235, 383);
    ctx.font = "7px monospace"; ctx.fillStyle = "#a386b6"; ctx.textAlign = "center";
    ctx.fillText("COUPE COURTE. STOCK INFINI.", 180, 417);
  }
  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, 360, 430);
    ctx.fillStyle = "#09060f";
    ctx.fillRect(0, 0, 360, 430);
    ctx.strokeStyle = "#2b193d";
    ctx.lineWidth = 1;
    ctx.font = "9px monospace";
    if (this.game === "drop") { this.drawDrop(); return; }
    if (this.game === "runner") {
      const state = this.state;
      ctx.setLineDash([9, 11]);
      ctx.lineDashOffset = -(state.time * 100 % 20);
      [120, 240].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 430); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.fillStyle = "#846298";
      ctx.textAlign = "center";
      ["NON", "DÉCLARÉ", "ENCORE"].forEach((text, i) => ctx.fillText(text, 60 + i * 120, 24));
      for (const row of state.rows) {
        for (const lane of row.blocked) {
          const x = lane * 120 + 13;
          ctx.fillStyle = row.hit ? "#352344" : "#aa78dd";
          ctx.fillRect(x, row.y, 94, 21);
          ctx.fillStyle = "#170c22";
          ctx.font = "bold 9px monospace";
          ctx.fillText("DOUANE", x + 47, row.y + 14);
          ctx.fillRect(x + 7, row.y + 21, 4, 8);
          ctx.fillRect(x + 83, row.y + 21, 4, 8);
        }
        if (!row.collected) {
          const x = row.safe * 120 + 60, y = row.y + 10;
          ctx.fillStyle = "#d5ffb8";
          ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill();
        }
      }
      const visible = state.invincible <= 0 || Math.floor(state.invincible * 12) % 2 === 0;
      if (visible) {
        const x = state.x;
        ctx.fillStyle = "#ead8ff";
        ctx.beginPath();
        ctx.moveTo(x - 13, 340);ctx.lineTo(x - 25, 352);ctx.lineTo(x - 20, 369);ctx.lineTo(x - 12, 363);ctx.lineTo(x - 12, 379);
        ctx.lineTo(x + 12, 379);ctx.lineTo(x + 12, 363);ctx.lineTo(x + 20, 369);ctx.lineTo(x + 25, 352);ctx.lineTo(x + 13, 340);ctx.closePath();ctx.fill();
        ctx.fillStyle = "#170c22";ctx.font = "bold 9px monospace";ctx.fillText("FLD", x, 363);
        ctx.fillStyle = "#9b59ff";ctx.fillRect(x - 11, 386, 22, 3);
      }
      ctx.fillStyle = "#826598";ctx.font = "8px monospace";ctx.fillText("↑ DIRECTION : AILLEURS ↑", 180, 417);
    } else if (this.game === "breaker") {
      const state = this.state;
      state.bricks.forEach((brick, i) => {
        if (!brick.alive) return;
        ctx.fillStyle = ["#b68de7", "#9d73ce", "#865db4", "#6e4797", "#57347c"][Math.floor(i / 7)];
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
        ctx.fillStyle = "#190d24";ctx.font = "8px monospace";ctx.textAlign = "center";ctx.fillText(i % 2 ? "TAX" : "FLD", brick.x + brick.w / 2, brick.y + 13);
      });
      ctx.fillStyle = "#d5b6ff";ctx.fillRect(state.paddle - 43, 388, 86, 9);
      ctx.fillStyle = "#f7efff";ctx.beginPath();ctx.arc(state.ball.x, state.ball.y, 5, 0, Math.PI * 2);ctx.fill();
      ctx.strokeStyle = "#76439c";ctx.setLineDash([3, 5]);ctx.beginPath();ctx.moveTo(0, 416);ctx.lineTo(360, 416);ctx.stroke();ctx.setLineDash([]);
      ctx.textAlign = "center";ctx.fillStyle = "#846298";ctx.font = "8px monospace";ctx.fillText("PAS DE VISA. PAS DE MUR.", 180, 30);
      if (state.waiting && this.running) {ctx.fillStyle = "#e4d0ff";ctx.font = "10px monospace";ctx.fillText("TOUCHEZ POUR RELANCER", 180, 330);}
    }
  }
}
