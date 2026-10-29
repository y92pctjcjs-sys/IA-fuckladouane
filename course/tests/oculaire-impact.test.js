import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createDamageSpin,SPIN_SECONDS,REDUCED_SPIN_SECONDS,tauntIndex} from '../oculaire-reactions.js';
import {TAUNTS,synthesizeTaunt} from '../oculaire-taunts.js';
import {createOculaire} from '../oculaire.js';
import {META,SURFACES} from '../assets/oculaire/portrait-data.js';
import {createRace,hit,finish,pause,resume,step} from '../simulation.js';
import {sample} from '../track.js';

test('one accepted damaging collision produces one complete turn, repeated frames and invulnerability produce none',()=>{
 const r=createRace(),spin=createDamageSpin();r.state='RACE';r.speed=40;spin.update(r);
 assert.equal(hit(r,11,2,'vehicle'),true);assert.equal(r.health,89);const physics=JSON.stringify(r);
 assert.equal(spin.update(r).active,true);assert.equal(JSON.stringify(r),physics,'decorative reaction must not mutate the simulation');
 for(let i=0;i<20;i++)assert.equal(spin.update(r).serial,1);
 assert.equal(hit(r,17,0,'barrier'),false);assert.equal(r.hitSerial,1);
 let previous=-1;for(let i=0;i<=100;i++){r.time=SPIN_SECONDS*i/101;const p=spin.update(r);assert.ok(p.angle>=previous);previous=p.angle;}
 assert.ok(previous>Math.PI*2-.001);r.time=SPIN_SECONDS;const done=spin.update(r);assert.equal(done.active,false);assert.equal(done.angle,0);assert.equal(done.completed,1);
 r.time=10;assert.equal(spin.update(r).completed,1);
});

test('spin phase is frame-rate independent, freezes in pause, and resets on a new race or rewound clock',()=>{
 const angles=[];for(const hz of[30,60,144]){
  const r=createRace(),spin=createDamageSpin();r.state='RACE';spin.update(r);hit(r,5);spin.update(r);
  for(let i=1;i/hz<.43;i++){r.time=i/hz;spin.update(r);}r.time=.43;const before=spin.update(r);angles.push(before.angle);
  pause(r);for(let i=0;i<50;i++)assert.deepEqual(spin.update(r),before);resume(r);assert.deepEqual(spin.update(r),before);
  r.time=1.1;assert.equal(spin.update(r).completed,1);r.time=0;r.hitSerial=0;assert.equal(spin.update(r).active,false);assert.equal(spin.update(r).completed,0);
  hit(r,5);spin.reset();assert.equal(spin.update(createRace()).active,false);
 }
 assert.ok(Math.max(...angles)-Math.min(...angles)<1e-12);
});

test('normal and reduced full turns finish before the next accepted hit and queued hits each keep their turn',()=>{
 assert.ok(SPIN_SECONDS<1.05&&REDUCED_SPIN_SECONDS<1.05);
 for(const reduced of[false,true]){
  const r=createRace(),spin=createDamageSpin();r.state='RACE';spin.update(r,reduced);hit(r,5);spin.update(r,reduced);
  r.time=(reduced?REDUCED_SPIN_SECONDS:SPIN_SECONDS)/2;assert.ok(Math.abs(spin.update(r,reduced).angle-Math.PI)<1e-10);
  r.time=reduced?REDUCED_SPIN_SECONDS:SPIN_SECONDS;assert.equal(spin.update(r,reduced).completed,1);
 }
 const r=createRace(),spin=createDamageSpin();r.state='RACE';spin.update(r);r.hitSerial=3;spin.update(r);r.time=SPIN_SECONDS*3;assert.equal(spin.update(r).completed,3);assert.equal(spin.update(r).active,false);
});

test('fatal damage completes its spin during interception while victory keeps its own finale',()=>{
 const r=createRace(),spin=createDamageSpin();r.state='RACE';r.health=5;spin.update(r);hit(r,11);finish(r,false,'VÉHICULE HORS SERVICE');assert.equal(spin.update(r).active,true);
 for(let i=0;i<120;i++)step(r,1/120);assert.equal(r.time,0);assert.equal(spin.update(r).completed,1);
 const winner=createRace(),other=createDamageSpin();winner.state='RACE';other.update(winner);hit(winner,5);other.update(winner);finish(winner,true);assert.equal(other.update(winner).active,false);assert.equal(other.update(winner).angle,0);
});

test('every seed alternates three different taunts without an immediate repeat',()=>{
 assert.equal(TAUNTS.length,3);assert.equal(new Set(TAUNTS.map(v=>v.id)).size,3);
 for(let seed=0;seed<100;seed++){
  const indices=Array.from({length:30},(_,n)=>tauntIndex(seed,n+1));
  for(let i=0;i<indices.length;i+=3)assert.equal(new Set(indices.slice(i,i+3)).size,3);
  for(let i=1;i<indices.length;i++)assert.notEqual(indices[i],indices[i-1]);
 }
});

test('three original mono taunts are deterministic, short, finite, distinct and free of clipping or edge clicks',()=>{
 const buffers=TAUNTS.map((_,i)=>synthesizeTaunt(i,48000));let bytes=0;
 for(const [i,data]of buffers.entries()){
  bytes+=data.byteLength;assert.equal(data.length,Math.ceil(TAUNTS[i].duration*48000));assert.deepEqual(data,synthesizeTaunt(i,48000));
  let peak=0,power=0,dc=0;for(const value of data){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));power+=value*value;dc+=value;}
  assert.ok(peak<=.821&&peak>.8);assert.ok(Math.sqrt(power/data.length)>.1);assert.ok(Math.abs(dc/data.length)<1e-4);assert.equal(Math.abs(data[0]),0);assert.equal(Math.abs(data.at(-1)),0);
  assert.ok(data.length/48000<SPIN_SECONDS);
 }
 assert.ok(bytes<460000,'three cached buffers must stay below 460 kB at 48 kHz');
 for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
  let cross=0,pa=0,pb=0;for(let i=0;i<Math.min(buffers[a].length,buffers[b].length);i++){cross+=buffers[a][i]*buffers[b][i];pa+=buffers[a][i]**2;pb+=buffers[b][i]**2;}
  assert.ok(Math.abs(cross/Math.sqrt(pa*pb))<.3,'taunts must differ in waveform and rhythm');
 }
 assert.throws(()=>synthesizeTaunt(3),/moquerie inconnue/);assert.throws(()=>synthesizeTaunt(0,0),/fréquence audio/);
});

function setup(s=3000,aspect=390/844){
 const scene=new T.Scene(),view=createOculaire(scene,{loadModel:async()=>({META,SURFACES})}),player=new T.Group(),p=sample(s),back=sample(s-12),ahead=sample(s+24),camera=new T.PerspectiveCamera(62,aspect,.3,4200);
 player.position.set(p.x,p.y,p.z);scene.add(player);camera.position.set(back.x,back.y+4.3,back.z);camera.lookAt(ahead.x,ahead.y+1.1,ahead.z);camera.updateMatrixWorld(true);
 const r=createRace();Object.assign(r,{state:'RACE',s,time:10,speed:48});r.cops.forEach(c=>c.active=false);return {view,player,camera,r};
}
test('the actual portrait turns rigidly on its local axis, keeps the approved geometry, and returns all five gazes',async()=>{
 const {view,player,camera,r}=setup();await view.ready;view.update(r,player,camera);const neutral=view.root.quaternion.clone(),irises=[];view.root.traverse(o=>{if(/eye_\d_pupil/.test(o.name))irises.push(o);});
 const pupils=irises.map(o=>o.quaternion.clone()),triangles=view.status.triangles,meshes=view.status.meshes;hit(r,5);view.update(r,player,camera);
 r.time=10+SPIN_SECONDS/2;view.update(r,player,camera);const expected=neutral.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI));
 assert.ok(view.root.quaternion.angleTo(expected)<1e-6);assert.equal(view.status.reaction.active,true);assert.equal(view.status.triangles,triangles);assert.equal(view.status.meshes,meshes);assert.equal(view.inspect(camera).markVisible,false);
 irises.forEach((o,i)=>assert.ok(o.quaternion.angleTo(pupils[i])<1e-7));
 pause(r);const paused=view.root.matrixWorld.clone();for(let i=0;i<20;i++)view.update(r,player,camera);assert.deepEqual(view.root.matrixWorld.elements,paused.elements);resume(r);
 r.time=10+SPIN_SECONDS;view.update(r,player,camera);assert.equal(view.status.reaction.active,false);assert.ok(view.root.quaternion.angleTo(neutral)<1e-6);assert.equal(view.status.reaction.completed,1);
 for(const eye of view.inspect(camera).gazes)assert.ok(eye.errorRadians<1e-6);view.reset();assert.equal(view.status.reaction.completed,0);view.dispose();
});

test('the spinning silhouette stays in the real chase-camera frame through narrow formats, lanes and bends',async()=>{
 for(const aspect of[320/740,390/844,844/390]){
  const {view,player,camera,r}=setup(6000,aspect);await view.ready;
  for(const s of[3000,6000,9000,11400])for(const lane of[-5,0,5]){
   view.reset();r.time=10;r.hitSerial=0;r.invulnerable=0;r.s=s;r.x=lane;
   const p=sample(s,lane),back=sample(s-12,lane*.62),ahead=sample(s+24,lane*.7);player.position.set(p.x,p.y,p.z);camera.position.set(back.x,back.y+4.3,back.z);camera.lookAt(ahead.x,ahead.y+1.1,ahead.z);camera.updateMatrixWorld(true);view.update(r,player,camera);hit(r,5);view.update(r,player,camera);
   for(let n=0;n<=12;n++){r.time=10+SPIN_SECONDS*n/12;view.update(r,player,camera);const a=view.inspect(camera);assert.ok(a.screen.min[0]>-1&&a.screen.max[0]<1,`spin horizontal ${s}/${lane}/${aspect}/${n}`);assert.ok(a.screen.min[1]>-.05&&a.screen.max[1]<1,`spin vertical ${s}/${lane}/${aspect}/${n}`);assert.equal(a.markVisible,false);}
  }
  view.dispose();
 }
});
