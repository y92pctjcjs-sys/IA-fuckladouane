import * as T from './vendor/three.module.min.js';
import {sample,stageAt,LENGTH,curvature} from './track.js?v=fld-route-003';
import {surface} from './materials.js?v=fld-route-003';
import {distanceToShortcut,railOpening} from './route-options.js?v=fld-route-003';
import {LANDMARKS} from './route-atlas.js?v=fld-route-003';

// Static, deterministic scenery. No tree, rock or sign participates in the simulation.
const forestMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.96});
const terrainMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:1});
const railMaterial=surface('#717b86',.39,.65),postMaterial=surface('#4a535d',.67,.45);
const treeCache=new Map(),signCache=new Map(),unitBox=new T.BoxGeometry(1,1,1);
const SHORTCUT_START=2900,SHORTCUT_END=4640;
export const forestTemplate=(species='oak',low=false)=>({geometry:treeGeometry(species,low),material:forestMaterial});
const hash=n=>{const x=Math.sin(n*127.1+39.7)*43758.5453123;return x-Math.floor(x);};
export function shoulderHeight(s,lateral){const d=Math.abs(lateral);return Math.min(3.4,Math.max(0,d-10.3)*.055)+Math.sin(s/137)*Math.min(.28,Math.max(0,d-13)*.009);}
function colouredGeometry(parts){
 const p=[],n=[],colors=[];
 for(const {geometry,color,matrix}of parts){
  const source=geometry.clone().applyMatrix4(matrix),g=source.index?source.toNonIndexed():source,c=new T.Color(color);
  const a=g.attributes.position,b=g.attributes.normal;
  for(let i=0;i<a.count;i++){p.push(a.getX(i),a.getY(i),a.getZ(i));n.push(b.getX(i),b.getY(i),b.getZ(i));colors.push(c.r,c.g,c.b);}
  if(g!==source)g.dispose();source.dispose();geometry.dispose();
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();g.computeBoundingBox();return g;
}
function treeGeometry(species,low){
 const key=species+':'+low;if(treeCache.has(key))return treeCache.get(key);
 const parts=[],dummy=new T.Object3D();
 function add(geometry,color,x,y,z,sx=1,sy=1,sz=1,rz=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,0,rz);dummy.updateMatrix();parts.push({geometry,color,matrix:dummy.matrix.clone()});}
 const birch=species==='birch',pine=species==='pine';
 add(new T.CylinderGeometry(birch?.09:.16,birch?.17:.24,pine?7.4:6.2,low?5:7),birch?'#a6aaa0':'#484339',0,pine?3.7:3.1,0);
 if(pine){
  for(let i=0;i<(low?2:4);i++){const y=low?4.3+i*2:3.5+i*1.4,r=(low?2.35:2.6)-i*(low?.65:.43);add(new T.ConeGeometry(r,low?3.8:3.5,low?6:8),i%2?'#283b35':'#344b3d',0,y,0,1,1,.9);}
 }else{
  const crowns=low?[[0,6.0,0,2.7,2.8,2.25]]:[[0,6.9,0,2.45,2.5,2.1],[-1.5,5.4,.35,2.0,2.0,1.8],[1.45,5.8,-.25,2.0,2.1,1.75]];
  for(const [i,[x,y,z,sx,sy,sz]]of crowns.entries())add(new T.IcosahedronGeometry(1,low?0:1),birch?(i%2?'#52624a':'#657456'):(i%2?'#34483b':'#405843'),x,y,z,sx,sy,sz);
  if(!low)for(const side of[-1,1])add(new T.CylinderGeometry(.055,.10,2.4,5),'#514a3e',side*.6,4.4,0,1,1,1,-side*.55);
 }
 const g=colouredGeometry(parts);g.userData.worldShared=true;treeCache.set(key,g);return g;
}
export function forestPlacements(start){
 const result=[];
 for(const side of[-1,1])for(let i=0;i<22;i++){
  const seed=start*3+i*79+(side+1)*89,s=start+3+hash(seed)*74,kind=stageAt(s).kind;
  if(!['open','frontier','control'].includes(kind)||s>LENGTH-950)continue;
  // Clear tunnel portals and the arrival view, and alternate dense groves with glades.
  if(s>5040&&s<7560||s<2320)continue;
  const glade=Math.floor(s/320)%4===2,max=kind==='control'?5:glade?7:22;if(i>=max)continue;
  const lateral=side*(kind==='control'?45+hash(seed+8)*25:17.2+hash(seed+8)*40),scale=.82+hash(seed+13)*.46;
  if(s>11560&&s<11840&&Math.abs(lateral)<31)continue;
  if(LANDMARKS.some(l=>Math.abs(l.s-s)<35&&Math.abs(l.side*l.offset-lateral)<11))continue;
  const point=sample(s,lateral);if(s>SHORTCUT_START&&s<SHORTCUT_END&&distanceToShortcut(point.x,point.z)<12.5)continue;
  result.push({s,lateral,scale,yaw:hash(seed+5)*Math.PI*2,species:i%3===0?'pine':Math.floor(start/160)%3===0?'birch':'oak'});
 }
 return result;
}
function addForest(root,start){
 const placements=forestPlacements(start);if(!placements.length)return;
 const near=new T.Group(),far=new T.Group();root.add(near,far);near.userData.forestLOD='near';far.userData.forestLOD='far';far.visible=false;root.userData.forestLayers={near,far};
 const groups=new Map();for(const p of placements){if(!groups.has(p.species))groups.set(p.species,[]);groups.get(p.species).push(p);}
 const dummy=new T.Object3D();
 for(const [species,list]of groups)for(const low of[false,true]){
  const mesh=new T.InstancedMesh(treeGeometry(species,low),forestMaterial,list.length);mesh.name='FORÊT / '+species+(low?' / HORIZON':' / PROCHE');mesh.userData.forestInstance=true;
  for(const [i,p]of list.entries()){
   const pos=sample(p.s,p.lateral);dummy.position.set(pos.x,pos.y+shoulderHeight(p.s,p.lateral)-.12,pos.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();(low?far:near).add(mesh);
 }
}
function terrain(root,start){
 const positions=[],indices=[],colors=[],stride=7;
 for(const side of[-1,1]){
  const offset=positions.length/3;
  for(let i=0;i<=20;i++)for(let j=0;j<=6;j++){
   const s=start+i*4,lateral=side*(10.2+j*12),p=sample(s,lateral),t=hash(Math.floor(s/20)+j*77);
   positions.push(p.x,p.y+shoulderHeight(s,lateral)-.18,p.z);
   const c=new T.Color(j===0?'#31372f':stageAt(s).kind==='frontier'?'#303e37':'#29372e');c.multiplyScalar(.88+t*.24);colors.push(c.r,c.g,c.b);
   if(i&&j){const centre=sample(s-2,side*(10.2+(j-.5)*12));if(s>SHORTCUT_START&&s<SHORTCUT_END&&distanceToShortcut(centre.x,centre.z)<14)continue;const a=offset+(i-1)*stride+j-1,b=a+1,c=a+stride,d=c+1;indices.push(...(side>0?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.userData.chunkOwned=true;
 const mesh=new T.Mesh(g,terrainMaterial);mesh.name='TALUS / relief continu';root.add(mesh);
}
function chevronMaterial(direction){
 if(signCache.has(direction))return signCache.get(direction);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const c=canvas.getContext('2d');
 c.fillStyle='#111a22';c.fillRect(0,0,128,64);c.strokeStyle='#cbd4cf';c.lineWidth=3;c.strokeRect(2,2,124,60);c.fillStyle='#e7e8d8';
 for(const x of[16,61]){c.beginPath();for(const [i,[u,v]]of [[0,0],[23,0],[47,26],[23,52],[0,52],[24,26]].entries()){const px=direction>0?112-x-u:x+u;const py=v+6;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const mat=new T.MeshBasicMaterial({map:texture,toneMapped:false});signCache.set(direction,mat);return mat;
}
const signGeometry=new T.PlaneGeometry(1.75,.9);
function curveGuides(root,start){
 if(stageAt(start+40).kind==='tunnel')return;
 for(const offset of[12,48]){
  const s=start+offset,k=curvature(s);if(Math.abs(k)<.00135)continue;
  const side=-Math.sign(k),p=sample(s,side*11.8),group=new T.Group();group.position.set(p.x,p.y,p.z);group.rotation.y=p.angle+Math.PI;group.name='BALISAGE / '+(k>0?'GAUCHE':'DROITE');root.add(group);
  const post=new T.Mesh(unitBox,postMaterial);post.position.y=.85;post.scale.set(.09,1.7,.09);group.add(post);
  const sign=new T.Mesh(signGeometry,chevronMaterial(Math.sign(k)));sign.position.y=1.65;group.add(sign);
 }
}
export function landscapeChunk(root,start){
 root.userData.landscapeRoot=null;const kind=stageAt(start+40).kind;if(kind==='tunnel'||kind==='industrial')return;
 const group=new T.Group();group.name='PAYSAGE / '+start;group.userData.landscape=true;root.add(group);root.userData.landscapeRoot=group;terrain(group,start);addForest(group,start);curveGuides(group,start);return group;
}
export function setLandscapeDetail(root,start,driverS,economy){
 const low=economy||start-driverS>110;
 const layers=root.userData.landscapeRoot?.userData.forestLayers;if(layers){layers.near.visible=!low;layers.far.visible=low;}
}
// One curved W-profile rail mesh per chunk, with road-local offsets at every 4 metres.
export function curvedRails(root,start){
 const positions=[],indices=[],profile=[[-.07,.43],[.01,.48],[-.04,.56],[.02,.64],[-.07,.72],[.08,.72],[.08,.43]];
 for(const side of[-1,1]){
  if(side===1&&start>=LENGTH)continue;
  const base=positions.length/3,n=profile.length;
  for(let i=0;i<=20;i++){
   const s=start+i*4;
   for(const [dx,y]of profile){const p=sample(s,side*(9.6+dx));positions.push(p.x,p.y+y,p.z);}
   if(i&&!railOpening(start+i*4-2,side))for(let j=0;j<n;j++){const a=base+(i-1)*n+j,b=base+(i-1)*n+(j+1)%n,c=base+i*n+j,d=base+i*n+(j+1)%n;indices.push(...(side>0?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.userData.chunkOwned=true;
 const mesh=new T.Mesh(g,railMaterial);mesh.name='GLISSIÈRES / courbes continues';root.add(mesh);return mesh;
}
