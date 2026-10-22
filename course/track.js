// Distances in metres; shared by simulation and rendering.
export const LENGTH = 5200;
export const HALF_WIDTH = 8;
export const SECTORS = ['01 / ZONE INDUSTRIELLE', '02 / TUNNEL & ÉCHANGEUR', '03 / POSTE FRONTIÈRE'];
const STEP = 4;
const points = [];
function heading(s) {
  return .52 * Math.sin(s / 340) + .23 * Math.sin(s / 145) - .15 * Math.sin(s / 670);
}
let x = 0, z = 0;
for (let s = 0; s <= LENGTH + 400; s += STEP) {
  const a = heading(s);
  if (s) { const mid = heading(s - STEP / 2); x += Math.sin(mid) * STEP; z += Math.cos(mid) * STEP; }
  points.push({s, x, y: 3.5 * Math.sin(s / 260) + 2 * Math.sin(s / 580), z, angle: a});
}
export function sample(s, lateral = 0) {
  const q = Math.max(0, Math.min(points.length - 1.001, s / STEP));
  const i = Math.floor(q), t = q - i, a = points[i], b = points[i + 1];
  const angle = a.angle + (b.angle - a.angle) * t;
  return {x: a.x + (b.x - a.x) * t + Math.cos(angle) * lateral,
    y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t - Math.sin(angle) * lateral, angle};
}
export const curvature = s => (heading(s + 2) - heading(s - 2)) / 4;
export const sectorAt = s => Math.min(2, Math.floor(s / (LENGTH / 3)));
export const BLOCKADES = [
  {s: 620, xs: [-5, 0]}, {s: 1320, xs: [0, 5]},
  {s: 2130, xs: [-5, 0]}, {s: 2960, xs: [-5, 5]},
  {s: 4020, xs: [0, 5]}, {s: 4930, xs: [-5, 0]}
];
