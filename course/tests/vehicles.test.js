import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createVehicle,animateVehicle} from '../models.js';
import {vehicleLivery,atlasUV} from '../vehicle-livery.js';
import {testCanvas} from './helpers/canvas.js';

function withCanvas(run){const previous=globalThis.document;globalThis.document={createElement:testCanvas};try{run();}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}}

test('front and rear body caps close the raised centre of the bonnet and boot',()=>withCanvas(()=>{
  for(const [kind,variant,frontY,rearY] of [['fld',0,.675,.805],['cop',0,.805,.970],['cop',1,.805,.970]]) {
    const car=createVehicle(kind,variant);car.updateMatrixWorld(true);const body=car.getObjectByName('Chassis');
    for(const [z,y,direction] of [[2.5,frontY,-1],[-2.5,rearY,1]]) {
      const ray=new T.Raycaster(new T.Vector3(0,y,z),new T.Vector3(0,0,direction));
      const hits=ray.intersectObject(body);assert.ok(hits.length>0,`${kind} ${variant}: unclosed body end`);assert.ok(hits[0].distance<.52,`${kind}: rays must hit the end cap, not the interior`);
    }
  }
}));
test('custom wheels spin while the calipers stay fixed and the front hubs steer',()=>withCanvas(()=>{
  const car=createVehicle();const wheel=car.userData.wheels.find(w=>w.front),rotation=wheel.caliper.rotation.clone();
  animateVehicle(car,{speed:42,steer:.6,boosting:false,state:'RACE'},.05);
  assert.ok(wheel.rolling.rotation.x>0);assert.equal(wheel.steering.rotation.y,.18);
  assert.deepEqual(wheel.caliper.rotation.toArray(),rotation.toArray());assert.equal(wheel.caliper.parent,wheel.steering);
  assert.notEqual(wheel.caliper.parent,wheel.rolling);
}));
test('lights remain separately switchable after static mesh merging and share French blue',()=>withCanvas(()=>{
  const car=createVehicle('cop');
  assert.equal(car.userData.staticBatched,true);
  for(const key of ['blue','red']){assert.equal(car.userData[key].parent,car);assert.ok(car.userData[key].isMesh);}
  assert.equal(car.userData.blue.material.color.getHex(),0x499dff);assert.equal(car.userData.red.material,car.userData.blue.material);
  car.userData.blue.visible=false;assert.equal(car.userData.red.visible,true);
}));
test('vehicle atlases are cached locally and every referenced patch stays inside the texture',()=>withCanvas(()=>{
  assert.equal(vehicleLivery(false),vehicleLivery(false));assert.notEqual(vehicleLivery(false),vehicleLivery(true));
  assert.equal(vehicleLivery(false).map.image.width,1024);
  for(const name of ['side','hood','rear','plate'])for(const u of [0,1])for(const v of [0,1])assert.ok(atlasUV(name,u,v).every(n=>Number.isFinite(n)&&n>=0&&n<=1));
}));
