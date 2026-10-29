import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.min.js';
import {createOculaire,createWhispers,GROWTH,growthAt,WORDS} from '../oculaire.js';
import {META,SURFACES} from '../assets/oculaire/portrait-data.js';
import {sample,STAGES} from '../track.js';
import {createRace,pause,resume,finish,step} from '../simulation.js';
const data={META,SURFACES};
function setup(){const scene=new T.Scene(),view=createOculaire(scene,{loadModel:async()=>data}),player=new T.Group();scene.add(player);return {scene,view,player};}
function place(s,x,aspect){
 const p=sample(s,x),behind=sample(Math.max(0,s-12),x*.62),ahead=sample(s+24,x*.7),camera=new T.PerspectiveCamera(62,aspect,.3,4200);
 camera.position.set(behind.x,behind.y+4.3,behind.z);
 if(s<15){const start=sample(0);camera.position.set(p.x-Math.sin(start.angle)*10.5,p.y+4.3,p.z-Math.cos(start.angle)*10.5);}
 camera.lookAt(ahead.x,ahead.y+1.1,ahead.z);camera.updateMatrixWorld(true);return {p,camera};
}

test('adapted portrait is self contained and preserves the five eyes, three noses, three mouths within bounded geometry',()=>{
 assert.equal(META.eyes.length,5);assert.equal(META.mouths.length,3);assert.ok(META.triangles<100000);assert.ok(META.draws<=30);
 const file=readFileSync(new URL('../assets/oculaire/portrait-data.js',import.meta.url));assert.ok(file.length<1800000);
 assert.ok(SURFACES.every(s=>s.p&&s.n&&s.c&&s.i));assert.equal(SURFACES.filter(s=>s.group.startsWith('eye_')&&s.finish==='iris').length,5);
 const runtime=readFileSync(new URL('../oculaire.js',import.meta.url),'utf8');assert.doesNotMatch(runtime,/GLTFLoader|\.glb/);
});

test('failed portrait adaptation reports an exact error and leaves the game scene usable',async()=>{
 const scene=new T.Scene(),messages=[],old=console.error;console.error=()=>{};
 try{const view=createOculaire(scene,{loadModel:()=>Promise.reject(new Error('portrait HTTP 404')),report:s=>messages.push(s)});await view.ready;assert.equal(view.status.state,'error');assert.equal(view.status.error,'Error: portrait HTTP 404');assert.equal(view.root.visible,false);assert.equal(messages.length,1);view.dispose();assert.equal(scene.children.length,0);}finally{console.error=old;}
});

test('dispose before deferred portrait completes prevents allocating the asset',async()=>{
 let done;const source=new Promise(resolve=>done=resolve),scene=new T.Scene(),view=createOculaire(scene,{loadModel:()=>source});view.dispose();done(data);await view.ready;assert.equal(scene.children.length,0);assert.equal(view.root.children[0].children.length,0);
});

test('the five independent eye axes converge on the car through the real bends, three lanes, nitro and all growth stages',async()=>{
 const {view,player}=setup();await view.ready;
 for(const aspect of[320/740,390/844,844/390])for(let s=0;s<13000;s+=300)for(const x of[-5,0,5]){
  const {p,camera}=place(s,x,aspect);player.position.set(p.x,p.y+.015,p.z);const r=createRace();Object.assign(r,{state:'RACE',s,x,time:s/48,speed:68,boosting:true,drifting:s%600===0});view.update(r,player,camera);const a=view.inspect(camera);
  for(const eye of a.gazes)assert.ok(eye.errorRadians<1e-6,`gaze ${s}/${x}: ${eye.errorRadians}`);
  assert.ok(a.screen.min[0]>-1&&a.screen.max[0]<1,`horizontal bounds ${s}/${aspect}`);assert.ok(a.screen.min[1]>.02&&a.screen.max[1]<1,`vertical bounds ${s}`);
 }
 view.dispose();
});

test('growth reaches all five specified plateaus continuously within the existing 13 km route',()=>{
 assert.deepEqual(GROWTH,[1,1.06,1.12,1.18,1.25]);for(let i=0;i<5;i++)assert.equal(growthAt(STAGES[i].start+350),GROWTH[i]);
 for(const stage of STAGES.slice(1))assert.ok(Math.abs(growthAt(stage.start-.001)-growthAt(stage.start+.001))<1e-7);
});

test('whispers defer to driving threats, never repeat, and pause with simulation time',()=>{
 const whispers=createWhispers(),r=createRace();Object.assign(r,{state:'RACE',s:700,time:20,speed:48});r.capture=1;assert.equal(whispers.update(r).text,'');r.capture=0;
 const first=whispers.update(r);assert.ok(WORDS.includes(first.text));pause(r);assert.equal(whispers.update(r).text,'');resume(r);assert.equal(whispers.update(r).text,first.text);
 const seen=new Set([first.text]);for(const s of[2700,4700,6100,9500,11300]){r.s=s;r.time+=60;r.lastRevealTime=-100;const value=whispers.update(r);assert.ok(value.text);assert.ok(!seen.has(value.text));seen.add(value.text);}assert.equal(seen.size,6);
 whispers.reset(r.seed);r.s=700;r.time=20;assert.equal(whispers.update(r).text,first.text);
});

test('only victory reveals the reverse; impact creates exactly 1000 pigmented surface fragments; pause and restart restore state',async()=>{
 const {view,player}=setup();await view.ready;const {p,camera}=place(12999,0,390/844);player.position.set(p.x,p.y,p.z);const r=createRace();Object.assign(r,{state:'RACE',s:13000,time:270,speed:48});view.update(r,player,camera);
 r.result={won:false,ending:'caught'};r.state='INTERCEPTION';r.cinematic=3;view.update(r,player,camera);assert.equal(view.inspect(camera).markVisible,false);assert.equal(view.status.fragments,0);
 r.result={won:true,ending:'escape'};r.state='ARRIVAL';
 for(const t of[0,1,2,3.6,4.69]){r.cinematic=t;view.update(r,player,camera);assert.equal(view.status.fragments,0);assert.equal(view.inspect(camera).markVisible,t>=1.85);}
 r.cinematic=4.7;view.update(r,player,camera);assert.equal(view.status.fragments,1000);assert.equal(view.status.phase,'fracture');assert.equal(view.inspect(camera).markVisible,false);assert.ok(view.inspect(camera).gpuBytes<13000000);
 pause(r);const before=view.root.position.toArray();for(let i=0;i<8;i++)view.update(r,player,camera);assert.deepEqual(view.root.position.toArray(),before);resume(r);
 view.reset();const fresh=createRace();fresh.state='RACE';view.update(fresh,player,camera);assert.equal(view.status.phase,'sky');assert.equal(view.status.fragments,0);assert.equal(view.inspect(camera).markVisible,false);view.dispose();
});

test('both existing victory durations leave time for impact without changing the single ending draw',()=>{
 for(const ending of['love','escape']){let calls=0;const r=createRace(()=>{calls++;return ending;});Object.assign(r,{state:'RACE',s:13000,speed:48});finish(r,true);for(let i=0;i<600;i++)step(r,1/120);assert.equal(r.state,'ARRIVAL');assert.ok(r.cinematic>4.7);for(let i=0;i<2100;i++)step(r,1/120);assert.equal(r.state,'RESULTS');assert.equal(calls,1);}
});
