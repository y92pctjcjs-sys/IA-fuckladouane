import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../vendor/three.module.min.js';
import {createOculaire,OCULAIRE_MODEL} from '../oculaire.js';
import {sample} from '../track.js';

test('validated v4 binary remains byte-identical, with five eyes, three modeled noses and three mouths',()=>{
  const bytes=readFileSync(OCULAIRE_MODEL);
  assert.equal(bytes.length,41870456);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'08ac7e703ce322dadbd3c5a8be83955c17ca8289fa739c260575ffe248c5d10e');
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for (const [pattern,count] of [[/^eye_\d$/,5],[/^nose_\d$/,3],[/^mouth_\d$/,3]]) assert.equal(gltf.nodes.filter(n=>pattern.test(n.name)).length,count);
  assert.equal(gltf.meshes.filter(m=>/^nose_\d_relief_anatomique$/.test(m.name)).length,3);
  assert.equal(gltf.images.length,24);assert.ok(gltf.images.every(image=>Number.isInteger(image.bufferView)&&!image.uri));
});

test('a failed import reports the exact error and leaves the game scene available',async()=>{
  const scene=new T.Scene(),messages=[],error=new Error('model HTTP 404');
  const old=console.error;console.error=()=>{};
  try {
    const view=createOculaire(scene,{loadModel:()=>Promise.reject(error),report:value=>messages.push(value)});
    await view.ready;assert.equal(view.status.state,'error');assert.equal(view.status.error,'Error: model HTTP 404');
    assert.equal(view.root.visible,false);assert.equal(messages.length,1);assert.equal(scene.children.length,1);
    view.dispose();assert.equal(scene.children.length,0);
  } finally {console.error=old;}
});

test('disposing during loading releases the eventual model without making it visible',async()=>{
  let resolve;const pending=new Promise(done=>resolve=done),scene=new T.Scene();
  const geometry=new T.BoxGeometry(1,2,1),mesh=new T.Mesh(geometry,new T.MeshStandardMaterial());
  let released=0;geometry.addEventListener('dispose',()=>released++);
  const view=createOculaire(scene,{loadModel:()=>pending});view.dispose();resolve({scene:mesh});await view.ready;
  assert.equal(released,1);assert.equal(view.root.visible,false);assert.equal(scene.children.length,0);
});

test('world-space placement remains above the road and inside portrait and landscape camera bounds through the real route',async()=>{
  const scene=new T.Scene(),model=new T.Mesh(new T.BoxGeometry(1.95,2.723,2.1),new T.MeshStandardMaterial());
  const view=createOculaire(scene,{loadModel:async()=>({scene:model})});await view.ready;
  const player=new T.Group();scene.add(player);
  for (const aspect of [320/740,390/844,844/390]) for (let s=0;s<=12900;s+=150) for (const x of [-5,0,5]) {
    const p=sample(s,x),behind=sample(Math.max(0,s-12),x*.62),ahead=sample(s+24,x*.7);
    player.position.set(p.x,p.y+.015,p.z);
    const camera=new T.PerspectiveCamera(62,aspect,.3,4200);camera.position.set(behind.x,behind.y+4.3,behind.z);
    if(s<15) {const start=sample(0);camera.position.set(p.x-Math.sin(start.angle)*10.5,p.y+4.3,p.z-Math.cos(start.angle)*10.5);}
    camera.lookAt(ahead.x,ahead.y+1.1,ahead.z);camera.updateMatrixWorld(true);
    view.update({s},player,camera);const bounds=view.inspect(camera).screen;
    assert.ok(bounds.min[0]>-1&&bounds.max[0]<1,`horizontal clipping at ${s}, lane ${x}, aspect ${aspect}: ${JSON.stringify(bounds)}`);
    assert.ok(bounds.min[1]>.05&&bounds.max[1]<1,`vertical placement at ${s}: ${JSON.stringify(bounds)}`);
    assert.ok(view.root.position.distanceTo(camera.position)>200,'head remains a distant object in the world');
  }
  view.dispose();
});
