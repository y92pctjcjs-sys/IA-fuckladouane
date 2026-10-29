import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {META,SURFACES} from '../assets/oculaire/portrait-data.js';
import {adaptOculaireHair} from '../oculaire-hair.js';
import {createOculaire,blinkAt,pursuitSignal,createPursuitMotion} from '../oculaire.js';
import {createRace,pause,resume} from '../simulation.js';
import {sample} from '../track.js';
const source={META,SURFACES},adapted=adaptOculaireHair(source);
function typed(v,Type){return v instanceof Type?v:new Type(Uint8Array.from(atob(v),c=>c.charCodeAt(0)).buffer);}
function mesh(s){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Float32Array.from(typed(s.p,Int16Array),x=>x/8192),3));g.setIndex(new T.BufferAttribute(typed(s.i,Uint16Array),1));const m=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld(true);return m;}

test('dense hair shares the existing draw budget, keeps the source immutable and uses valid finite geometry',()=>{
 const before=JSON.stringify(META),after=adaptOculaireHair(source);assert.equal(JSON.stringify(META),before);assert.equal(after.SURFACES.length,SURFACES.length);
 assert.ok(after.META.triangles<105000);assert.equal(after.META.hair.opaque,true);assert.ok(after.META.hair.locks>100);
 const s=after.SURFACES.find(s=>s.group==='body'&&s.finish==='hair');assert.ok(s.p.length/3<65536);assert.ok(Math.max(...s.i)<s.p.length/3);
 assert.ok([...s.p,...s.n,...s.c].every(Number.isFinite));
});

test('the opaque hair covers the actual upper skull from front, crown, back and both temples',()=>{
 const skin=mesh(adapted.SURFACES.find(s=>s.group==='body'&&s.finish==='skin')),hair=mesh(adapted.SURFACES.find(s=>s.group==='body'&&s.finish==='hair'));
 const shift=new T.Vector3().fromArray(adapted.META.center).sub(new T.Vector3().fromArray(META.center)),center=new T.Vector3(-META.center[0],.1,-.1).sub(shift);
 for(const polar of[.18,.45,.75,1.02,1.25])for(let i=0;i<24;i++){
  const phi=i/24*Math.PI*2,direction=new T.Vector3(Math.sin(polar)*Math.sin(phi),Math.cos(polar),Math.sin(polar)*Math.cos(phi));
  const ray=new T.Raycaster(center.clone().addScaledVector(direction,4),direction.negate(),0,5),body=ray.intersectObject(skin,false)[0],cover=ray.intersectObject(hair,false)[0];
  assert.ok(body&&cover,`scalp sample ${polar}/${i}`);assert.ok(cover.distance<body.distance-.002,`skin breaks through hair at ${polar}/${i}: ${cover.distance} / ${body.distance}`);
 }
 hair.geometry.dispose();skin.geometry.dispose();hair.material.dispose();skin.material.dispose();
});

test('all five eye apertures remain clear of the new fringe and framing locks',()=>{
 const hair=mesh(adapted.SURFACES.find(s=>s.group==='body'&&s.finish==='hair')),camera=new T.Vector3(0,0,6);
 for(const p of adapted.META.eyes){const eye=new T.Vector3().fromArray(p),direction=eye.clone().sub(camera),distance=direction.length();const hit=new T.Raycaster(camera,direction.normalize(),0,distance-.03).intersectObject(hair,false);assert.equal(hit.length,0,`hair covers eye at ${p}`);}
 hair.geometry.dispose();hair.material.dispose();
});

test('blink cadence is about ten brief irregular closures per minute and deterministic across restarts',()=>{
 let count=0,previous=false,start=0;const events=[];
 for(let t=0;t<300;t+=1/240){const closed=blinkAt(t,5678,2,false)>.2;if(closed&&!previous){count++;start=t;events.push(t);}if(!closed&&previous)assert.ok(t-start<.22);previous=closed;}
 assert.ok(count>=48&&count<=52);assert.ok(count/(300/7.7)>1.2&&count/(300/7.7)<1.4);
 assert.ok(new Set(events.slice(1).map((t,i)=>(t-events[i]).toFixed(1))).size>5);
 assert.equal(blinkAt(37.123,5678,3,false),blinkAt(37.123,5678,3,false));
});

test('only revealed active rear patrols drive head reactions, weighted by real distance and side',()=>{
 const r=createRace();Object.assign(r,{s:3000,x:0,state:'RACE',time:0});r.cops.forEach(c=>Object.assign(c,{active:false,s:2980,x:5}));assert.deepEqual(pursuitSignal(r),{side:0,threat:0});
 r.cops[0].active=true;const left=pursuitSignal(r);assert.ok(left.side>0&&left.threat>0);r.cops[0].x=-5;assert.ok(pursuitSignal(r).side<0);
 r.cops[0].s=3005;assert.deepEqual(pursuitSignal(r),{side:0,threat:0});r.cops[0].s=2850;assert.deepEqual(pursuitSignal(r),{side:0,threat:0});
 r.cops[0].s=2885;const far=pursuitSignal(r);r.cops[0].s=2990;assert.ok(pursuitSignal(r).threat>far.threat);
});

test('pursuit motion is smooth, frame-rate independent, frozen in pause and reset for a new run',()=>{
 const outputs=[];
 for(const hz of[30,60,144]){const motion=createPursuitMotion(),r=createRace();Object.assign(r,{s:3000,x:0,state:'RACE',time:0});r.cops.forEach(c=>c.active=false);Object.assign(r.cops[0],{active:true,s:2990,x:5});motion.update(r);let state;
  for(let i=0;i<hz;i++){r.time=(i+1)/hz;state=motion.update(r);}outputs.push(state.side);
  const before=state.side;r.cops[0].x=-5;r.time+=1/hz;state=motion.update(r);assert.ok(state.side>0&&state.side<before);
  pause(r);const frozen=motion.update(r);r.time+=4;assert.deepEqual(motion.update(r),frozen);resume(r);motion.reset();assert.deepEqual(motion.update(r),{side:0,threat:0});
 }
 assert.ok(Math.max(...outputs)-Math.min(...outputs)<1e-10);
});

test('five pupils keep converging on the player through the new police-driven rotation, lanes and bends',async()=>{
 const scene=new T.Scene(),head=createOculaire(scene,{loadModel:async()=>source}),player=new T.Group();scene.add(player);await head.ready;
 const camera=new T.PerspectiveCamera(62,320/740,.3,4200),r=createRace();r.state='RACE';r.speed=48;r.cops.forEach(c=>c.active=true);
 for(const s of[600,2400,4400,6100,8400,11700])for(const x of[-5,0,5])for(const direction of[-1,1]){
  const p=sample(s,x),behind=sample(s-12,x*.62),ahead=sample(s+24,x*.7);player.position.set(p.x,p.y+.015,p.z);camera.position.set(behind.x,behind.y+4.3,behind.z);camera.lookAt(ahead.x,ahead.y+1.1,ahead.z);camera.updateMatrixWorld(true);
  Object.assign(r,{s,x,time:0});r.cops.forEach((c,i)=>Object.assign(c,{s:s-8-i*12,x:x+direction*5,phase:'flank'}));head.reset();
  for(let i=0;i<=120;i++){r.time=i/60;head.update(r,player,camera);}const view=head.inspect(camera);
  assert.ok(view.pursuit.side*direction>0);for(const gaze of view.gazes)assert.ok(gaze.errorRadians<1e-6);
  assert.ok(view.screen.min[0]>-1&&view.screen.max[0]<1,`patrol movement clips at ${s}/${x}/${direction}`);
 }
 head.dispose();
});
