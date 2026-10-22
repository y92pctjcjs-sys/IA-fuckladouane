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
const labelCache=new Map();
function decal(text,color='#cdff4a',background='#13111b'){
  const key=text+color+background;if(labelCache.has(key))return labelCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,512,128);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='900 82px Arial';c.fillText(text,256,68,480);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
  const mat=new T.MeshBasicMaterial({map,side:T.DoubleSide});labelCache.set(key,mat);return mat;
}
function badge(parent,text,x,y,z,w,h,color,angle=0){const m=new T.Mesh(new T.PlaneGeometry(w,h),decal(text,color));m.position.set(x,y,z);m.rotation.y=angle;parent.add(m);return m;}
const wheelMeshes=vehicleData.wheel.map(part=>({geo:geometry(part,true),mat:part.material==='Material.002'?materials.rim:materials.rubber}));
export function createVehicle(kind='fld',variant=0){
  const g=new T.Group(),police=kind==='cop',traffic=kind==='traffic';g.name=police?'DOUANE / INTERCEPTEUR':'fld® / 89 COMPACTE';
  const paint=new T.MeshPhysicalMaterial({color:police?'#e0e5ee':traffic?['#39465c','#653445','#85838c'][variant%3]:palette.paint,metalness:.68,roughness:.26,clearcoat:.85,clearcoatRoughness:.18,envMapIntensity:1.6});
  const accent=police?surface('#214c92',.37,.6):surface(palette.purple,.35,.52);
  for(const part of vehicleData.body){
    let mat=materials.dark;
    if(part.material==='BodyPaint')mat=paint;else if(part.material==='BodyPaint_Accent')mat=accent;else if(part.material==='Glass')mat=materials.glass;else if(part.material==='Chrome')mat=materials.chrome;else if(part.material==='HeadLight')mat=glow.white;else if(part.material==='BrakeLight')mat=glow.red;else if(part.material==='TurnSignal')mat=emissive('#ffad4f');
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
  if(police){block(g,0,1.29,-.27,1.15,.09,.25,materials.dark);g.userData.blue=block(g,-.32,1.40,-.27,.43,.15,.23,glow.blue);g.userData.red=block(g,.32,1.40,-.27,.43,.15,.23,glow.red);}
  for(const side of[-1,1]){const pipe=new T.Mesh(new T.CylinderGeometry(.085,.085,.28,10),materials.chrome);pipe.rotation.x=Math.PI/2;pipe.position.set(side*.62,.32,-1.97);g.add(pipe);}
  g.userData.flame=block(g,0,.32,-2.2,.75,.1,.25,glow.purple);g.userData.flame.visible=false;
  const shadow=new T.Mesh(new T.PlaneGeometry(2.85,5),new T.MeshBasicMaterial({map:softTexture(),transparent:true,opacity:.66,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;shadow.userData.cpuTextureOnly=true;g.add(shadow);
  g.userData.paint=paint;return g;
}
export function animateVehicle(vehicle,race,dt){
  for(const wheel of vehicle.userData.wheels){wheel.rolling.rotation.x=(wheel.rolling.rotation.x+race.speed*dt/.33)%(Math.PI*2);if(wheel.front)wheel.steering.rotation.y=race.steer*.3;}
  vehicle.rotation.z=-race.steer*Math.min(race.speed/50,1)*.025;
  vehicle.userData.flame.visible=race.boosting&&race.state==='RACE';
}
