import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import {createDigitalSky} from '../sky.js';
import {LENGTH} from '../track.js';
test('one depth-tested GPU mesh shares its glyph atlas, freezes on reduced motion and thins at arrival',()=>{
 const old=globalThis.document;let canvases=0;
 globalThis.document={createElement(){canvases++;return {width:0,height:0,getContext:()=>({fillText(){}})};}};
 try{
  const scene=new T.Scene(),sky=createDigitalSky(scene),camera=new T.PerspectiveCamera();
  assert.equal(canvases,1);assert.equal(scene.children.length,1);const mesh=scene.children[0];assert.equal(mesh.geometry.isInstancedBufferGeometry,true);assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.depthWrite,false);
  sky.update({s:0,time:20},camera,2);const full=mesh.geometry.instanceCount;assert.ok(full>2000&&full<3000);assert.ok(mesh.material.uniforms.time.value>0);
  sky.update({s:0,time:20},camera,0);assert.ok(mesh.geometry.instanceCount<full/2);
  sky.setReduced(true);sky.update({s:5000,time:40},camera,2);assert.equal(mesh.material.uniforms.time.value,0);
  sky.update({s:LENGTH,time:300,result:{won:true},cinematic:7},camera,2);assert.ok(mesh.geometry.instanceCount<full/2);assert.equal(canvases,1);
  sky.dispose();assert.equal(scene.children.length,0);
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
