import test from 'node:test';
import assert from 'node:assert/strict';
import {LENGTH,STAGES,SECTORS,BEATS,ROUTE_ID,BLOCKADES,HALF_WIDTH,sectorAt,sample,curvature,warningDistance,blockadeAhead,DIMENSIONS} from '../track.js';
import {createRace,start,step,emptyInput,createClock,pause,resume} from '../simulation.js';
import {createSave,createPreferences,LEGACY_KEY,SAVE_KEY,PREFS_KEY} from '../storage.js';
import {createQuality} from '../quality.js';

test('five contiguous stages and nine distinct situations share one 13 km route',()=>{
 assert.equal(LENGTH,13000);assert.equal(STAGES.length,5);assert.equal(SECTORS.length,5);
 STAGES.forEach((stage,i)=>{assert.equal(stage.start,i?STAGES[i-1].end:0);assert.equal(sectorAt(stage.start),i);assert.equal(sectorAt(stage.end-.001),i);assert.ok(stage.end>stage.start);});
 assert.equal(STAGES.at(-1).end,LENGTH);assert.equal(sectorAt(LENGTH+100),4);assert.equal(sectorAt(-10),0);
 for(const stage of STAGES.slice(1)){const a=sample(stage.start-.01),b=sample(stage.start+.01);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.03);}
 for(let i=1;i<BEATS.length;i++)assert.ok(BEATS[i].s-BEATS[i-1].s<=48*40);
 assert.ok(BEATS.some(b=>b.pressure<.3)&&BEATS.some(b=>b.pressure>.8));
});
test('every blockade gives three seconds at boost speed and has a physically wide escape corridor',()=>{
 for(const speed of [18,48,68]){
  assert.ok(warningDistance(speed)>=speed*3);
  for(const row of BLOCKADES){
   const first=blockadeAhead(row.s-warningDistance(speed)+.01,speed);assert.equal(first,row);assert.ok((row.s-(row.s-warningDistance(speed)+.01))/Math.max(1,speed)>=3);
   assert.ok(Math.abs(row.gap)+DIMENSIONS.player.halfWidth<HALF_WIDTH);
   const clearance=Math.min(...row.xs.map(x=>Math.abs(x-row.gap)-DIMENSIONS.barrier.halfWidth-DIMENSIONS.player.halfWidth));assert.ok(clearance>2);
  }
 }
});
test('legacy records remain byte-identical, love migrates, and new route records never inherit old times',()=>{
 const legacy=JSON.stringify({version:1,runs:31,wins:30,bestTime:91,bestScore:12000,love:true}),map=new Map([[LEGACY_KEY,legacy]]),writes=[];
 const storage={getItem:k=>map.get(k),setItem(k,v){writes.push(k);map.set(k,v);}};
 const save=createSave(storage);assert.equal(save.data.bestTime,null);assert.equal(save.data.love,true);assert.equal(save.legacy.bestTime,91);
 save.record({won:true,time:280,score:20000,ending:'escape'});assert.deepEqual(writes,[SAVE_KEY]);assert.equal(map.get(LEGACY_KEY),legacy);assert.equal(createSave(storage).data.bestTime,280);assert.equal(save.data.route,ROUTE_ID);
 const prefs=createPreferences(storage);prefs.update({music:.2,quality:'eco'});assert.equal(map.get(LEGACY_KEY),legacy);assert.equal(createPreferences(storage).data.music,.2);assert.equal(writes.at(-1),PREFS_KEY);
});
test('refused, corrupt and mismatched-route storage cannot crash or contaminate records',()=>{
 for(const store of [null,{getItem(){throw Error();},setItem(){throw Error();}},{getItem:()=>'{bad',setItem(){}},{getItem:()=>JSON.stringify({version:2,route:'other',bestTime:1,love:true}),setItem(){}}]){
  const save=createSave(store);assert.equal(save.data.bestTime,null);save.record({won:true,time:290,score:1,ending:'love'});assert.equal(save.data.love,true);assert.equal(save.data.bestTime,290);
  const prefs=createPreferences(store);prefs.update({master:2,music:-1,sensitivity:99,quality:'invalid'});assert.equal(prefs.data.master,1);assert.equal(prefs.data.music,0);assert.equal(prefs.data.sensitivity,1.5);assert.equal(prefs.data.quality,'auto');
 }
});
test('quality changes have hysteresis, preserve economy selection and ignore paused frames',()=>{
 const q=createQuality();for(let i=0;i<150;i++)q.update(.04,true);assert.ok(q.level<2);const level=q.level;
 for(let i=0;i<50;i++)q.update(.005,true);assert.equal(q.level,level);
 const paused=createQuality();for(let i=0;i<1000;i++)paused.update(.08,false);assert.equal(paused.level,2);
 q.setMode('eco');for(let i=0;i<3000;i++)q.update(.01,true);assert.equal(q.level,0);assert.equal(q.ratio,.72);
});
function controller(r){
 const row=BLOCKADES.find(b=>b.s>r.s-9&&b.s-r.s<210),traffic=r.traffic.filter(t=>t.s>r.s-6&&t.s-r.s<95);
 let candidates=[0,-5,5].filter(x=>(!row||row.xs.every(o=>Math.abs(o-x)>=2.7))&&traffic.every(t=>Math.abs(t.x-x)>2.1));
 const target=candidates.length?candidates.reduce((a,b)=>Math.abs(a-r.x)<Math.abs(b-r.x)?a:b):row?row.gap:0;
 return {...emptyInput(),steer:Math.max(-1,Math.min(1,(target-r.x)*.38-r.vx*.12+curvature(r.s)*r.speed*r.speed*.065)),nitro:r.pressure>55&&r.nitro>30};
}
export function traverse(hz=60){
 const r=createRace(()=> 'escape');start(r);const clock=createClock(r,()=>controller(r));const sectors=new Set();
 for(let frames=0;frames<hz*400&&!r.result;frames++){clock.advance(1/hz);if(r.state==='RACE')sectors.add(sectorAt(r.s));}
 return {r,sectors};
}
test('entire journey, not just twelve seconds, is deterministic at 30/60/144 Hz',()=>{
 const runs=[30,60,144].map(traverse);
 for(const {r,sectors} of runs){assert.equal(r.result?.won,true,r.result?.reason);assert.equal(sectors.size,5);assert.ok(r.result.time>=240&&r.result.time<=360);assert.ok(Math.abs(r.result.time-runs[0].r.result.time)<.00001);assert.ok(Math.abs(r.result.health-runs[0].r.result.health)<.00001);}
});
test('pursuers have bounded acceleration and phases without contact teleports; pause freezes every field',()=>{
 const r=createRace();r.state='RACE';r.s=8500;r.speed=48;r.time=44;r.cops.forEach((c,i)=>Object.assign(c,{s:8480-i*4,speed:46,active:true}));
 for(let n=0;n<120*24;n++){
  const positions=r.cops.map(c=>[c.s,c.speed]);step(r,1/120,controller(r));
  r.cops.forEach((c,i)=>{assert.ok(c.s>=positions[i][0]);assert.ok(c.s-positions[i][0]<.5);assert.ok(c.speed-positions[i][1]<=7.5/120+1e-9);});
  if(r.result)break;
 }
 const phases=new Set();r.result=null;r.state='RACE';
 for(let n=0;n<120*23;n++){r.s=8600;r.speed=48;step(r,1/120,emptyInput());r.cops.forEach(c=>phases.add(c.phase));}
 assert.ok(phases.has('recover')&&phases.has('flank')&&phases.has('encircle'));
 pause(r);const before=structuredClone({...r,ending:null});for(let i=0;i<100;i++)step(r,.05,{steer:1,nitro:true});assert.deepEqual({...r,ending:null},before);resume(r);assert.equal(r.state,'RACE');
});
