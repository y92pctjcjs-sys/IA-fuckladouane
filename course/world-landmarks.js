import * as T from './vendor/three.module.min.js';
import {sample} from './track.js?v=fld-route-003';
import {LANDMARKS} from './route-atlas.js?v=fld-route-003';
import {shoulderHeight} from './world-landscape.js?v=fld-route-003';
const cache=new Map(),solidMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.73,metalness:.12}),litMaterial=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
function model(id){
 if(cache.has(id))return cache.get(id);
 const solid=[],lit=[],dummy=new T.Object3D();
 function add(geometry,color,x,y,z,sx=1,sy=1,sz=1,rx=0,rz=0,glow=false){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,0,rz);dummy.updateMatrix();(glow?lit:solid).push({geometry,color,matrix:dummy.matrix.clone()});}
 const box=(x,y,z,w,h,d,c,glow=false)=>add(new T.BoxGeometry(w,h,d),c,x,y,z,1,1,1,0,0,glow);
 const pipe=(x,y,z,r,h,c,rx=0,rz=0)=>add(new T.CylinderGeometry(r,r,h,12),c,x,y,z,1,1,1,rx,rz);
 const steel='#65717b',concrete='#737872',dark='#222c32',warm='#d8c69c';
 if(id==='quai89'){
  for(const x of[-7,7]){box(x,5.7,0,.55,11.4,.8,steel);box(x,.2,0,2.5,.4,3.0,concrete);}
  box(0,11.4,0,18,.65,.9,steel);box(0,10.9,0,16,.06,.06,warm,true);box(4,10.5,0,1.6,1.3,1.5,dark);box(4,7.2,0,.06,5.5,.06,steel);
  for(const z of[-5,4]){box(-1,1.5,z,7.5,3,2.7,z<0?'#506166':'#665468');for(let i=-3;i<=3;i++)box(i,1.5,z-1.37,.06,2.8,.03,steel);}
 }else if(id==='water'){
  box(0,.2,0,10,.4,10,concrete);for(const x of[-2.6,2.6])for(const z of[-2.6,2.6])box(x,8,z,.42,16,.42,concrete);
  pipe(0,17,0,4.4,4.6,'#666f71');pipe(0,19.5,0,4.7,.3,steel);pipe(0,14.6,0,4.7,.3,steel);
  for(const y of[4,9,13]){box(0,y,-2.65,5.6,.12,.15,steel);box(0,y,2.65,5.6,.12,.15,steel);}
  box(0,18,-4.45,2.7,.07,.04,'#b993ff',true);
 }else if(id==='grove'){
  box(0,.15,0,8,.3,8,'#5c6654');for(const x of[-2.2,2.2])for(const z of[-2,2])box(x,2.5,z,.18,5,.18,'#60695b');
  box(0,5,0,5.4,.18,5.4,'#3d4941');for(const z of[-2.4,2.4])for(const y of[3.5,4.5])box(0,y,z,5,.08,.08,steel);
  for(let i=0;i<8;i++)box(-2.6, .25+i*.32,-2+i*.5,1.3,.14,.48,'#7f8875');box(0,5.5,0,6.2,.13,6.2,dark);
 }else if(id==='relay'){
  box(0,.15,0,6,.3,6,concrete);for(const x of[-1,1])box(x,9,0,.18,18,.18,steel);
  for(let i=0;i<8;i++){add(new T.BoxGeometry(.08,2.5,.08),steel,0,i*2.2+1.5,0,1,1,1,0,i%2?.75:-.75);}
  box(0,18,0,5.5,.22,.24,steel);for(const x of[-1.8,0,1.8])box(x,17.4,0,.45,2.3,.35,'#a1aaa8');
  pipe(2,12,0,1.0,.18,'#949d99',0,Math.PI/2);box(0,18.3,0,.15,.3,.15,'#ff626b',true);
 }else if(id==='omerta'){
  box(0,6.0,0,.24,2.5,6,dark);
  for(const z of[-1.7,1.7]){
   pipe(-.15,6.0,z,.85,.28,steel,0,Math.PI/2);
   for(let i=0;i<4;i++){const a=i*Math.PI/2;add(new T.BoxGeometry(.04,.55,.16),'#252f34',-.31,6+Math.cos(a)*.30,z+Math.sin(a)*.30,1,1,1,a,0);}
   box(-.33,4.6,z,.035,.055,.6,'#b8d3c7',true);
  }
 }else if(id==='annex'){
  box(0,.2,0,13,.4,12,concrete);box(0,2.1,0,9,3.8,8,'#626d70');box(0,4.1,0,10,.25,9,dark);box(0,2.6,-4.02,7.8,1.3,.04,'#b5c2c3');
  box(-6,3.4,0,.22,6.8,.22,steel);box(-3.5,6.8,0,6.0,.22,3.5,dark);box(-3.5,6.6,-.4,4,.05,.12,warm,true);
 }else if(id==='depot'){
  box(0,.1,0,16,.2,16,'#485157');for(const [i,z]of [-4,0,4].entries()){
   box(i%2?2:-2,1.4,z,8,2.8,3.1,['#5e5464','#56665b','#605e4f'][i]);for(let j=-3;j<=3;j++)box((i%2?2:-2)+j,1.4,z-1.57,.045,2.6,.03,steel);
  }
  for(const x of[-7,7]){box(x,4,5,.14,8,.14,steel);box(x,8,5,3,.15,.8,'#c7d6d6',true);}
 }else if(id==='gates'){
  box(0,.25,0,7,.5,9,concrete);box(0,6,0,4.4,12,6,'#686d6b');
  for(let i=0;i<6;i++)box(-2.4+i*.96,6.5,-3.35,.16,12.5,1.1,i%2?'#88918b':'#535e60');
  box(0,13,0,6,.45,8,concrete);box(0,11.2,-4.03,3.9,.06,.06,'#d0ff50',true);
 }else{
  box(0,.18,0,5,.36,5,concrete);box(0,4.2,0,2.4,8.4,1.5,'#505d63');box(0,8.5,0,3,.3,2,steel);for(let i=0;i<4;i++)box(0,2+i*1.4,-.77,1.35,.07,.04,i%2?'#62dfff':'#d0ff50',true);
 }
 function bake(parts,material){
  if(!parts.length)return null;const p=[],n=[],c=[];
  for(const item of parts){const a=item.geometry.clone().applyMatrix4(item.matrix),g=a.index?a.toNonIndexed():a,color=new T.Color(item.color),pos=g.attributes.position,normal=g.attributes.normal;
   for(let i=0;i<pos.count;i++){p.push(pos.getX(i),pos.getY(i),pos.getZ(i));n.push(normal.getX(i),normal.getY(i),normal.getZ(i));c.push(color.r,color.g,color.b);}if(g!==a)g.dispose();a.dispose();item.geometry.dispose();}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(n,3));geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));geometry.computeBoundingSphere();geometry.computeBoundingBox();return new T.Mesh(geometry,material);
 }
 const group=new T.Group();for(const o of[bake(solid,solidMaterial),bake(lit,litMaterial)])if(o)group.add(o);cache.set(id,group);return group;
}
export function addWorldLandmarks(root,start){
 for(const landmark of LANDMARKS){if(landmark.s<start||landmark.s>=start+80)continue;
  for(const side of landmark.bothSides?[-1,1]:[landmark.side]){
   const p=sample(landmark.s,side*landmark.offset),g=model(landmark.id).clone(true);g.name=landmark.name;g.userData.landmark=landmark.id;g.userData.roadS=landmark.s;g.userData.lateral=side*landmark.offset;
   g.position.set(p.x,p.y+(landmark.kind==='open'||landmark.kind==='control'||landmark.kind==='frontier'?shoulderHeight(landmark.s,side*landmark.offset)-.18:0),p.z);g.rotation.y=p.angle+(landmark.bothSides&&side<0?Math.PI:0);root.add(g);
  }
 }
}
