import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from '../renderer.js';
import {createRace} from '../simulation.js';
import {LENGTH} from '../track.js';
import {testCanvas} from './helpers/canvas.js';

test('actual Three scene, track and instanced vehicles build without missing geometry or invalid camera transforms', () => {
 const names=['document','devicePixelRatio','innerWidth','innerHeight','addEventListener','removeEventListener'];
 const previous=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 let calls=0, maxDraws=0;
 globalThis.document={createElement:testCanvas};
 globalThis.devicePixelRatio=3;globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
 const fake={setPixelRatio(r){assert.equal(r,1.25);},setSize(w,h){assert.equal(w,390);assert.equal(h,844);},dispose(){},info:{},render(scene,camera){
  calls++;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  assert.ok(camera.isPerspectiveCamera);assert.ok(camera.position.toArray().every(Number.isFinite));assert.ok(camera.quaternion.toArray().every(Number.isFinite));
  let draws=0,instances=0;scene.traverseVisible(o=>{if(o.isMesh){draws++;assert.ok(o.geometry.attributes.position.count>0);assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isInstancedMesh)instances+=o.count;}});
  assert.ok(instances>20);maxDraws=Math.max(maxDraws,draws);assert.ok(draws<350,`visible draw calls ${draws}`);
 }};
 try {
  const view=createRenderer({},true,()=>fake), r=createRace(()=> 'love');
  for(const s of [0,1700,3000,5500,7000,8500,11900]){r.state='RACE';r.s=s;r.speed=48;r.cops.forEach(c=>{c.s=s-12;c.active=true;});r.traffic.forEach((c,i)=>c.s=s+50+i*100);view.render(r,1/60);assert.ok(view.metrics.chunks<=10);}
  r.s=LENGTH;r.result={won:true,ending:'love'};r.state='ARRIVAL';for(const time of [0,4,6,10,13]){r.cinematic=time;view.render(r,1/60);assert.ok(view.metrics.chunks<=10);}
  r.result={won:true,ending:'escape'};r.cinematic=4;view.render(r,1/60);r.result={won:false,ending:'caught'};r.state='INTERCEPTION';view.render(r,1/60);
  view.reset();view.render(createRace(),1/60);
  view.dispose();assert.equal(calls,15);assert.ok(maxDraws>50);
 } finally {for(const k of names){if(previous[k]===undefined)delete globalThis[k];else globalThis[k]=previous[k];}}
});
