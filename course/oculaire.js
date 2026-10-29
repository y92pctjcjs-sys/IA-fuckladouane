import * as T from './vendor/three.module.min.js';
import {sample,LENGTH,STAGES,sectorAt,blockadeAhead,beatAt} from './track.js?v=oculaire-003';
import {createOculaireFinale} from './oculaire-finale.js?v=oculaire-003';

export const WORDS=Object.freeze([
 'Tu conduis depuis l’intérieur de mes paupières.',
 'Le fil se souvient d’une peau qu’il n’a jamais touchée.',
 'Le ciel a été cousu sur l’envers.',
 'Ce tunnel passe derrière mon visage.',
 'Quelqu’un porte ton visage dans l’autre sens.',
 'L’étiquette est à l’intérieur du souvenir.'
]);
export const GROWTH=Object.freeze([1,1.06,1.12,1.18,1.25]);
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};
export function growthAt(s){const i=sectorAt(s),stage=STAGES[i];return i===0?1:T.MathUtils.lerp(GROWTH[i-1],GROWTH[i],smooth((s-stage.start)/300));}
export function dangerous(r){return Boolean(blockadeAhead(r.s,r.speed)||r.capture>.15||r.time-r.lastRevealTime<4||r.impact>.1||r.drifting||r.s-beatAt(r.s).s<130);}
export function createWhispers(){
 let index=0,until=-1,text='',mouth=-1,seed=0,order=[],lastTime=0,nextAllowed=0;
 const gates=[650,2700,4700,6100,9500,11300];
 function reset(value=0){index=0;until=-1;text='';mouth=-1;lastTime=0;nextAllowed=0;seed=value>>>0;order=WORDS.map((_,i)=>i).sort((a,b)=>hash(seed+a*971)-hash(seed+b*971));}
 reset();
 return {reset,update(r){
  if(r.time<lastTime||r.seed!==seed)reset(r.seed);lastTime=r.time;
  if(r.state!=='RACE')return {text:'',mouth:-1};
  const blocked=dangerous(r);
  if(text&&(r.time>=until||blocked)){text='';mouth=-1;}
  if(!text&&!blocked&&r.time>=nextAllowed&&index<gates.length&&r.s>=gates[index]){mouth=order[index]%3;text=WORDS[order[index++]];until=r.time+4.8;nextAllowed=r.time+23;}
  return {text,mouth};
 }};
}
function decode(value,Type){const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return new Type(bytes.buffer);}
function geometry(surface){
 const g=new T.BufferGeometry(),p=decode(surface.p,Int16Array),n=decode(surface.n,Int8Array);
 g.setAttribute('position',new T.Float32BufferAttribute(Float32Array.from(p,x=>x/8192),3));
 g.setAttribute('normal',new T.BufferAttribute(n,3,true));g.setAttribute('color',new T.BufferAttribute(decode(surface.c,Uint8Array),3,true));
 g.setIndex(new T.BufferAttribute(decode(surface.i,Uint16Array),1));g.computeBoundingSphere();return g;
}
function blinkAt(time,seed,i,reduced){
 const cycle=Math.floor(time/7.7),start=1.7+hash(seed+cycle*61)*4.7;
 const offset=reduced?0:hash(seed+cycle*73)>.74?i*.018:0;
 const t=(time-cycle*7.7-start-offset)/.21;
 return t>=0&&t<=1?Math.sin(t*Math.PI)**2:0;
}

// Reuses the approved surfaces as a bounded game asset. The source file stays intact.
export function createOculaire(scene,{loadModel=()=>import('./assets/oculaire/portrait-data.js?v=oculaire-003'),report=()=>{}}={}){
 const root=new T.Group();root.name='OCULAIRE';root.visible=false;scene.add(root);
 const face=new T.Group();root.add(face);
 const eyes=[],mouths=[],resources=new Set(),whispers=createWhispers();
 const status={state:'loading',error:null,meshes:0,triangles:0,growth:1,caption:'',mouth:-1,phase:'sky',fragments:0};
 const target=new T.Vector3(),worldEye=new T.Vector3(),localTarget=new T.Vector3();
 let meta,finale,disposed=false,reduced=false,seed=-1;
 const ready=Promise.resolve().then(loadModel).then(data=>{
  if(disposed)return;
  if(!data.META||!Array.isArray(data.SURFACES))throw new Error('OCULAIRE: données de portrait absentes.');
  meta=data.META;
  const materials=new Map();
  function material(finish){
   if(!materials.has(finish)){
    const m=new T.MeshStandardMaterial({vertexColors:true,roughness:finish==='iris'?.27:finish==='metal'?.22:.77,metalness:finish==='metal'?.7:0,side:T.DoubleSide,fog:false,toneMapped:false});
    resources.add(m);materials.set(finish,m);
   }
   return materials.get(finish);
  }
  meta.eyes.forEach((p,i)=>{
   const assembly=new T.Group();assembly.name=`eye_${i}`;assembly.position.fromArray(p);face.add(assembly);
   const globe=new T.Group();assembly.add(globe);
   const iris=new T.Group();iris.name=`eye_${i}_pupil`;globe.add(iris);
   // The baked outer eye axes follow the skull curvature. Remove their neutral yaw before aiming.
   const forward=new T.Vector3(Math.sin([- .943,- .228,0,.228,.943][i]),0,Math.cos([-.943,-.228,0,.228,.943][i]));
   eyes.push({assembly,globe,iris,forward,gaze:new T.Vector3(),blink:0});
  });
  meta.mouths.forEach((p,i)=>{const group=new T.Group();group.position.fromArray(p);group.name=`mouth_${i}`;face.add(group);mouths.push(group);});
  for(const surface of data.SURFACES){
   const g=geometry(surface);resources.add(g);const mesh=new T.Mesh(g,material(surface.finish));mesh.name=`${surface.group}_${surface.finish}`;
   if(surface.group.startsWith('eye_')){
    const eye=eyes[Number(surface.group.slice(4))];g.translate(-eye.assembly.position.x,-eye.assembly.position.y,-eye.assembly.position.z);
    (surface.finish==='iris'?eye.iris:surface.finish==='sclera'?eye.globe:eye.assembly).add(mesh);
   }else if(surface.group.startsWith('mouth_')){
    const mouth=mouths[Number(surface.group.slice(6))];g.translate(-mouth.position.x,-mouth.position.y,-mouth.position.z);mouth.add(mesh);
   }else face.add(mesh);
  }
  finale=createOculaireFinale(scene,face,data);face.add(finale.mark);
  status.meshes=data.SURFACES.length;status.triangles=meta.triangles;status.state='ready';root.visible=true;report({...status});
 }).catch(error=>{status.state='error';status.error=`${error.name}: ${error.message}`;root.visible=false;report({...status});console.error('OCULAIRE adaptation:',error);});
 function sky(r,player,camera){
  const p=sample(Math.min(LENGTH+200,r.s+40));const dx=p.x-camera.position.x,dz=p.z-camera.position.z,d=Math.hypot(dx,dz)||1;
  const scale=34/meta.height*growthAt(r.s);root.scale.setScalar(scale);
  root.position.set(camera.position.x+dx/d*210,p.y+33,camera.position.z+dz/d*210);
  target.copy(player.position);target.y+=.9;root.lookAt(target);root.updateMatrixWorld(true);
 }
 function reset(){seed=-1;whispers.reset();finale?.reset();face.visible=true;root.visible=status.state==='ready';Object.assign(status,{growth:1,caption:'',mouth:-1,phase:'sky',fragments:0});}
 return {
  root,ready,reset,
  setReduced(value){reduced=Boolean(value);},
  shot(r){return finale?.shot(r);},
  update(r,player,camera){
   if(status.state!=='ready'||disposed)return;
   if(seed!==r.seed){seed=r.seed;whispers.reset(seed);finale.reset();}
   status.growth=growthAt(r.s);const speech=whispers.update(r);status.caption=speech.text;status.mouth=speech.mouth;
   root.visible=true;face.visible=true;
   if(r.result?.won&&['ARRIVAL','PAUSE','RESULTS'].includes(r.state)){
    const result=finale.update(r,root,camera,reduced);status.phase=result.phase;status.fragments=result.fragments;
   }else{
    finale.reset();sky(r,player,camera);status.phase='sky';status.fragments=0;
   }
   root.updateMatrixWorld(true);
   // Convert the same stable car target into the head frame separately for every eye.
   target.copy(player.position);target.y+=.9;localTarget.copy(target);root.worldToLocal(localTarget);
   for(const [i,eye]of eyes.entries()){
    const direction=localTarget.clone().sub(eye.assembly.position).normalize();
    eye.iris.quaternion.setFromUnitVectors(eye.forward,direction);eye.gaze.copy(direction);
    eye.blink=blinkAt((r.time||0)+(r.result?.won?r.cinematic||0:0),seed,i,reduced);
    eye.globe.scale.y=1-eye.blink*.98;
   }
   mouths.forEach((mouth,i)=>{mouth.scale.y=1+(speech.mouth===i?Math.sin((r.time||0)*17)*.035:0);});
   root.updateMatrixWorld(true);
  },
  get status(){return {...status};},
  inspect(camera){
   if(!meta)return {...status};
   root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
   const box=new T.Box3().setFromObject(face),screen=new T.Box2();
   for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
    const p=new T.Vector3(x,y,z).project(camera);screen.expandByPoint(new T.Vector2(p.x,p.y));
   }
   const direction=root.position.clone().sub(camera.position),objects=[];
   scene.traverseVisible(o=>{if(!o.isMesh)return;for(let parent=o;parent;parent=parent.parent)if(parent===root||parent===finale?.effects)return;if(o.material.depthWrite&&o.material.opacity>.95)objects.push(o);});
   const hits=new T.Raycaster(camera.position,direction.clone().normalize(),camera.near,Math.max(.31,direction.length()-20)).intersectObjects(objects,false);
   const gazes=eyes.map(eye=>{
    worldEye.copy(eye.assembly.position);root.localToWorld(worldEye);
    const actual=eye.forward.clone().applyQuaternion(eye.iris.quaternion).transformDirection(root.matrixWorld),wanted=target.clone().sub(worldEye).normalize();
    return {origin:worldEye.toArray(),direction:actual.toArray(),errorRadians:actual.angleTo(wanted),blink:eye.blink};
   });
   return {...status,features:['eye_0','eye_1','eye_2','eye_3','eye_4','nose_0','nose_1','nose_2','mouth_0','mouth_1','mouth_2'],position:root.position.toArray(),screen:{min:screen.min.toArray(),max:screen.max.toArray()},occludedAtCenter:hits.length>0,gazes,markVisible:Boolean(finale?.mark.visible),gpuBytes:finale?.gpuBytes||0};
  },
  dispose(){disposed=true;finale?.dispose();for(const value of resources)value.dispose();root.removeFromParent();}
 };
}
