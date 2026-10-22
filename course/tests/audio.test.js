import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreEvents,BPM,STEP_SECONDS,frequency} from '../score.js';
import {createAudio} from '../audio.js';

test('original 108 BPM score develops beyond a short loop and resolves all victories',()=>{
 assert.equal(BPM,108);assert.ok(Math.abs(STEP_SECONDS*16-60/108*4)<1e-9);assert.equal(frequency(69),440);
 const bars=(bar,sector=0)=>Array.from({length:16},(_,n)=>scoreEvents(bar*16+n,sector,70));
 assert.notDeepEqual(bars(0),bars(8));assert.notDeepEqual(bars(8),bars(24));assert.notDeepEqual(bars(24,1),bars(24,2));assert.notDeepEqual(bars(24,2),bars(24,4));
 const ending=Array.from({length:32},(_,n)=>scoreEvents(n,4,0,true)).flat();assert.ok(ending.some(e=>e.kind==='pad'));assert.equal(ending.some(e=>e.kind==='kick'||e.kind==='snare'),false);
 for(let step=0;step<2200;step++)for(const e of scoreEvents(step,Math.floor(step/450),80)){assert.ok(e.duration>0&&e.volume>0&&e.volume<1);assert.ok(Number.isFinite(frequency(e.midi)));}
});
function fakeContext(){
 const sources=[];
 const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),detune:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){}});
 const source=()=>{const n={...node(),start(t){n.startTime=t;},stop(t){if(t===undefined)n.onended?.();}};sources.push(n);return n;};
 const context={state:'suspended',currentTime:0,sampleRate:8000,destination:node(),createGain:node,createBiquadFilter:node,createDynamicsCompressor:node,createOscillator:source,createBufferSource:source,createBuffer(c,length){const data=new Float32Array(length);return {getChannelData:()=>data};},async resume(){this.state='running';this.onstatechange?.();},async suspend(){this.state='suspended';this.onstatechange?.();},async close(){this.state='closed';},sources};return context;
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
