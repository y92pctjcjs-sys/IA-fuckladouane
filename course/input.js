export function createInput(root, togglePause) {
  const keys = new Set(), pointers = new Map();
  const codes = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyA', 'KeyD', 'KeyS', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyP', 'Escape']);
  function clear() { keys.clear(); pointers.clear(); root.querySelectorAll('[data-control]').forEach(b => b.classList.remove('held')); }
  addEventListener('keydown', e => {
    if (!codes.has(e.code) || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    e.preventDefault();
    if (e.code === 'KeyP' || e.code === 'Escape') { if (!e.repeat) togglePause(); return; }
    keys.add(e.code);
  });
  addEventListener('keyup', e => { keys.delete(e.code); });
  addEventListener('blur', clear);
  root.querySelectorAll('[data-control]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); pointers.set(e.pointerId, button.dataset.control); button.classList.add('held'); });
    const release = e => { pointers.delete(e.pointerId); if (![...pointers.values()].includes(button.dataset.control)) button.classList.remove('held'); };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
  });
  return { clear, read() {
    const values = new Set(pointers.values());
    const left = keys.has('ArrowLeft') || keys.has('KeyA') || values.has('left');
    const right = keys.has('ArrowRight') || keys.has('KeyD') || values.has('right');
    return {steer: Number(right) - Number(left), brake: keys.has('ArrowDown') || keys.has('KeyS') || values.has('brake'),
      drift: keys.has('Space') || values.has('drift'), nitro: keys.has('ShiftLeft') || keys.has('ShiftRight') || values.has('nitro')};
  }};
}
