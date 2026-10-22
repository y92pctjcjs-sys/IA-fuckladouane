import {createRunner, stepRunner, createBreaker, launchBreaker, stepBreaker, shuffled} from "./core.js?v=4";

const $ = id => document.getElementById(id);
const GAME_INFO = {
  runner: {name: "DOUANE RUN", title: "PASSEZ\nENTRE LES LIGNES.", copy: "Flèches, boutons ou toucher une voie.\nVisez les losanges. Évitez les barrières.", help: "3 vies · Touchez une voie ou utilisez ← →"},
  breaker: {name: "CASSE-FRONTIÈRE", title: "LA FRONTIÈRE\nEST FRAGILE.", copy: "Déplacez la raquette avec le doigt ou ← →.\n35 briques. Trois vies. Aucune douane.", help: "Glissez ou ← → · Touchez le terrain / espace pour relancer"},
  memory: {name: "MÉMOIRE SAISIE", title: "RENDEZ-NOUS\nLES SOUVENIRS.", copy: "Retrouvez les huit paires de pièces saisies.\nMoins de coups. Plus d’Omerta.", help: "Retournez deux cartes · 8 paires · Record en coups"}
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
    this.mismatchTimer = 0;
    this.deck = [];
    this.state = createRunner();
    document.querySelectorAll("[data-game]").forEach(button => {
      button.addEventListener("click", () => this.select(button.dataset.game));
    });
    $("playBtn").addEventListener("click", () => this.play());
    $("pauseBtn").addEventListener("click", () => this.togglePause());
    for (const [id, direction] of [["leftBtn", -1], ["rightBtn", 1]]) {
      const button = $(id);
      button.addEventListener("click", () => this.move(direction));
      button.addEventListener("pointerdown", event => {
        if (this.game !== "breaker" || !this.running || this.paused) return;
        this.hold = direction;
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
      if (this.game === "runner") this.state.lane = Math.min(2, Math.floor(x / 120));
      else if (this.game === "breaker") {
        this.state.paddle = Math.max(43, Math.min(317, x));
        launchBreaker(this.state);
      }
    });
    this.canvas.addEventListener("pointermove", event => {
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
      if (!this.running || this.paused || this.game === "memory") return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        this.keys.add(event.key);
        if (!event.repeat && this.game === "runner") this.move(event.key === "ArrowLeft" ? -1 : 1);
      }
      if (event.code === "Space" && event.target === this.canvas) {
        event.preventDefault();
        if (this.game === "breaker") launchBreaker(this.state);
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
    this.resolveMismatch();
    this.keys.clear();
    this.hold = 0;
    this.running = this.paused = false;
    this.game = game;
    this.state = game === "breaker" ? createBreaker() : createRunner();
    this.moves = this.pairs = 0;
    $("gameName").textContent = GAME_INFO[game].name;
    $("gameHelp").textContent = GAME_INFO[game].help;
    $("gameStatus").textContent = "PRÊT";
    $("memoryBoard").hidden = game !== "memory";
    this.canvas.hidden = game === "memory";
    this.canvas.setAttribute("aria-label", game === "runner"
      ? "Douane Run. Changez de voie avec les flèches gauche et droite. Évitez les barrières."
      : "Casse-frontière. Déplacez la raquette avec les flèches ou le doigt. Espace pour lancer.");
    $("memoryBoard").replaceChildren();
    document.querySelectorAll("[data-game]").forEach(button => {
      const selected = button.dataset.game === game;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    $("leftBtn").disabled = $("rightBtn").disabled = game === "memory";
    $("pauseBtn").disabled = true;
    this.overlay("ZONE FRANCHE / " + GAME_INFO[game].name, GAME_INFO[game].title, GAME_INFO[game].copy, "JOUER");
    this.hud();
    this.draw();
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
    if (!this.ctx && this.game !== "memory") {
      this.notify("Le canvas n’est pas disponible dans ce navigateur. Mémoire saisie reste jouable.");
      return;
    }
    const resume = this.paused;
    if (resume) this.paused = false;
    else {
      this.state = this.game === "breaker" ? createBreaker() : createRunner();
      this.running = true;
      if (this.game === "memory") this.startMemory();
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
    if (this.game !== "memory") {
      this.canvas.focus({preventScroll: true});
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(this.loop);
    } else {
      this.setMemoryDisabled(false);
      $("memoryBoard").querySelector("button:not(:disabled)")?.focus({preventScroll: true});
    }
  }
  move(direction) {
    if (!this.running || this.paused || !this.active) return;
    if (this.game === "runner") this.state.lane = Math.max(0, Math.min(2, this.state.lane + direction));
    if (this.game === "breaker") this.state.paddle = Math.max(43, Math.min(317, this.state.paddle + direction * 25));
  }
  pause() {
    this.keys.clear();
    this.hold = 0;
    if (!this.running || this.paused) return;
    cancelAnimationFrame(this.frame);
    this.paused = true;
    this.resolveMismatch();
    if (this.game === "memory") this.setMemoryDisabled(true);
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
    else stepBreaker(this.state, dt, this.hold || Number(this.keys.has("ArrowRight")) - Number(this.keys.has("ArrowLeft")));
    this.draw();
    this.hud();
    if (this.game === "runner" && this.state.score >= 600) this.onUnlock("runner");
    if (this.state.over) {
      const score = Math.floor(this.state.score);
      this.onRecord(this.game, score);
      if (this.game === "breaker" && this.state.won) this.onUnlock("breaker");
      this.finish(this.state.won ? "FRONTIÈRE ABOLIE." : "COLIS INTERCEPTÉ.", "Score : " + score + (this.state.won ? ". Les 35 briques ont disparu." : ". Le bureau vous attend au prochain passage."));
      return;
    }
    this.frame = requestAnimationFrame(this.loop);
  }
  finish(title, copy) {
    this.running = this.paused = false;
    this.keys.clear();
    this.hold = 0;
    cancelAnimationFrame(this.frame);
    $("gameStatus").textContent = this.game === "memory" || this.state.won ? "TERMINÉ" : "INTERCEPTÉ";
    $("pauseBtn").disabled = true;
    this.overlay("DOSSIER SANS SUITE", title, copy, "REJOUER");
    $("playBtn").focus({preventScroll: true});
    this.onSound(220);
  }
  hud() {
    const score = this.game === "memory" ? this.moves : Math.floor(this.state.score);
    const scoreLabel = this.game === "memory" ? String(score).padStart(2, "0") + " COUPS" : String(score).padStart(5, "0");
    if ($("gameScore").textContent !== scoreLabel) $("gameScore").textContent = scoreLabel;
    const lives = this.game === "memory" ? this.pairs + "/8 PAIRES" : Array.from({length: this.state.lives}, () => "●").join(" ");
    if ($("gameLives").textContent !== lives) {
      $("gameLives").textContent = lives;
      $("gameLives").setAttribute("aria-label", this.game === "memory" ? this.pairs + " paires sur 8" : this.state.lives + " vies");
    }
    if (this.game === "breaker") {
      const help = this.state.waiting && this.running ? "Balle perdue · Touchez le terrain ou espace pour relancer" : GAME_INFO.breaker.help;
      if ($("gameHelp").textContent !== help) $("gameHelp").textContent = help;
    }
  }
  startMemory() {
    clearTimeout(this.mismatchTimer);
    this.flipped = [];
    this.moves = this.pairs = 0;
    this.deck = shuffled(["IA", "FLD", "404", "QR", "€€", "0%", "Ø", "88"].flatMap(symbol => [symbol, symbol]))
      .map(symbol => ({symbol, matched: false, revealed: false}));
    const board = $("memoryBoard");
    board.replaceChildren();
    this.deck.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "memory-card";
      button.type = "button";
      button.setAttribute("aria-label", "Carte " + (index + 1) + ", face cachée");
      const face = document.createElement("span");
      face.className = "card-face";
      face.textContent = card.symbol;
      button.append(face);
      button.addEventListener("click", () => this.flip(index));
      board.append(button);
    });
  }
  flip(index) {
    const card = this.deck[index];
    if (!this.running || this.paused || card.matched || card.revealed || this.flipped.length === 2) return;
    card.revealed = true;
    this.renderCard(index);
    this.onSound(330 + index * 18);
    this.flipped.push(index);
    if (this.flipped.length !== 2) return;
    this.moves++;
    const [a, b] = this.flipped;
    if (this.deck[a].symbol === this.deck[b].symbol) {
      this.deck[a].matched = this.deck[b].matched = true;
      this.renderCard(a);
      this.renderCard(b);
      this.flipped = [];
      this.pairs++;
      if (this.pairs === 8) {
        this.onRecord("memory", this.moves);
        this.onUnlock("memory");
        this.hud();
        this.finish("SAISIE\nLEVÉE.", "Huit paires récupérées en " + this.moves + " coups. La mémoire n’a pas de frontière.");
      }
    } else this.mismatchTimer = setTimeout(() => this.resolveMismatch(), 750);
    this.hud();
  }
  renderCard(index) {
    const card = this.deck[index], button = $("memoryBoard").children[index];
    if (!button) return;
    button.classList.toggle("revealed", card.revealed);
    button.classList.toggle("matched", card.matched);
    button.disabled = card.matched || this.paused;
    button.setAttribute("aria-label", "Carte " + (index + 1) + (card.revealed ? " : " + card.symbol + (card.matched ? ", paire trouvée" : "") : ", face cachée"));
  }
  resolveMismatch() {
    clearTimeout(this.mismatchTimer);
    if (this.flipped?.length === 2) {
      this.flipped.forEach(index => { this.deck[index].revealed = false; this.renderCard(index); });
      this.flipped = [];
    }
  }
  setMemoryDisabled(paused) {
    this.deck.forEach((card, index) => {
      const button = $("memoryBoard").children[index];
      if (button) button.disabled = paused || card.matched;
    });
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
