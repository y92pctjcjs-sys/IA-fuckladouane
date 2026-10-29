import * as T from './vendor/three.module.min.js';
import {sample, LENGTH, BLOCKADES, STAGES, stageAt, sectorAt} from './track.js?v=oculaire-003';
import {createVehicle,animateVehicle} from './models.js?v=oculaire-003';
import {asphaltMaterial,industrialMaterial,facadeMaterial,surface,environmentTexture,softTexture} from './materials.js?v=oculaire-003';
import {createDrivingEffects} from './effects.js?v=oculaire-003';
import {industrialDetail,tunnelDetail,lightPool,borderDetail,openDetail,controlDetail} from './scenery.js?v=oculaire-003';
import {createDigitalSky} from './sky.js?v=oculaire-003';
import {createQuality} from './quality.js?v=oculaire-003';
import {addRoadPosters} from './posters.js?v=oculaire-003';
import {patrolSkin} from './vehicle-skins.js?v=oculaire-003';
import {setVehicleDetail} from './vehicle-detail.js?v=oculaire-003';
import {resetRoadPrototype} from './road-vehicles.js?v=oculaire-003';
import {industrialPrototype} from './design-scenery.js?v=oculaire-003';
import {createOculaire} from './oculaire.js?v=oculaire-003';
const box = new T.BoxGeometry(1, 1, 1);
const planeGeometry=new T.PlaneGeometry(1,1),treeGeometry=new T.ConeGeometry(1,1,5);
const mats = new Map();
function material(color, glow = false) {
  const key = color + ':' + glow;
  if (!mats.has(key)) mats.set(key, glow ? new T.MeshBasicMaterial({color,toneMapped:false}) : new T.MeshLambertMaterial({color}));
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
  const m = new T.Mesh(planeGeometry, label(text, color, bg));
  m.scale.set(w,h,1);m.position.set(x, y, z); parent.add(m); return m;
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
function car(kind='fld',variant=0,skin='') {
  const vehicle=createVehicle(kind,variant,skin);
  if(vehicle.userData.staticBatched)return vehicle;
  const exclude=new Set([vehicle.userData.flame,vehicle.userData.blue,vehicle.userData.red]);
  for(const signal of [vehicle.userData.blue,vehicle.userData.red]){if(signal?.isGroup)batch(signal);signal?.traverse(n=>exclude.add(n));}
  for(const wheel of vehicle.userData.wheels)wheel.steering.traverse(n=>exclude.add(n));
  batch(vehicle,exclude);return vehicle;
}
function positionOn(object, s, lateral = 0, height = 0, yaw = 0) {
  const p = sample(s, lateral); object.position.set(p.x, p.y + height, p.z); object.rotation.y = p.angle + yaw; object.rotation.x=-Math.atan((sample(s+2).y-sample(Math.max(0,s-2)).y)/4);
}
function ribbon(start, end, l, r, height, color) {
  const vertices = [], indices = [], uvs = [];
  let i = 0;
  for (let s = start; s <= end + .01; s += 4) {
    const a = sample(s, l), b = sample(s, r);
    vertices.push(a.x, a.y + height, a.z, b.x, b.y + height, b.z);
    uvs.push(0,s/11,(r-l)/6,s/11);
    if (i) indices.push(i - 2, i, i - 1, i - 1, i, i + 1);
    i += 2;
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices); geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2)); geo.computeVertexNormals();
  geo.userData.chunkOwned=true;
  const m = new T.Mesh(geo, typeof color==='string'?material(color):color); m.material.side = T.DoubleSide; return m;
}
function wallRibbon(start,end,lateral,bottom,top,mat){
 const vertices=[],indices=[],uvs=[];let i=0;
 for(let s=start;s<=end;s+=4){const p=sample(s,lateral);vertices.push(p.x,p.y+bottom,p.z,p.x,p.y+top,p.z);uvs.push(s/8,0,s/8,(top-bottom)/8);if(i)indices.push(i-2,i,i-1,i-1,i,i+1);i+=2;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();geo.userData.chunkOwned=true;mat.side=T.DoubleSide;return new T.Mesh(geo,mat);
}
function person(parent,x,z,jacket) {
  const g=new T.Group();parent.add(g);g.position.set(x,0,z);
  const sleeve=new T.CapsuleGeometry(.12,.4,2,7),leg=new T.CapsuleGeometry(.115,.6,2,7);
  for(const side of[-1,1]){
    const l=new T.Mesh(leg,surface('#252433',.9));l.position.set(side*.14,.52,0);g.add(l);
    cube(g,side*.14,.09,.05,.23,.16,.4,'#161721');
    const arm=new T.Mesh(sleeve,surface(jacket,.95));arm.position.set(side*.37,1.21,0);arm.rotation.z=side*.08;g.add(arm);
    const hand=new T.Mesh(new T.SphereGeometry(.078,8,6),surface('#c69982',.96));hand.position.set(side*.40,.87,.01);g.add(hand);
  }
  const torso=new T.Mesh(new T.CylinderGeometry(.28,.31,.65,8),surface(jacket,.93));torso.position.y=1.23;torso.scale.z=.68;g.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(.20,12,8),surface('#d1a389',.96));head.position.y=1.78;head.scale.z=.91;g.add(head);
  const hair=new T.Mesh(new T.SphereGeometry(.205,12,6,0,Math.PI*2,0,Math.PI*.48),surface('#29222c',.95));hair.position.y=1.8;g.add(hair);
  for(const side of[-1,1])cube(g,side*.065,1.80,.177,.027,.023,.015,'#332b33');
  return g;
}
export function createRenderer(canvas, reduced = false, makeRenderer = options => new T.WebGLRenderer(options), qualityMode='auto', appearance={fld:'nightrunner',cop:'mixed'}, assets={}) {
  const quality=createQuality(qualityMode);
  const renderer = makeRenderer({canvas, antialias: false, powerPreference: 'default'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1,quality.ratio)); renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene = new T.Scene(); scene.background = new T.Color('#0b0a1c'); scene.fog = new T.FogExp2('#17162b', .004); scene.environment=environmentTexture();
  const camera = new T.PerspectiveCamera(62, 1, .3, 4200);
  const sky=createDigitalSky(scene,reduced);
  scene.add(new T.HemisphereLight('#b7c0ed', '#252033', 2.5));
  const moonLight = new T.DirectionalLight('#bbb3ff', 1.7); moonLight.position.set(-80, 120, 20); scene.add(moonLight);
  const moon = new T.Mesh(new T.SphereGeometry(21, 16, 12), material('#d6cdeb', true)); moon.position.set(-190, 180, 500); scene.add(moon);
  const CHUNK_SIZE=80,CHUNK_COUNT=10;
  const chunks=Array.from({length:CHUNK_COUNT},()=>{const g=new T.Group();scene.add(g);return {s:-Infinity,g};});
  function releaseChunk(g){
    const geometries=new Set();g.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry?.userData.chunkOwned)geometries.add(o.geometry);});
    for(const geometry of geometries)geometry.dispose();g.clear();
  }
  function fillChunk(chunk,s){
    releaseChunk(chunk.g);chunk.s=s;const g=chunk.g;
    g.add(ribbon(s, s + 80, -45, 45, -.22, '#171624'));
    g.add(ribbon(s, s + 80, -8.1, 8.1, 0, asphaltMaterial()));
    g.add(ribbon(s, s + 80, -7.9, -7.65, .035, '#c7b5d1'));
    g.add(ribbon(s, s + 80, 7.65, 7.9, .035, '#c7b5d1'));
    for (let d = s; d < s + 80; d += 12) {
      for (const lateral of [-2.65, 2.65]) { const mark = new T.Group(); g.add(mark); positionOn(mark, d, lateral, .045); cube(mark, 0, 0, 0, .14, .025, 4, '#a8a7ad'); }
    }
    for (const side of [-1, 1]) {
      if (side === 1 && s >= LENGTH) continue; // Open station access beyond the border.
      const rail = new T.Group(); g.add(rail); positionOn(rail, s + 40, side * 9.6);
      for(let offset=5;offset<80;offset+=10){const strip=new T.Group();g.add(strip);positionOn(strip,s+offset,side*9.6);cube(strip,0,.55,0,.2,.45,10.15,'#71687e');}
      for (let d = 0; d < 80; d += 20) {
        const p = new T.Group(); g.add(p); positionOn(p, s + d, side * 9.3);
        cube(p, 0, .75, 0, .15, 1.5, .2, '#393346'); cube(p, 0, 1.35, 0, .16, .19, .3, side < 0 ? '#b88fff' : '#d0f46b', true);
      }
    }
    const stage=stageAt(Math.min(LENGTH-1,s+40));
    const tunnel=stage.kind==='tunnel';
    if (tunnel) {
      const arch = new T.Group(); g.add(arch); positionOn(arch, s + 40);
      tunnelDetail(arch,cube);
      g.add(wallRibbon(s,s+80,-10.1,.1,8.3,industrialMaterial('concrete')));
      g.add(wallRibbon(s,s+80,10.1,.1,8.3,industrialMaterial('concrete')));
      g.add(ribbon(s,s+80,-10.3,10.3,8.3,industrialMaterial('concrete')));
      for (const dz of [-30, -10, 10, 30]) {
        cube(arch, 0, 7.7, dz, 19.7, .08, .16, '#b97cff', true);
        cube(arch, -9.6, 2.2, dz, .08, .16, 11, '#b97cff', true); cube(arch, 9.6, 2.2, dz, .08, .16, 11, '#b97cff', true);
      }
    } else {
      openDetail(g,s,stage.kind,cube,positionOn);
      if(stage.kind==='control')controlDetail(g,s,cube,positionOn);
      for (const side of [-1, 1]) {
        const p = new T.Group(); g.add(p); positionOn(p, s + 35, side * 13);
        cube(p, 0, 5.5, 0, .23, 11, .23, '#666076'); cube(p, -side * 1.7, 11, 0, 3.5, .2, .35, '#827a91');
        cube(p, -side * 3, 10.8, 0, 1.4, .08, .6, '#f0e9b9', true);
        const pool=lightPool(p,side<0?'#af7aff':'#cfd5ac',12,22);pool.position.x=-side*8;
        if (stage.kind==='industrial') {
         if(s===0&&side===-1){industrialPrototype(p,side);}else{
          industrialDetail(p,s,side,cube);
          const h = 5 + ((s / 80 + (side + 1) * 3) % 5) * 2;
          cube(p, side * 17, h / 2, 8, 22, h, 30, side < 0 ? '#353145' : '#2b3448').material=industrialMaterial('steel');
          cube(p, side * 17, h + .3, 8, 23, .5, 31, '#5a4d68');
          for (let k = 0; k < 4; k++) cube(p, side * 17 + (k - 1.5) * 4, 3.8, -7.05, 2, 1, .05, '#b99e58', true);
          for (let k = 0; k < 2; k++) cube(p, side * 7, 1.6 + k * 3.1, -10, 6, 3, 12, k ? '#5a365d' : '#354757').material=industrialMaterial(k?'purple':'steel');
         }
        } else {
          for (let k = 0; k < 3; k++) {
            const tree = new T.Mesh(treeGeometry, material(stage.kind==='frontier'?'#34413d':'#202b35'));tree.scale.set(3+k,10+k*2,3+k);
            tree.position.set(side * (12 + k * 8), 4, k * 16 - 15); p.add(tree);
          }
        }
      }
    }
    const inscriptions={0:'SWAGISTAN NETWORK',8:'SAV / 6 H À 6 H 20',19:'BUREAU DES ORIGINES DOUTEUSES',36:'FROM ELSEWHERE',64:'OMERTA',77:'RIEN À DÉCLARER',108:'CONTRÔLE DU SWAG',142:'MADE IN SWAGISTAN'};
    const text=inscriptions[s/80];
    if(text){const sign=new T.Group();g.add(sign);positionOn(sign,s+30,stage.kind==='tunnel'?-9.55:-18,stage.kind==='tunnel'?3.5:5);const p=plate(sign,text,0,0,0,stage.kind==='tunnel'?5:12,1.4);p.rotation.y=Math.PI;}
    addRoadPosters(g,s,cube,positionOn);
    batch(g);
  }
  function stream(s){
    const first=Math.max(0,Math.floor((s-120)/CHUNK_SIZE)*CHUNK_SIZE);
    const wanted=Array.from({length:CHUNK_COUNT},(_,i)=>first+i*CHUNK_SIZE).filter(n=>n<LENGTH+320);
    for(const chunk of chunks)chunk.g.visible=wanted.includes(chunk.s);
    for(const start of wanted){
      if(chunks.some(chunk=>chunk.s===start))continue;
      const chunk=chunks.find(chunk=>!wanted.includes(chunk.s));
      fillChunk(chunk,start);chunk.g.visible=true;
    }
  }
  stream(0);
  const barriers = [];
  for (const row of BLOCKADES) {
    for (const x of row.xs) {
      const g = new T.Group(); scene.add(g); positionOn(g, row.s, x);
      cube(g, 0, .55, 0, 3.3, 1.1, 1, '#b7b3bd');
      for (const dx of [-1.2, 0, 1.2]) { const stripe = cube(g, dx, .7, -.53, .42, .8, .04, '#bc6eff', true); stripe.rotation.z = -.3; }
      cube(g, 0, 1.25, 0, .35, .35, .3, '#ffb84f', true); g.userData.s=row.s;barriers.push(g);
    }
    const warning = new T.Group(); scene.add(warning); positionOn(warning, row.s - 260, -10.8);
    const p = plate(warning, 'CONTRÔLE / OUVERTURE', 0, 2.8, 0, 5, 1.3, '#ffbf76'); p.rotation.y = Math.PI;
    cube(warning, 0, 1.3, 0, .16, 2.6, .16, '#777080');warning.userData.s=row.s-260;barriers.push(warning);
  }
  const overpass=new T.Group();scene.add(overpass);positionOn(overpass,8200);
  cube(overpass,0,6.6,0,74,.6,8,'#454451').material=industrialMaterial('concrete');
  cube(overpass,0,7,0,74,.12,7,'#252630');
  for(const side of[-1,1]){
    cube(overpass,side*16,3.1,0,1.2,6.2,5.5,'#545461').material=industrialMaterial('concrete');
    for(const z of[-3.8,3.8])cube(overpass,side*18,7.7,z,36,.65,.16,'#747285');
    cube(overpass,side*12,6.1,0,4,.05,6,'#b785ec',true);
  }
  batch(overpass);
  const finishGate = new T.Group(); scene.add(finishGate); positionOn(finishGate, LENGTH);
  cube(finishGate, -11, 4, 0, 4, 8, 8, '#524159'); cube(finishGate, 11, 4, 0, 4, 8, 8, '#524159');
  cube(finishGate, 0, 7.5, 0, 22, 1.6, 1.5, '#291e3e');
  borderDetail(finishGate,cube);batch(finishGate);
  const banner = plate(finishGate, 'SWAGISTAN / VOUS ÊTES PASSÉ', 0, 7.5, -.8, 19, 1.3); banner.rotation.y = Math.PI;
  const destination=new T.Group();scene.add(destination);positionOn(destination,LENGTH+200);
  const destinationMaterials=Array.from({length:3},(_,i)=>{const m=facadeMaterial(i).clone();m.fog=false;return m;});
  for(let i=0;i<17;i++){
    const side=i%2?-1:1,height=16+(i*13%43),x=side*(22+(i%9)*11);
    cube(destination,x,height/2,45+(i*23%100),8+i%4*2,height,12,'#45405e').material=destinationMaterials[i%3];
    cube(destination,x,height+.25,45+(i*23%100),8+i%4*2,.15,12,'#b996df',true);
  }
  const origin=plate(destination,'MADE IN SWAGISTAN',0,31,15,42,4,'#e5d6ff');origin.rotation.y=Math.PI;batch(destination);
  const station = new T.Group(); scene.add(station); positionOn(station, LENGTH + 65, 20);
  cube(station, 0, -.05, 0, 38, .2, 45, '#3c3942');
  cube(station, 8, 2, 5, 9, 4, 8, '#62606b'); cube(station, 8, 2, .9, 7, 2, .04, '#f2d8a5', true);
  for (const x of [-7, 5]) cube(station, x, 2.7, -5, .35, 5.4, .35, '#85808b');
  cube(station, -1, 5.5, -5, 19, .6, 10, '#c2b2c9'); cube(station, -1, 5.15, -9.9, 18, .16, .1, '#cfaaff', true);
  for (const x of [-5, 2]) { cube(station, x, 1.1, -5, .9, 2.2, .7, '#b6aab8'); cube(station, x, 1.6, -5.4, .6, .5, .05, '#223d32'); }
  for(const x of[-5,2]){const display=plate(station,'0.00 €',x,1.6,-5.42,.65,.25,'#bfff72');display.rotation.y=Math.PI;}
  for(const x of[-7.6,6.1])cube(station,x,.12,-5,.25,.24,9,'#86808d');
  cube(station,8,1.9,.82,.15,3.8,.1,'#9a849e');
  cube(station,5.5,.6,-1,2.8,.15,.65,'#776276');for(const x of[4.5,6.5])cube(station,x,.3,-1,.12,.6,.5,'#4a4556');
  const warmPool=lightPool(station,'#edc18c',23,24);warmPool.position.set(-2,.04,-5);
  const stationSign = plate(station, 'DERNIÈRE STATION / fld®', 0, 5.6, -10.1, 17, 1); stationSign.rotation.y = Math.PI;
  const waitingCar = car('fld',0,appearance.fld); waitingCar.position.set(-3, .1, -1); waitingCar.rotation.y = Math.PI * .68; station.add(waitingCar);
  const stranger = person(station, -2, -1, '#b7a0d7'); stranger.rotation.y = -Math.PI / 2;
  const playerPerson = person(station, -8, -1, '#22202d'); playerPerson.rotation.y = Math.PI / 2; playerPerson.visible = false;
  const warm = new T.PointLight('#f4ca94', 22, 30, 2); warm.position.set(-2, 4.5, -6); station.add(warm);
  const movingStation=new Set();for(const object of[waitingCar,stranger,playerPerson])object.traverse(n=>movingStation.add(n));batch(station,movingStation);
  const player = car('fld',0,appearance.fld); scene.add(player);
  const oculaire = createOculaire(scene, {...assets.oculaire, report(status) {
    if (canvas.dataset) {canvas.dataset.oculaire = status.state; canvas.dataset.oculaireError = status.error || '';}
  }});
  if (canvas.dataset) canvas.dataset.oculaire = 'loading';
  oculaire.setReduced(reduced);
  const cops = Array.from({length: 3}, (_,i) => { const c = car(i?'undercover':'cop',i,i?'':patrolSkin(appearance,0));  scene.add(c); return c; });
  let trafficVariant=0;
  const traffic = Array.from({length: 7}, () => { const c = car('traffic',Math.floor(trafficVariant++)); scene.add(c); return c; });
  const effects=createDrivingEffects(scene,reduced);
  let initialized=false;
  const glow=new T.PointLight('#956bf1',10,12,2);scene.add(glow);
  const headPool=new T.Group();scene.add(headPool);const headWash=lightPool(headPool,'#dce7ff',5,13);headWash.material.opacity=.2;
  const aim = new T.Vector3(), desired = new T.Vector3();
  function resize() { const w = globalThis.visualViewport?.width||innerWidth, h = globalThis.visualViewport?.height||innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize);globalThis.visualViewport?.addEventListener('resize',resize); resize();
  function reportAppearance(){if(canvas.dataset){canvas.dataset.vehicle=player.userData.skin;canvas.dataset.patrols=cops.map(c=>c.userData.skin||c.userData.kind).join(',');}}
  reportAppearance();
  return {
    render(r, elapsed = 1 / 60) {
      const love = r.result?.ending === 'love' && ['ARRIVAL', 'RESULTS', 'PAUSE'].includes(r.state);
      const ending = r.result && r.state !== 'RACE';
      let s = r.s, lateral = r.x, yaw = r.yaw;
      if (ending && r.result.won) {
        const t = Math.min(1, r.cinematic / (love ? 5 : 7)); s = LENGTH + t * (love ? 65 : 145); lateral = r.x * (1 - t) + (love ? 11 : 0) * t; yaw *= 1 - t;
      }
      if(quality.update(elapsed,r.state==='RACE')){renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.ratio));resize();}
      stream(s);destination.visible=s>STAGES[4].start-300;
      overpass.visible=Math.abs(s-8200)<430;station.visible=s>LENGTH-300;finishGate.visible=s>LENGTH-380;
      positionOn(player, s, lateral, .015, yaw);
      animateVehicle(player,r,r.state==='RACE'?Math.min(elapsed,.05):0);
      player.userData.flame.visible = r.boosting && r.state === 'RACE';
      player.userData.flame.scale.z=reduced?1:.8+Math.sin(r.time*40)*.25;
      for (let i = 0; i < cops.length; i++) {
        const c = r.cops[i], m = cops[i]; m.visible = (c.active||c.undercover) && c.s>0 && c.s-r.s<300 && c.s-r.s>-100 && (!ending||r.result.won&&r.cinematic<3);
        positionOn(m, Math.max(0,c.s+(ending?Math.min(r.cinematic,2)*c.speed*.3:0)), c.x);
        animateVehicle(m,{...r,speed:c.speed,steer:c.steer,boosting:false},r.state==='RACE'?Math.min(elapsed,.05):0);
        if(m.visible&&m.userData.staticBatched)setVehicleDetail(m,Math.abs(c.s-r.s)>(quality.level===0?55:85));
        m.userData.blue.visible = c.active&&(reduced || Math.sin(r.time * 6 + i) > 0); m.userData.red.visible = c.active&&(reduced || !m.userData.blue.visible);
      }
      for (let i = 0; i < traffic.length; i++) { const t = r.traffic[i]; traffic[i].visible = t.s > r.s - 70 && t.s < r.s + 300 && !ending; positionOn(traffic[i], t.s, t.x);animateVehicle(traffic[i],{...r,speed:t.speed,steer:t.steer,boosting:false},r.state==='RACE'?Math.min(elapsed,.05):0);if(traffic[i].visible&&traffic[i].userData.prototype)setVehicleDetail(traffic[i],Math.abs(t.s-r.s)>(quality.level===0?55:85)); }
      for (const {s:start,g} of chunks)g.visible=start>s-160&&start<s+(quality.level===0?300:380);
      barriers.forEach(g => { g.visible = Math.abs(g.userData.s-s)<(quality.level===0?300:450) && !ending; });
      const chaseDistance=10.5+Math.min(2,r.speed/34)+(r.boosting?1:0);
      const behind = sample(Math.max(0, s-chaseDistance), lateral*.62);
      desired.set(behind.x, behind.y + 4.3, behind.z);
      const ahead = sample(s + 24, lateral * .7); aim.set(ahead.x, ahead.y + 1.1, ahead.z);
      // At the starting line the mathematical road starts at zero: extend behind it.
      if (s < 15) { const start = sample(0); desired.set(player.position.x - Math.sin(start.angle) * 10.5, player.position.y + 4.3, player.position.z - Math.cos(start.angle) * 10.5); }
      if (love && r.cinematic > 5) {
        const p = sample(LENGTH + 65, 20); const t = Math.min(1, (r.cinematic - 5) / 4);
        stranger.position.set(-2 - t * 4, 0, -1 - t * .8);
        playerPerson.visible = true; playerPerson.position.set(-8 + t, 0, -1 - t * .8);
        desired.set(p.x - 14, p.y + 5, p.z - 16); aim.set(p.x - 5, p.y + 1.3, p.z - 5);
      } else playerPerson.visible = false;
      const celestialShot=oculaire.shot(r);
      if(celestialShot){desired.lerp(celestialShot.position,celestialShot.blend);aim.lerp(celestialShot.target,celestialShot.blend);}
      if (!initialized) { camera.position.copy(desired); initialized = true; }
      camera.position.lerp(desired, 1 - Math.exp(-Math.min(elapsed, .1) * 5));
      if (!reduced && r.state === 'RACE') camera.position.x += Math.sin(r.time * 70) * r.impact * .12;
      camera.lookAt(aim);
      const targetFov=62+(r.boosting&&!reduced?4:0),fov=camera.fov+(targetFov-camera.fov)*(1-Math.exp(-elapsed*4)); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      const welcoming=r.result?.won||r.s>12000;
      scene.fog.color.lerp(new T.Color(welcoming?'#433443':stageAt(r.s).fog),.04);scene.background.copy(scene.fog.color).multiplyScalar(.43);
      scene.fog.density=stageAt(r.s).kind==='tunnel'?.005:.0033;
      sky.update(r,camera,quality.level);
      const front=sample(s+7,lateral);headPool.position.set(front.x,front.y+.018,front.z);headPool.rotation.y=front.angle;
      glow.position.copy(player.position);glow.position.y+=1.5;glow.color.set(love&&r.cinematic>5?'#e8b992':'#956bf1');
      moon.position.set(camera.position.x-190,camera.position.y+180,camera.position.z+500);
      effects.setReduced(reduced||quality.level===0);effects.update(r,camera);
      oculaire.update(r,player,camera);
      renderer.render(scene, camera);
    },
    setAppearance(next,seed=0){
      const marked=patrolSkin(next,seed>>>0);
      if(next.fld===appearance.fld&&marked===cops[0].userData.skin)return;
      function replace(target,kind,variant,skin){const source=car(kind,variant,skin);target.clear();target.add(...source.children.slice());target.userData=source.userData;target.name=source.name;}
      if(next.fld!==appearance.fld){replace(player,'fld',0,next.fld);replace(waitingCar,'fld',0,next.fld);}
      if(marked!==cops[0].userData.skin)replace(cops[0],'cop',0,marked);
      appearance={...next};reportAppearance();
    },
    reset() { initialized = false; effects.clear();oculaire.reset();for(const vehicle of [...traffic,...cops])resetRoadPrototype(vehicle);stranger.position.set(-2,0,-1);playerPerson.visible=false; },
    configure(settings) {reduced=settings.reduced;sky.setReduced(reduced);oculaire.setReduced(reduced);quality.setMode(settings.quality);renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.ratio));resize();},
    get metrics(){return {fps:quality.fps===null?null:Math.round(quality.fps),level:quality.level,ratio:Math.min(devicePixelRatio||1,quality.ratio),chunks:chunks.filter(c=>Number.isFinite(c.s)).length,calls:renderer.info.render?.calls??null,triangles:renderer.info.render?.triangles??null,geometries:renderer.info.memory?.geometries??null};},
    get oculaireStatus() {return oculaire.status;},
    inspectOculaire() {return oculaire.inspect(camera);},
    dispose() { removeEventListener('resize', resize);globalThis.visualViewport?.removeEventListener('resize',resize);for(const chunk of chunks)releaseChunk(chunk.g);sky.dispose();effects.dispose();oculaire.dispose();renderer.dispose(); },
    info: renderer.info
  };
}
