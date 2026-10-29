import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createRace,finish,step,pause,resume} from '../simulation.js';
import {LENGTH,sample} from '../track.js';
import {cinematicDuration,departureStart,departureMotion,victoryPose,victoryShot,victorySample,createVictoryTail} from '../victory-drive.js';
import {createRenderer} from '../renderer.js';
import {canvasSink} from '../tools/canvas-sink.mjs';
function winner(ending='escape'){const r=createRace(()=>ending);Object.assign(r,{state:'RACE',s:LENGTH,time:280,speed:48,x:0});finish(r,true);return r;}

test('the entire head finale and rare encounter precede the driving outro; defeat has none',()=>{
 assert.equal(departureStart({ending:'escape'}),7);assert.equal(departureStart({ending:'love'}),14);
 for(const ending of['escape','love']){
  const r=winner(ending);r.cinematic=departureStart(r.result)-.001;assert.equal(victoryShot(r),null);assert.equal(victoryPose(r).departing,false);
  r.cinematic=departureStart(r.result);assert.equal(victoryPose(r).departing,true);assert.equal(victoryShot(r).blend,0);
 }
 const r=winner();r.result={won:false,ending:'caught'};assert.equal(victoryPose(r),null);assert.equal(victoryShot(r),null);assert.equal(cinematicDuration(r.result),4.5);
});
test('slow motion decelerates smoothly then accelerates without stopping or resetting position',()=>{
 const v0=145/7;assert.equal(departureMotion(0).speed,v0);assert.equal(departureMotion(1).speed,6.5);assert.equal(departureMotion(5).speed,58);
 for(const join of[.45,1.8,3.5]){
  const a=departureMotion(join-1e-6),b=departureMotion(join+1e-6);assert.ok(Math.abs(a.speed-b.speed)<1e-3);assert.ok(b.distance>=a.distance&&b.distance-a.distance<.001);
 }
 for(let t=.01;t<10;t+=.01){const a=departureMotion(t-.00001),b=departureMotion(t+.00001),v=departureMotion(t).speed;assert.ok(v>0);assert.ok(Math.abs((b.distance-a.distance)/.00002-v)<1e-5);}
});
test('camera eases around the moving car then stays fixed while the car continues towards the horizon',()=>{
 const r=winner(),start=departureStart(r.result);let previous=null;
 for(let i=0;i<=780;i++){
  r.cinematic=start+i/100;const shot=victoryShot(r,390/844),pose=victoryPose(r);assert.ok([...shot.position,...shot.target].every(Number.isFinite));assert.ok(shot.fov>=52&&shot.fov<=62);
  if(previous)assert.ok(Math.hypot(...shot.position.map((v,k)=>v-previous[k]))<1.5,'camera must not teleport');previous=shot.position;
  assert.ok(pose.speed>=6.5);
 }
 r.cinematic=start+3.5;const fixed=victoryShot(r).position,near=victoryPose(r).s;r.cinematic=start+7.8;assert.deepEqual(victoryShot(r).position,fixed);assert.ok(victoryPose(r).s>near+200);
 r.state='RESULTS';assert.ok(victoryPose(r,20).s>victoryPose(r,0).s+1000);assert.deepEqual(victoryShot(r,1,false,20).position,fixed);
 const normal=winner();normal.cinematic=8.7;assert.ok(victoryShot(normal,1,true).position[1]>victoryShot(normal,1,false).position[1]);
});
test('the infinite extension joins the authored road without clamping the departing car or changing gameplay samples',()=>{
 const join=LENGTH+320,a=sample(join),b=victorySample(join+.0001);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.001);
 for(const s of[0,3100,13000,13300])assert.deepEqual(victorySample(s,5),sample(s,5));
 assert.ok(Math.hypot(victorySample(16000).x-a.x,victorySample(16000).z-a.z)>2600);
 assert.deepEqual(sample(16000),sample(20000),'the gameplay sampling boundary is preserved');
});
test('finish locks the exact score and elapsed race time while only cinematic time advances to the new result deadline',()=>{
 for(const ending of['escape','love']){
  const r=winner(ending),result=r.result,clock=r.time,distance=r.s;for(let i=0;i<Math.ceil(cinematicDuration(result)*120)-1;i++)step(r,1/120);
  assert.equal(r.state,'ARRIVAL');step(r,.02);assert.equal(r.state,'RESULTS');assert.equal(r.result,result);assert.equal(r.time,clock);assert.equal(r.s,distance);assert.ok(Object.isFrozen(r.result));
 }
 const r=winner(),tail=createVictoryTail();r.state='RESULTS';tail.update(r,.1);assert.equal(tail.update(r,.1),.2);r.previous='RESULTS';r.state='PAUSE';assert.equal(tail.update(r,20),.2);tail.reset();assert.equal(tail.update(createRace(),.1),0);
});
test('the actual car, wheels and camera remain framed, deterministic and frozen in pause; replay removes the outro',()=>{
 const names=['document','innerWidth','innerHeight','devicePixelRatio','addEventListener','removeEventListener'],old=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 Object.assign(globalThis,{document:{createElement:canvasSink},devicePixelRatio:1,addEventListener(){},removeEventListener(){}});
 try{for(const [width,height]of[[320,740],[390,844],[844,390]]){
  Object.assign(globalThis,{innerWidth:width,innerHeight:height});let scene,camera;
  const sink={setPixelRatio(){},setSize(){},dispose(){},info:{},render(s,c){scene=s;camera=c;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}};
  const view=createRenderer({},false,()=>sink,'auto',undefined,{oculaire:{loadModel:()=>new Promise(()=>{})}});
  try{for(const ending of['escape','love']){
   const r=winner(ending),result=JSON.stringify(r.result);view.reset();
   for(let i=0;i<=65;i++){
    r.cinematic=departureStart(r.result)+.8+i*.1;view.render(r,1/60);const inspect=view.inspectVictory(),vehicle=scene.children.find(o=>o.userData.kind==='fld');
    assert.equal(JSON.stringify(r.result),result);assert.equal(r.s,LENGTH);
    if(i<28){
     vehicle.traverseVisible(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,instance=new T.Matrix4();for(let k=0;k<(mesh.isInstancedMesh?mesh.count:1);k++){
      if(mesh.isInstancedMesh)mesh.getMatrixAt(k,instance);else instance.identity();const matrix=mesh.matrixWorld.clone().multiply(instance);
      for(let n=0;n<a.count;n++){const p=new T.Vector3().fromBufferAttribute(a,n).applyMatrix4(matrix).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`vehicle frame ${ending}/${width}/${i}: ${p.toArray()}`);}
     }});
    }
    assert.ok(inspect.wheels.every(Number.isFinite));
   }
   const before=view.inspectVictory();pause(r);for(let i=0;i<20;i++)view.render(r,1/30);assert.deepEqual(view.inspectVictory(),before);resume(r);
   r.state='RESULTS';view.render(r,.1);const a=view.inspectVictory();view.render(r,.1);const b=view.inspectVictory();assert.ok(b.s>a.s);assert.deepEqual(a.camera,b.camera);assert.notDeepEqual(a.wheels,b.wheels);
  }
  view.reset();view.render(createRace(),1/60);assert.equal(view.inspectVictory(),null);assert.equal(scene.getObjectByName('VICTOIRE / ROUTE VERS L’HORIZON').visible,false);
  }finally{view.dispose();}
 }}finally{for(const k of names)if(old[k]===undefined)delete globalThis[k];else globalThis[k]=old[k];}
});
