import * as T from './vendor/three.module.min.js';
import {resolveSkin} from './vehicle-skins.js?v=fld-route-003';
// Ink is part of the body UVs, never a floating rectangular decal plane.
const cache=new Map(),pending=new Set(),pigments=new Map();
const regions={side:[0,0,1024,256],hood:[0,256,512,512],roof:[512,256,512,256],rear:[512,512,512,128],plate:[512,640,512,128],rim:[0,768,256,256],banner:[256,768,768,128],front:[256,896,384,128],blank:[768,896,256,128]};
let logoMask=null,brandDone;export const brandReady=new Promise(r=>{brandDone=r;});
function text(c,t,x,y,size,color,align='left',weight=900){c.font=`${weight} ${size}px Arial`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(t,x,y);}
function polygon(c,p,color){c.fillStyle=color;c.beginPath();c.moveTo(...p[0]);for(const q of p.slice(1))c.lineTo(...q);c.closePath();c.fill();}
function stroke(c,p,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...p[0]);for(const q of p.slice(1))c.lineTo(...q);c.stroke();}
function noise(n){const v=Math.sin(n*127.1+38.3)*43758.54;return v-Math.floor(v);}
function pigment(color){if(!logoMask)return null;if(pigments.has(color))return pigments.get(color);const p=document.createElement('canvas');p.width=1024;p.height=390;const c=p.getContext('2d');c.drawImage(logoMask,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,1024,390);c.globalCompositeOperation='source-over';pigments.set(color,p);return p;}
// Compensate for the physical patch dimensions to retain the exact logo aspect.
function brand(c,x,y,w,color,aspect=1){const h=w/(1598/608)*aspect,ink=pigment(color);if(ink)c.drawImage(ink,x,y,w,h);else{text(c,'fld',x+w*.40,y+h*.52,h*.75,color,'center');text(c,'®',x+w*.70,y+h*.22,h*.22,color);}return h;}
function feather(c,x,y,scale,color,flip=1){for(let i=0;i<9;i++){const t=i/8;polygon(c,[[x,y],[x+flip*(25+60*t)*scale,y-(34+14*t)*scale],[x+flip*(17+45*t)*scale,y+(2+22*t)*scale]],color);}}
function side(c,s){
 const cop=s.kind==='cop';c.fillStyle=s.paint;c.fillRect(0,0,1024,256);
 for(let i=0;i<700;i++){c.fillStyle=i%2?'#ffffff07':'#00000009';c.fillRect(noise(i)*1024,noise(i+5)*256,1,1);}
 if(cop){
  polygon(c,[[0,142],[1024,95],[1024,230],[0,230]],s.accent);polygon(c,[[0,130],[1024,83],[1024,92],[0,139]],s.secondary);
  text(c,'DOUANE',508,173,78,'#f4f4ee','center');text(c,'D-89',857,119,23,'#e4e8e7');text(c,'INTERCEPTION',497,228,14,'#d0dbe0','center',700);
  for(let i=0;i<3;i++)polygon(c,[[755+i*26,150],[769+i*26,148],[747+i*26,199],[734+i*26,199]],s.secondary);
  if(s.id==='infernal'){for(let i=0;i<12;i++){const x=37+i*83;stroke(c,[[x,118],[x+19,96],[x+6,62],[x+23,35]],i%2?'#c94427':'#6e2821',2);}text(c,'INFERNAL',124,220,18,'#ffbe83','center');}
  if(s.id==='wreck'){
   for(let i=0;i<95;i++){const x=noise(i+7)*1024,y=noise(i+9)*255;stroke(c,[[x,y],[x+14+noise(i)*48,y-3-noise(i+4)*13]],i%3?'#c3c1ad':'#384041',1+noise(i+4)*2);}
   polygon(c,[[11,37],[185,51],[231,90],[173,112],[26,94]],'#676f6f');for(let i=0;i<8;i++)stroke(c,[[29+i*23,46],[55+i*20,87]],'#cbd1cc',2);
   c.save();c.translate(888,65);c.rotate(.10);c.fillStyle='#c4c0a2';c.fillRect(-50,-11,101,22);text(c,'RÉPARÉ.',0,1,15,'#343738','center');c.restore();
  }
 }else{
  polygon(c,[[0,190],[337,205],[728,137],[1024,155],[1024,204],[731,185],[338,237],[0,226]],s.id==='seraph'?'#b8ccdc':s.id==='cursed'?'#f50099':'#6234a3');
  stroke(c,[[0,221],[338,231],[730,176],[1024,194]],s.accent,s.id==='cursed'?8:4);stroke(c,[[0,182],[337,196],[731,129],[1024,148]],s.secondary,3);
  if(s.id==='seraph'){feather(c,151,141,.75,'#b7c7cf',-1);feather(c,835,116,.7,'#b7c7cf',1);brand(c,315,31,386,'#a99158',1.35);text(c,'SÉRAPHIN / 89',875,214,15,'#6f705e','center');}
  else if(s.id==='cursed'){
   for(let i=0;i<26;i++){const x=noise(i+8)*1024,y=noise(i+3)*246;c.fillStyle=i%2?'#00ffdd':'#ff188f';c.fillRect(x,y,6+noise(i+4)*90,2+noise(i+7)*6);}
   brand(c,318,27,386,'#00edff',1.35);brand(c,309,33,386,'#ff1d77',1.35);brand(c,314,30,386,'#dbff17',1.35);text(c,'SIGNAL LOST / 89',855,214,15,'#00ffff','center');
  }else{brand(c,314,30,386,'#e3d9ee',1.35);text(c,'FROM ELSEWHERE / 89',859,216,14,'#e4cfed','center');}
  text(c,'fuckladouane.com',494,242,16,s.id==='seraph'?'#535e72':'#ecdbf3','center',700);
 }
}
function hood(c,s){
 const cop=s.kind==='cop';c.fillStyle=s.paint;c.fillRect(0,256,512,512);
 if(cop){
  polygon(c,[[24,700],[50,385],[140,356],[372,356],[462,385],[488,700]],s.accent);stroke(c,[[27,705],[50,378],[139,350],[374,350],[465,378],[490,705]],s.secondary,6);
  text(c,'DOUANE',256,526,62,'#f4f4ee','center');text(c,s.id==='infernal'?'INFERNAL / 89':s.id==='wreck'?'DOSSIER OUVERT / 89':'BRIGADE / 89',256,611,20,'#c8d1d3','center');
  if(s.id==='infernal')for(let i=0;i<7;i++)stroke(c,[[55+i*63,687],[74+i*55,628],[61+i*58,581],[83+i*49,477],[88+i*50,369]],'#d9652b',2);
  if(s.id==='wreck')for(let i=0;i<60;i++){const x=15+noise(i)*470,y=290+noise(i+4)*448;stroke(c,[[x,y],[x+9+noise(i+1)*36,y+5+noise(i+3)*45]],i%2?'#69716e':'#b1b4a6',2);}
 }else{
  const ink=s.id==='seraph'?'#a28c56':s.id==='cursed'?'#d8ff09':'#dfd6f1';
  if(s.id==='cursed'){for(let i=0;i<18;i++){const y=294+i*23;polygon(c,[[23,y],[153+noise(i)*270,y-8],[488,y+11],[199,y+13]],i%3?'#fe119c':'#00e8ff');}brand(c,82,390,360,'#00f4ff',1.714);brand(c,68,400,360,'#ff004e',1.714);}
  brand(c,76,395,360,ink,1.714);stroke(c,[[29,286],[29,735],[483,735],[483,286]],s.secondary,2);
  text(c,s.id==='seraph'?'ORIGINE CÉLESTE':'ORIGINE NON DÉCLARÉE',256,688,18,ink,'center',700);text(c,'SWAGISTAN MOTOR CLUB',256,718,15,ink,'center',700);
 }
}
function other(c,s){
 const cop=s.kind==='cop',ink=s.id==='seraph'?'#a28c56':cop?'#f1f3ec':s.accent;
 c.fillStyle=s.paint;c.fillRect(512,256,512,512);c.fillRect(768,896,256,128);
 if(cop)text(c,'DOUANE',768,382,70,s.accent,'center');else brand(c,594,296,348,ink,.74);
 c.fillStyle=cop?s.accent:'#10121a';c.fillRect(512,512,512,128);if(cop)text(c,'DOUANE',768,559,65,'#f2f4ef','center');else brand(c,633,519,270,ink,.50);
 text(c,cop?'INTERCEPTION / 89':'SWAGISTAN MOTOR CLUB',768,614,17,cop?'#c3d7e5':s.secondary,'center',700);
 c.fillStyle=cop?'#e2e5df':'#12121b';c.fillRect(512,640,512,128);c.fillStyle=cop?'#245395':s.accent;c.fillRect(512,640,39,128);c.fillRect(985,640,39,128);
 text(c,cop?'D-089-FR':'FLD-089-SW',768,702,58,cop?'#172434':'#edf0e3','center');text(c,cop?'F':'SW',532,716,17,cop?'#ffffff':'#25212b','center');text(c,'89',1005,715,21,cop?'#ffffff':'#25212b','center');
 c.fillStyle='#181b23';c.fillRect(0,768,256,256);c.strokeStyle=s.metal;c.lineWidth=8;c.beginPath();c.arc(128,896,111,0,Math.PI*2);c.stroke();brand(c,31,855,194,ink,1);
 c.fillStyle='#10121a';c.fillRect(256,768,768,128);text(c,cop?'DOUANE / 89':'fuckladouane.com',640,832,67,cop?'#d8e5f3':ink,'center');
 c.fillStyle='#0d1018';c.fillRect(256,896,384,128);if(cop)text(c,'D-89',448,958,71,'#c9d9e7','center');else brand(c,322,909,257,ink,1);
 c.fillStyle=s.metal;c.fillRect(640,896,128,128);
}
function draw(c,s){c.clearRect(0,0,1024,1024);side(c,s);hood(c,s);other(c,s);}
export function vehicleLivery(police=false,skinId=''){
 const s=resolveSkin(police?'cop':'fld',skinId);if(cache.has(s.id))return cache.get(s.id);const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d');draw(c,s);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const material=new T.MeshPhysicalMaterial({map,metalness:s.id==='wreck'?.25:s.id==='seraph'?.48:.58,roughness:s.id==='wreck'?.62:.28,clearcoat:s.id==='wreck'?.1:1,clearcoatRoughness:.20,envMapIntensity:1.1,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:s.id==='cursed'?.14:.025,iridescence:s.id==='seraph'?.20:s.id==='cursed'?.36:0});
 material.name='Chassis';material.userData.skin=s.id;cache.set(s.id,material);if(!logoMask)pending.add({c,map,s});return material;
}
if(typeof Image!=='undefined'){
 const image=new Image();image.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=390;const c=canvas.getContext('2d');c.drawImage(image,0,0,1024,390);const pixels=c.getImageData(0,0,1024,390);
  for(let i=0;i<pixels.data.length;i+=4){const l=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/765;pixels.data[i+3]=Math.round(pixels.data[i+3]*(1-l));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;}c.putImageData(pixels,0,0);logoMask=canvas;
  for(const {c:ctx,map,s} of pending){draw(ctx,s);map.needsUpdate=true;}pending.clear();brandDone(true);
 };image.onerror=()=>brandDone(false);image.src=new URL('./assets/fld-tribal.png',import.meta.url).href;
}else brandDone(false);
export function atlasUV(region,u,v){const [x,y,w,h]=regions[region];return[(x+T.MathUtils.clamp(u,0,1)*w)/1024,1-(y+(1-T.MathUtils.clamp(v,0,1))*h)/1024];}
