import * as T from './vendor/three.module.min.js';
import {createVehicle} from './models.js?v=fld-design-001';
import {VEHICLE_SKINS,skinsFor,resolveSkin,createAppearance} from './vehicle-skins.js?v=fld-design-001';
import {studioEnvironment} from './vehicle-studio.js?v=fld-design-001';
const $=id=>document.getElementById(id),canvas=$('garage');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});}catch{$('unavailable').hidden=false;}
if(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const scene=new T.Scene();scene.background=new T.Color('#11111b');scene.fog=new T.Fog('#11111b',12,55);const studio=studioEnvironment(renderer);scene.environment=studio.texture;
  const camera=new T.PerspectiveCamera(35,1,.05,60),target=new T.Vector3(0,.72,0);
  const hemi=new T.HemisphereLight('#dde2ff','#24212d',2.5);scene.add(hemi);
  const key=new T.DirectionalLight('#edf1ff',4.8);key.position.set(3,7,4);scene.add(key);
  const fill=new T.DirectionalLight('#c6afff',3.0);fill.position.set(-4,3,-2);scene.add(fill);
  const rim=new T.DirectionalLight('#d8efff',2.6);rim.position.set(1,3,-5);scene.add(rim);
  const floor=new T.Mesh(new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({color:'#08090f',roughness:.91,metalness:0,envMapIntensity:.08}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;scene.add(floor);
  const grid=new T.GridHelper(50,50,'#343044','#24212e');grid.position.y=.002;grid.material.transparent=true;grid.material.opacity=.50;scene.add(grid);
  // A quiet ground halo and studio stripes give useful reflections without post-processing.
  const halo=new T.Mesh(new T.RingGeometry(2.85,2.86,96),new T.MeshBasicMaterial({color:'#7950a9',transparent:true,opacity:.6}));halo.rotation.x=-Math.PI/2;halo.position.y=.008;scene.add(halo);
  let storage;try{storage=localStorage;}catch{}const appearance=createAppearance(storage),cars=new Map();
  const requested=VEHICLE_SKINS.find(s=>s.id===new URLSearchParams(location.search).get('skin'));
  let selected=requested||resolveSkin('fld',appearance.data.fld),kind=selected.kind;
  let angle=.68,pitch=.23,distance=7.9,goalAngle=angle,goalPitch=pitch,goalDistance=distance;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rotating=!reduce,night=false,previous=0,rotationTime=0,contextLost=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;$('unavailable').hidden=false;});
  $('rotate').setAttribute('aria-pressed',String(rotating));
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  function savedStatus(){
    const saved=appearance.data,active=saved[kind]===selected.id;
    $('equip').textContent=active?'ÉQUIPÉ EN COURSE ✓':kind==='cop'?'ÉQUIPER LA PATROUILLE':'ÉQUIPER CE STYLE';
    $('equip').disabled=active;$('mixed').hidden=kind!=='cop';$('mixed').setAttribute('aria-pressed',String(saved.cop==='mixed'));
    $('skinStatus').textContent=kind==='cop'&&saved.cop==='mixed'?'Patrouille tirée au sort au départ. Deux douanes restent banalisées.':active?'Ce style sera utilisé à votre prochaine course.':'La prévisualisation est prête. Équipez ce style pour courir.';
    const query=new URLSearchParams({car:saved.fld,patrol:saved.cop});for(const a of document.querySelectorAll('a[href^="../course.html"]'))a.href='../course.html?'+query;
  }
  function select(s){
    selected=s;kind=s.kind;
    if(!cars.has(s.id)){const car=createVehicle(kind,0,s.id);scene.add(car);cars.set(s.id,car);}
    for(const [id,car]of cars)car.visible=id===s.id;
    for(const b of document.querySelectorAll('[data-kind]'))b.setAttribute('aria-pressed',String(b.dataset.kind===kind));
    $('skins').replaceChildren();for(const skin of skinsFor(kind)){
      const button=document.createElement('button');button.dataset.skin=skin.id;button.style.setProperty('--swatch',skin.color);button.setAttribute('aria-pressed',String(skin.id===s.id));
      const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');button.append(dot,document.createTextNode(skin.label));button.addEventListener('click',()=>select(skin));$('skins').append(button);
    }
    document.documentElement.style.setProperty('--acid',s.color);
    $('model').innerHTML=(kind==='fld'?'89':'D-89')+'<br>'+s.name;$('role').textContent=s.role;$('copy').textContent=s.copy;
    $('length').innerHTML=(kind==='fld'?'4,13':'4,17')+' <small>M</small>';$('detailNumber').textContent=s.number+' / 06';$('detailText').textContent=s.detail;
    history.replaceState(null,'',location.pathname+'?skin='+s.id);savedStatus();
  }
  for(const button of document.querySelectorAll('[data-kind]'))button.addEventListener('click',()=>select(resolveSkin(button.dataset.kind,appearance.data[button.dataset.kind])));
  $('equip').addEventListener('click',()=>{appearance.update({[kind]:selected.id});savedStatus();});
  $('mixed').addEventListener('click',()=>{appearance.update({cop:'mixed'});savedStatus();});
  select(selected);
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
  $('inspect').addEventListener('click',()=>{const active=document.body.classList.toggle('inspect');$('inspect').setAttribute('aria-pressed',String(active));$('inspect').textContent=active?'AFFICHER LES INFOS':'VOIR EN GRAND';});
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
    const compact=canvas.clientWidth<=360&&canvas.clientHeight<=740&&!document.body.classList.contains('inspect');
    const fittedDistance=distance*Math.max(1,.95/camera.aspect)*(compact?1.26:1);
    camera.position.set(Math.sin(angle)*fittedDistance,Math.sin(pitch)*fittedDistance+.85,Math.cos(angle)*fittedDistance);camera.lookAt(target);
    // Leave breathing room for the left-hand specification block on large screens.
    const portrait=canvas.clientWidth<760&&canvas.clientHeight>560;
    camera.setViewOffset(canvas.clientWidth,canvas.clientHeight,portrait?0:-canvas.clientWidth*.14,portrait?-canvas.clientHeight*(compact?.065:.085):0,canvas.clientWidth,canvas.clientHeight);
    const cop=kind==='cop'?cars.get(selected.id):null;if(cop){cop.userData.blue.visible=reduce||Math.sin(rotationTime*8)>0;cop.userData.red.visible=reduce||!cop.userData.blue.visible;}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}
