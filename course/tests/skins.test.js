import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createVehicle,animateVehicle} from '../models.js';
import {createAppearance,APPEARANCE_KEY,VEHICLE_SKINS,resolveSkin,patrolSkin} from '../vehicle-skins.js';
import {setVehicleDetail,distantGeometry} from '../vehicle-detail.js';
import {testCanvas} from './helpers/canvas.js';
const original=globalThis.document;globalThis.document={createElement:testCanvas};
test.after(()=>{if(original===undefined)delete globalThis.document;else globalThis.document=original;});
function measurements(car){car.updateMatrixWorld(true);const bounds=new T.Box3();let triangles=0;
 car.traverse(o=>{if(!o.isMesh||!o.visible||o.userData.cpuTextureOnly)return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;assert.ok([...p.array,...n.array].every(Number.isFinite));o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));triangles+=(o.geometry.index?.count??p.count)/3;});
 return {size:bounds.getSize(new T.Vector3()),triangles};
}
test('six original liveries have valid geometry, safe footprints and bounded near detail',()=>{
 assert.equal(VEHICLE_SKINS.length,6);assert.equal(new Set(VEHICLE_SKINS.map(s=>s.id)).size,6);
 const paint=new Set();
 for(const s of VEHICLE_SKINS)for(const variant of s.kind==='cop'?[0,1]:[0]){
  const car=createVehicle(s.kind,variant,s.id),m=measurements(car);paint.add(car.userData.paint);
  assert.equal(car.userData.skin,s.id);assert.equal(car.userData.cosmeticOnly,true);assert.ok(m.size.x<2.12&&m.size.z<4.25);assert.ok(m.triangles>15000&&m.triangles<30000,s.id+' triangle budget');assert.equal(car.userData.wheels.length,4);
 }
 assert.equal(paint.size,6);
});
test('angel and wreck variants change physical meshes as well as colours',()=>{
 const base=createVehicle(),angel=createVehicle('fld',0,'seraph'),cop=createVehicle('cop'),wreck=createVehicle('cop',0,'wreck');
 assert.ok(measurements(angel).size.y>measurements(base).size.y+.12);
 const a=cop.getObjectByName('Chassis').geometry.attributes.position.array,b=wreck.getObjectByName('Chassis').geometry.attributes.position.array;
 assert.notDeepEqual(a,b);assert.ok(measurements(wreck).triangles>measurements(cop).triangles);
});
test('distant detail is cached, reduces geometry and restores the exact close meshes',()=>{
 const car=createVehicle('cop',0,'infernal'),high=car.getObjectByName('Chassis').geometry,near=measurements(car).triangles;
 assert.equal(distantGeometry(high),distantGeometry(high));setVehicleDetail(car,true);const far=measurements(car).triangles;assert.ok(far<near*.75,`${far}/${near}`);
 setVehicleDetail(car,false);assert.equal(car.getObjectByName('Chassis').geometry,high);assert.equal(measurements(car).triangles,near);
});
test('every cop skin retains independent French blue strobes and steering after a detail switch',()=>{
 for(const id of ['patrol','infernal','wreck']){
  const car=createVehicle('cop',1,id);setVehicleDetail(car,true);const before=car.userData.blue.geometry;
  animateVehicle(car,{speed:44,steer:.4,boosting:false,state:'RACE'},1/60);assert.ok(car.userData.wheels[0].rolling.rotation.x>0);
  assert.equal(car.userData.blue.geometry,before);assert.equal(car.userData.blue.material.color.getHex(),0x499dff);assert.equal(car.userData.red.parent,car);
 }
});
test('appearance storage preserves all records and validates the vehicle family',()=>{
 const values=new Map([['fld.course.v1','old love'],['fld.course.v2','current record'],['fld.course.preferences.v2','audio']]),writes=[];
 const storage={getItem:k=>values.get(k),setItem(k,v){writes.push(k);values.set(k,v);}};
 const state=createAppearance(storage);assert.deepEqual(state.data,{fld:'nightrunner',cop:'mixed'});
 state.update({fld:'seraph',cop:'infernal'});assert.deepEqual(createAppearance(storage).data,{fld:'seraph',cop:'infernal'});
 state.update({fld:'infernal',cop:'cursed',wins:999});assert.deepEqual(state.data,{fld:'seraph',cop:'infernal'});
 assert.ok(writes.every(k=>k===APPEARANCE_KEY));assert.equal(values.get('fld.course.v1'),'old love');assert.equal(values.get('fld.course.v2'),'current record');assert.equal(values.get('fld.course.preferences.v2'),'audio');
});
test('blocked, corrupt or missing storage still allows a session choice and safe fallbacks',()=>{
 for(const storage of [null,{getItem:()=>'{bad',setItem(){throw Error('blocked');}},{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}]){
  const state=createAppearance(storage);state.update({fld:'cursed',cop:'wreck'});assert.deepEqual(state.data,{fld:'cursed',cop:'wreck'});
 }
 assert.equal(resolveSkin('fld','invalid').id,'nightrunner');assert.equal(resolveSkin('cop','seraph').id,'patrol');
 assert.deepEqual([0,1,2].map(i=>patrolSkin({cop:'mixed'},i)),['patrol','infernal','wreck']);assert.equal(patrolSkin({cop:'wreck'},1),'wreck');
});
