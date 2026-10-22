import * as T from './vendor/three.module.min.js';
import {sample, LENGTH, BLOCKADES, sectorAt} from './track.js';
const box = new T.BoxGeometry(1, 1, 1);
const wheelGeometry = new T.CylinderGeometry(.36, .36, .28, 10);
const mats = new Map();
function material(color, glow = false) {
  const key = color + ':' + glow;
  if (!mats.has(key)) mats.set(key, glow ? new T.MeshBasicMaterial({color}) : new T.MeshLambertMaterial({color}));
  return mats.get(key);
}
function cube(parent, x, y, z, w, h, d, color, glow = false) {
  const mesh = new T.Mesh(box, material(color, glow));
  mesh.position.set(x, y, z); mesh.scale.set(w, h, d); parent.add(mesh); return mesh;
}
const labelCache = new Map();
function label(text, color = '#d4ff4f', bg = '#151121') {
  const key = text + color + bg;
  if (!labelCache.has(key)) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const c = canvas.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 512, 128);
    c.strokeStyle = color; c.lineWidth = 5; c.strokeRect(3, 3, 506, 122);
    c.fillStyle = color; c.font = '900 50px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 256, 66, 480);
    const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace;
    labelCache.set(key, new T.MeshBasicMaterial({map: tex, side: T.DoubleSide}));
  }
  return labelCache.get(key);
}
function plate(parent, text, x, y, z, w, h, color, bg) {
  const m = new T.Mesh(new T.PlaneGeometry(w, h), label(text, color, bg));
  m.position.set(x, y, z); parent.add(m); return m;
}
// Bake repeated static meshes into shared instanced draws; moving lights stay separate.
function batch(root, exclude = new Set()) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), buckets = new Map();
  root.traverse(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || exclude.has(mesh)) return;
    const key = mesh.geometry.uuid + mesh.material.uuid;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(mesh);
  });
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const instanced = new T.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    meshes.forEach((mesh, i) => { instanced.setMatrixAt(i, inverse.clone().multiply(mesh.matrixWorld)); mesh.removeFromParent(); });
    instanced.instanceMatrix.needsUpdate = true;
    root.add(instanced);
  }
}
function car(kind = 'fld') {
  const g = new T.Group(), police = kind === 'cop', traffic = kind === 'traffic';
  const paint = police ? '#d8dce9' : traffic ? '#42516b' : '#20182f';
  cube(g, 0, .65, 0, 1.85, .62, 4, paint);
  cube(g, 0, .95, -.15, 1.72, .45, 2.8, paint);
  cube(g, 0, 1.28, -.25, 1.48, .53, 1.8, '#121d32');
  cube(g, 0, 1.58, -.4, 1.5, .12, 1.45, paint);
  cube(g, 0, 1, 1.3, .24, .04, 1.28, police ? '#234291' : '#b288fa', true);
  cube(g, 0, .53, 1.98, 1.7, .21, .12, '#12111a');
  cube(g, 0, .53, -1.99, 1.7, .21, .12, '#100b16');
  for (const side of [-1, 1]) {
    cube(g, side * .64, .85, 2.03, .5, .14, .07, '#e8f4da', true);
    cube(g, side * .61, .83, -2.03, .56, .12, .07, '#ff335e', true);
    cube(g, side * .94, .4, 0, .06, .09, 3, police ? '#204bc3' : '#bbff3e', true);
    for (const z of [-1.23, 1.2]) {
      const w = new T.Mesh(wheelGeometry, material('#0a0b10')); w.rotation.z = Math.PI / 2;
      w.position.set(side * .98, .39, z); g.add(w);
      cube(g, side * 1.13, .4, z, .025, .24, .24, '#7e7d90');
    }
  }
  if (!traffic) {
    cube(g, 0, 1.17, -1.72, 2, .1, .35, police ? '#243d7d' : '#ab73e8');
    const name = plate(g, police ? 'DOUANE' : 'fld®', 0, 1, -2.065, 1.36, .34, police ? '#ffffff' : '#d4ff4f'); name.rotation.y = Math.PI;
    const hood = plate(g, police ? 'DOUANE' : 'fld®', 0, 1.2, 1.22, 1.22, .55, police ? '#234291' : '#bd94ff', paint); hood.rotation.x = -Math.PI / 2;
  }
  if (police) {
    cube(g, 0, 1.71, -.4, 1.2, .12, .3, '#171828');
    g.userData.blue = cube(g, -.35, 1.83, -.4, .45, .17, .28, '#3189ff', true);
    g.userData.red = cube(g, .35, 1.83, -.4, .45, .17, .28, '#ff285e', true);
  }
  g.userData.flame = cube(g, 0, .45, -2.4, .7, .2, .9, '#b8b0ff', true);
  g.userData.flame.visible = false;
  batch(g, new Set([g.userData.flame, g.userData.blue, g.userData.red]));
  return g;
}
function positionOn(object, s, lateral = 0, height = 0, yaw = 0) {
  const p = sample(s, lateral); object.position.set(p.x, p.y + height, p.z); object.rotation.y = p.angle + yaw;
}
function ribbon(start, end, l, r, height, color) {
  const vertices = [], indices = [];
  let i = 0;
  for (let s = start; s <= end + .01; s += 4) {
    const a = sample(s, l), b = sample(s, r);
    vertices.push(a.x, a.y + height, a.z, b.x, b.y + height, b.z);
    if (i) indices.push(i - 2, i, i - 1, i - 1, i, i + 1);
    i += 2;
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  const m = new T.Mesh(geo, material(color)); m.material.side = T.DoubleSide; return m;
}
function person(parent, x, z, jacket) {
  const g = new T.Group(); parent.add(g); g.position.set(x, 0, z);
  cube(g, -.15, .48, 0, .21, .95, .25, '#252433'); cube(g, .15, .48, 0, .21, .95, .25, '#252433');
  cube(g, 0, 1.22, 0, .62, .65, .35, jacket);
  const head = new T.Mesh(new T.IcosahedronGeometry(.22, 0), material('#d6a68a')); head.position.y = 1.8; g.add(head);
  cube(g, 0, 1.98, -.03, .38, .12, .36, '#26212d');
  cube(g, -.4, 1.2, 0, .18, .65, .23, jacket); cube(g, .4, 1.2, 0, .18, .65, .23, jacket);
  return g;
}
export function createRenderer(canvas, reduced = false, makeRenderer = options => new T.WebGLRenderer(options)) {
  const renderer = makeRenderer({canvas, antialias: false, powerPreference: 'default'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(); scene.background = new T.Color('#0b0a1c'); scene.fog = new T.FogExp2('#17112b', .0034);
  const camera = new T.PerspectiveCamera(62, 1, .3, 650);
  scene.add(new T.HemisphereLight('#c2b5f4', '#222030', 2.1));
  const moonLight = new T.DirectionalLight('#bbb3ff', 1.7); moonLight.position.set(-80, 120, 20); scene.add(moonLight);
  const moon = new T.Mesh(new T.SphereGeometry(21, 16, 12), material('#d6cdeb', true)); moon.position.set(-190, 180, 500); scene.add(moon);
  const chunks = [];
  for (let s = 0; s < LENGTH + 240; s += 80) {
    const g = new T.Group(); scene.add(g); chunks.push({s, g});
    g.add(ribbon(s, s + 80, -45, 45, -.22, '#171624'));
    g.add(ribbon(s, s + 80, -8.1, 8.1, 0, '#343440'));
    g.add(ribbon(s, s + 80, -7.9, -7.65, .035, '#c7b5d1'));
    g.add(ribbon(s, s + 80, 7.65, 7.9, .035, '#c7b5d1'));
    for (let d = s; d < s + 80; d += 12) {
      for (const lateral of [-2.65, 2.65]) { const mark = new T.Group(); g.add(mark); positionOn(mark, d, lateral, .045); cube(mark, 0, 0, 0, .14, .025, 4, '#a8a7ad'); }
    }
    for (const side of [-1, 1]) {
      if (side === 1 && s >= LENGTH) continue; // Open station access beyond the border.
      const rail = new T.Group(); g.add(rail); positionOn(rail, s + 40, side * 9.6);
      cube(rail, 0, .55, 0, .2, .45, 77, '#71687e');
      for (let d = 0; d < 80; d += 20) {
        const p = new T.Group(); g.add(p); positionOn(p, s + d, side * 9.3);
        cube(p, 0, .75, 0, .15, 1.5, .2, '#393346'); cube(p, 0, 1.35, 0, .16, .19, .3, side < 0 ? '#b88fff' : '#d0f46b', true);
      }
    }
    const tunnel = s >= 1760 && s < 2800;
    if (tunnel) {
      const arch = new T.Group(); g.add(arch); positionOn(arch, s + 40);
      cube(arch, -10.2, 4, 0, 1, 8, 80, '#242035'); cube(arch, 10.2, 4, 0, 1, 8, 80, '#242035');
      cube(arch, 0, 8.2, 0, 21, .7, 80, '#252035');
      for (const dz of [-30, -10, 10, 30]) {
        cube(arch, 0, 7.7, dz, 19.7, .08, .16, '#b97cff', true);
        cube(arch, -9.6, 2.2, dz, .08, .16, 11, '#b97cff', true); cube(arch, 9.6, 2.2, dz, .08, .16, 11, '#b97cff', true);
      }
    } else {
      for (const side of [-1, 1]) {
        const p = new T.Group(); g.add(p); positionOn(p, s + 35, side * 13);
        cube(p, 0, 5.5, 0, .23, 11, .23, '#666076'); cube(p, -side * 1.7, 11, 0, 3.5, .2, .35, '#827a91');
        cube(p, -side * 3, 10.8, 0, 1.4, .08, .6, '#f0e9b9', true);
        if (s < 1760) {
          const h = 5 + ((s / 80 + (side + 1) * 3) % 5) * 2;
          cube(p, side * 17, h / 2, 8, 22, h, 30, side < 0 ? '#353145' : '#2b3448');
          cube(p, side * 17, h + .3, 8, 23, .5, 31, '#5a4d68');
          for (let k = 0; k < 4; k++) cube(p, side * 17 + (k - 1.5) * 4, 3.8, -7.05, 2, 1, .05, '#b99e58', true);
          for (let k = 0; k < 2; k++) cube(p, side * 7, 1.6 + k * 3.1, -10, 6, 3, 12, k ? '#5a365d' : '#354757');
        } else {
          for (let k = 0; k < 3; k++) {
            const tree = new T.Mesh(new T.ConeGeometry(3 + k, 10 + k * 2, 5), material('#202b35'));
            tree.position.set(side * (12 + k * 8), 4, k * 16 - 15); p.add(tree);
          }
        }
      }
    }
  }
  for (const chunk of chunks) batch(chunk.g);
  const signs = [[200, 'SWAGISTAN ↗'], [1020, 'RIEN À DÉCLARER.'], [1640, 'CONTRÔLE DU SWAG'], [3200, 'LES FRAIS SERONT ÉMOTIONNELS'], [4670, 'AUCUNE SORTIE RÉGLEMENTAIRE']];
  for (const [s, text] of signs) {
    const g = new T.Group(); scene.add(g); positionOn(g, s);
    cube(g, -9.1, 4.3, 0, .3, 8.6, .3, '#676072'); cube(g, 9.1, 4.3, 0, .3, 8.6, .3, '#676072');
    const sign = plate(g, text, 0, 7.4, 0, 17, 2.3); sign.rotation.y = Math.PI;
  }
  const barriers = [];
  for (const row of BLOCKADES) {
    for (const x of row.xs) {
      const g = new T.Group(); scene.add(g); positionOn(g, row.s, x);
      cube(g, 0, .55, 0, 3.3, 1.1, 1, '#b7b3bd');
      for (const dx of [-1.2, 0, 1.2]) { const stripe = cube(g, dx, .7, -.53, .42, .8, .04, '#bc6eff', true); stripe.rotation.z = -.3; }
      cube(g, 0, 1.25, 0, .35, .35, .3, '#ffb84f', true); barriers.push(g);
    }
    const warning = new T.Group(); scene.add(warning); positionOn(warning, row.s - 95, -10.8);
    const p = plate(warning, 'BARRAGE / 100 M', 0, 2.8, 0, 5, 1.3, '#ffbf76'); p.rotation.y = Math.PI;
    cube(warning, 0, 1.3, 0, .16, 2.6, .16, '#777080');
  }
  const finishGate = new T.Group(); scene.add(finishGate); positionOn(finishGate, LENGTH);
  cube(finishGate, -11, 4, 0, 4, 8, 8, '#524159'); cube(finishGate, 11, 4, 0, 4, 8, 8, '#524159');
  cube(finishGate, 0, 7.5, 0, 22, 1.6, 1.5, '#291e3e');
  const banner = plate(finishGate, 'SWAGISTAN / VOUS ÊTES PASSÉ', 0, 7.5, -.8, 19, 1.3); banner.rotation.y = Math.PI;
  const station = new T.Group(); scene.add(station); positionOn(station, LENGTH + 65, 20);
  cube(station, 0, -.05, 0, 38, .2, 45, '#3c3942');
  cube(station, 8, 2, 5, 9, 4, 8, '#62606b'); cube(station, 8, 2, .9, 7, 2, .04, '#f2d8a5', true);
  for (const x of [-7, 5]) cube(station, x, 2.7, -5, .35, 5.4, .35, '#85808b');
  cube(station, -1, 5.5, -5, 19, .6, 10, '#c2b2c9'); cube(station, -1, 5.15, -9.9, 18, .16, .1, '#cfaaff', true);
  for (const x of [-5, 2]) { cube(station, x, 1.1, -5, .9, 2.2, .7, '#b6aab8'); cube(station, x, 1.6, -5.4, .6, .5, .05, '#223d32'); }
  const stationSign = plate(station, 'DERNIÈRE STATION / fld®', 0, 5.6, -10.1, 17, 1); stationSign.rotation.y = Math.PI;
  const waitingCar = car(); waitingCar.position.set(-3, .1, -1); waitingCar.rotation.y = Math.PI * .68; station.add(waitingCar);
  const stranger = person(station, -2, -1, '#b7a0d7'); stranger.rotation.y = -Math.PI / 2;
  const playerPerson = person(station, -8, -1, '#22202d'); playerPerson.rotation.y = Math.PI / 2; playerPerson.visible = false;
  const warm = new T.PointLight('#f4ca94', 22, 30, 2); warm.position.set(-2, 4.5, -6); station.add(warm);
  const player = car(); scene.add(player);
  const cops = Array.from({length: 3}, () => { const c = car('cop'); scene.add(c); return c; });
  const traffic = Array.from({length: 9}, () => { const c = car('traffic'); scene.add(c); return c; });
  const skid = [];
  for (let i = 0; i < 30; i++) { const m = new T.Mesh(box, material('#74637a')); m.scale.set(.1, .025, 2.5); scene.add(m); m.visible = false; skid.push(m); }
  let skidCursor = 0, lastSkid = 0, initialized = false;
  const aim = new T.Vector3(), desired = new T.Vector3();
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  return {
    render(r, elapsed = 1 / 60) {
      const love = r.result?.ending === 'love' && ['ARRIVAL', 'RESULTS', 'PAUSE'].includes(r.state);
      const ending = r.result && r.state !== 'RACE';
      let s = r.s, lateral = r.x, yaw = r.yaw;
      if (ending && r.result.won) {
        const t = Math.min(1, r.cinematic / (love ? 5 : 4.5)); s = LENGTH + t * (love ? 65 : 110); lateral = r.x * (1 - t) + (love ? 11 : 0) * t; yaw *= 1 - t;
      }
      positionOn(player, s, lateral, .08, yaw);
      player.userData.flame.visible = r.boosting && r.state === 'RACE';
      player.userData.flame.scale.z = .8 + Math.sin(r.time * 40) * .25;
      for (let i = 0; i < cops.length; i++) {
        const c = r.cops[i], m = cops[i]; m.visible = c.active && Math.abs(c.s - r.s) < 260 && !ending;
        positionOn(m, Math.max(0, c.s), c.x);
        m.userData.blue.visible = Math.sin(r.time * 15 + i) > 0; m.userData.red.visible = !m.userData.blue.visible;
      }
      for (let i = 0; i < traffic.length; i++) { const t = r.traffic[i]; traffic[i].visible = t.s > r.s - 70 && t.s < r.s + 300 && !ending; positionOn(traffic[i], t.s, t.x); }
      for (const {s: start, g} of chunks) g.visible = start > s - 200 && start < s + 430;
      barriers.forEach(g => { g.visible = g.position.distanceTo(player.position) < 330 && !ending; });
      if (r.drifting && r.state === 'RACE' && !reduced && r.time - lastSkid > .055) {
        lastSkid = r.time;
        for (const side of [-.76, .76]) { const m = skid[skidCursor++ % skid.length]; positionOn(m, r.s - 1, r.x + side, .055, r.yaw); m.visible = true; }
      }
      if (r.state === 'MENU' || r.state === 'COUNTDOWN') { skid.forEach(m => m.visible = false); }
      const behind = sample(Math.max(0, s - 13 - (r.boosting ? 2 : 0)), lateral * .68);
      desired.set(behind.x, behind.y + 6.1, behind.z);
      const ahead = sample(s + 24, lateral * .7); aim.set(ahead.x, ahead.y + 1.1, ahead.z);
      // At the starting line the mathematical road starts at zero: extend behind it.
      if (s < 15) { const start = sample(0); desired.set(player.position.x - Math.sin(start.angle) * 13, player.position.y + 6, player.position.z - Math.cos(start.angle) * 13); }
      if (love && r.cinematic > 5) {
        const p = sample(LENGTH + 65, 20); const t = Math.min(1, (r.cinematic - 5) / 4);
        stranger.position.set(-2 - t * 4, 0, -1 - t * .8);
        playerPerson.visible = true; playerPerson.position.set(-8 + t, 0, -1 - t * .8);
        desired.set(p.x - 14, p.y + 5, p.z - 16); aim.set(p.x - 5, p.y + 1.3, p.z - 5);
      } else playerPerson.visible = false;
      if (!initialized) { camera.position.copy(desired); initialized = true; }
      camera.position.lerp(desired, 1 - Math.exp(-Math.min(elapsed, .1) * 5));
      if (!reduced && r.state === 'RACE') camera.position.x += Math.sin(r.time * 70) * r.impact * .12;
      camera.lookAt(aim);
      const fov = 62 + (r.boosting && !reduced ? 5 : 0); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      scene.fog.color.set(love && r.cinematic > 5 ? '#30233a' : sectorAt(r.s) === 1 ? '#20162e' : '#17112b');
      renderer.render(scene, camera);
    },
    dispose() { removeEventListener('resize', resize); renderer.dispose(); },
    info: renderer.info
  };
}
