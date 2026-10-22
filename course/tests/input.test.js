import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput} from '../input.js';
test('multitouch steer + nitro survives release of either finger and cancel clears stuck input', () => {
 const handlers={};const old=globalThis.addEventListener;
 globalThis.addEventListener=(name,callback)=>{handlers[name]=callback;};
 function button(name){const events={},classes=new Set();return {dataset:{control:name},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},setPointerCapture(){},addEventListener:(n,f)=>events[n]=f,send(n,id){events[n]({pointerId:id,preventDefault(){}});}};}
 const buttons=['left','right','drift','nitro','brake'].map(button), root={querySelectorAll(){return buttons;}};
 try {
  let pauses=0;const input=createInput(root,()=>pauses++);
  buttons[0].send('pointerdown',1);buttons[3].send('pointerdown',2);assert.deepEqual(input.read(),{steer:-1,brake:false,drift:false,nitro:true});
  buttons[0].send('pointerup',1);assert.equal(input.read().nitro,true);assert.equal(input.read().steer,0);
  buttons[3].send('pointercancel',2);assert.equal(input.read().nitro,false);
  buttons[1].send('pointerdown',3);buttons[2].send('pointerdown',4);assert.equal(input.read().drift,true);buttons[1].send('lostpointercapture',3);assert.equal(input.read().steer,0);assert.equal(input.read().drift,true);
  const key=(code,repeat=false)=>({code,repeat,target:{tagName:'BODY'},preventDefault(){}});
  handlers.keydown(key('KeyA'));handlers.keydown(key('ShiftLeft'));assert.equal(input.read().steer,-1);assert.equal(input.read().nitro,true);
  handlers.keyup(key('KeyA'));assert.equal(input.read().steer,0);handlers.keydown(key('KeyP'));handlers.keydown(key('KeyP',true));assert.equal(pauses,1);
  handlers.blur();assert.deepEqual(input.read(),{steer:0,brake:false,drift:false,nitro:false});
 } finally {globalThis.addEventListener=old;}
});
