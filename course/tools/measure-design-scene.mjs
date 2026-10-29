// CPU structure / resource-lifecycle evidence, with OCULAIRE fully loaded.
// No rasterization, actual draw calls, frame pacing or GPU memory is measured here.
import {performance} from 'node:perf_hooks';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {canvasSink} from './canvas-sink.mjs';
const root=process.argv[2]?pathToFileURL(resolve(process.argv[2])+'/'):new URL('../../',import.meta.url);
const [{createRenderer},{createRace},{LENGTH},model]=await Promise.all([
 import(new URL('course/renderer.js',root)),import(new URL('course/simulation.js',root)),import(new URL('course/track.js',root)),import(new URL('course/assets/oculaire/portrait-data.js',root))
]);
globalThis.document={createElement:canvasSink};globalThis.devicePixelRatio=3;
globalThis.addEventListener=globalThis.removeEventListener=()=>{};
const rows=[];
for(const profile of ['auto','eco','high'])for(const [width,height]of [[390,844],[844,390]]){
 globalThis.innerWidth=width;globalThis.innerHeight=height;
 const live=new Set(),seen=new WeakSet();let maxVisibleMeshes=0,maxTriangles=0,maxGeometries=0,sceneRef;
 const sink={setPixelRatio(){},setSize(){},dispose(){},info:{},render(scene,camera){
  sceneRef=scene;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);let visible=0,triangles=0;
  scene.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);live.add(o.geometry);o.geometry.addEventListener('dispose',()=>live.delete(o.geometry));}});
  scene.traverseVisible(o=>{if(o.isMesh){visible++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  maxVisibleMeshes=Math.max(maxVisibleMeshes,visible);maxTriangles=Math.max(maxTriangles,triangles);maxGeometries=Math.max(maxGeometries,live.size);
 }};
 const started=performance.now(),view=createRenderer({},true,()=>sink,profile,undefined,{oculaire:{loadModel:()=>model}});
 await new Promise(setImmediate);
 if(view.oculaireStatus.state!=='ready')throw Error('OCULAIRE not ready: '+JSON.stringify(view.oculaireStatus));
 const loadedCpuMs=Math.round(performance.now()-started),r=createRace(()=> 'escape');r.state='RACE';r.speed=48;
 const afterLaps=[];
 for(let lap=0;lap<2;lap++){
  for(let s=0;s<=LENGTH;s+=80){r.s=s;r.time=s/48;r.cops.forEach((c,i)=>Object.assign(c,{s:s-16-i*8,speed:48,active:s>450+i*3000}));r.traffic.forEach((t,i)=>{t.s=s+50+i*100;});view.render(r,1/60);}
  afterLaps.push(live.size);
 }
 const beforeReplays=live.size,geometriesBefore=new Set();sceneRef.traverse(o=>{if(o.geometry)geometriesBefore.add(o.geometry);});
 for(let i=0;i<8;i++){view.reset();view.render(r,1/60);}
 const geometriesAfter=new Set();sceneRef.traverse(o=>{if(o.geometry)geometriesAfter.add(o.geometry);});
 const replayAllocations=[...geometriesAfter].filter(g=>!geometriesBefore.has(g)).length;
 const row={profile,width,height,devicePixelRatio:3,targetRatio:view.metrics.ratio,oculaire:view.oculaireStatus.state,loadedCpuMs,totalCpuMs:Math.round(performance.now()-started),maxVisibleMeshes,maxTrianglesBeforeFrustumCulling:maxTriangles,maxGeometries,afterLaps,beforeReplays,afterReplays:live.size,replayAllocations};
 if(afterLaps[0]!==afterLaps[1]||row.beforeReplays!==row.afterReplays||replayAllocations)throw Error('Geometry growth: '+JSON.stringify(row));
 view.dispose();row.sharedGeometryAfterDispose=live.size;rows.push(row);
}
const report={kind:'CPU_ONLY_OCULAIRE_READY_NOT_GPU_OR_IPHONE',date:new Date().toISOString(),node:process.version,rows};
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
