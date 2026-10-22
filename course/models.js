import * as T from './vendor/three.module.min.js';
import {vehicleData} from './assets/vehicle-data.js';
import {surface,palette,softTexture} from './materials.js';
// Geometry: Classic Muscle car, Alexus16, CC BY 4.0; full attribution in CREDITS.md.
const geometryCache=new Map();
function bytes(text){return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
function geometry(part, wheel=false){
  const key=part.position;if(geometryCache.has(key))return geometryCache.get(key);
  const q=new Uint16Array(bytes(part.position).buffer),n=new Int16Array(bytes(part.normal).buffer),position=new Float32Array(q.length),normal=new Float32Array(n.length);
  for(let i=0;i<q.length;i++){
    const axis=i%3;let v=part.min[axis]+q[i]/65535*(part.max[axis]-part.min[axis]);
    if(!wheel)v=axis===0?v*.87:axis===1?v*.85+.52:v*.85-.18;
    position[i]=v;normal[i]=n[i]/32767;
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(position,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));geo.setIndex(new T.BufferAttribute(new Uint16Array(bytes(part.index).buffer),1));geo.computeBoundingBox();geo.computeBoundingSphere();geometryCache.set(key,geo);return geo;
}
function block(parent,x,y,z,w,h,d,mat){const mesh=new T.Mesh(block.geometry,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
block.geometry=new T.BoxGeometry(1,1,1);
const emissive=(color)=>new T.MeshBasicMaterial({color,toneMapped:false});
const glow={purple:emissive(palette.purple),acid:emissive(palette.acid),white:emissive('#f1f0dd'),red:emissive('#ff324f'),blue:emissive('#4b9eff')};
const materials={glass:new T.MeshPhysicalMaterial({color:palette.glass,metalness:.35,roughness:.12,clearcoat:1,envMapIntensity:1.5}),rubber:surface('#0b0d12',.92),rim:surface('#9b9bad',.23,.86),dark:surface('#11141b',.6,.35),chrome:surface('#9fabc2',.22,.9)};
const labelCache=new Map(),planeGeometry=new T.PlaneGeometry(1,1);
const lampAmber=emissive('#ffad4f');
const paintCache=new Map();
function paintFor(key,color){if(!paintCache.has(key))paintCache.set(key,new T.MeshPhysicalMaterial({color,metalness:.68,roughness:.28,clearcoat:.85,clearcoatRoughness:.18,envMapIntensity:1.6}));return paintCache.get(key);}
function decal(text,color='#cdff4a',background='#13111b'){
  const key=text+color+background;if(labelCache.has(key))return labelCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,512,128);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='900 82px Arial';c.fillText(text,256,68,480);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
  const mat=new T.MeshBasicMaterial({map,side:T.DoubleSide});labelCache.set(key,mat);return mat;
}
function badge(parent,text,x,y,z,w,h,color,angle=0){const m=new T.Mesh(planeGeometry,decal(text,color));m.scale.set(w,h,1);m.position.set(x,y,z);m.rotation.y=angle;parent.add(m);return m;}
const wheelMeshes=vehicleData.wheel.map(part=>({geo:geometry(part,true),mat:part.material==='Material.002'?materials.rim:materials.rubber}));
export function createVehicle(kind='fld',variant=0){
  if(kind==='cop'&&variant%2===0)return createPatrol();
  const g=new T.Group(),police=kind==='cop',traffic=kind==='traffic';g.name=police?'DOUANE / INTERCEPTEUR':'fld® / 89 COMPACTE';
  const paint=paintFor(kind+variant,police?'#e0e5ee':traffic?['#39465c','#653445','#85838c'][variant%3]:palette.paint);
  const accent=police?surface('#214c92',.37,.6):surface(palette.purple,.35,.52);
  for(const part of vehicleData.body){
    let mat=materials.dark;
    if(part.material==='BodyPaint')mat=paint;else if(part.material==='BodyPaint_Accent')mat=accent;else if(part.material==='Glass')mat=materials.glass;else if(part.material==='Chrome')mat=materials.chrome;else if(part.material==='HeadLight')mat=glow.white;else if(part.material==='BrakeLight')mat=glow.red;else if(part.material==='TurnSignal')mat=lampAmber;
    const m=new T.Mesh(geometry(part),mat);m.name=part.name;g.add(m);
  }
  g.userData.wheels=[];
  for(const side of [-1,1])for(const z of [-1.105,1.148]){
    const steering=new T.Group(),rolling=new T.Group();steering.position.set(side*.80,.34,z);steering.add(rolling);g.add(steering);
    // Turn the left wheel outward without a negative scale, keeping instancing valid.
    for(const part of wheelMeshes){const mesh=new T.Mesh(part.geo,part.mat);mesh.scale.setScalar(.95);mesh.rotation.y=side<0?Math.PI:0;rolling.add(mesh);}
    g.userData.wheels.push({steering,rolling,front:z>0});

  }
  for(const side of[-1,1])block(g,side*.88,.33,0,.03,.045,2.35,police?glow.blue:glow.acid);
  if(!traffic){
    // A low wing and a distinct FLD livery, independent from the source model.
    block(g,0,1.05,-1.75,1.91,.075,.31,accent);for(const x of[-.58,.58])block(g,x,.94,-1.72,.065,.22,.11,materials.dark);
    badge(g,police?'DOUANE':'fld®',0,.78,-2.025,1.05,.26,police?'#ffffff':'#cdff4a',Math.PI);
    const hood=badge(g,police?'DOUANE':'fld®',0,.72,1.27,1.15,.46,police?'#ffffff':'#cdff4a');hood.rotation.x=-Math.PI/2;
    for(const side of[-1,1])badge(g,police?'DOUANE':'fld® 89',side*.895,.67,-.13,1.04,.31,police?'#ffffff':'#b993ff',side*Math.PI/2);
  }
  if(police){
    for(const side of[-1,1]){block(g,side*.91,.61,1.88,.09,.36,.15,materials.dark);block(g,side*.91,.96,.5,.19,.12,.25,materials.dark);}
    block(g,0,.49,2.01,1.72,.14,.13,materials.dark);
    block(g,0,1.29,-.27,1.15,.09,.25,materials.dark);g.userData.blue=block(g,-.32,1.40,-.27,.43,.15,.23,glow.blue);g.userData.red=block(g,.32,1.40,-.27,.43,.15,.23,glow.blue);}
  for(const side of[-1,1]){const pipe=new T.Mesh(new T.CylinderGeometry(.085,.085,.28,10),materials.chrome);pipe.rotation.x=Math.PI/2;pipe.position.set(side*.62,.32,-1.97);g.add(pipe);}
  g.userData.flame=block(g,0,.32,-2.2,.75,.1,.25,glow.purple);g.userData.flame.visible=false;
  const shadow=new T.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;shadow.userData.cpuTextureOnly=true;g.add(shadow);
  g.userData.paint=paint;g.userData.kind=kind;return g;
}
const shadowGeometry=new T.PlaneGeometry(2.85,5),shadowMaterial=new T.MeshBasicMaterial({map:softTexture(),transparent:true,opacity:.66,depthWrite:false});

// Original procedural patrol: a high estate body, entirely distinct from the muscle interceptor.
const patrolCache=new Map();
function loft(key,sections){
 if(patrolCache.has(key))return patrolCache.get(key);
 const positions=[],indices=[];
 for(const [z,w,b,h] of sections)positions.push(-w,b,z,w,b,z,w,h-.12,z,w*.82,h,z,-w*.82,h,z,-w,h-.12,z);
 for(let i=1;i<sections.length;i++)for(let j=0;j<6;j++){const a=(i-1)*6+j,b=(i-1)*6+(j+1)%6,c=i*6+j,d=i*6+(j+1)%6;indices.push(a,b,c,b,d,c);}
 indices.push(0,2,1,0,4,2,0,5,4);const n=(sections.length-1)*6;indices.push(n,n+1,n+2,n,n+2,n+4,n,n+4,n+5);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();patrolCache.set(key,geo);return geo;
}
function createPatrol(){
 const g=new T.Group();g.name='DOUANE / PATROUILLE HAUTE';g.userData.kind='cop';g.userData.paint=paintFor('patrol','#dce3ea');
 const body=new T.Mesh(loft('body',[[-2.04,.83,.49,.94],[-1.65,.94,.48,1.02],[1.18,.94,.48,1.01],[2.04,.84,.50,.89]]),g.userData.paint);body.name='PatrolBody';g.add(body);
 const cabin=new T.Mesh(loft('cabin',[[-1.64,.83,.91,1.45],[-1.32,.83,.96,1.64],[.45,.81,.96,1.65],[1.12,.81,.96,1.02]]),materials.glass);g.add(cabin);
 block(g,0,1.66,-.39,1.42,.08,1.72,paintFor('navy','#142b4a'));
 for(const side of[-1,1]){
   block(g,side*.945,.80,-.12,.018,.24,2.7,surface('#16375c',.4,.5));
   for(const z of[-1.25,-.4,.54])block(g,side*.81,1.31,z,.09,.63,.07,materials.dark);
   block(g,side*.96,1.03,.78,.12,.13,.30,materials.dark);
   block(g,side*.65,.88,2.051,.46,.14,.035,glow.white);
   block(g,side*.75,.85,-2.051,.18,.23,.035,glow.red);
   for(const z of[-.65,.36])block(g,side*.95,1.01,z,.025,.035,.17,materials.chrome);
   badge(g,'DOUANE',side*.958,.80,-.15,1.32,.24,'#ffffff',side*Math.PI/2);
   block(g,side*.60,1.74,-.5,.08,.08,1.9,materials.dark);
 }
 block(g,0,.65,2.055,1.31,.20,.07,materials.dark);for(const y of[.59,.66,.73])block(g,0,y,2.10,1.1,.017,.015,materials.chrome);
 block(g,0,.48,2.09,1.75,.12,.06,materials.dark);block(g,0,.52,-2.09,1.75,.15,.06,materials.dark);
 badge(g,'DOUANE',0,.8,-2.06,1.23,.24,'#ffffff',Math.PI);
 block(g,0,1.76,-.26,1.21,.08,.27,materials.dark);g.userData.blue=block(g,-.35,1.87,-.26,.45,.15,.24,glow.blue);g.userData.red=block(g,.35,1.87,-.26,.45,.15,.24,glow.blue);
 block(g,.55,1.94,-.91,.025,.42,.025,materials.dark);
 g.userData.wheels=[];
 for(const side of[-1,1])for(const z of[-1.29,1.25]){
   const steering=new T.Group(),rolling=new T.Group();steering.position.set(side*.83,.36,z);steering.add(rolling);g.add(steering);
   for(const part of wheelMeshes){const mesh=new T.Mesh(part.geo,part.mat);mesh.rotation.y=side<0?Math.PI:0;rolling.add(mesh);}
   g.userData.wheels.push({steering,rolling,front:z>0});
 }
 const shadow=new T.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;shadow.userData.cpuTextureOnly=true;g.add(shadow);
 g.userData.flame=block(g,0,.3,-2.2,.1,.1,.1,glow.purple);g.userData.flame.visible=false;return g;
}
export function animateVehicle(vehicle,race,dt){
  for(const wheel of vehicle.userData.wheels){wheel.rolling.rotation.x=(wheel.rolling.rotation.x+race.speed*dt/.33)%(Math.PI*2);if(wheel.front)wheel.steering.rotation.y=race.steer*.3;}
  vehicle.rotation.z=-race.steer*Math.min(race.speed/50,1)*.025;
  vehicle.userData.flame.visible=race.boosting&&race.state==='RACE';
}
