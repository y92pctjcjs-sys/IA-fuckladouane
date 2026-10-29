import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import * as portrait from '../assets/oculaire/portrait-data.js';
import {sample,curvature,LENGTH,BLOCKADES,DIMENSIONS,warningDistance,ROUTE_ID} from '../track.js';
import {SHORTCUT,DEBRIS,shortcutSample,shortcutDistance,driveSample,drivingCurvature,debrisAhead} from '../route-options.js';
import {createRace,step,createClock,pause,resume,overlaps} from '../simulation.js';
import {createSave,V3_KEY,SAVE_KEY} from '../storage.js';
import {debrisModel} from '../route-assets.js';
import {routeSvg} from '../route-atlas.js';
import {driver} from '../tools/driver.mjs';
import {canvasSink} from '../tools/canvas-sink.mjs';
import {createRenderer} from '../renderer.js';
function branchRace(){const r=createRace();Object.assign(r,{state:'RACE',s:SHORTCUT.entry-.6,x:SHORTCUT.offset,speed:48});r.cops=[];r.traffic=[];return r;}
test('V4 contains real direction changes and bounded, continuous separated bends over 13 km',()=>{
 let length=0,maxK=0,minAngle=0,maxAngle=0;const points=[];
 for(let s=4;s<=LENGTH;s+=4){const a=sample(s-4),b=sample(s);length+=Math.hypot(a.x-b.x,a.z-b.z);maxK=Math.max(maxK,Math.abs(curvature(s)));minAngle=Math.min(minAngle,b.angle);maxAngle=Math.max(maxAngle,b.angle);if(s%32===0)points.push(b);}
 assert.ok(Math.abs(length-LENGTH)<.01);assert.ok(maxAngle-minAngle>4.3);assert.ok(maxK>.006&&maxK<.0076);
 assert.ok(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>2700);
 for(let i=0;i<points.length;i++)for(let j=i+19;j<points.length;j++)assert.ok(Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z)>400,'unrelated road sections must not overlap');
 assert.ok(Math.hypot(sample(LENGTH).x,sample(LENGTH).z)<LENGTH*.6);
});
test('secret road is physically shorter and joins position, tangent and height without teleporting',()=>{
 const a=shortcutSample(0),b=shortcutSample(SHORTCUT.length),start=sample(SHORTCUT.entry,SHORTCUT.offset),end=sample(SHORTCUT.exit,SHORTCUT.exitOffset);
 for(const [p,q]of[[a,start],[b,end]])for(const k of['x','y','z','angle'])assert.ok(Math.abs(p[k]-q[k])<1e-7,k);
 for(const [d,s]of[[0,SHORTCUT.entry],[SHORTCUT.length,SHORTCUT.exit]]){const lo=Math.max(0,d-.1),hi=Math.min(SHORTCUT.length,d+.1),grade=(shortcutSample(hi).y-shortcutSample(lo).y)/(hi-lo),main=(sample(s+.1).y-sample(s-.1).y)/.2;assert.ok(Math.abs(grade-main)<.0001);}
 assert.ok(SHORTCUT.skippedMetres>580&&SHORTCUT.skippedMetres<610);assert.ok(SHORTCUT.length>650&&SHORTCUT.length<720);
 for(let s=SHORTCUT.entry+2;s<SHORTCUT.exit-2;s+=4)assert.ok(Math.abs(drivingCurvature({s,branch:SHORTCUT.id}))<.0105);
});
function completeBranch(hz){
 const r=branchRace(),clock=createClock(r,()=>driver(r));let maxStep=0,previous=driveSample(r.s,r.x,r.branch);
 for(let n=0;n<hz*40&&r.s<SHORTCUT.exit+30;n++){clock.advance(1/hz);const p=driveSample(r.s,r.x,r.branch);maxStep=Math.max(maxStep,Math.hypot(p.x-previous.x,p.z-previous.z));previous=p;}
 return {r,maxStep};
}
test('secret drive and rejoin are continuous, faster, deterministic and viable with normal steering',()=>{
 const runs=[30,60,144].map(completeBranch);for(const {r,maxStep}of runs){assert.equal(r.shortcutUsed,true);assert.equal(r.branch,null);assert.ok(r.s>SHORTCUT.exit);assert.ok(r.health>=95);assert.ok(r.time<17);assert.ok(maxStep<2.1);assert.equal(r.shortcutMetres,SHORTCUT.skippedMetres);}
 // Compare at a fixed simulation time, independent of the outer render-frame endpoint.
 const states=[30,60,144].map(hz=>{const r=branchRace(),clock=createClock(r,()=>driver(r));for(let i=0;i<hz*17;i++)clock.advance(1/hz);return r;});
 for(const r of states)for(const k of['s','x','health','time'])assert.ok(Math.abs(r[k]-states[0][k])<1e-8,k);
 const main=createRace();Object.assign(main,{state:'RACE',s:SHORTCUT.entry-.6,x:0,speed:48});main.cops=[];main.traffic=[];for(let i=0;i<120*17;i++)step(main,1/120,driver(main));assert.equal(main.shortcutUsed,false);assert.ok(main.s<SHORTCUT.exit-300);
});
test('the secret requires choosing its entrance; pause freezes the branch and its progress',()=>{
 const r=branchRace();r.x=0;step(r,.02);assert.equal(r.branch,null);assert.equal(r.shortcutUsed,false);
 const b=branchRace();step(b,.02);assert.equal(b.branch,SHORTCUT.id);pause(b);const frozen=structuredClone({...b,ending:null});for(let i=0;i<80;i++)step(b,.05,{steer:1,nitro:true});assert.deepEqual({...b,ending:null},frozen);resume(b);step(b,.02);assert.ok(b.s>frozen.s);
});
test('main-road cars and barriers cannot collide through the forest or award remote near passes',()=>{
 const r=branchRace();Object.assign(r,{branch:SHORTCUT.id,s:3800,x:0,speed:48});
 const car={id:'t0',s:3800,x:0,type:'traffic',speed:24,cruiseSpeed:24,steer:0,wasAhead:true,passCounted:false};assert.equal(overlaps(r,car),false);
 assert.equal(overlaps(r,{id:'b',s:3800,x:0,type:'barrier'}),false);
 r.traffic=[car];for(let i=0;i<100;i++)step(r,1/120,driver(r));assert.equal(r.health,100);assert.equal(r.nearMisses,0);
 r.s=SHORTCUT.entry;r.x=0;assert.equal(overlaps(r,{s:SHORTCUT.entry,x:SHORTCUT.offset,type:'traffic'}),true);
});
test('debris is sparse, forewarned, forgiving and always leaves two lanes clear',()=>{
 assert.equal(DEBRIS.length,5);
 for(const d of DEBRIS){assert.ok(BLOCKADES.every(b=>Math.abs(b.s-d.s)>warningDistance(68)+150));const safe=[-5,0,5].filter(x=>Math.abs(x-d.x)>DIMENSIONS.player.halfWidth+DIMENSIONS.debris.halfWidth);assert.equal(safe.length,2);assert.equal(debrisAhead({s:d.s-warningDistance(68)+.01,speed:68,branch:null}),d);}
 const r=createRace();Object.assign(r,{state:'RACE',s:DEBRIS[0].s-.5,x:DEBRIS[0].x,speed:40});r.cops=[];r.traffic=[];step(r,.01);assert.equal(r.health,94);assert.equal(r.debrisHits,1);assert.equal(r.impactKind,'debris');for(let i=0;i<50;i++)step(r,.01);assert.equal(r.health,94);
 assert.equal(debrisAhead({s:2700,speed:48,branch:SHORTCUT.id}),null);
});
test('visible debris, including its reflective tabs, fits the actual collision footprint',()=>{
 for(const kind of['tyres','cartons']){const group=debrisModel(kind),bounds=new T.Box3().setFromObject(group);assert.ok(bounds.min.x>=-DIMENSIONS.debris.halfWidth&&bounds.max.x<=DIMENSIONS.debris.halfWidth);assert.ok(bounds.min.z>=-DIMENSIONS.debris.halfLength&&bounds.max.z<=DIMENSIONS.debris.halfLength);assert.ok(bounds.max.y>.35&&bounds.max.y<1);group.traverse(o=>{if(o.geometry)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});}
});
test('traffic clears the merge lane gradually while the physical car returns',()=>{
 const r=branchRace();Object.assign(r,{s:SHORTCUT.exit-220,branch:SHORTCUT.id,x:0});r.traffic=[{id:'t0',s:SHORTCUT.exit-70,x:5,speed:25,cruiseSpeed:25,type:'traffic',steer:0,wasAhead:true,passCounted:false}];
 let last=r.traffic[0].x;for(let i=0;i<240;i++){step(r,1/120,driver(r));assert.ok(Math.abs(r.traffic[0].x-last)<=3/120+1e-9);last=r.traffic[0].x;}assert.ok(last<0);
});
test('V3 records are retained byte-for-byte and only the existing love unlock follows into V4',()=>{
 const old=JSON.stringify({version:3,route:'swagistan-13k-v3-pursuit',wins:6,runs:20,bestTime:250,bestScore:50000,love:true}),map=new Map([[V3_KEY,old]]),writes=[],store={getItem:k=>map.get(k),setItem(k,v){writes.push(k);map.set(k,v);}},save=createSave(store);
 assert.equal(save.data.bestTime,null);assert.equal(save.data.bestScore,0);assert.equal(save.data.love,true);save.record({won:true,time:268,score:33000,ending:'escape',route:ROUTE_ID,shortcut:true});assert.equal(map.get(V3_KEY),old);assert.deepEqual(writes,[SAVE_KEY]);assert.equal(JSON.parse(map.get(SAVE_KEY)).version,4);assert.equal(createSave(store).data.bestTime,268);assert.equal(createSave(store).data.shortcutKnown,true);
});
test('atlas follows the real new geometry and reveals the secret only after discovery',()=>{
 assert.doesNotMatch(routeSvg(1,3800),/data-shortcut/);assert.match(routeSvg(1,3800,{branch:SHORTCUT.id,discovered:true}),/data-shortcut="forest-cut"/);assert.doesNotMatch(routeSvg(3,8500,{discovered:true}),/data-shortcut/);
 for(const stage of[-1,0,1,2,3,4])assert.doesNotMatch(routeSvg(stage,3800,{branch:SHORTCUT.id,discovered:true}),/NaN|Infinity|undefined/);
});
test('real chase camera follows the branch asphalt and OCULAIRE keeps all five gaze targets',async()=>{
 const keys=['document','innerWidth','innerHeight','devicePixelRatio','addEventListener','removeEventListener'],old=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));Object.assign(globalThis,{document:{createElement:canvasSink},innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener(){},removeEventListener(){}});let scene,camera,view;
 try{
  const sink={setSize(){},setPixelRatio(){},dispose(){},info:{},render(s,c){scene=s;camera=c;}};view=createRenderer({},true,()=>sink,'auto',undefined,{oculaire:{loadModel:()=>portrait}});await new Promise(setImmediate);assert.equal(view.oculaireStatus.state,'ready');
  for(const [w,h]of[[390,844],[844,390]]){globalThis.innerWidth=w;globalThis.innerHeight=h;view.configure({quality:'auto',reduced:true});
   for(const s of[3140,3350,3700,4100,4370]){const r=createRace();r.state='RACE';r.speed=48;r.cops.forEach(c=>Object.assign(c,{s:1,active:false,undercover:false}));r.traffic.forEach(t=>t.s=10000);Object.assign(r,{s,branch:SHORTCUT.id,x:0,time:70});view.reset();for(let i=0;i<10;i++)view.render(r,1/60);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const p=driveSample(s,0,SHORTCUT.id),projected=new T.Vector3(p.x,p.y+.6,p.z).project(camera);assert.ok(Math.abs(projected.x)<.4&&projected.y>-.9&&projected.y<.2);const road=scene.getObjectByName('LISIÈRE / ASPHALTE'),ray=new T.Raycaster(new T.Vector3(p.x,p.y+1,p.z),new T.Vector3(0,-1,0));assert.ok(ray.intersectObject(road).length>0);const head=view.inspectOculaire();assert.equal(head.gazes.length,5);for(const eye of head.gazes)assert.ok(eye.errorRadians<.02);assert.ok(head.screen.min[0]>-1&&head.screen.max[0]<1);}
  }
 }finally{view?.dispose();for(const k of keys)if(old[k]===undefined)delete globalThis[k];else globalThis[k]=old[k];}
});
