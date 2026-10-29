import * as T from './vendor/three.module.min.js';
import {softTexture} from './materials.js?v=oculaire-003';

// Milestone 2 only. Production collision boxes, simulation and spawn rules are untouched.
// Coordinates: +Z front, -Z rear, +Y up. All dimensions include mirrors and lamps.
export const ROAD_PROTOTYPES=Object.freeze({
 compact:Object.freeze({id:'B01',name:'COMPACTE TURBO',halfLength:2.01,width:.895,height:1.49,rearBase:-1.80,rearRoof:-1.21,frontRoof:.26,frontBase:1.02,wheelbase:2.52,radius:.33,colors:['#434952','#4a5058','#393f48']}),
 city:Object.freeze({id:'C01',name:'CITADINE',halfLength:1.95,width:.86,height:1.64,rearBase:-1.80,rearRoof:-1.06,frontRoof:.47,frontBase:1.23,wheelbase:2.36,radius:.32,colors:['#d1cabb','#759a96','#b3b6aa']})
});
const templates=new Map(),paints=new Map(),geometries=new Map();
const box=new T.BoxGeometry(1,1,1);
const standard=(color,roughness,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const unlit=color=>new T.MeshBasicMaterial({color,toneMapped:false});
const m={
 trim:standard('#161b22',.83),metal:standard('#9ca5ad',.28,.78),
 glass:new T.MeshPhysicalMaterial({color:'#182832',roughness:.18,metalness:.15,clearcoat:.7,transparent:true,opacity:.72,depthWrite:false,envMapIntensity:.9}),
 head:unlit('#e9e8dc'),tail:unlit('#a92c3b'),brake:unlit('#ff4253'),blue:unlit('#62caff'),plate:standard('#d1d7cf',.68),euro:unlit('#39698a'),
 shadow:new T.MeshBasicMaterial({map:softTexture(),transparent:true,opacity:.65,depthWrite:false})
};
function paint(type,variant){
 const key=type+':'+variant%3;
 if(!paints.has(key))paints.set(key,new T.MeshPhysicalMaterial({color:ROAD_PROTOTYPES[type].colors[variant%3],metalness:type==='compact'?.62:.28,roughness:type==='compact'?.31:.39,clearcoat:.65,clearcoatRoughness:.22,envMapIntensity:1.1}));
 return paints.get(key);
}
function mesh(root,geometry,material,name=''){const o=new T.Mesh(geometry,material);o.name=name;root.add(o);return o;}
function block(root,x,y,z,w,h,d,material){const o=mesh(root,box,material);o.position.set(x,y,z);o.scale.set(w,h,d);return o;}
function patch(root,fn,nu,nv,material,flip=false){
 const positions=[],uv=[],indices=[];
 for(let v=0;v<=nv;v++)for(let u=0;u<=nu;u++){positions.push(...fn(u/nu,v/nv));uv.push(u/nu,v/nv);}
 for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){
  const a=v*(nu+1)+u,b=a+1,c=a+nu+1,d=c+1;
  indices.push(...(flip?[a,c,b,b,c,d]:[a,b,c,b,d,c]));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(root,g,material);
}
// One static draw per finish. No new geometry is created by per-frame animation.
function merge(root,name=''){
 root.updateMatrixWorld(true);const groups=new Map();
 root.traverse(o=>{if(o.isMesh){if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(o);}});
 root.clear();
 for(const [material,parts]of groups){
  const positions=[],normals=[],uv=[];
  for(const part of parts){
   const g=part.geometry.clone().applyMatrix4(part.matrixWorld).toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,t=g.attributes.uv;
   for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(t?.getX(i)||0,t?.getY(i)||0);}
   g.dispose();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingBox();g.computeBoundingSphere();mesh(root,g,material,material===root.userData.paint?'Chassis':name);
 }
}
function bodyHeight(p,z){
 const nose=Math.pow(Math.max(0,(z-p.frontBase)/(p.halfLength-p.frontBase)),1.7),tail=Math.pow(Math.max(0,(-z-1.4)/(p.halfLength-1.4)),2);
 return (p.id==='C01'?.93:.96)-nose*.19-tail*.045;
}
function bodyWidth(p,z){return p.width*(1-(p.id==='C01'?.25:.13)*Math.pow(Math.abs(z)/p.halfLength,p.id==='C01'?4:6));}
function body(root,p,paint){
 const positions=[],uv=[],indices=[],nz=76,nr=12;
 for(let i=0;i<=nz;i++){
  const z=-p.halfLength+i/nz*p.halfLength*2,w=bodyWidth(p,z),top=bodyHeight(p,z);
  let cut=.255;
  for(const axle of[-p.wheelbase/2,p.wheelbase/2]){const d=Math.abs(z-axle),r=p.radius+.035;if(d<r)cut=Math.max(cut,p.radius+Math.sqrt(r*r-d*d));}
  const shoulder=top-.065,waist=Math.max(top-.22,cut+.025);
  const ring=[[0,top+.014],[w*.65,top],[w*.93,shoulder],[w,waist],[w*.998,cut],[w*.78,.23],[0,.23],[-w*.78,.23],[-w*.998,cut],[-w,waist],[-w*.93,shoulder],[-w*.65,top]];
  for(let j=0;j<nr;j++){positions.push(ring[j][0],ring[j][1],z);uv.push(j/nr,i/nz);}
  if(i)for(let j=0;j<nr;j++){const a=(i-1)*nr+j,b=(i-1)*nr+(j+1)%nr,c=i*nr+j,d=i*nr+(j+1)%nr;indices.push(a,c,b,b,c,d);}
 }
 // Close both ends; this also prevents seeing through a bumper at chase-camera height.
 for(const end of[0,nz])for(let j=1;j<nr-1;j++){const a=end*nr;indices.push(...(end?[a,a+j+1,a+j]:[a,a+j,a+j+1]));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(root,g,paint);
 block(root,0,.25,0,1.50,.07,3.64,m.trim);
 const rear=-p.halfLength,front=p.halfLength;
 for(const z of[rear,front]){
  block(root,0,.39,z*.988,1.62,.16,.09,m.trim);
  block(root,0,.53,z*1.004,.52,.11,.018,m.plate);
  block(root,-.248,.53,z*1.010,.027,.11,.005,m.euro);
 }
 block(root,0,.61,front+.009,.76,.085,.025,m.trim);
 for(let i=-3;i<=3;i++)block(root,i*.098,.61,front+.025,.012,.055,.015,m.metal);
 for(const side of[-1,1]){
  const rearY=p.id==='C01'?.83:.91;
  block(root,side*.65,rearY,rear-.005,p.id==='C01'?.17:.31,p.id==='C01'?.24:.14,.045,m.trim);
  for(const dy of[-1,1])block(root,side*.65,rearY+dy*.032,rear-.032,p.id==='C01'?.09:.245,.026,.01,m.tail);
  block(root,side*.61,.72,front+.008,.33,.10,.035,m.trim);
  block(root,side*.61,.73,front+.029,p.id==='C01'?.24:.27,.041,.008,m.head);
  block(root,side*.79,.42,rear-.026,.075,.03,.008,m.tail);
  for(const z of[-.43,.55])block(root,side*(p.width-.015),.93,z,.026,.027,.14,m.metal);
  const mirror=block(root,side*.904,1.07,.71,.078,.074,.15,paint);mirror.rotation.y=-side*.08;
  block(root,side*.906,1.07,.635,.055,.047,.007,m.metal);
  // Continuous sill and shoulder crease follow the actual body, not floating decals.
  patch(root,(u,v)=>{const z=-1.1+u*2.2;return[side*(bodyWidth(p,z)+.002),.29+v*.045,z];},18,1,m.trim,side<0);
 }
}
function cockpit(root,p,paint){
 const base=.95,rw=p.width*(p.id==='C01'?.75:.80),bw=p.width*.94,dome=p.id==='C01'?.075:.025;
 const glassPoint=(u,v,rear=false)=>{
  const z=T.MathUtils.lerp(rear?p.rearBase:p.frontBase,rear?p.rearRoof:p.frontRoof,v)+(rear?-.018:p.id==='C01'?.060:.025)*Math.sin(u*Math.PI);
  return[(u*2-1)*T.MathUtils.lerp(bw,rw,v),T.MathUtils.lerp(base,p.height-.025,v)+.017*Math.sin(u*Math.PI),z];
 };
 patch(root,(u,v)=>[(u*2-1)*(rw+.025*Math.sin(v*Math.PI)),p.height+dome*Math.sin(v*Math.PI)+.035*Math.sin(u*Math.PI)*Math.sin(v*Math.PI),T.MathUtils.lerp(p.rearRoof,p.frontRoof,v)],14,12,paint,true);
 for(const rear of[false,true]){
  patch(root,(u,v)=>glassPoint(u,v,rear),14,10,m.glass,rear);
  // Solid painted pillars run along each pane edge, leaving five-door proportions readable.
  for(const side of[-1,1])patch(root,(u,v)=>{const q=glassPoint(side<0?u*.034:1-u*.034,v,rear);q[2]+=rear?-.003:.003;return q;},1,10,paint,rear!== (side>0));
 }
 for(const side of[-1,1]){
  const point=(u,v)=>[side*(T.MathUtils.lerp(bw,rw,v)+(.006+.019*v)*Math.sin(u*Math.PI)),T.MathUtils.lerp(base,p.height-.025+dome*Math.sin(u*Math.PI),v),T.MathUtils.lerp(T.MathUtils.lerp(p.rearBase,p.frontBase,u),T.MathUtils.lerp(p.rearRoof,p.frontRoof,u),v)];
  patch(root,point,20,10,m.glass,side>0);
  for(const centre of[.04,.56,.97])patch(root,(u,v)=>{const q=point(T.MathUtils.clamp(centre+(u-.5)*.035,0,1),v);q[0]+=side*.008;return q;},1,10,centre===.56?m.trim:paint,side>0);
  patch(root,(u,v)=>point(u,v*.028),20,1,m.trim,side>0);
 }
 block(root,0,.94,.48,1.32,.06,.55,m.trim); // dashboard visible through smoked glazing
 block(root,0,1.075,p.rearBase+.14,1.31,.055,.16,m.trim);
 // Painted spoiler lip and actual tailgate reveal a short, upright hatch from behind.
 block(root,0,p.height-.02,p.rearRoof-.035,1.43,.035,.14,paint);
 block(root,0,1.025,p.rearBase-.024,.29,.025,.018,m.trim);
 return glassPoint;
}
function wheelGeometry(p){
 const key='wheel:'+p.radius;if(geometries.has(key))return geometries.get(key);
 const g=new T.Group(),tire=new T.Mesh(new T.CylinderGeometry(p.radius,p.radius,.155,24,1),m.trim);tire.rotation.z=Math.PI/2;g.add(tire);
 for(const side of[-1,1]){
  const disc=mesh(g,new T.CircleGeometry(.215,24),m.metal);disc.rotation.y=side*Math.PI/2;disc.position.x=side*.079;
  for(let i=0;i<6;i++){const a=i*Math.PI/3,spoke=block(g,side*.082,Math.cos(a)*.155,Math.sin(a)*.155,.004,.095,.033,m.trim);spoke.rotation.x=a;}
 }
 // One shared map encodes alloy/rubber colour, roughness and metalness in one draw per wheel.
 const tex=(values,color=false)=>{const t=new T.DataTexture(Uint8Array.from(values),2,1,T.RGBAFormat);if(color)t.colorSpace=T.SRGBColorSpace;t.magFilter=t.minFilter=T.NearestFilter;t.needsUpdate=true;return t;};
 const material=new T.MeshStandardMaterial({map:tex([16,19,24,255,144,150,158,255],true),roughnessMap:tex([242,242,242,255,100,100,100,255]),metalnessMap:tex([0,0,0,255,220,220,220,255]),roughness:1,metalness:1});
 g.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,o.material===m.trim?.25:.75,.5);o.material=material;}});
 merge(g);const result={geometry:g.children[0].geometry,material};geometries.set(key,result);return result;
}
function signalGeometry(p,glassPoint,side){
 const g=new T.Group();
 block(g,side*.36,.64,p.halfLength+.027,.14,.04,.018,m.blue);
 const front=glassPoint(.5+side*.22,.25),rear=glassPoint(.5+side*.25,.23,true);
 block(g,front[0],front[1]-.012,front[2]-.035,.145,.045,.025,m.blue);
 block(g,rear[0],rear[1]-.012,rear[2]+.035,.145,.045,.025,m.blue);
 merge(g);return g.children[0].geometry;
}
export function createRoadPrototype(type='compact',variant=0,undercover=false){
 const p=ROAD_PROTOTYPES[type],key=type+':'+variant%3,finish=paint(type,variant);
 if(!templates.has(key)){
  const shell=new T.Group();shell.userData.paint=finish;body(shell,p,finish);const glass=cockpit(shell,p,finish);merge(shell,'Finish');
  templates.set(key,{shell,signals:[-1,1].map(side=>signalGeometry(p,glass,side))});
 }
 const template=templates.get(key),root=new T.Group();root.add(template.shell.clone(true));root.name=p.id+' / '+p.name;
 root.userData={kind:undercover?'undercover':'traffic',designId:p.id,prototype:true,staticBatched:true,paint:finish,wheelbase:p.wheelbase,wheelRadius:p.radius,cosmeticOnly:true,wheels:[],lastSpeed:null,braking:false};
 const wheel=wheelGeometry(p);
 for(const side of[-1,1])for(const z of[-p.wheelbase/2,p.wheelbase/2]){
  const steering=new T.Group(),rolling=new T.Group();steering.position.set(side*.79,p.radius,z);steering.add(rolling);rolling.add(new T.Mesh(wheel.geometry,wheel.material));root.add(steering);root.userData.wheels.push({steering,rolling,front:z>0});
 }
 for(const [i,name]of['blue','red'].entries()){
  const signal=mesh(root,template.signals[i],m.blue,'Concealed blue modules');signal.visible=false;root.userData[name]=signal;
 }
 const brakes=new T.Group(),rear=-p.halfLength-.035,y=p.id==='C01'?.83:.91;
 for(const side of[-1,1])block(brakes,side*.65,y,rear,p.id==='C01'?.094:.245,p.id==='C01'?.14:.07,.006,m.brake);
 block(brakes,0,p.height-.11,p.rearRoof-.07,.35,.025,.018,m.brake);merge(brakes);
 root.userData.brakes=brakes;root.add(brakes);brakes.visible=false;
 root.userData.flame=new T.Group();root.add(root.userData.flame);root.userData.flame.visible=false;
 const shadow=mesh(root,geometries.get('shadow')||(()=>{const g=new T.PlaneGeometry(2.65,4.7);geometries.set('shadow',g);return g;})(),m.shadow);shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.userData.cpuTextureOnly=true;
 return root;
}
export function animateRoadBrakes(vehicle,race,dt){
 if(!vehicle.userData.brakes||dt<=0||race.state!=='RACE')return;
 const data=vehicle.userData,previous=data.lastSpeed;
 data.braking=previous!==null&&(race.speed-previous)/dt<-1.5;
 data.lastSpeed=race.speed;data.brakes.visible=data.braking;
}
export function resetRoadPrototype(vehicle){
 if(!vehicle.userData.prototype)return;
 vehicle.userData.lastSpeed=null;vehicle.userData.braking=false;vehicle.userData.brakes.visible=false;
 vehicle.userData.blue.visible=false;vehicle.userData.red.visible=false;
 for(const wheel of vehicle.userData.wheels){wheel.rolling.rotation.x=0;wheel.steering.rotation.y=0;}
}
