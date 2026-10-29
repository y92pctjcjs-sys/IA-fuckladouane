import * as T from './vendor/three.module.min.js';
import {vehicleData} from './assets/vehicle-data.js';
import {surface,palette,softTexture} from './materials.js?v=fld-route-003';
import {createDesignedVehicle} from './vehicle-designs.js?v=fld-route-003';
import {createRoadPrototype,animateRoadBrakes} from './road-vehicles.js?v=fld-route-003';
// Civilian traffic retains Classic Muscle car, Alexus16, CC BY 4.0 (CREDITS.md).
// Player and marked patrol/interceptor are original meshes in vehicle-designs.js.
const geometryCache=new Map();
function bytes(text){return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
function geometry(part,wheel=false){
 const key=part.position;if(geometryCache.has(key))return geometryCache.get(key);
 const q=new Uint16Array(bytes(part.position).buffer),n=new Int16Array(bytes(part.normal).buffer),position=new Float32Array(q.length),normal=new Float32Array(n.length);
 for(let i=0;i<q.length;i++){
  const axis=i%3;let v=part.min[axis]+q[i]/65535*(part.max[axis]-part.min[axis]);
  if(!wheel)v=axis===0?v*.87:axis===1?v*.85+.52:v*.85-.18;
  position[i]=v;normal[i]=n[i]/32767;
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(position,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));geo.setIndex(new T.BufferAttribute(new Uint16Array(bytes(part.index).buffer),1));geo.computeBoundingBox();geo.computeBoundingSphere();geometryCache.set(key,geo);return geo;
}
const box=new T.BoxGeometry(1,1,1);
function block(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
const basic=color=>new T.MeshBasicMaterial({color,toneMapped:false});
const glow={purple:basic(palette.purple),acid:basic(palette.acid),white:basic('#f1f0dd'),red:basic('#ff324f'),amber:basic('#ffad4f'),blue:basic('#4b9eff')};
const materials={glass:new T.MeshPhysicalMaterial({color:palette.glass,metalness:.35,roughness:.12,clearcoat:1,envMapIntensity:1.5}),rubber:surface('#0b0d12',.92),rim:surface('#9b9bad',.23,.86),dark:surface('#11141b',.6,.35),chrome:surface('#9fabc2',.22,.9)};
const paintCache=new Map();
function paintFor(variant){
 const key=variant%3;if(!paintCache.has(key))paintCache.set(key,new T.MeshPhysicalMaterial({color:['#39465c','#653445','#85838c'][key],metalness:.68,roughness:.28,clearcoat:.85,clearcoatRoughness:.18,envMapIntensity:1.6}));return paintCache.get(key);
}
const wheelMeshes=vehicleData.wheel.map(part=>({geo:geometry(part,true),mat:part.material==='Material.002'?materials.rim:materials.rubber}));
const shadowGeometry=new T.PlaneGeometry(2.85,5),shadowMaterial=new T.MeshBasicMaterial({map:softTexture(),transparent:true,opacity:.66,depthWrite:false});
export function createVehicle(kind='fld',variant=0,skin=''){
 if(kind==='fld'||kind==='cop')return createDesignedVehicle(kind,variant,skin);
 // Bounded prototype: one city slot, one shared compact civilian / undercover base.
 // Other traffic and the second undercover keep their reviewed original geometry.
 if(variant===1)return createRoadPrototype('compact',0,kind==='undercover');
 if(kind==='traffic'&&variant===0)return createRoadPrototype('city',0,false);
 const g=new T.Group();g.name='TRAFIC / BERLINE CIVILE';const paint=paintFor(variant),accent=surface('#262d3a',.45,.4);
 for(const part of vehicleData.body){
  const byName={BodyPaint:paint,BodyPaint_Accent:accent,Glass:materials.glass,Chrome:materials.chrome,HeadLight:glow.white,BrakeLight:glow.red,TurnSignal:glow.amber};
  const m=new T.Mesh(geometry(part),byName[part.material]||materials.dark);m.name=part.name;g.add(m);
 }
 g.userData.wheels=[];
 for(const side of [-1,1])for(const z of [-1.105,1.148]){
  const steering=new T.Group(),rolling=new T.Group();steering.position.set(side*.80,.34,z);steering.add(rolling);g.add(steering);
  for(const part of wheelMeshes){const mesh=new T.Mesh(part.geo,part.mat);mesh.scale.setScalar(.95);mesh.rotation.y=side<0?Math.PI:0;rolling.add(mesh);}
  g.userData.wheels.push({steering,rolling,front:z>0});
 }
 for(const side of [-1,1]){
  const pipe=new T.Mesh(new T.CylinderGeometry(.085,.085,.28,10),materials.chrome);pipe.rotation.x=Math.PI/2;pipe.position.set(side*.62,.32,-1.97);g.add(pipe);
 }
 if(kind==='undercover'){
  g.userData.blue=new T.Group();g.userData.red=new T.Group();g.add(g.userData.blue,g.userData.red);
  for(const [index,side] of [-1,1].entries()){
   const signals=index?g.userData.red:g.userData.blue;
   block(signals,side*.44,.60,2.01,.22,.075,.025,glow.blue);
   block(signals,side*.35,1.14,-1.02,.25,.075,.06,glow.blue);
  }
  g.userData.blue.visible=false;g.userData.red.visible=false;
 }
 g.userData.flame=block(g,0,.32,-2.2,.75,.1,.25,glow.purple);g.userData.flame.visible=false;
 const shadow=new T.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;shadow.userData.cpuTextureOnly=true;g.add(shadow);
 g.userData.paint=paint;g.userData.kind=kind;return g;
}
export function animateVehicle(vehicle,race,dt){
 animateRoadBrakes(vehicle,race,dt);
 for(const wheel of vehicle.userData.wheels){wheel.rolling.rotation.x=(wheel.rolling.rotation.x+race.speed*dt/(vehicle.userData.wheelRadius||.33))%(Math.PI*2);if(wheel.front)wheel.steering.rotation.y=race.steer*.3;}
 vehicle.rotation.z=-race.steer*Math.min(race.speed/50,1)*.025;
 vehicle.userData.flame.visible=race.boosting&&race.state==='RACE';
}
