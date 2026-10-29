import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from '../renderer.js';
import {createRace} from '../simulation.js';
import {LENGTH} from '../track.js';
import {canvasSink} from '../tools/canvas-sink.mjs';

test('actual Three scene, track and instanced vehicles build without missing geometry or invalid camera transforms', () => {
 const names=['document','devicePixelRatio','innerWidth','innerHeight','addEventListener','removeEventListener'];
 const previous=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 let calls=0, maxDraws=0;
 globalThis.document={createElement:canvasSink};
 globalThis.devicePixelRatio=3;globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
 const fake={setPixelRatio(r){assert.equal(r,1.25);},setSize(w,h){assert.equal(w,390);assert.equal(h,844);},dispose(){},info:{},render(scene,camera){
  calls++;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  assert.ok(camera.isPerspectiveCamera);assert.ok(camera.position.toArray().every(Number.isFinite));assert.ok(camera.quaternion.toArray().every(Number.isFinite));
  let draws=0,instances=0;scene.traverseVisible(o=>{if(o.isMesh){draws++;assert.ok(o.geometry.attributes.position.count>0);assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isInstancedMesh)instances+=o.count;}});
  assert.ok(instances>20);maxDraws=Math.max(maxDraws,draws);assert.ok(draws<350,`visible draw calls ${draws}`);
 }};
 try {
  const view=createRenderer({},true,()=>fake,'auto',undefined,{oculaire:{loadModel:()=>new Promise(()=>{})}}), r=createRace(()=> 'love');
  for(const s of [0,1700,3000,5500,7000,8500,11900]){r.state='RACE';r.s=s;r.speed=48;r.cops.forEach(c=>{c.s=s-12;c.active=true;});r.traffic.forEach((c,i)=>c.s=s+50+i*100);view.render(r,1/60);assert.ok(view.metrics.chunks<=10);}
  r.s=LENGTH;r.result={won:true,ending:'love'};r.state='ARRIVAL';for(const time of [0,4,6,10,13]){r.cinematic=time;view.render(r,1/60);assert.ok(view.metrics.chunks<=10);}
  r.result={won:true,ending:'escape'};r.cinematic=4;view.render(r,1/60);r.result={won:false,ending:'caught'};r.state='INTERCEPTION';view.render(r,1/60);
  view.reset();view.render(createRace(),1/60);
  view.dispose();assert.equal(calls,15);assert.ok(maxDraws>50);
 } finally {for(const k of names){if(previous[k]===undefined)delete globalThis[k];else globalThis[k]=previous[k];}}
});

test('skin equipment and random marked liveries preserve the same two hidden civilian units',()=>{
 const names=['document','devicePixelRatio','innerWidth','innerHeight','addEventListener','removeEventListener'];
 const previous=Object.fromEntries(names.map(k=>[k,globalThis[k]]));let scene;
 globalThis.document={createElement:canvasSink};globalThis.devicePixelRatio=1;globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.addEventListener=globalThis.removeEventListener=()=>{};
 const sink={setPixelRatio(){},setSize(){},dispose(){},info:{},render(value){scene=value;}};
 const canvas={dataset:{}},race=createRace();let view;
 try{
  view=createRenderer(canvas,true,()=>sink,'auto',{fld:'seraph',cop:'infernal'},{oculaire:{loadModel:()=>new Promise(()=>{})}});view.render(race,1/60);
  const hidden=[];scene.traverse(o=>{if(o.userData.kind==='undercover')hidden.push(o);});assert.equal(hidden.length,2);
  const paint=hidden.map(o=>o.userData.paint),geometry=hidden.map(o=>o.getObjectByName('Chassis').geometry);
  for(const [fld,cop]of [['cursed','wreck'],['nightrunner','patrol'],['seraph','mixed']])for(const seed of [0,1,2]){
   view.setAppearance({fld,cop},seed);view.render(race,1/60);
   assert.equal(canvas.dataset.vehicle,fld);assert.equal(canvas.dataset.patrols,(cop==='mixed'?['patrol','infernal','wreck'][seed]:cop)+',undercover,undercover');
   for(const [i,unit]of hidden.entries()){
    assert.equal(unit.parent,scene);assert.equal(unit.userData.paint,paint[i]);assert.equal(unit.getObjectByName('Chassis').geometry,geometry[i]);assert.equal(unit.userData.blue.visible,false);assert.equal(unit.userData.red.visible,false);
   }
  }
  race.state='RACE';race.s=200;race.cops.forEach(c=>Object.assign(c,{s:180,active:true,undercover:false}));view.render(race,1/60);
  for(const unit of hidden){assert.equal(unit.visible,true);assert.equal(unit.userData.blue.visible,true);}
 }finally{view?.dispose();for(const k of names){if(previous[k]===undefined)delete globalThis[k];else globalThis[k]=previous[k];}}
});
