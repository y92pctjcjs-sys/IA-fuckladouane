// CPU measurements only. A scene sink is not a GPU or phone benchmark.
import {performance} from 'node:perf_hooks';
import {createRace,start,step,createClock,emptyInput} from '../simulation.js';
import {LENGTH,BLOCKADES,curvature,sectorAt} from '../track.js';
import {createRenderer} from '../renderer.js';
import {canvasSink} from './canvas-sink.mjs';
import {driver} from './driver.mjs';
const runs=[];
for(const boost of [false,true])for(const hz of [30,60,144]){
 const r=createRace(()=> 'escape'),sectors=new Set();start(r);const clock=createClock(r,()=>driver(r,boost));const begin=performance.now();
 for(let frame=0;frame<hz*400&&!r.result;frame++){clock.advance(1/hz);if(r.state==='RACE')sectors.add(sectorAt(r.s));}
 runs.push({hz,profile:boost?'pursuit_nitro_brake':'traffic_only',won:r.result?.won,time:r.result?.time,health:r.health,drifts:r.drifts,score:r.result?.score,reveals:r.undercoverReveals,sectors:sectors.size,cpuMs:Math.round(performance.now()-begin)});
}
const seeds=[1,2,3,4,5,0xf1d2026],encounters=[];
for(const skilled of [false,true])for(const seed of seeds){
 const r=createRace(()=> 'escape',seed);start(r);let firstPressure=null;
 while(!r.result&&r.time<400){step(r,1/120,driver(r,skilled));if(firstPressure===null&&r.pressure>10)firstPressure=r.time;}
 encounters.push({profile:skilled?'pursuit_nitro_brake':'traffic_only',seed,won:r.result?.won,time:r.time,metres:r.s,health:r.health,score:r.result?.score,hits:r.hitSerial,reveals:r.undercoverReveals,escapes:r.escapes,firstPressureSeconds:firstPressure});
}
let maxVisibleMeshes=0,maxLiveGeometry=0,maxChunks=0;
const live=new Set(),seen=new WeakSet();
globalThis.document={createElement:canvasSink};
globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.devicePixelRatio=3;globalThis.addEventListener=globalThis.removeEventListener=()=>{};
const sink={setPixelRatio(){},setSize(){},info:{},dispose(){},render(scene,camera){
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);let visible=0;
 scene.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);live.add(o.geometry);o.geometry.addEventListener('dispose',()=>live.delete(o.geometry));}});
 scene.traverseVisible(o=>{if(o.isMesh)visible++;});maxVisibleMeshes=Math.max(maxVisibleMeshes,visible);maxLiveGeometry=Math.max(maxLiveGeometry,live.size);
}};
const begin=performance.now(),view=createRenderer({},true,()=>sink),buildMs=Math.round(performance.now()-begin),r=createRace();
r.state='RACE';r.speed=48;
for(let lap=0;lap<2;lap++)for(let s=0;s<=LENGTH;s+=80){r.s=s;r.time=s/48;r.cops.forEach((c,i)=>Object.assign(c,{s:s-16-i*8,speed:48,active:s>450+i*3000}));r.traffic.forEach((t,i)=>t.s=s+50+i*100);view.render(r,1/60);maxChunks=Math.max(maxChunks,view.metrics.chunks);}
const sceneCpuMs=Math.round(performance.now()-begin);view.dispose();
console.log(JSON.stringify({kind:'CPU_ONLY_NOT_GPU_OR_IPHONE',routeMetres:LENGTH,runs,encounters,scene:{initialBuildMs:buildMs,twoTraversalsCpuMs:sceneCpuMs,maxVisibleMeshes,maxLiveGeometry,maxChunks,remainingSharedGeometryAfterChunkDisposal:live.size}},null,2));
