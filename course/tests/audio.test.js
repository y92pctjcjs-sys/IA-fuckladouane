import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreEvents,BPM,STEP_SECONDS,frequency} from '../score.js';
import {createAudio,engineTone} from '../audio.js';
import {TAUNTS,tauntIndex} from '../oculaire-taunts.js';
import {createRace,hit,finish} from '../simulation.js';

test('original 108 BPM score develops beyond a short loop and resolves all victories',()=>{
 assert.equal(BPM,108);assert.ok(Math.abs(STEP_SECONDS*16-60/108*4)<1e-9);assert.equal(frequency(69),440);
 const bars=(bar,sector=0)=>Array.from({length:16},(_,n)=>scoreEvents(bar*16+n,sector,70));
 assert.notDeepEqual(bars(0),bars(8));assert.notDeepEqual(bars(8),bars(24));assert.notDeepEqual(bars(24,1),bars(24,2));assert.notDeepEqual(bars(24,2),bars(24,4));
 const ending=Array.from({length:32},(_,n)=>scoreEvents(n,4,0,true)).flat();assert.ok(ending.some(e=>e.kind==='pad'));assert.equal(ending.some(e=>e.kind==='kick'||e.kind==='snare'),false);
 for(let step=0;step<2200;step++)for(const e of scoreEvents(step,Math.floor(step/450),80)){assert.ok(e.duration>0&&e.volume>0&&e.volume<1);assert.ok(Number.isFinite(frequency(e.midi)));}
});
function fakeContext(){
 const sources=[];
 const param=()=>({value:0,setTargetAtTime(value){this.target=value;},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),detune:param(),Q:param(),pan:param(),delayTime:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connections:[],connect(to){this.connections.push(to);},disconnect(){}});
 const source=()=>{const n={...node(),start(t){n.startTime=t;},stop(t){if(t===undefined)n.onended?.();}};sources.push(n);return n;};
 const context={state:'suspended',currentTime:0,sampleRate:8000,destination:node(),createGain:node,createBiquadFilter:node,createStereoPanner:node,createDelay:node,createDynamicsCompressor:node,createOscillator:source,createBufferSource:source,createBuffer(c,length){const data=new Float32Array(length);return {getChannelData:()=>data};},async resume(){this.state='running';this.onstatechange?.();},async suspend(){this.state='suspended';this.onstatechange?.();},async close(){this.state='closed';},sources};return context;
}
test('audio is gesture-gated, one scheduler survives replay, pause and Safari-style interruption',async()=>{
 const previousSet=globalThis.setInterval,previousClear=globalThis.clearInterval,timers=new Map();let id=0,initialized=0,interruptions=0;const context=fakeContext();
 globalThis.setInterval=(fn,ms)=>{assert.equal(ms,25);timers.set(++id,fn);return id;};globalThis.clearInterval=n=>timers.delete(n);
 try{
  const audio=createAudio(()=>interruptions++,()=>{initialized++;return context;});audio.update({state:'MENU'});await audio.resume();assert.equal(initialized,0);assert.equal(audio.enabled,false);
  await audio.toggle();assert.equal(initialized,1);assert.equal(timers.size,1);assert.ok(audio.diagnostics.voices>0);
  audio.suspend();assert.equal(timers.size,0);assert.equal(interruptions,0);await audio.resume();assert.equal(timers.size,1);
  for(let i=0;i<5;i++){audio.reset();await audio.resume();assert.equal(timers.size,1);assert.ok(audio.diagnostics.voices<10);}
  const before=context.sources.length;context.currentTime+=20;[...timers.values()][0]();assert.ok(context.sources.length-before<20,'do not burst twenty seconds of late notes');
  context.state='interrupted';context.onstatechange();assert.equal(interruptions,1);assert.equal(timers.size,0);await audio.resume();assert.equal(timers.size,1);assert.equal(initialized,1);
  await audio.toggle();assert.equal(audio.enabled,false);assert.equal(timers.size,0);assert.equal(audio.diagnostics.voices,0);
  audio.dispose();assert.equal(context.state,'closed');
 }finally{globalThis.setInterval=previousSet;globalThis.clearInterval=previousClear;}
});
test('quiet filtered engine has its own physical bus and can be muted without changing effects or music',async()=>{
 const context=fakeContext(),audio=createAudio(()=>{},()=>context);
 try{
  audio.configure({engineEnabled:false,engine:.28,effects:.8,music:.6});await audio.toggle();
  const engine=context.sources.find(source=>source.type==='triangle'&&source.startTime===undefined);
  const filter=engine.connections[0].connections[0],engineBus=filter.connections[0];
  assert.equal(filter.type,'lowpass');assert.equal(engineBus.gain.target,0);assert.notEqual(engine.type,'sawtooth');
  const siren=context.sources.filter(source=>source.type==='sine'&&source.startTime===undefined)[1],fxBus=siren.connections[0].connections[0];
  assert.notEqual(engineBus,fxBus);assert.equal(fxBus.gain.target,.8);assert.equal(audio.diagnostics.musicLevel,.6);
  audio.configure({engineEnabled:true,engine:.13});assert.equal(engineBus.gain.target,.13);assert.equal(fxBus.gain.target,.8);
  audio.configure({effects:0});assert.equal(fxBus.gain.target,0);assert.equal(engineBus.gain.target,.13);
 }finally{audio.dispose();}
});
test('engine gear hysteresis removes boundary chatter and the soundtrack contains stereo lead development',()=>{
 assert.equal(engineTone(10.2,1).gear,1);assert.equal(engineTone(11,1).gear,2);assert.equal(engineTone(9.8,2).gear,2);
 let gear=1;for(let speed=0;speed<=70;speed+=.1){const tone=engineTone(speed,gear);gear=tone.gear;assert.ok(tone.hz>=34&&tone.hz<85);assert.ok(tone.cutoff<=340);}
 const events=Array.from({length:16*24},(_,n)=>scoreEvents(16*16+n,1,80)).flat();
 assert.ok(events.some(e=>e.kind==='lead'));assert.ok(events.some(e=>e.pan<-.2));assert.ok(events.some(e=>e.pan>.2));
 assert.notDeepEqual(scoreEvents(16*16,1),scoreEvents(48*16,1));
});

const tauntSources=context=>context.sources.filter(s=>s.buffer&&s.buffer.getChannelData(0).length<context.sampleRate);
test('each accepted hit schedules exactly one cached taunt through the existing effects bus and cleans up its voice',async()=>{
 const context=fakeContext(),audio=createAudio(()=>{},()=>context),r=createRace(undefined,13);r.state='RACE';r.speed=40;
 try{
  await audio.toggle();audio.update(r);const buffers=[];
  for(let n=1;n<=4;n++){
   r.invulnerable=0;assert.equal(hit(r,5),true);audio.update(r);
   assert.equal(audio.diagnostics.tauntCount,n);assert.equal(audio.diagnostics.lastTaunt,TAUNTS[tauntIndex(r.seed,n)].id);
   for(let frame=0;frame<12;frame++)audio.update(r);assert.equal(audio.diagnostics.tauntCount,n);
   assert.equal(hit(r,5),false);audio.update(r);assert.equal(audio.diagnostics.tauntCount,n);
   const source=tauntSources(context).at(-1),gain=source.connections[0],fxBus=gain.connections[0];
   assert.equal(source.startTime,context.currentTime+.035);assert.equal(gain.gain.value,.34);assert.equal(fxBus.gain.target,.7);buffers.push(source.buffer);
   const voices=audio.diagnostics.voices;source.onended();assert.equal(audio.diagnostics.voices,voices-1);
  }
  assert.equal(new Set(buffers.slice(0,3)).size,3);assert.equal(buffers[0],buffers[3]);assert.ok(audio.diagnostics.tauntBytes<80000);
  audio.reset();assert.equal(audio.diagnostics.voices,0);assert.equal(audio.diagnostics.tauntCount,0);assert.equal(audio.diagnostics.lastTaunt,null);
 }finally{audio.dispose();assert.equal(audio.diagnostics.tauntBytes,0);}
});

test('sound off, zero effects, zero master and suspension consume hit events without a delayed taunt after reactivation',async()=>{
 const context=fakeContext(),audio=createAudio(()=>{},()=>context),r=createRace();r.state='RACE';
 const damage=()=>{r.invulnerable=0;hit(r,5);audio.update(r);};
 try{
  damage();assert.equal(audio.enabled,false);assert.equal(tauntSources(context).length,0);
  await audio.toggle();audio.update(r);assert.equal(audio.diagnostics.tauntCount,0);damage();assert.equal(audio.diagnostics.tauntCount,1);
  audio.configure({effects:0});damage();assert.equal(audio.diagnostics.tauntCount,1);audio.configure({effects:.7});audio.update(r);assert.equal(audio.diagnostics.tauntCount,1);
  audio.configure({master:0});damage();audio.configure({master:.75});audio.update(r);assert.equal(audio.diagnostics.tauntCount,1);
  audio.suspend();damage();await audio.resume();audio.update(r);assert.equal(audio.diagnostics.tauntCount,1);
  await audio.toggle();damage();await audio.toggle();audio.update(r);assert.equal(audio.diagnostics.tauntCount,1);
  damage();assert.equal(audio.diagnostics.tauntCount,2);
 }finally{audio.dispose();}
});

test('a fatal hit retains its taunt during interception and a victory does not fabricate one',async()=>{
 const context=fakeContext(),audio=createAudio(()=>{},()=>context),r=createRace();r.state='RACE';r.health=5;
 try{
  await audio.toggle();audio.update(r);hit(r,11);finish(r,false,'VÉHICULE HORS SERVICE');audio.update(r);assert.equal(audio.diagnostics.tauntCount,1);audio.update(r);assert.equal(audio.diagnostics.tauntCount,1);
  audio.reset();const winner=createRace();winner.state='RACE';audio.update(winner);finish(winner,true);audio.update(winner);assert.equal(audio.diagnostics.tauntCount,0);
 }finally{audio.dispose();}
});

test('the victory engine follows the slow departure, fades into the distance and retains its separate mute bus',async()=>{
 const context=fakeContext(),audio=createAudio(()=>{},()=>context),r=createRace(()=> 'escape');r.state='RACE';r.speed=48;
 try{
  await audio.toggle();audio.update(r);finish(r,true);r.cinematic=6;audio.update(r);
  const engine=context.sources.find(s=>s.type==='triangle'&&s.startTime===undefined),gain=engine.connections[0],bus=gain.connections[0].connections[0];assert.equal(gain.gain.target,0);
  r.cinematic=7.5;audio.update(r);const close=gain.gain.target;assert.ok(close>0&&close<.024);assert.equal(engine.frequency.target,engineTone(6.5).hz);
  r.cinematic=13;audio.update(r);assert.ok(gain.gain.target<close/3);
  audio.configure({engineEnabled:false});assert.equal(bus.gain.target,0);assert.equal(audio.diagnostics.effectsLevel,.7);assert.equal(audio.diagnostics.tauntCount,0);
 }finally{audio.dispose();}
});
