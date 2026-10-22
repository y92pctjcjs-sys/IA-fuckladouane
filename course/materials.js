import * as T from './vendor/three.module.min.js';
const cache = new Map();
export const palette = {paint:'#21182f',purple:'#b792ff',acid:'#cdff4a',glass:'#15263b',metal:'#798297'};
export function surface(color, roughness = .7, metalness = 0) {
  const key = [color,roughness,metalness].join(':');
  if (!cache.has(key)) cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));
  return cache.get(key);
}
function dataTexture(size, paint, color = false) {
  const bytes = new Uint8Array(size * size * 4);
  for (let y=0;y<size;y++) for(let x=0;x<size;x++) { const value=paint(x,y); const offset=(y*size+x)*4;bytes[offset]=value[0];bytes[offset+1]=value[1];bytes[offset+2]=value[2];bytes[offset+3]=value[3]??255; }
  const texture = new T.DataTexture(bytes,size,size,T.RGBAFormat); texture.needsUpdate=true;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;
  if(color)texture.colorSpace=T.SRGBColorSpace;
  return texture;
}
const noise = (x,y) => {const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export function asphaltMaterial() {
  if(cache.has('asphalt'))return cache.get('asphalt');
  const map=dataTexture(128,(x,y)=>{const n=noise(x,y),grain=24+n*19;const crack=Math.abs(Math.sin(x*.12+y*.019+Math.sin(y*.04)))<.027;return crack?[12,12,17]:[grain,grain+1,grain+6];},true);
  const rough=dataTexture(128,(x,y)=>{const patches=Math.sin(x*.055)*Math.sin(y*.07);const n=patches>.4?78:145+noise(x,y)*55;return[n,n,n];});
  const normal=dataTexture(128,(x,y)=>[126+(noise(x+1,y)-noise(x-1,y))*16,126+(noise(x,y+1)-noise(x,y-1))*16,254]);
  const material=new T.MeshStandardMaterial({color:'#a3a5b3',map,roughnessMap:rough,normalMap:normal,normalScale:new T.Vector2(.32,.32),roughness:.74,metalness:.12});
  material.userData.previewColor='#30323e';cache.set('asphalt',material);return material;
}
export function industrialMaterial(kind='steel') {
  const key='industrial:'+kind;if(cache.has(key))return cache.get(key);
  const colors={steel:[66,74,89],purple:[83,56,102],concrete:[85,84,91],brick:[68,57,69]};const base=colors[kind]||colors.steel;
  const map=dataTexture(128,(x,y)=>{const rib=kind==='concrete'?0:(x%12<3?-12:4);const seam=y%64<2?-18:0;const grain=noise(x,y)*8;return base.map(n=>n+rib+seam+grain);},true);
  const mat=new T.MeshStandardMaterial({map,color:'#dddddd',roughness:kind==='concrete'?.92:.52,metalness:kind==='concrete'?0:.35});mat.userData.previewColor=kind==='purple'?'#533866':kind==='concrete'?'#55545b':'#424a59';cache.set(key,mat);return mat;
}
export function facadeMaterial(seed=0) {
  const key='facade:'+seed;if(cache.has(key))return cache.get(key);
  const map=dataTexture(128,(x,y)=>{const window=x%16>4&&x%16<11&&y%20>5&&y%20<13;const on=noise(Math.floor(x/16)+seed,Math.floor(y/20))>.4;return window?(on?[155,137,106]:[22,29,42]):[39+seed*3,42,54];},true);
  const glow=dataTexture(128,(x,y)=>{const lit=x%16>4&&x%16<11&&y%20>5&&y%20<13&&noise(Math.floor(x/16)+seed,Math.floor(y/20))>.4;return lit?[91,72,42]:[0,0,0];},true);
  const mat=new T.MeshStandardMaterial({map,emissiveMap:glow,emissive:'#ffffff',emissiveIntensity:.65,roughness:.86});mat.userData.previewColor='#2d3245';cache.set(key,mat);return mat;
}
export function softTexture(kind='shadow') {
  const key='soft:'+kind;if(cache.has(key))return cache.get(key);
  const tex=dataTexture(64,(x,y)=>{const distance=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);const alpha=Math.max(0,1-distance);return kind==='shadow'?[0,0,0,alpha*alpha*195]:[255,255,255,alpha*alpha*210];});
  tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;cache.set(key,tex);return tex;
}
export function environmentTexture() {
  if(cache.has('environment'))return cache.get('environment');
  const faces=Array.from({length:6},(_,face)=>dataTexture(64,(x,y)=>{
    const horizon=1-Math.abs(y-32)/32;let r=9+horizon*15,g=12+horizon*14,b=25+horizon*26;
    if((Math.abs(x-17)<3||Math.abs(x-48)<2)&&y>12&&y<49){r+=60;g+=45;b+=95;}
    if(y<9){r+=35;g+=38;b+=52;}
    if(face===2){r+=15;g+=12;b+=22;}return[r,g,b];
  },true));
  const texture=new T.CubeTexture(faces);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;cache.set('environment',texture);return texture;
}
