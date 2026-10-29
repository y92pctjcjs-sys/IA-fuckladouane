// Actual static scene geometry, sampled vertical clearance. Not GPU or a playtest.
import * as T from '../vendor/three.module.min.js';
import {createRenderer} from '../renderer.js';
import {createRace} from '../simulation.js';
import {sample,LENGTH} from '../track.js';
import {SHORTCUT,driveSample} from '../route-options.js';
import {canvasSink} from './canvas-sink.mjs';
import {writeFileSync} from 'node:fs';
globalThis.document={createElement:canvasSink};globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.devicePixelRatio=1;globalThis.addEventListener=globalThis.removeEventListener=()=>{};
let scene;const sink={setSize(){},setPixelRatio(){},dispose(){},info:{},render(value){scene=value;}};
const view=createRenderer({},true,()=>sink,'auto',undefined,{oculaire:{loadModel:()=>new Promise(()=>{})}}),race=createRace(),issues=[],ray=new T.Raycaster(),up=new T.Vector3(0,1,0);race.state='RACE';race.speed=48;
let probes=0;
function check(s,branch){
 race.s=s;race.branch=branch;view.render(race,1/60);scene.updateMatrixWorld(true);
 const roots=scene.children.filter(o=>o.visible&&(Number.isFinite(o.userData.chunkStart)||o.userData.shortcut)),candidates=[];
 for(const root of roots)root.traverseVisible(o=>{if(o.isMesh&&!o.material.transparent&&!o.userData.cpuTextureOnly)candidates.push(o);});
 for(const x of(branch?[-3.7,-2.8,-1.4,0,1.4,2.8,3.7]:[-8,-7,-5,-2.5,0,2.5,5,7,8])){
  const p=driveSample(s,x,branch);ray.set(new T.Vector3(p.x,p.y+.12,p.z),up);ray.near=0;ray.far=2.75;
  const hit=ray.intersectObjects(candidates,false)[0];probes++;
  if(hit&&issues.length<60){let owner=hit.object;while(owner.parent&&!owner.userData.chunkStart&&!owner.userData.shortcut)owner=owner.parent;issues.push({s,x,branch,point:hit.point.toArray(),mesh:hit.object.name,owner:owner.name,geometry:hit.object.geometry.type,material:hit.object.material.type});}
 }
}
try{for(let s=8;s<LENGTH;s+=8)check(s,null);for(let s=SHORTCUT.entry+8;s<SHORTCUT.exit;s+=8)check(s,SHORTCUT.id);}finally{view.dispose();}
const report={kind:'CPU_STATIC_GEOMETRY_CLEARANCE_NOT_WEBGL',probes,excluded:'Transparent ground light pools and soft textures are not solid obstacles',verticalFromRoad:.12,verticalToRoad:2.87,mainLateralRange:[-8,8],branchLateralRange:[-3.7,3.7],issues};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(issues.length)process.exitCode=1;
