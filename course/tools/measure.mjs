// CPU measurements only. A scene sink is not a GPU or phone benchmark.
import {performance} from 'node:perf_hooks';
import {createRace,start,step,createClock,emptyInput} from '../simulation.js';
import {LENGTH,BLOCKADES,curvature,sectorAt} from '../track.js';
import {createRenderer} from '../renderer.js';
function controls(r,boost=false){
 const row=BLOCKADES.find(b=>b.s>r.s-9&&b.s-r.s<210),traffic=r.traffic.filter(t=>t.s>r.s-6&&t.s-r.s<95);
 const candidates=[0,-5,5].filter(x=>(!row||row.xs.every(o=>Math.abs(o-x)>=2.7))&&traffic.every(t=>Math.abs(t.x-x)>2.1));
 const target=candidates.length?candidates.reduce((a,b)=>Math.abs(a-r.x)<Math.abs(b-r.x)?a:b):row?.gap||0;
 return {...emptyInput(),steer:Math.max(-1,Math.min(1,(target-r.x)*.38-r.vx*.12+curvature(r.s)*r.speed*r.speed*.065)),nitro:boost&&r.pressure>55&&r.nitro>30};
}
const runs=[];
for(const boost of [false,true])for(const hz of [30,60,144]){
 const r=createRace(()=> 'escape'),sectors=new Set();start(r);const clock=createClock(r,()=>controls(r,boost));const begin=performance.now();
 for(let frame=0;frame<hz*400&&!r.result;frame++){clock.advance(1/hz);if(r.state==='RACE')sectors.add(sectorAt(r.s));}
 runs.push({hz,boost,won:r.result?.won,time:r.result?.time,health:r.health,drifts:r.drifts,sectors:sectors.size,cpuMs:Math.round(performance.now()-begin)});
}
let maxVisibleMeshes=0,maxLiveGeometry=0,maxChunks=0;
const live=new Set(),seen=new WeakSet();
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {fillRect(){},strokeRect(){},fillText(){}};}};}};
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
console.log(JSON.stringify({kind:'CPU_ONLY_NOT_GPU_OR_IPHONE',routeMetres:LENGTH,runs,scene:{initialBuildMs:buildMs,twoTraversalsCpuMs:sceneCpuMs,maxVisibleMeshes,maxLiveGeometry,maxChunks,remainingSharedGeometryAfterChunkDisposal:live.size}},null,2));
