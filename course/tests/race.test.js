import test from 'node:test';
import assert from 'node:assert/strict';
import {createRace, start, step, pause, resume, finish, hit, overlaps, emptyInput, createClock} from '../simulation.js';
import {drawEnding} from '../ending.js';
import {createSave, SAVE_KEY} from '../storage.js';
import {BLOCKADES, LENGTH, sample, curvature} from '../track.js';
function running(ending = () => 'escape') { const r = createRace(ending); start(r); for (let i = 0; i < 361; i++) step(r, 1 / 120); assert.equal(r.state, 'RACE'); return r; }
function advance(r, time, input = emptyInput()) { for (let t = 0; t < time - 1e-8; t += 1 / 120) step(r, 1 / 120, input); }

test('menu requires launch, countdown precedes driving, fresh race resets all state', () => {
 const r = createRace(); step(r, .05); assert.equal(r.state, 'MENU'); start(r); step(r, .05); assert.equal(r.s, 0); assert.equal(r.time, 0);
 const active = running(); advance(active, 2); assert.ok(active.speed > 15); assert.ok(active.s > 10); assert.equal(createRace().result, null); assert.equal(createRace().health, 100);
});
test('progressive steering is continuous; drift releases into grip and earns nitro', () => {
 const r = running(); r.speed = 45; r.nitro = 40;
 step(r, 1 / 120, {...emptyInput(), steer: .3, drift: true}); assert.ok(r.steer > 0 && r.steer < .3);
 advance(r, 1.2, {...emptyInput(), steer: .25, drift: true}); assert.equal(r.drifting, true); assert.ok(r.nitro > 40); assert.ok(r.x > 0 && r.x < 7);
 advance(r, .5); assert.equal(r.drifting, false); assert.equal(r.drifts, 1); assert.ok(Math.abs(r.yaw) < .2);
});
test('nitro gives measurable speed advantage, drains and recharges; brake slows', () => {
 const a = running(), b = running(); a.speed = b.speed = 48;
 advance(a, 2); advance(b, 2, {...emptyInput(), nitro: true}); assert.ok(b.s > a.s + 20); assert.ok(b.nitro < 60); assert.ok(b.speed > 60);
 const n = b.nitro; advance(b, 1); assert.ok(b.nitro > n);
 advance(b, 3, {...emptyInput(), brake: true}); assert.ok(b.speed < 5);
});
test('collision follows visible coordinates with contact cooldown and sensible damage', () => {
 const r = running(); r.s = 619; r.x = -5; r.speed = 45;
 assert.equal(overlaps(r, r.obstacles[0]), true); step(r, .01); assert.equal(r.health, 83); assert.ok(r.speed < 35);
 for (let i = 0; i < 40; i++) { r.s = 620; step(r, .01); } assert.equal(r.health, 83);
 r.x = 5; assert.equal(overlaps(r, r.obstacles[0]), false); assert.equal(hit(r, 100), false);
});
test('every announced blockade has a full car-width safe passage', () => {
 for (const row of BLOCKADES) {
  const free = [-5, 0, 5].filter(x => row.xs.every(o => Math.abs(x - o) >= 2.55));
  assert.ok(free.length > 0); assert.ok(row.s > 100 && row.s < LENGTH);
 }
});
test('road has left and right turns, elevation, and continuous world coordinates', () => {
 let min = 0, max = 0, elevation = 0;
 for (let s = 4; s < LENGTH; s += 4) { const a = sample(s), b = sample(s - 4); min = Math.min(min, curvature(s)); max = Math.max(max, curvature(s)); elevation = Math.max(elevation, Math.abs(a.y)); assert.ok(Math.hypot(a.x-b.x,a.z-b.z) < 4.01); }
 assert.ok(min < -.001 && max > .001); assert.ok(elevation > 3);
});
test('pursuers accelerate, move laterally and never teleport to the player', () => {
 const r = running(); r.speed = 40; const s = r.cops[0].s; advance(r, 3, {...emptyInput(), steer: .15});
 assert.ok(r.cops[0].speed > 20); assert.ok(r.cops[0].s > s); assert.ok(Math.abs(r.cops[0].x) < 7);
 r.s = 3600; step(r, .01); assert.ok(r.cops.every(c => c.active)); assert.ok(r.cops.every(c => c.s < r.s));
});
test('pause freezes driving and clock, countdown and cinematic; resume is explicit', () => {
 for (const state of ['COUNTDOWN','RACE','ARRIVAL','INTERCEPTION']) {
  const r = running(); r.state = state; r.result = {ending: 'love'}; pause(r); const before = structuredClone({...r, ending: null});
  advance(r, 2, {...emptyInput(), nitro: true, steer: 1}); assert.deepEqual({...r, ending:null}, before); resume(r); assert.equal(r.state, state);
 }
});
test('clock is stable at 30, 60, and 144 Hz; resumed clock does not spend pause time', () => {
 const runs = [30,60,144].map(hz => { const r = running(); const clock = createClock(r, emptyInput); for (let i=0;i<hz*12;i++) clock.advance(1/hz); return r; });
 for (const r of runs) { assert.ok(Math.abs(r.time - runs[0].time) < .0001); assert.ok(Math.abs(r.s - runs[0].s) < .001); }
 const r = running(), clock = createClock(r, emptyInput); pause(r); const s = r.s; clock.advance(20); resume(r); clock.advance(1/60); assert.ok(r.s - s < .1);
});
test('one impact cannot cause an arbitrary arrest; surrounded immobilization lasts four seconds', () => {
 const r = running(); hit(r, 8); advance(r, .5); assert.equal(r.state, 'RACE');
 r.s = 3500; r.x = 0; r.speed = 0; r.cops.forEach((c,i) => { c.active=true; c.s=r.s-6-i*3; c.speed=0; c.x=0; });
 advance(r, 3.8, {...emptyInput(),brake:true}); assert.equal(r.state,'RACE'); assert.ok(r.capture > 3);
 advance(r,.3,{...emptyInput(),brake:true}); assert.equal(r.state,'INTERCEPTION'); assert.equal(r.result.reason,'IMMOBILISÉ ET ENCERCLÉ');
});
test('resistance loss stops the run; no score, damage or ending mutation after terminal transition', () => {
 const r=running(); r.health=1; r.s=619; r.x=-5; r.speed=40; step(r,.01); assert.equal(r.state,'INTERCEPTION');
 const result=r.result, health=r.health, s=r.s; advance(r,5); assert.equal(r.state,'RESULTS'); assert.equal(r.result,result); assert.equal(r.health,health); assert.equal(r.s,s); assert.equal(hit(r,100),false);
});
test('finish requires a drivable vehicle and fixes exactly one ending draw', () => {
 let calls=0; const r=running(()=>{calls++;return 'love';}); r.s=LENGTH-.1;r.speed=40;step(r,.01);
 assert.equal(r.state,'ARRIVAL');assert.equal(calls,1);const result=r.result;for(let i=0;i<20;i++) finish(r,true);advance(r,14);
 assert.equal(r.result,result);assert.equal(calls,1);assert.equal(r.state,'RESULTS');assert.equal(result.ending,'love');
 const failed=running(()=>{throw Error('defeat must not draw');}); failed.health=0;step(failed,.01);assert.equal(failed.result.won,false);
});
test('all thirty buckets have exactly one romantic ending; rejection discards incomplete bucket', () => {
 const results=Array.from({length:30},(_,n)=>drawEnding(()=>n));assert.equal(results.filter(x=>x==='love').length,1);
 const sequence=[0xffffffff,0xfffffffe,29];let calls=0;assert.equal(drawEnding(()=>{calls++;return sequence.shift();}),'escape');assert.equal(calls,3);
 assert.equal(drawEnding(()=>30),'love');assert.throws(()=>drawEnding(()=>-1),RangeError);
});
test('blocked/corrupt storage remains playable in memory; records save only to owned key, once', () => {
 const writes=[];const store={getItem(){return '{broken';},setItem(k,v){writes.push([k,JSON.parse(v)]);}};
 const s=createSave(store), result={won:true,time:120,score:9000,ending:'love'};s.record(result);s.record(result);assert.equal(s.data.wins,1);assert.equal(s.data.love,true);assert.equal(writes.length,1);assert.equal(writes[0][0],SAVE_KEY);
 const blocked=createSave({getItem(){throw Error();},setItem(){throw Error();}});blocked.record(result);assert.equal(blocked.data.bestTime,120);blocked.record({won:true,time:110,score:9100,ending:'escape'});assert.equal(blocked.data.bestTime,110);assert.equal(blocked.data.love,true);
});
test('complete controller-driven run crosses all sectors and can be replayed', () => {
 for(let run=0;run<2;run++) {
  const r=running();
  while(r.state==='RACE'&&r.time<190) {
   const row=BLOCKADES.find(b=>b.s>r.s-9&&b.s-r.s<150);
   let target=0;
   const traffic=r.traffic.filter(t=>t.s>r.s-5&&t.s-r.s<95);
   const candidates=[0,-5,5].filter(x=>(!row||row.xs.every(o=>Math.abs(o-x)>=2.55))&&traffic.every(t=>Math.abs(t.x-x)>2));
   if(candidates.length) target=candidates.reduce((a,b)=>Math.abs(a-r.x)<Math.abs(b-r.x)?a:b);
   else if(row) target=[-5,0,5].find(x=>row.xs.every(o=>Math.abs(o-x)>=2.55));
   const steer=Math.max(-1,Math.min(1,(target-r.x)*.38-r.vx*.12+curvature(r.s)*r.speed*r.speed*.065));
   step(r,1/120,{...emptyInput(),steer,nitro:r.pressure>45&&r.nitro>30});
  }
  assert.equal(r.result?.won,true,`run ${run}: ${r.result?.reason}, s=${r.s}, health=${r.health}`);assert.ok(r.time>70&&r.time<160);advance(r,5);assert.equal(r.state,'RESULTS');
 }
});
