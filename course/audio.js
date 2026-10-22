export function createAudio() {
  let context, master, engine, engineGain, siren, sirenGain, boost, boostGain, active = false, lastHit = 0;
  function initialize() {
    context = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    master = context.createGain(); master.gain.value = .18; master.connect(context.destination);
    const oscillator = (type, volume) => {
      const o = context.createOscillator(), g = context.createGain(); o.type = type; g.gain.value = volume; o.connect(g); g.connect(master); o.start(); return [o, g];
    };
    [engine, engineGain] = oscillator('sawtooth', 0);
    [siren, sirenGain] = oscillator('sine', 0);
    [boost, boostGain] = oscillator('triangle', 0);
  }
  return {
    get enabled() { return active; },
    async toggle() { try { if (!context) initialize(); active = !active; if (active) await context.resume(); else await context.suspend(); } catch { active = false; } return active; },
    suspend() { if (context?.state === 'running') context.suspend().catch(() => {}); },
    resume() { if (active && context) context.resume().catch(() => {}); },
    update(r) {
      if (!active || !context || context.state !== 'running') return;
      const on = r.state === 'RACE', t = context.currentTime;
      engine.frequency.setTargetAtTime(38 + r.speed * 2.5, t, .08); engineGain.gain.setTargetAtTime(on ? .1 : 0, t, .05);
      siren.frequency.setTargetAtTime(600 + Math.sin(r.time * 5) * 240, t, .04); sirenGain.gain.setTargetAtTime(on ? r.pressure * .0007 : 0, t, .1);
      boost.frequency.setTargetAtTime(260 + Math.sin(r.time * 30) * 70, t, .05); boostGain.gain.setTargetAtTime(on && r.boosting ? .09 : 0, t, .04);
      if (on && r.impact > .9 && t - lastHit > .6) {
        lastHit = t; const o = context.createOscillator(), g = context.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(30, t + .15); g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g); g.connect(master); o.start(); o.stop(t + .2); o.onended = () => { o.disconnect(); g.disconnect(); };
      }
    }
  };
}
