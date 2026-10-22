import * as T from './vendor/three.module.min.js';
import {createVehicle} from './models.js?v=pursuit3';
import {environmentTexture} from './materials.js?v=pursuit3';
const $=id=>document.getElementById(id),canvas=$('garage');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});}catch{$('unavailable').hidden=false;}
if(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const scene=new T.Scene();scene.background=new T.Color('#11111b');scene.fog=new T.Fog('#11111b',12,35);scene.environment=environmentTexture();
  const camera=new T.PerspectiveCamera(35,1,.05,60),target=new T.Vector3(0,.72,0);
  const hemi=new T.HemisphereLight('#dde2ff','#24212d',2.5);scene.add(hemi);
  const key=new T.DirectionalLight('#edf1ff',4.8);key.position.set(3,7,4);scene.add(key);
  const fill=new T.DirectionalLight('#c6afff',3.0);fill.position.set(-4,3,-2);scene.add(fill);
  const rim=new T.DirectionalLight('#d8efff',2.6);rim.position.set(1,3,-5);scene.add(rim);
  const floor=new T.Mesh(new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({color:'#08090f',roughness:.91,metalness:0,envMapIntensity:.08}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;scene.add(floor);
  const grid=new T.GridHelper(50,50,'#343044','#24212e');grid.position.y=.002;grid.material.transparent=true;grid.material.opacity=.50;scene.add(grid);
  // A quiet ground halo and studio stripes give useful reflections without post-processing.
  const halo=new T.Mesh(new T.RingGeometry(2.85,2.86,96),new T.MeshBasicMaterial({color:'#7950a9',transparent:true,opacity:.6}));halo.rotation.x=-Math.PI/2;halo.position.y=.008;scene.add(halo);
  const cars={fld:createVehicle('fld'),cop:createVehicle('cop',0)};for(const car of Object.values(cars))scene.add(car);cars.cop.visible=false;
  let kind='fld',angle=.68,pitch=.23,distance=7.9,goalAngle=angle,goalPitch=pitch,goalDistance=distance;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rotating=!reduce,night=false,previous=0,rotationTime=0,contextLost=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;$('unavailable').hidden=false;});
  $('rotate').setAttribute('aria-pressed',String(rotating));
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  const info={
    fld:{title:'89<br>NIGHTRUNNER<span>fld®</span>',role:'ORIGINE NON DÉCLARÉE',copy:'Un coupé en fuite. Carrosserie prune, ailes larges, jantes polies, livrée acide. Direction : le Swagistan.',length:'4,15',detail:'TRIBAL FLD® / KIT LARGE / 7 BRANCHES'},
    cop:{title:'D-89<br>INTERCEPTION',role:'BRIGADE DU DERNIER PÉAGE',copy:'Un break d’interception. Livrée blanche et bleu marine, balisage arrière, rampe bleue et feux de pénétration. Vos papiers, s’il vous plaît.',length:'4,19',detail:'LIVRÉE DOUANE / FLASH BLEU / 5 BRANCHES'}
  };
  for(const button of document.querySelectorAll('[data-kind]'))button.addEventListener('click',()=>{
    kind=button.dataset.kind;for(const [id,car] of Object.entries(cars))car.visible=id===kind;
    for(const b of document.querySelectorAll('[data-kind]'))b.setAttribute('aria-pressed',String(b===button));
    const data=info[kind];$('model').innerHTML=data.title;$('role').textContent=data.role;$('copy').textContent=data.copy;$('length').innerHTML=data.length+' <small>M</small>';
    $('detailNumber').textContent=kind==='fld'?'01 / 02':'02 / 02';$('detailText').textContent=data.detail;
  });
  function stopRotation(){rotating=false;$('rotate').setAttribute('aria-pressed','false');}
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
    stopRotation();const a={front:.68,rear:Math.PI+.65,side:Math.PI/2}[button.dataset.view];
    goalAngle=angle+Math.atan2(Math.sin(a-angle),Math.cos(a-angle));goalPitch=button.dataset.view==='side'?.13:.23;
    for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b===button));
  });
  $('rotate').addEventListener('click',()=>{rotating=!rotating;$('rotate').setAttribute('aria-pressed',String(rotating));});
  $('lighting').addEventListener('click',()=>{
    night=!night;$('lighting').setAttribute('aria-pressed',String(night));$('lighting').textContent=night?'VUE ATELIER':'VUE DE NUIT';
    hemi.intensity=night?1.05:2.5;key.intensity=night?1.2:4.8;fill.intensity=night?1.8:3;rim.intensity=night?1.7:2.6;renderer.toneMappingExposure=night?1.08:1.35;
  });
  const pointers=new Map();let pinch=0;
  canvas.addEventListener('pointerdown',e=>{stopRotation();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);pinch=0;});
  canvas.addEventListener('pointermove',e=>{
    const p=pointers.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const [a,b]=[...pointers.values()],span=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)goalDistance=T.MathUtils.clamp(goalDistance*pinch/Math.max(span,1),5.4,14);pinch=span;}
    else{goalAngle-=dx*.009;goalPitch=T.MathUtils.clamp(goalPitch+dy*.005,-.025,.65);}
  });
  function release(e){pointers.delete(e.pointerId);pinch=0;}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
  addEventListener('blur',()=>{pointers.clear();pinch=0;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();goalDistance=T.MathUtils.clamp(goalDistance+e.deltaY*.006,5.4,14);},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;
    e.preventDefault();stopRotation();if(e.key==='ArrowLeft')goalAngle-=.15;if(e.key==='ArrowRight')goalAngle+=.15;
    if(e.key==='ArrowUp')goalPitch=Math.min(.65,goalPitch+.05);if(e.key==='ArrowDown')goalPitch=Math.max(-.025,goalPitch-.05);
    if(e.key==='+'||e.key==='=')goalDistance=Math.max(5.4,goalDistance-.4);if(e.key==='-')goalDistance=Math.min(12,goalDistance+.4);
  });
  document.addEventListener('visibilitychange',()=>{previous=0;pointers.clear();});
  function frame(now) {
    if(contextLost)return;
    requestAnimationFrame(frame);if(document.hidden){previous=0;return;}if(now-previous<32)return;
    const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now;rotationTime+=dt;
    if(rotating)goalAngle+=dt*.12;
    const mix=reduce?1:1-Math.exp(-dt*9);angle=T.MathUtils.lerp(angle,goalAngle,mix);pitch=T.MathUtils.lerp(pitch,goalPitch,mix);distance=T.MathUtils.lerp(distance,goalDistance,mix);
    const fittedDistance=distance*Math.max(1,.95/camera.aspect);
    camera.position.set(Math.sin(angle)*fittedDistance,Math.sin(pitch)*fittedDistance+.85,Math.cos(angle)*fittedDistance);camera.lookAt(target);
    // Leave breathing room for the left-hand specification block on large screens.
    const portrait=canvas.clientWidth<760&&canvas.clientHeight>560;
    camera.setViewOffset(canvas.clientWidth,canvas.clientHeight,portrait?0:-canvas.clientWidth*.14,portrait?-canvas.clientHeight*.085:0,canvas.clientWidth,canvas.clientHeight);
    const cop=cars.cop;cop.userData.blue.visible=reduce||Math.sin(rotationTime*8)>0;cop.userData.red.visible=reduce||!cop.userData.blue.visible;
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}
