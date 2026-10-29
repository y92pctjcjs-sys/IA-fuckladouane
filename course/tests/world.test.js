import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {LENGTH,STAGES,BLOCKADES,sample,screenSide} from '../track.js';
import {LANDMARKS,routeData,routeSvg,elevationSvg,curveAt} from '../route-atlas.js';
import {forestPlacements,landscapeChunk,setLandscapeDetail,curvedRails} from '../world-landscape.js';
import {addWorldLandmarks} from '../world-landmarks.js';
import {canvasSink} from '../tools/canvas-sink.mjs';
import {createAtlasDialog} from '../atlas-dialog.js';
import {createRenderer} from '../renderer.js';
import {createRace} from '../simulation.js';
function withCanvas(run){const old=globalThis.document;globalThis.document={createElement:canvasSink};try{return run();}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}}
test('atlas covers the actual 13 km and all five stages without inventing another route',()=>{
 const all=routeData();assert.equal(all.from,0);assert.equal(all.to,LENGTH);assert.equal(all.stages.length,5);assert.equal(all.blockades.length,10);assert.equal(all.points[0].s,0);assert.equal(all.points.at(-1).s,LENGTH);
 for(const p of all.points){const real=sample(p.s);assert.deepEqual([p.x,p.y,p.z],[real.x,real.y,real.z]);}
 for(const [i,stage]of STAGES.entries()){
  const local=routeData(i);assert.equal(local.from,stage.start);assert.equal(local.to,stage.end);assert.equal(local.stages.length,1);
  for(const l of local.landmarks)assert.equal(l.kind,stage.kind);
 }
 for(const [i,b]of all.blockades.entries()){assert.equal(b.s,BLOCKADES[i].s);assert.equal(b.opening,screenSide(BLOCKADES[i].gap));}
 for(const stage of [-1,0,1,2,3,4])assert.doesNotMatch(routeSvg(stage,3760),/NaN|Infinity|undefined/);
 assert.doesNotMatch(elevationSvg(),/NaN|Infinity|undefined/);assert.equal(new Set(LANDMARKS.map(l=>l.id)).size,9);
});
test('forest alternates clearings and groves, preserves portals and keeps its canopy outside driving space',()=>{
 const counts=new Set();let trees=0;
 for(let s=0;s<LENGTH;s+=80){
  const entries=forestPlacements(s);assert.deepEqual(entries,forestPlacements(s));counts.add(entries.length);trees+=entries.length;
  for(const p of entries){assert.ok(p.s>=2320&&!(p.s>5040&&p.s<7560));assert.ok(p.s<=LENGTH-950);assert.ok(Math.abs(p.lateral)-4.5*p.scale>10.5);assert.ok(['oak','birch','pine'].includes(p.species));}
 }
 assert.ok(trees>1000&&trees<4000);assert.ok(counts.size>4);
});
test('forest detail switches without allocations, shares templates and keeps terrain outside the road',()=>withCanvas(()=>{
 const a=new T.Group(),b=new T.Group();landscapeChunk(a,2880);landscapeChunk(b,2960);const layers=a.userData.landscapeRoot.userData.forestLayers;
 assert.ok(layers.near.children.length>0&&layers.near.children.length<=2);assert.equal(layers.far.visible,false);
 const geometries=layers.near.children.map(m=>m.geometry),matrices=layers.near.children.map(m=>m.instanceMatrix.array.slice());
 for(let i=0;i<12;i++){setLandscapeDetail(a,2880,2800,i%2===0);assert.equal(layers.far.visible,i%2===0);}
 for(const [i,m]of layers.near.children.entries()){assert.equal(m.geometry,geometries[i]);assert.deepEqual(m.instanceMatrix.array,matrices[i]);assert.equal(m.material.vertexColors,true);}
 const shared=new Set();a.traverse(o=>{if(o.isInstancedMesh)shared.add(o.geometry);});let found=0;b.traverse(o=>{if(o.isInstancedMesh&&shared.has(o.geometry))found++;});assert.ok(found>0);
 a.traverse(o=>{if(o.geometry)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
 const empty=new T.Group();landscapeChunk(empty,5600);assert.equal(empty.children.length,0);
}));
test('curved guardrails join exactly at chunk boundaries and present solid faces to the driver',()=>{
 for(const start of [0,2880,5520,8000,11680]){
  const a=curvedRails(new T.Group(),start),b=curvedRails(new T.Group(),start+80),pa=a.geometry.attributes.position,pb=b.geometry.attributes.position;
  for(let side=0;side<2;side++)for(let j=0;j<7;j++){
   const end=side*21*7+20*7+j,begin=side*21*7+j;
   assert.ok(new T.Vector3().fromBufferAttribute(pa,end).distanceTo(new T.Vector3().fromBufferAttribute(pb,begin))<.002);
  }
  a.updateMatrixWorld(true);
  for(const side of[-1,1]){const s=start+40,p=sample(s,side*8.5),q=sample(s,side*10);const direction=new T.Vector3(q.x-p.x,0,q.z-p.z).normalize();const ray=new T.Raycaster(new T.Vector3(p.x,p.y+.6,p.z),direction);assert.ok(ray.intersectObject(a).length>0,'guardrail must face the driving corridor');}
 }
});
test('all mapped landmarks exist as bounded 3D assets away from the driveable road',()=>{
 const ids=new Set();let triangles=0;
 for(const l of LANDMARKS){
  const root=new T.Group();addWorldLandmarks(root,Math.floor(l.s/80)*80);assert.ok(root.children.length>0);
  for(const g of root.children){ids.add(g.userData.landmark);g.updateMatrixWorld(true);const inverse=new T.Matrix4().makeRotationY(-sample(g.userData.roadS).angle),origin=sample(g.userData.roadS);
   g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;triangles+=(o.geometry.index?.count??p.count)/3;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).sub(new T.Vector3(origin.x,origin.y,origin.z)).applyMatrix4(inverse);assert.ok(Math.abs(v.x)>(l.kind==='tunnel'?9.3:14),'decor must stay out of the road');assert.ok(v.y<23);}});
  }
 }
 assert.equal(ids.size,9);assert.ok(triangles<10000);
});
test('turn descriptors agree with the existing screen-side convention',()=>{
 const directions=new Set();for(let s=0;s<LENGTH;s+=20){const turn=curveAt(s);if(turn.direction!=='OUVERT'){assert.equal(turn.direction,screenSide(turn.curvature));assert.ok(turn.radius>340);directions.add(turn.direction);}}
 assert.deepEqual([...directions].sort(),['DROITE','GAUCHE']);
});
test('atlas close messages are accepted only from its own frame and same origin',()=>{
 const listeners=new Map(),source={},frame={contentWindow:source,src:''};let closes=0,opens=0;
 const win={location:{origin:'local-origin'},addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
 const dialog={open:false,ownerDocument:{defaultView:win},showModal(){this.open=true;opens++;},close(){this.open=false;closes++;}};
 const atlas=createAtlasDialog(dialog,frame);atlas.open(3760);assert.equal(opens,1);assert.ok(frame.src.includes('at=3760'));const close=listeners.get('message');
 close({origin:'wrong-origin',source,data:{type:'fld-atlas-close'}});close({origin:'local-origin',source:{},data:{type:'fld-atlas-close'}});assert.equal(closes,0);
 close({origin:'local-origin',source,data:{type:'fld-atlas-close'}});assert.equal(closes,1);assert.equal(dialog.open,false);atlas.dispose();assert.equal(listeners.size,0);
});
test('OMERTA roof begins at 5.2 km and ends at 7.4 km despite the streaming chunk boundary',()=>{
 const names=['document','devicePixelRatio','innerWidth','innerHeight','addEventListener','removeEventListener'],old=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 Object.assign(globalThis,{document:{createElement:canvasSink},devicePixelRatio:1,innerWidth:390,innerHeight:844,addEventListener(){},removeEventListener(){}});
 let roofs=[];const sink={setPixelRatio(){},setSize(){},dispose(){},info:{},render(scene){scene.updateMatrixWorld(true);roofs=[];scene.traverseVisible(o=>{if(o.name==='OMERTA / TOIT')roofs.push(o);});}};let view;
 try{view=createRenderer({},true,()=>sink,'auto',undefined,{oculaire:{loadModel:()=>new Promise(()=>{})}});const r=createRace();r.state='RACE';r.speed=48;
  for(const s of [5198,5202,7380,7398,7402,7420]){r.s=s;view.render(r,1/60);const p=sample(s),ray=new T.Raycaster(new T.Vector3(p.x,p.y+3,p.z),new T.Vector3(0,1,0));assert.equal(ray.intersectObjects(roofs).length>0,s>=5200&&s<7400,'roof at '+s);}
 }finally{view?.dispose();for(const name of names)if(old[name]===undefined)delete globalThis[name];else globalThis[name]=old[name];}
});
