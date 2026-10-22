import * as T from './vendor/three.module.min.js';

// One local atlas per design. Readable labels keep their orientation on BOTH doors.
// The small hood mark is the owner's unmodified tribal logo, loaded only by the game.
const cache = new Map();
const regions = {side:[0,0,1024,256],hood:[0,256,512,512],rear:[512,256,512,128],plate:[512,384,512,128]};
let logo = null;
const pending = new Set();
function text(c, value, x, y, size, color, font='Arial', align='left') {
  c.font=`900 ${size}px ${font}`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(value,x,y);
}
function polygon(c, points, color) {
  c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
}
function draw(c, police) {
  c.clearRect(0,0,1024,1024);
  // Full length side panel, viewed from front at left to rear at right.
  c.fillStyle=police?'#e7edf0':'#221329';c.fillRect(0,0,1024,256);
  if(police) {
    polygon(c,[[0,120],[1024,74],[1024,222],[0,222]],'#17395c');
    polygon(c,[[0,108],[1024,62],[1024,72],[0,118]],'#ed3b48');
    text(c,'DOUANE',478,167,88,'#ffffff','Arial','center');
    text(c,'INTERCEPTION',800,199,21,'#c5dce9');
    text(c,'89',949,110,31,'#ffffff','Arial','center');
    for(let i=0;i<3;i++)polygon(c,[[712+i*40,122],[739+i*40,118],[715+i*40,170],[688+i*40,170]],i===0?'#ed3b48':'#ffffff');
  } else {
    polygon(c,[[0,44],[222,44],[475,194],[1024,119],[1024,216],[400,216],[170,83],[0,83]],'#783eb3');
    polygon(c,[[0,45],[220,45],[475,190],[1024,116],[1024,124],[474,202],[217,54],[0,54]],'#ed48a5');
    polygon(c,[[0,209],[390,209],[1002,137],[1024,137],[1024,148],[391,227],[0,227]],'#caff49');
    c.save();c.translate(473,122);c.transform(1,0,-.18,1,0,0);
    text(c,'fld',-154,0,139,'#f5f1eb','Arial');text(c,'®',13,-47,43,'#caff49');c.restore();
    text(c,'SWAGISTAN MOTOR CLUB',321,238,19,'#eae0fa');
    text(c,'89',793,63,51,'#caff49');text(c,'FROM ELSEWHERE',750,104,15,'#f2f0ff');
    for(let i=0;i<6;i++)polygon(c,[[808+i*26,182],[824+i*26,180],[814+i*26,205],[798+i*26,207]],'#74e2ed');
  }
  // Bonnet: restrained lettering leaves room for the exact tribal emblem.
  c.fillStyle=police?'#e7edf0':'#cec7d6';c.fillRect(0,256,512,512);
  for(let i=0;i<7;i++) {
    c.fillStyle=police?'#17395c':i%2?'#a0ff50':'#7a3db4';
    c.fillRect(24,278+i*7,464-i*7,2);
  }
  if(police) {
    c.fillStyle='#17395c';c.fillRect(14,448,484,137);
    text(c,'DOUANE',256,519,88,'#ffffff','Arial','center');
    text(c,'BRIGADE / 89',256,611,24,'#17395c','Arial','center');
    c.fillStyle='#ed3b48';c.fillRect(14,583,484,7);
  } else {
    // Compensate for the bonnet's 1.20 × .78 m UV patch, preserving the emblem's real proportions.
    if(logo)c.drawImage(logo,30,375,452,265);
    else {text(c,'fld',245,496,142,'#e9e1f4','Arial','center');text(c,'®',350,455,43,'#caff49');}
    text(c,'ORIGINE NON DÉCLARÉE',256,683,21,'#3f2754','Arial','center');
    text(c,'89 / SWAGISTAN',256,733,25,'#3f2754','Arial','center');
  }
  c.fillStyle=police?'#17395c':'#15111f';c.fillRect(512,256,512,128);
  text(c,police?'DOUANE':'fld® / SWAGISTAN',768,309,police?72:39,police?'#ffffff':'#caff49','Arial','center');
  text(c,police?'INTERCEPTION / 89':'AUCUNE FRONTIÈRE',768,357,17,police?'#c2dfef':'#b9a5cc','Arial','center');
  c.fillStyle=police?'#ecf0ee':'#11131a';c.fillRect(512,384,512,128);
  c.fillStyle=police?'#24599a':'#7c3fc8';c.fillRect(512,384,43,128);c.fillRect(981,384,43,128);
  text(c,police?'D-089-FR':'FLD-089-SW',768,450,61,police?'#18202b':'#e7ecda','Arial','center');
  text(c,police?'F':'SW',533,462,19,'#ffffff','Arial','center');
  text(c,'89',1002,461,24,'#ffffff','Arial','center');
}
export function vehicleLivery(police=false) {
  const key=police?'douane':'fld';if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const context=canvas.getContext('2d');draw(context,police);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardMaterial({map,roughness:.38,metalness:.35,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:.10});
  material.name=key+'-livery';cache.set(key,material);
  if(!police)pending.add({context,map});
  return material;
}
// Using a local Image prevents any network dependency, and the fallback remains readable.
if(typeof Image!=='undefined') {
  const image=new Image();image.onload=()=>{logo=image;for(const {context,map} of pending){draw(context,false);map.needsUpdate=true;}pending.clear();};
  image.src=new URL('./assets/fld-tribal.png',import.meta.url).href;
}
export function atlasUV(region,u,v) {
  const [x,y,w,h]=regions[region];return [(x+u*w)/1024,1-(y+(1-v)*h)/1024];
}
