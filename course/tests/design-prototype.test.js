import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createVehicle,animateVehicle} from '../models.js';
import {createRoadPrototype,resetRoadPrototype} from '../road-vehicles.js';
import {setVehicleDetail} from '../vehicle-detail.js';
import {industrialPrototype} from '../design-scenery.js';
import {DIMENSIONS} from '../track.js';

function dimensions(car){
 car.updateMatrixWorld(true);const bounds=new T.Box3();let triangles=0,draws=0;
 car.traverseVisible(o=>{if(o.isMesh&&!o.userData.cpuTextureOnly){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;draws++;}});
 return {bounds,size:bounds.getSize(new T.Vector3()),triangles,draws};
}
test('prototype footprints including active blue modules and brakes fit the unchanged collision boxes',()=>{
 for(const type of ['compact','city']){
  const car=createRoadPrototype(type,0,true);car.userData.brakes.visible=true;car.userData.blue.visible=car.userData.red.visible=true;
  const {bounds,size,triangles,draws}=dimensions(car),d=DIMENSIONS.traffic;
  assert.ok(bounds.min.x>=-d.halfWidth&&bounds.max.x<=d.halfWidth);assert.ok(bounds.min.z>=-d.halfLength&&bounds.max.z<=d.halfLength);
  assert.ok(size.x>1.84&&size.z>3.92,'no tiny body inside an oversized collision box');assert.ok(triangles<6500);assert.ok(draws<=15);
  car.traverse(o=>{if(o.isMesh)for(const attr of ['position','normal'])assert.ok([...o.geometry.attributes[attr].array].every(Number.isFinite));});
 }
});
test('new hatch and city have different roofs, glazing, wheelbases and rear silhouettes',()=>{
 const a=createRoadPrototype('compact'),b=createRoadPrototype('city'),sa=dimensions(a).size,sb=dimensions(b).size;
 assert.notEqual(a.getObjectByName('Chassis').geometry,b.getObjectByName('Chassis').geometry);
 assert.ok(sb.y>sa.y+.07);assert.ok(sa.z>sb.z+.10);assert.ok(a.userData.wheelbase>b.userData.wheelbase+.15);
 for(const car of [a,b]){
  const body=car.getObjectByName('Chassis');car.updateMatrixWorld(true);
  for(const [z,direction]of [[-3,1],[3,-1]]){
   const hits=new T.Raycaster(new T.Vector3(0,.65,z),new T.Vector3(0,0,direction)).intersectObject(body);
   assert.ok(hits.length>0&&hits[0].distance<1.1,'body end cap must face the real approaching camera');
  }
 }
});
test('one existing hidden unit and a civilian share the exact B01 shell and paint, with no roof strobe',()=>{
 const cop=createVehicle('undercover',1),civilian=createVehicle('traffic',1),city=createVehicle('traffic',0),legacy=createVehicle('undercover',2);
 assert.equal(cop.userData.designId,'B01');assert.equal(city.userData.designId,'C01');assert.equal(legacy.userData.prototype,undefined);
 assert.equal(cop.getObjectByName('Chassis').geometry,civilian.getObjectByName('Chassis').geometry);assert.equal(cop.userData.paint,civilian.userData.paint);
 for(const car of [cop,civilian])for(const name of ['blue','red']){
  const signal=car.userData[name];assert.equal(signal.visible,false);signal.geometry.computeBoundingBox();assert.ok(signal.geometry.boundingBox.max.y<1.3,'modules stay in grille / glazing, below roof');
 }
});
test('prototype wheels and individual brake lamps follow vehicle speed, freeze in pause and reset',()=>{
 const car=createRoadPrototype('compact'),r={state:'RACE',speed:30,steer:.5,boosting:false};
 animateVehicle(car,r,1/60);const wheel=car.userData.wheels.find(w=>w.front),angle=wheel.rolling.rotation.x;
 assert.ok(angle>0);assert.equal(wheel.steering.rotation.y,.15);assert.equal(car.userData.brakes.visible,false);
 r.speed=29.8;animateVehicle(car,r,1/60);assert.equal(car.userData.brakes.visible,true);
 const paused=wheel.rolling.rotation.x;animateVehicle(car,{...r,state:'PAUSE',speed:0},0);assert.equal(wheel.rolling.rotation.x,paused);assert.equal(car.userData.brakes.visible,true);
 r.speed=30;animateVehicle(car,r,1/60);assert.equal(car.userData.brakes.visible,false);
 resetRoadPrototype(car);assert.equal(car.userData.lastSpeed,null);assert.equal(wheel.rolling.rotation.x,0);assert.equal(wheel.steering.rotation.y,0);
});
test('prototype close and distant details share cached resources and restore their exact original mesh',()=>{
 for(const type of ['compact','city']){
  const a=createRoadPrototype(type),b=createRoadPrototype(type),source=a.getObjectByName('Chassis').geometry,near=dimensions(a);
  assert.equal(source,b.getObjectByName('Chassis').geometry);assert.equal(a.userData.wheels[0].rolling.children[0].geometry,b.userData.wheels[0].rolling.children[0].geometry);
  setVehicleDetail(a,true);const far=dimensions(a);assert.ok(far.triangles<near.triangles*.8);assert.ok(Math.abs(far.size.x-near.size.x)<.08&&Math.abs(far.size.z-near.size.z)<.08);
  setVehicleDetail(a,false);assert.equal(a.getObjectByName('Chassis').geometry,source);assert.equal(dimensions(a).triangles,near.triangles);
 }
});
test('loading-yard prototype stays behind the rails and contains no road-blocking decorative solids',()=>{
 for(const side of [-1,1]){
  const parent=new T.Group();parent.position.x=side*13;const yard=industrialPrototype(parent,side);parent.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(yard);
  assert.ok(side<0?bounds.max.x<-16.4:bounds.min.x>16.4);assert.ok(bounds.max.y<12);assert.equal(yard.userData.designPrototype,true);
  const geometries=new Set(),materials=new Set();yard.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});
  assert.equal(geometries.size,1);assert.ok(materials.size<=7);
 }
});
