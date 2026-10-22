import test from 'node:test';
import assert from 'node:assert/strict';
import {createRace,start,step,pause,resume,emptyInput} from '../simulation.js';
import {PURSUIT,moveCivilian} from '../pursuit.js';
import {BLOCKADES,LENGTH} from '../track.js';
import {driver} from '../tools/driver.mjs';
import {createSave,createPreferences,LEGACY_KEY,PREVIOUS_KEY,SAVE_KEY,PREFS_KEY} from '../storage.js';

test('marked patrol approaches within ten seconds; undercover cars reveal in place and raise heat',()=>{
 const r=createRace(()=> 'escape',12345);start(r);let first=0;
 while(r.time<10){step(r,1/120,emptyInput());if(!first&&r.pressure>10)first=r.time;}
 assert.ok(first>0&&first<10);assert.equal(r.cops[0].active,true);assert.equal(r.cops.filter(c=>c.undercover&&!c.active).length,2);
 const hidden=r.cops[1];r.s=hidden.s-23;r.speed=48;const before=hidden.s,health=r.health;
 step(r,1/120,emptyInput());assert.equal(hidden.active,true);assert.equal(hidden.phase,'reveal');assert.ok(Math.abs(hidden.s-before-hidden.speed/120)<1e-8,'the reveal must advance only one fixed step');assert.equal(r.revealSerial,1);assert.equal(r.undercoverReveals,1);assert.ok(r.pressure>30);assert.equal(r.health,health);assert.ok(hidden.grace>2);
 pause(r);const snapshot=structuredClone({...r,ending:null});for(let i=0;i<50;i++)step(r,.05,{steer:1,nitro:true});assert.deepEqual({...r,ending:null},snapshot);resume(r);
 for(let i=0;i<100;i++)step(r,1/120,emptyInput());assert.equal(r.revealSerial,1);assert.equal(r.cops.length,3);
});
test('escaped unmarked cars rejoin only outside the front and rear visibility limits',()=>{
 const r=createRace();r.state='RACE';r.s=3100;r.speed=48;
 const c=r.cops[1];Object.assign(c,{s:r.s-PURSUIT.recycleDistance-5,active:true,speed:35,escaped:true,engaged:true});
 step(r,1/120,emptyInput());assert.equal(c.active,false);assert.equal(c.phase,'civilian');assert.ok(c.s-r.s>500);
 assert.equal(r.reinforcements.length,1);const move=r.reinforcements[0];assert.ok(move.player-move.from>100);assert.ok(move.to-move.player>300);
 assert.equal(r.cops.length,3);assert.ok(c.s<LENGTH);
});
test('civilians wait at blocked lanes and cross through the real gap after the player',()=>{
 const row=BLOCKADES[0],r={s:row.s-110},t={id:'t1',s:row.s-75,x:row.gap,speed:27,cruiseSpeed:27,steer:0};
 for(let i=0;i<120*10;i++)moveCivilian(r,t,1/120);
 assert.ok(t.s<row.s-6);assert.ok(t.speed<1);assert.ok(Math.abs(t.x-row.gap)>3);
 r.s=row.s+40;
 for(let i=0;i<120*10;i++){
  const before=t.s;moveCivilian(r,t,1/120);
  if(before<=row.s&&t.s>=row.s)assert.ok(Math.abs(t.x-row.gap)<.4);
 }
 assert.ok(t.s>row.s+20);
});
test('different encounter seeds change the traffic disguise without changing route length or ending odds',()=>{
 const a=createRace(()=> 'love',1),b=createRace(()=> 'escape',0xdeadbeef);
 assert.notDeepEqual(a.cops.map(c=>[c.s,c.x,c.offset]),b.cops.map(c=>[c.s,c.x,c.offset]));
 assert.equal(a.obstacles.length,b.obstacles.length);assert.equal(a.result,null);assert.equal(b.result,null);
 const r=createRace(()=> 'escape');r.state='RACE';
 while(!r.result&&r.time<360)step(r,1/120,driver(r));
 assert.equal(r.result?.won,true);assert.ok(r.time>240&&r.time<360);assert.ok(r.undercoverReveals>=2);assert.ok(r.result.health<80);assert.equal(r.cops.length,3);
});
test('v1 and easier v2 records are retained byte-for-byte; only love carries into the new challenge',()=>{
 const old=JSON.stringify({version:1,love:false,bestTime:99}),v2=JSON.stringify({version:2,route:'swagistan-13k-v2',wins:30,bestTime:240,bestScore:50000,love:true});
 const map=new Map([[LEGACY_KEY,old],[PREVIOUS_KEY,v2]]),store={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},save=createSave(store);
 assert.equal(save.data.bestTime,null);assert.equal(save.data.bestScore,0);assert.equal(save.data.love,true);
 save.record({won:true,time:280,score:31000,ending:'escape'});assert.equal(map.get(LEGACY_KEY),old);assert.equal(map.get(PREVIOUS_KEY),v2);assert.equal(JSON.parse(map.get(SAVE_KEY)).version,3);
 const prefs=createPreferences(store);prefs.update({engine:.13,engineEnabled:false,effects:.8,music:.6});const loaded=createPreferences(store).data;
 assert.equal(loaded.engineEnabled,false);assert.equal(loaded.engine,.13);assert.equal(loaded.effects,.8);assert.equal(loaded.music,.6);assert.ok(map.has(PREFS_KEY));
 const blocked=createPreferences({getItem(){throw Error();},setItem(){throw Error();}});blocked.update({engineEnabled:false});assert.equal(blocked.data.engineEnabled,false);
});
test('near-pass points are awarded once and invulnerable contact cannot masquerade as a clean pass',()=>{
 function drive(ghost=false){
  const r=createRace();r.state='RACE';r.s=1000;r.speed=48;r.x=ghost?.2:2.5;r.cops=[];
  r.traffic=[{id:'t0',s:1001,x:0,speed:20,cruiseSpeed:20,type:'traffic',steer:0,wasAhead:true,passCounted:false}];
  if(ghost)r.invulnerable=2;
  for(let i=0;i<120;i++){if(ghost&&i===6)r.x=2.5;step(r,1/120,emptyInput());}
  return r;
 }
 const clean=drive();assert.equal(clean.nearMisses,1);assert.equal(clean.chain,1);
 for(let i=0;i<120;i++)step(clean,1/120,emptyInput());assert.equal(clean.nearMisses,1);
 const contact=drive(true);assert.equal(contact.health,100);assert.equal(contact.nearMisses,0);
});
