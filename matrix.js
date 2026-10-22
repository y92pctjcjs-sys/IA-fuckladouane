// Time-based, capped at 30 fps. A static frame remains when movement is disabled.
export class MatrixRain {
  constructor(canvas, moving = true) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {alpha: true});
    this.moving = moving;
    this.dense = false;
    this.frame = 0;
    this.last = 0;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.resize();
    window.addEventListener("resize", this.resize, {passive: true});
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(this.frame);
      this.last = 0;
      if (!document.hidden && this.moving) this.frame = requestAnimationFrame(this.loop);
    });
    if (moving && this.ctx) this.frame = requestAnimationFrame(this.loop);
  }
  resize() {
    if (!this.ctx) return;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.columns = Array.from({length: Math.ceil(this.w / 19)}, (_, i) => ({
      x: i * 19, y: Math.random() * (this.h + 250), speed: 34 + Math.random() * 60,
      length: 9 + Math.floor(Math.random() * 18), seed: Math.floor(Math.random() * 1000)
    }));
    this.draw(0);
  }
  setMoving(value) {
    this.moving = value;
    cancelAnimationFrame(this.frame);
    this.last = 0;
    if (value && !document.hidden && this.ctx) this.frame = requestAnimationFrame(this.loop);
    else this.draw(0);
  }
  loop(now) {
    if (!this.moving || document.hidden || !this.ctx) return;
    if (!this.last || now - this.last >= 32) {
      const dt = this.last ? Math.min(.1, (now - this.last) / 1000) : 0;
      this.last = now;
      this.draw(dt);
    }
    this.frame = requestAnimationFrame(this.loop);
  }
  draw(dt) {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    this.columns.forEach(col => {
      col.y += col.speed * dt * (this.dense ? 1.6 : 1);
      if (col.y - col.length * 19 > this.h) col.y = -19;
      for (let j = 0; j < col.length; j++) {
        const y = col.y - j * 19;
        if (y < -19 || y > this.h + 19) continue;
        const digit = Math.abs(Math.floor(col.seed + j * 7 + Math.floor(col.y / 60))) % 10;
        ctx.fillStyle = j === 0 ? "rgba(237,217,255,.96)" : "rgba(158,85,255," + ((1 - j / col.length) * .62).toFixed(2) + ")";
        ctx.fillText(digit, col.x + 9, y);
      }
    });
  }
}
