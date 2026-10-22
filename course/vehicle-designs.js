import * as T from './vendor/three.module.min.js';
import {surface,softTexture} from './materials.js?v=pursuit3';
import {vehicleLivery,atlasUV} from './vehicle-livery.js?v=pursuit3';

// Original road-ready meshes. Coordinates in metres; front +Z, wheel axles X.
// Actual cut-out wheel arches, separate glass, rotating wheels and static calipers.
export const VEHICLE_DESIGNS=Object.freeze({
  fld:{id:'fld-89-nightrunner',name:'fld® / 89 NIGHTRUNNER',role:'ORIGINE NON DÉCLARÉE',length:4.15,width:2.10,wheelbase:2.52},
  cop:{id:'douane-d89-interception',name:'DOUANE / D-89 INTERCEPTION',role:'BRIGADE DU DERNIER PÉAGE',length:4.19,width:2.10,wheelbase:2.52}
});
const cache=new Map(),templates=new Map();
const box=new T.BoxGeometry(1,1,1),plane=new T.PlaneGeometry(1,1);
const M={
  black:surface('#10121b',.48,.35),rubber:surface('#0b0e15',.88,.03),
  chrome:surface('#c1c9d2',.23,.87),rotor:surface('#6c7582',.40,.83),
  glass:new T.MeshPhysicalMaterial({color:'#1a3046',metalness:.36,roughness:.13,clearcoat:1,envMapIntensity:1.7}),
  carbon:surface('#171626',.55,.47),navy:surface('#163657',.29,.56),
  fld:new T.MeshPhysicalMaterial({color:'#28152f',roughness:.26,metalness:.67,clearcoat:1,clearcoatRoughness:.19}),
  cop:new T.MeshPhysicalMaterial({color:'#e7edf0',roughness:.31,metalness:.42,clearcoat:.7}),
  acid:new T.MeshBasicMaterial({color:'#caff49',toneMapped:false}),
  pink:new T.MeshBasicMaterial({color:'#ee4da6',toneMapped:false}),
  cyan:new T.MeshBasicMaterial({color:'#75e4ed',toneMapped:false}),
  red:new T.MeshBasicMaterial({color:'#fa304b',toneMapped:false}),
  blue:new T.MeshBasicMaterial({color:'#499dff',toneMapped:false}),
  white:new T.MeshBasicMaterial({color:'#ebefff',toneMapped:false}),
  amber:new T.MeshBasicMaterial({color:'#ffb94e',toneMapped:false})
};
const lampAtlasMaterial=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});lampAtlasMaterial.name='Baked lamp colours';
for(const [name,mat] of Object.entries(M))mat.name=name;
const v3=a=>new T.Vector3(...a);
function mesh(parent,geo,mat,name='') {const m=new T.Mesh(geo,mat);m.name=name;parent.add(m);return m;}
function block(parent,x,y,z,w,h,d,mat,rz=0) {const m=mesh(parent,box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.z=rz;return m;}
function cached(key,make) {if(!cache.has(key))cache.set(key,make());return cache.get(key);}
function faces(points,quads,region=null,uvs=null) {
  const positions=[],uv=[],indices=[];
  for(let i=0;i<points.length;i++){positions.push(...points[i]);const p=uvs?.[i]||[i%2,Math.floor(i/2)%2];uv.push(...(region?atlasUV(region,...p):p));}
  for(const q of quads){if(q.length===3)indices.push(...q);else indices.push(q[0],q[1],q[2],q[0],q[2],q[3]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function quad(parent,points,mat,region=null,uvs=[[0,0],[1,0],[1,1],[0,1]]) {return mesh(parent,faces(points,[[0,1,2,3]],region,uvs),mat);}
function line(parent,points,radius,mat) {
  const curve=new T.CatmullRomCurve3(points.map(v3),false,'centripetal');
  return mesh(parent,new T.TubeGeometry(curve,Math.max(1,(points.length-1)*2),radius,5,false),mat);
}
// One material = one static draw. Merged geometries are cached and shared by every car.
function mergeGeometry(items) {
  const positions=[],normals=[],uvs=[],colors=[],useColors=items.some(item=>item.color);
  for(const {geometry,matrix,color} of items){
    const g=geometry.index?geometry.toNonIndexed():geometry.clone();g.applyMatrix4(matrix);
    positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);
    if(g.attributes.uv)uvs.push(...g.attributes.uv.array);else for(let i=0;i<g.attributes.position.count;i++)uvs.push(0,0);
    if(useColors)for(let i=0;i<g.attributes.position.count;i++)colors.push(color?.r??1,color?.g??1,color?.b??1);
    g.dispose();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));if(useColors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function mergeStatic(root) {
  root.updateMatrixWorld(true);const buckets=new Map(),geos=new Set();
  root.traverse(o=>{if(!o.isMesh)return;const flat=o.material.isMeshBasicMaterial&&!o.material.map&&!o.material.transparent,mat=flat?lampAtlasMaterial:o.material;if(!buckets.has(mat))buckets.set(mat,[]);buckets.get(mat).push({geometry:o.geometry,matrix:o.matrixWorld.clone(),color:flat?o.material.color:null});if(o.geometry!==box&&o.geometry!==plane&&!cacheHas(o.geometry))geos.add(o.geometry);});
  root.clear();for(const [material,items] of buckets){mesh(root,mergeGeometry(items),material,material===M.fld||material===M.cop?'Chassis':material.name);}
  for(const geo of geos)geo.dispose();return root;
}
function cacheHas(geometry){for(const value of cache.values())if(value===geometry)return true;return false;}
const wheelZ=[-1.25,1.27],wheelY=.35,archRadius=.405;
const profiles={
  fld:[[-2.02,.84,.81],[-1.7,.96,.89],[-1.25,.98,.90],[-.65,.92,.88],[.50,.91,.84],[1.27,.96,.80],[1.75,.93,.73],[2.02,.85,.65]],
  cop:[[-2.04,.86,.96],[-1.6,.96,1.0],[-1.25,.96,1.01],[-.5,.93,1.0],[.60,.93,.98],[1.27,.96,.94],[1.75,.94,.86],[2.04,.86,.78]]
};
function sectionAt(sections,z) {
  let a=sections[0],b=sections[1];for(let i=1;i<sections.length;i++){b=sections[i];if(z<=b[0])break;a=b;}
  const t=T.MathUtils.clamp((z-a[0])/(b[0]-a[0]||1),0,1);return [T.MathUtils.lerp(a[1],b[1],t),T.MathUtils.lerp(a[2],b[2],t)];
}
function hoodY(sections,z,x) {const [w,h]=sectionAt(sections,z);return h+.048-Math.abs(x)/(.82*w)*.020;}
function body(parent,police) {
  const sections=profiles[police?'cop':'fld'],paint=police?M.cop:M.fld;
  const points=[],quads=[];
  for(let i=0;i<sections.length;i++){
    const [z,w,h]=sections[i];points.push([-w,h-.025,z],[-w*.82,h+.028,z],[0,h+.048,z],[w*.82,h+.028,z],[w,h-.025,z]);
    if(i)for(let j=0;j<4;j++){const a=(i-1)*5+j;quads.push([a,a+5,a+6,a+1]);}
  }
  mesh(parent,faces(points,quads),paint);
  // The lower edge rises over each tyre, so the shell never intersects a rotating wheel.
  for(const side of [-1,1]) {
    const pts=[],qs=[],uv=[];const end=sections.at(-1)[0],start=sections[0][0],steps=100;
    for(let i=0;i<=steps;i++) {
      const z=T.MathUtils.lerp(start,end,i/steps),[w,h]=sectionAt(sections,z);
      let lower=.28;for(const wz of wheelZ){const d=z-wz;if(Math.abs(d)<archRadius)lower=Math.max(lower,wheelY+Math.sqrt(archRadius**2-d*d));}
      pts.push([side*(w-.016),lower,z],[side*w,h-.026,z]);
      // Front is LEFT when looking at the passenger door; the driver door is reversed geometrically.
      const u=side>0?1-i/steps:i/steps;uv.push([u,(lower-.28)/.74],[u,(h-.306)/.74]);
      if(i){const a=(i-1)*2;qs.push(side>0?[a,a+1,a+3,a+2]:[a,a+2,a+3,a+1]);}
    }
    mesh(parent,faces(pts,qs,'side',uv),vehicleLivery(police));
    // Proud overfenders with a real opening and visible fasteners.
    for(const wz of wheelZ) {
      const pts=[],qs=[];for(let i=0;i<=24;i++) {
        const a=Math.PI*i/24,z=wz+Math.cos(a)*archRadius,y=wheelY+Math.sin(a)*archRadius;
        const [w]=sectionAt(sections,z);pts.push([side*(w+.014),y,z],[side*1.015,y+.055,z+.017*Math.cos(a)]);
        if(i){const n=(i-1)*2;qs.push(side>0?[n,n+1,n+3,n+2]:[n,n+2,n+3,n+1]);}
        if(i%6===0){const bolt=mesh(parent,cached('bolt',()=>new T.SphereGeometry(.014,6,4)),M.chrome);bolt.position.set(side*1.021,y+.037,z);}
      }
      const arch=faces(pts,qs);arch.userData.wheelArch=true;mesh(parent,arch,paint);
    }
    const skirt=block(parent,side*.96,.29,0,.11,.12,1.54,police?M.navy:M.carbon);
    block(parent,side*1.018,.31,0,.014,.019,1.54,police?M.chrome:M.acid);
    line(parent,[[side*.93,.83,-.67],[side*.93,.39,-.67],[side*.93,.37,.60],[side*.93,.80,.62]],.0055,M.black);
    block(parent,side*.944,.78,-.37,.018,.025,.17,M.chrome);
  }
  // Ends are separate panels; their geometry follows the taper of the shell.
  for(const front of [false,true]){
    const [z,w,h]=front?sections.at(-1):sections[0];
    const top=[[-w,h-.025],[-w*.82,h+.028],[0,h+.048],[w*.82,h+.028],[w,h-.025]],pts=[],qs=[];
    for(const [x,y] of top)pts.push([x,.29,z],[x,y,z]);
    for(let j=0;j<4;j++){const a=j*2;qs.push(front?[a,a+2,a+3,a+1]:[a,a+1,a+3,a+2]);}
    mesh(parent,faces(pts,qs),paint);
  }
  block(parent,0,.255,0,1.50,.05,3.90,M.black);
}
function cabin(parent,police,tall) {
  const top=police?(tall?1.56:1.29):1.27,back=police?(tall?-1.87:-.83):-1.04;
  const roofRear=police?(tall?-1.55:-.37):-.42,roofFront=police?.39:.28,front=police?1.07:.95;
  const base=police?.999:.897,roofWidth=police?.71:.66,baseWidth=police?.81:.78;
  const pts=[[-roofWidth,top,roofRear],[roofWidth,top,roofRear],[roofWidth,top,roofFront],[-roofWidth,top,roofFront]];
  quad(parent,[...pts].reverse(),police?M.navy:M.fld);
  for(const z of [roofRear,roofFront])line(parent,[[-roofWidth,top-.015,z],[roofWidth,top-.015,z]],.026,M.black);
  // Glass normals point outward, and physical glass stays opaque for mobile sorting stability.
  quad(parent,[[-baseWidth,base,front],[baseWidth,base,front],[roofWidth,top-.035,roofFront],[-roofWidth,top-.035,roofFront]],M.glass);
  quad(parent,[[baseWidth,base,back],[-baseWidth,base,back],[-roofWidth,top-.035,roofRear],[roofWidth,top-.035,roofRear]],M.glass);
  for(const side of [-1,1]) {
    const window=[[side*baseWidth,base,back],[side*baseWidth,base,front],[side*roofWidth,top-.035,roofFront],[side*roofWidth,top-.035,roofRear]];
    quad(parent,side>0?[...window].reverse():window,M.glass);
    const frame=[[side*baseWidth,base,back],[side*roofWidth,top,roofRear],[side*roofWidth,top,roofFront],[side*baseWidth,base,front],[side*baseWidth,base,back]];
    line(parent,frame,.026,police?M.navy:M.carbon);
    line(parent,[[side*(roofWidth+.015),top-.03,-.03],[side*baseWidth,base,-.03]],.025,M.black);
    if(police&&tall)line(parent,[[side*(roofWidth+.01),top-.03,-.66],[side*baseWidth,base,-.66]],.028,M.navy);
    block(parent,side*.91,base+.08,.66,.14,.045,.06,M.black);
    const mirror=block(parent,side*.988,base+.115,.66,.10,.08,.19,police?M.navy:M.fld);mirror.rotation.y=side*.12;
    block(parent,side*.99,base+.115,.568,.078,.049,.007,M.chrome);
  }
  line(parent,[[-.67,base+.035,front+.007],[.67,base+.035,front+.007]],.017,M.black);
  for(const side of [-1,1])line(parent,[[side*.12,base+.04,front+.025],[side*.48,base+.045,front+.04]],.009,M.black);
  if(!police)for(let i=0;i<7;i++) {
    const t=i/7,z=T.MathUtils.lerp(back+.025,roofRear-.09,t),y=T.MathUtils.lerp(base+.04,top-.06,t);
    const louver=block(parent,0,y,z,1.38-t*.15,.025,.035,M.carbon);louver.rotation.x=-.35;
  }
  return top;
}
function fascia(parent,police) {
  const z=police?2.045:2.025,back=police?-2.045:-2.025,frontY=police?.72:.60;
  block(parent,0,.33,z,1.92,.07,.08,M.carbon);
  block(parent,0,.51,z+.012,1.48,.205,.025,M.black);
  for(let i=0;i<9;i++)block(parent,0,.43+i*.020,z+.030,1.15,.009,.012,police?M.chrome:M.carbon);
  for(const side of [-1,1]) {
    block(parent,side*.59,frontY,z+.020,.49,.16,.027,M.black);
    for(const dx of [-.105,.105]){
      const ring=mesh(parent,cached('lamp-ring',()=>new T.TorusGeometry(.043,.008,6,16)),M.chrome);ring.position.set(side*.59+dx,frontY,z+.037);
      const lens=mesh(parent,cached('lamp-lens',()=>new T.CircleGeometry(.034,16)),M.white);lens.position.set(side*.59+dx,frontY,z+.040);
    }
    block(parent,side*.59,frontY-.10,z+.036,.45,.017,.010,police?M.white:M.cyan);
    block(parent,side*.84,.43,z+.045,.10,.035,.015,M.amber);
    block(parent,side*.71,.63,back-.022,.41,.105,.035,M.black);
    for(let i=0;i<5;i++)block(parent,side*(.53+i*.083),.635,back-.045,.055,.052,.011,M.red);
    block(parent,side*.62,.275,back+.015,.15,.11,.12,M.chrome);
    block(parent,side*.62,.275,back-.047,.112,.076,.010,M.black);
  }
  block(parent,0,.79,back-.014,1.66,.028,.012,police?M.red:M.pink);
  for(let i=-2;i<=2;i++)block(parent,i*.21,.28,back+.065,.025,.14,.15,M.carbon);
  block(parent,0,.37,back+.025,1.89,.07,.08,M.carbon);
  // The end decals face the viewer and are never mirrored.
  quad(parent,[[.44,.43,back-.031],[-.44,.43,back-.031],[-.44,.58,back-.031],[.44,.58,back-.031]],vehicleLivery(police),'plate');
  const rearBottom=police?.80:.675,rearTop=police?.94:.79;
  quad(parent,[[.59,rearBottom,back-.017],[-.59,rearBottom,back-.017],[-.59,rearTop,back-.017],[.59,rearTop,back-.017]],vehicleLivery(police),'rear');
  // Flat bonnet panel follows the actual hood inclination, clear of the windscreen.
  const sections=profiles[police?'cop':'fld'];const near=.995,far=1.77;
  const hoodPoints=[],hoodQuads=[],hoodUV=[],columns=8,rows=16;
  for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++) {
    const z=T.MathUtils.lerp(near,far,i/rows),x=T.MathUtils.lerp(-.60,.60,j/columns);
    hoodPoints.push([x,hoodY(sections,z,x)+.004,z]);hoodUV.push([j/columns,1-i/rows]);
    if(i&&j){const a=(i-1)*(columns+1)+j-1;hoodQuads.push([a,a+columns+1,a+columns+2,a+1]);}
  }
  mesh(parent,faces(hoodPoints,hoodQuads,'hood',hoodUV),vehicleLivery(police));
  for(const side of [-1,1]) {
    line(parent,Array.from({length:8},(_,i)=>{const z=T.MathUtils.lerp(near,far,i/7),x=side*T.MathUtils.lerp(.66,.71,i/7);return[x,hoodY(sections,z,x)+.003,z];}),.006,M.black);
    if(!police)for(let i=0;i<5;i++)block(parent,side*.58,.90,-1.26-i*.053,.29,.015,.024,M.black);
  }
}
function extras(parent,police,tall,roof) {
  if(!police) {
    const wing=block(parent,0,1.105,-1.77,1.98,.055,.28,M.carbon);wing.rotation.x=.06;
    for(const side of [-1,1]) {
      block(parent,side*.62,.98,-1.73,.045,.25,.09,M.carbon);
      block(parent,side*1.005,1.11,-1.78,.035,.19,.35,M.fld);
      block(parent,side*1.026,1.12,-1.78,.009,.017,.27,M.acid);
      block(parent,side*.97,.44,-.02,.015,.024,1.30,M.pink);
    }
    for(let i=0;i<7;i++)block(parent,-.45+i*.15,.856,-1.84,.085,.016,.12,M.black);
  } else {
    block(parent,0,roof+.065,-.26,1.23,.06,.26,M.black);
    for(const side of [-1,1]){
      block(parent,side*.38,roof+.10,-.26,.38,.06,.20,M.chrome);
      if(tall)block(parent,side*.62,roof+.045,-.43,.05,.045,1.43,M.chrome);
      block(parent,side*.78,.53,2.05,.045,.30,.04,M.black);
    }
    block(parent,0,.45,2.065,1.63,.047,.032,M.black);
    line(parent,[[.48,roof,-.81],[.48,roof+.12,-.82],[.50,roof+(tall?.51:.20),-.88]],.011,M.black);
    // Rear red/fluorescent chevrons are modelled on a local patch, not projected into the lights.
    for(const side of [-1,1])for(let i=0;i<6;i++) {
      const x=side*(.15+i*.12);
      const points=side>0?[[x-.045,.86,-2.050],[x+.035,.86,-2.050],[x+.115,1.0,-2.050],[x+.035,1.0,-2.050]]:[[x+.045,.86,-2.050],[x-.035,.86,-2.050],[x-.115,1.0,-2.050],[x-.035,1.0,-2.050]];
      quad(parent,side>0?[...points].reverse():points,i%2?M.red:M.acid);
    }
  }
}
function wheelParts(police) {
  const key=police?'wheel-douane':'wheel-fld';if(templates.has(key))return templates.get(key);
  const root=new T.Group();
  const tyreProfile=[[.23,-.111],[.29,-.111],[.332,-.086],[.35,-.050],[.35,.05],[.332,.086],[.29,.111],[.23,.111]].map(p=>new T.Vector2(...p));
  const tyre=mesh(root,new T.LatheGeometry(tyreProfile,32),M.rubber);tyre.rotation.z=-Math.PI/2;
  for(const x of [-.112,.112]){
    const lip=mesh(root,new T.TorusGeometry(.257,.018,6,28),M.chrome);lip.rotation.y=Math.PI/2;lip.position.x=x;
  }
  const barrel=mesh(root,new T.CylinderGeometry(.25,.25,.18,28,1,true),M.black);barrel.rotation.z=Math.PI/2;
  const disc=mesh(root,new T.CylinderGeometry(.205,.205,.025,28),M.rotor);disc.rotation.z=Math.PI/2;disc.position.x=.077;
  const spokes=police?5:7;
  for(let i=0;i<spokes;i++) {
    const a=i*Math.PI*2/spokes;
    const spoke=block(root,.115,Math.sin(a)*.135,Math.cos(a)*.135,.035,.045,.22,M.chrome);spoke.rotation.x=-a;
    if(!police){const slot=block(root,.137,Math.sin(a)*.155,Math.cos(a)*.155,.009,.010,.13,M.black);slot.rotation.x=-a;}
  }
  const hub=mesh(root,new T.CylinderGeometry(.071,.071,.04,12),police?M.black:M.chrome);hub.rotation.z=Math.PI/2;hub.position.x=.134;
  if(!police){const ring=mesh(root,new T.TorusGeometry(.278,.006,4,32),M.chrome);ring.rotation.y=Math.PI/2;ring.position.x=.112;}
  // Two wheel passes: dark tyre/barrel, bright alloy/disc. No per-spoke draw calls.
  root.traverse(o=>{if(o.isMesh){if(o.material===M.black)o.material=M.rubber;if(o.material===M.rotor)o.material=M.chrome;}});
  mergeStatic(root);templates.set(key,root);return root;
}
function addWheels(vehicle,police) {
  vehicle.userData.wheels=[];
  for(const side of [-1,1])for(const z of wheelZ) {
    const steering=new T.Group(),rolling=new T.Group(),face=new T.Group();steering.position.set(side*.885,wheelY,z);
    face.rotation.y=side<0?Math.PI:0;face.add(wheelParts(police).clone(true));rolling.add(face);steering.add(rolling);
    // The brake caliper steers with the hub, but correctly DOES NOT rotate with the tyre.
    const caliper=block(steering,side*.080,.07,.18,.060,.15,.065,police?M.red:M.acid);
    vehicle.add(steering);vehicle.userData.wheels.push({steering,rolling,caliper,front:z>0});
  }
}
function flashGeometry(side,roof) {
  const g=new T.Group();
  for(let i=0;i<4;i++)block(g,side*(.23+i*.085),roof+.14,-.26,.062,.075,.20,M.blue);
  block(g,side*.38,.55,2.075,.13,.047,.013,M.blue);
  block(g,side*.48,.83,-2.061,.18,.045,.014,M.blue);
  g.updateMatrixWorld(true);const parts=[];g.traverse(m=>{if(m.isMesh)parts.push({geometry:m.geometry,matrix:m.matrixWorld});});return mergeGeometry(parts);
}
const shadowMaterial=new T.MeshBasicMaterial({map:softTexture(),transparent:true,opacity:.78,depthWrite:false});
const underglowMaterial=new T.MeshBasicMaterial({map:softTexture('glow'),color:'#ac4efa',transparent:true,opacity:.23,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending});
export function createDesignedVehicle(kind='fld',variant=0) {
  const police=kind==='cop',tall=police&&variant%2===0,key=police?(tall?'patrol':'interceptor'):'nightrunner';
  if(!templates.has(key)) {
    const shell=new T.Group();body(shell,police);const roof=cabin(shell,police,tall);fascia(shell,police);extras(shell,police,tall,roof);
    mergeStatic(shell);shell.userData.roof=roof;templates.set(key,shell);
  }
  const shell=templates.get(key),g=new T.Group();g.name=VEHICLE_DESIGNS[police?'cop':'fld'].name+(tall?' / PATROUILLE':'');g.add(shell.clone(true));
  g.userData={kind,paint:police?M.cop:M.fld,designId:VEHICLE_DESIGNS[police?'cop':'fld'].id,staticBatched:true,wheelbase:2.52};
  addWheels(g,police);
  if(police)for(const [name,side] of [['blue',-1],['red',1]]) {
    g.userData[name]=mesh(g,cached(key+'-flash-'+side,()=>flashGeometry(side,shell.userData.roof)),M.blue,'Blue strobes '+side);
  }
  g.userData.flame=block(g,0,.28,-2.18,.77,.07,.36,M.cyan);g.userData.flame.visible=false;
  const shadow=mesh(g,cached('shadow-plane',()=>new T.PlaneGeometry(2.8,4.9)),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.userData.cpuTextureOnly=true;
  if(!police){const glow=mesh(g,cached('underglow-plane',()=>new T.PlaneGeometry(2.7,4.4)),underglowMaterial);glow.rotation.x=-Math.PI/2;glow.position.y=.018;glow.userData.cpuTextureOnly=true;}
  return g;
}
