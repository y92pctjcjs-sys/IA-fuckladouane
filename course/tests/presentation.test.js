import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createRace,step,emptyInput} from '../simulation.js';
import {sample,screenSide} from '../track.js';
import {createRenderer} from '../renderer.js';
import {POSTERS,POSTER_SITES,posterAtlas,addRoadPosters} from '../posters.js';
import {formatTime,resultBadge,createScoreCard} from '../results.js';
import {canvasSink} from '../tools/canvas-sink.mjs';
import {readFileSync} from 'node:fs';

function canvasEnvironment(run){
 const names=['document','innerWidth','innerHeight','devicePixelRatio','addEventListener','removeEventListener'],previous=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 Object.assign(globalThis,{document:{createElement:canvasSink},innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener(){},removeEventListener(){}});
 try{return run();}finally{for(const name of names)if(previous[name]===undefined)delete globalThis[name];else globalThis[name]=previous[name];}
}
test('right and left inputs move to the matching side of the actual chase camera projection',()=>canvasEnvironment(()=>{
 let actualCamera;
 const sink={setPixelRatio(){},setSize(){},dispose(){},info:{},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);actualCamera=camera;}};
 const view=createRenderer({},true,()=>sink,'auto',undefined,{oculaire:{loadModel:()=>new Promise(()=>{})}});
 for(const direction of [-1,1]){
  const r=createRace();r.state='RACE';r.s=3000;r.speed=48;view.reset();view.render(r,1/60);
  for(let i=0;i<120;i++)step(r,1/120,{...emptyInput(),steer:direction*.5});
  view.render(r,1/60);const p=sample(r.s,r.x),centre=sample(r.s);
  const a=new T.Vector3(p.x,p.y+.5,p.z).project(actualCamera),b=new T.Vector3(centre.x,centre.y+.5,centre.z).project(actualCamera);
  assert.equal(Math.sign(a.x-b.x),direction);
 }
 assert.equal(screenSide(5),'GAUCHE');assert.equal(screenSide(-5),'DROITE');view.dispose();
}));
test('sixteen original posters cover all five places with one bounded atlas and front-facing print',()=>canvasEnvironment(()=>{
 assert.equal(POSTERS.length,16);assert.ok(POSTER_SITES.length>50);assert.equal(new Set(POSTER_SITES.map(p=>p.kind)).size,5);
 const atlas=posterAtlas();assert.equal(posterAtlas(),atlas);assert.equal(atlas.texture.image.width,1024);assert.equal(atlas.texture.image.height,1536);assert.equal(atlas.geometries.length,16);
 for(const geometry of atlas.geometries)for(const n of geometry.attributes.uv.array)assert.ok(n>=0&&n<=1);
 for(const site of POSTER_SITES){
  const group=new T.Group(),cube=(parent,...args)=>{},positionOn=(object,s,x,y)=>{const p=sample(s,x);object.position.set(p.x,p.y+y,p.z);object.rotation.y=p.angle;};
  addRoadPosters(group,Math.floor(site.s/80)*80,cube,positionOn);group.updateMatrixWorld(true);let checked=0;
  group.traverse(mesh=>{if(mesh.material!==atlas.material)return;const point=new T.Vector3();mesh.getWorldPosition(point);const camera=sample(site.s-22);const normal=new T.Vector3(0,0,1).transformDirection(mesh.matrixWorld);assert.ok(normal.dot(new T.Vector3(camera.x,camera.y+4,camera.z).sub(point))>0,'print must face the approaching driver');checked++;});
  assert.ok(checked>0&&checked<=4);
 }
}));
test('score image uses the exact result and grades never turn a defeat into a victory',()=>{
 const result={won:true,score:37450,time:257.31,health:82,nearMisses:9,escapes:4};assert.equal(resultBadge(result).rank,'S');assert.equal(resultBadge({...result,health:40}).rank,'A');assert.equal(resultBadge({...result,won:false}).rank,'—');
 const texts=[],canvas=canvasSink(),context=canvas.getContext('2d');context.fillText=value=>texts.push(String(value));
 const output=createScoreCard(result,()=>canvas);assert.equal(output.width,1080);assert.equal(output.height,1440);
 assert.ok(texts.includes('SWAGISTAN.'));assert.ok(texts.includes(result.score.toLocaleString('fr-FR')));assert.ok(texts.includes('4:17.31'));assert.ok(texts.includes('82 %'));assert.ok(texts.includes('9'));assert.ok(texts.includes('4'));
 assert.equal(formatTime(59.999),'1:00.00');assert.equal(formatTime(0),'0:00.00');assert.equal(formatTime(240),'4:00.00');
});
test('the published entry refreshes changed modules and preserves the current world module cache',()=>{
 const html=readFileSync(new URL('../../course.html',import.meta.url),'utf8');assert.match(html,/course\/boot\.js\?v=oculaire-impact-005/);assert.match(html,/course\/style\.css\?v=fld-world-002/);
 const updated=new Set(['main.js','renderer.js','audio.js','oculaire.js','oculaire-reactions.js','oculaire-taunts.js']);
 const seen=new Set(),visit=path=>{
  if(seen.has(path))return;seen.add(path);const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  for(const match of source.matchAll(/'\.\/([^']+\.js(?:\?[^']+)?)'/g)){
   if(match[1].startsWith('vendor/')||match[1].startsWith('assets/'))continue;
   const file=match[1].split('?')[0],version=updated.has(file)?'oculaire-impact-005':'fld-world-002';
   assert.ok(match[1].endsWith('?v='+version),`${path} must not request a stale ${match[1]}`);visit(file);
  }
 };
 visit('boot.js');assert.ok(seen.has('pursuit.js')&&seen.has('posters.js')&&seen.has('results.js'));
});
