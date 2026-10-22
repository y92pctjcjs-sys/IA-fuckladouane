import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.min.js';
import {createVehicle,animateVehicle} from '../models.js';
import {createDrivingEffects} from '../effects.js';
import {asphaltMaterial,environmentTexture,softTexture} from '../materials.js';
import {createRace} from '../simulation.js';
import {testCanvas} from './helpers/canvas.js';
function withCanvas(run){const original=globalThis.document;globalThis.document={createElement:testCanvas};try{run();}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}}

test('custom FLD car has valid finite geometry and a footprint matching the existing collisions',()=>withCanvas(()=>{
 const car=createVehicle(),bounds=new T.Box3();car.updateMatrixWorld(true);let triangles=0;
 car.traverse(o=>{if(!o.isMesh||o.userData.cpuTextureOnly||!o.visible)return;
  o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
  const pos=o.geometry.attributes.position;assert.ok([...pos.array].every(Number.isFinite));
  const index=o.geometry.index;if(index)for(const i of index.array)assert.ok(i>=0&&i<pos.count);triangles+=(index?index.count:pos.count)/3;
 });
 const size=bounds.getSize(new T.Vector3());assert.ok(size.x<2.12&&size.x>1.8);assert.ok(size.z<4.25&&size.z>3.8);assert.ok(triangles>3000&&triangles<30000);
}));
test('custom vehicle instances share geometry; steering and wheel animation respect the paused step',()=>withCanvas(()=>{
 const first=createVehicle(),second=createVehicle();const a=first.getObjectByName('Chassis'),b=second.getObjectByName('Chassis');assert.equal(a.geometry,b.geometry);assert.equal(first.userData.paint.isMeshPhysicalMaterial,true);
 assert.notEqual(a.geometry,createVehicle('cop',1).getObjectByName('Chassis').geometry);
 first.updateMatrixWorld(true);for(const wheel of first.userData.wheels)wheel.rolling.traverse(mesh=>{if(mesh.isMesh)assert.ok(mesh.matrixWorld.determinant()>0,'mirrored wheels must remain compatible with instancing');});
 const r=createRace();r.state='RACE';r.speed=45;r.steer=.5;animateVehicle(first,r,1/60);const wheel=first.userData.wheels.find(w=>w.front);assert.ok(wheel.rolling.rotation.x>0);assert.equal(wheel.steering.rotation.y,.15);
 const angle=wheel.rolling.rotation.x;animateVehicle(first,r,0);assert.equal(wheel.rolling.rotation.x,angle);
}));
test('driving effects keep fixed reusable pools, freeze in pause and clear on replay',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),fx=createDrivingEffects(scene),r=createRace();r.state='RACE';r.drifting=true;r.boosting=true;r.speed=45;
 const pools=[...scene.children];assert.deepEqual(pools.map(p=>p.count),[160,48,16]);
 for(let i=0;i<600;i++){r.time+=1/60;r.s+=.8;fx.update(r,camera);}assert.deepEqual(scene.children,pools);
 const before=pools.map(p=>p.instanceMatrix.array.slice());r.state='PAUSE';for(let i=0;i<30;i++)fx.update(r,camera);for(let i=0;i<pools.length;i++)assert.deepEqual(pools[i].instanceMatrix.array,before[i]);
 fx.clear();for(const pool of pools){assert.ok([...pool.instanceMatrix.array].every(Number.isFinite));assert.equal(pool.instanceMatrix.array[0],0);}
 const quietScene=new T.Scene(),quiet=createDrivingEffects(quietScene,true);r.state='RACE';quiet.update(r,camera);assert.equal(quietScene.children[1].visible,false);assert.equal(quietScene.children[2].visible,false);
});
test('procedural maps and reflection environment stay small and are reused',()=>{
 const asphalt=asphaltMaterial();assert.equal(asphalt,asphaltMaterial());for(const texture of[asphalt.map,asphalt.normalMap,asphalt.roughnessMap]){assert.ok(texture.image.width<=128);assert.equal(texture.image.data.length,texture.image.width*texture.image.height*4);}
 const cube=environmentTexture();assert.equal(cube,environmentTexture());assert.equal(cube.images.length,6);for(const face of cube.images)assert.equal(face.image.width,64);
 const shadow=softTexture().image;assert.ok(shadow.data[(32*64+32)*4+3]>shadow.data[3]);
});
test('redistributed source models and attribution match the reviewed upstream assets',()=>{
 const blob=p=>{const bytes=readFileSync(new URL(p,import.meta.url));return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');};
 assert.equal(blob('../assets/source-chassis.glb'),'4116e944dbca1e57033dd633d2e50df4f91cbac1');
 assert.equal(blob('../assets/source-wheel.glb'),'45aa3d40406cc49b689e9c1a7dcf61c4a19915b4');
 assert.equal(blob('../assets/fld-tribal.png'),'7aaaa2f837fb7197399135e79a41cd443efa0eed');
 const credits=readFileSync(new URL('../CREDITS.md',import.meta.url),'utf8');assert.match(credits,/Alexus16/);assert.match(credits,/creativecommons.org\/licenses\/by\/4.0/);assert.match(credits,/Skid.tsx/);
 const license=readFileSync(new URL('../licenses/pmndrs-MIT.txt',import.meta.url),'utf8');assert.match(license,/Copyright 2021 pmdrs, contributors/);
});

test('high patrol and low interceptor have distinct silhouettes within the collision envelope',()=>withCanvas(()=>{
 const sizes=[];
 for(const variant of[0,1]){
  const vehicle=createVehicle('cop',variant),bounds=new T.Box3();vehicle.updateMatrixWorld(true);
  vehicle.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.cpuTextureOnly){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
  const size=bounds.getSize(new T.Vector3());sizes.push(size);assert.ok(size.x<2.12);assert.ok(size.z<4.3);assert.ok(vehicle.userData.wheels.length===4);assert.equal(vehicle.userData.blue.material.color.getHex(),vehicle.userData.red.material.color.getHex());
 }
 assert.ok(sizes[0].y>sizes[1].y+.4);
}));

test('unmarked customs share civilian paint and geometry and keep their hidden flashers off',()=>withCanvas(()=>{
 const hidden=createVehicle('undercover',1),civilian=createVehicle('traffic',1);
 assert.equal(createVehicle().userData.designId,'fld-89-nightrunner');assert.equal(createVehicle('cop').userData.designId,'douane-d89-interception');
 assert.equal(hidden.userData.paint,civilian.userData.paint);assert.equal(hidden.getObjectByName('Chassis').geometry,civilian.getObjectByName('Chassis').geometry);
 assert.equal(hidden.userData.blue.visible,false);assert.equal(hidden.userData.red.visible,false);assert.equal(hidden.userData.wheels.length,4);
 const bounds=new T.Box3().setFromObject(hidden).getSize(new T.Vector3());assert.ok(bounds.x<3&&bounds.z<5.1);
}));
