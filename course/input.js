export function analogValue(displacement,radius=52,sensitivity=1){
  const amount=Math.min(1,Math.abs(displacement)/Math.max(1,radius));
  if(amount<.06)return 0;
  const v=(amount-.06)/.94;
  return Math.max(-1,Math.min(1,Math.sign(displacement)*(.7*v+.3*v*v)*sensitivity));
}
export function createInput(root,togglePause,preferences=()=>({sensitivity:1})){
  const keys=new Set(),pointers=new Map(),buttons=[...root.querySelectorAll('[data-control]')];
  const pad=root.querySelector?.('[data-steering-pad]');
  let analog=0,analogPointer=null;
  const codes=new Set(['ArrowLeft','ArrowRight','ArrowDown','KeyA','KeyD','KeyS','Space','ShiftLeft','ShiftRight','KeyP','Escape']);
  function clear(){
    const releases=[...pointers].map(([id,control])=>[id,buttons.find(b=>b.dataset.control===control)]);if(analogPointer!==null)releases.push([analogPointer,pad]);
    keys.clear();pointers.clear();analog=0;analogPointer=null;
    for(const [id,element] of releases)try{if(element?.hasPointerCapture?.(id))element.releasePointerCapture(id);}catch{/* The browser may already have cancelled the contact. */}
    for(const b of [...buttons,...(pad?[pad]:[])])b.classList.remove('held');
    pad?.style.setProperty('--stick-x','0px');
  }
  const down=e=>{
    if(!codes.has(e.code)||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)||e.target?.closest?.('dialog[open]'))return;
    e.preventDefault();if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)togglePause();return;}keys.add(e.code);
  };
  const up=e=>keys.delete(e.code);
  addEventListener('keydown',down);addEventListener('keyup',up);addEventListener('blur',clear);
  const listeners=[];
  function on(element,name,callback){element.addEventListener(name,callback);listeners.push([element,name,callback]);}
  for(const button of buttons){
    on(button,'pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,button.dataset.control);button.classList.add('held');});
    const release=e=>{pointers.delete(e.pointerId);if(![...pointers.values()].includes(button.dataset.control))button.classList.remove('held');};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])on(button,name,release);
  }
  if(pad){
    function move(e){
      if(e.pointerId!==analogPointer)return;
      const rect=pad.getBoundingClientRect(),radius=Math.min(52,rect.width*.36),dx=e.clientX-rect.left-rect.width/2;
      analog=analogValue(dx,radius,preferences().sensitivity);
      pad.style.setProperty('--stick-x',`${Math.max(-radius,Math.min(radius,dx))}px`);
    }
    on(pad,'pointerdown',e=>{if(analogPointer!==null)return;e.preventDefault();analogPointer=e.pointerId;pad.setPointerCapture(e.pointerId);pad.classList.add('held');move(e);});
    on(pad,'pointermove',move);
    const release=e=>{if(e.pointerId!==analogPointer)return;analogPointer=null;analog=0;pad.classList.remove('held');pad.style.setProperty('--stick-x','0px');};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])on(pad,name,release);
  }
  return {clear,dispose(){clear();removeEventListener('keydown',down);removeEventListener('keyup',up);removeEventListener('blur',clear);for(const [el,n,f] of listeners)el.removeEventListener(n,f);},read(){
    const values=new Set(pointers.values()),left=keys.has('ArrowLeft')||keys.has('KeyA')||values.has('left'),right=keys.has('ArrowRight')||keys.has('KeyD')||values.has('right');
    return {steer:left||right?Number(right)-Number(left):analog,brake:keys.has('ArrowDown')||keys.has('KeyS')||values.has('brake'),drift:keys.has('Space')||values.has('drift'),nitro:keys.has('ShiftLeft')||keys.has('ShiftRight')||values.has('nitro')};
  }};
}
