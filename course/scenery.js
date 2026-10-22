import * as T from './vendor/three.module.min.js';
import {surface,industrialMaterial,facadeMaterial,softTexture} from './materials.js';
const metal=surface('#52596d',.44,.7),concrete=surface('#61636c',.92),dark=surface('#191b27',.83);
const tube=new T.CylinderGeometry(1,1,1,10);
function pipe(parent,x,y,z,r,h,mat=metal){const mesh=new T.Mesh(tube,mat);mesh.position.set(x,y,z);mesh.scale.set(r,h,r);parent.add(mesh);return mesh;}
export function industrialDetail(parent,s,side,cube){
  for(const z of[-2,8,18]){
    cube(parent,side*6.4,1.6,z,.1,2.65,.15,'#151720');
    cube(parent,side*9.6,1.6,z,.1,2.65,.15,'#151720');
  }
  cube(parent,side*17,.35,-7.5,19,.7,2.5,'#3c3d4b');
  for(const dx of[-6,0,6]){
    cube(parent,side*17+dx,2,-7.2,4.6,3.2,.25,'#171d29');
    cube(parent,side*17+dx,4,-7.45,5,.18,1,'#8b7e69',true);
    for(const k of[-1,1])cube(parent,side*17+dx+k*2.25,1.3,-8.4,.18,2.6,.18,'#a7976b');
  }
  for(const z of[-3,9,21]){cube(parent,side*17,9,z,4,1.2,2.3,'#4d4c5c');pipe(parent,side*20,10,z,.42,2.5);}
  // Distant lit offices give the warehouses a believable industrial skyline.
  const city=cube(parent,side*62,11+(s/80%3)*4,12,14,22+(s/80%3)*8,19,'#303544');city.material=facadeMaterial((s/80)%3);
  if(s%480===0){
    pipe(parent,side*37,12,18,1.2,24,industrialMaterial('concrete'));
    for(const y of[8,16,23]){const band=pipe(parent,side*37,y,18,1.25,1);band.material=surface('#7a4859',.8);}
    cube(parent,side*44,11,-2,.55,22,.55,'#57546a');cube(parent,side*41,21,-2,24,.4,.5,'#6b627c');cube(parent,side*30,18,-2,.1,6,.1,'#898196');
  }
}
export function tunnelDetail(parent,cube){
  for(const side of[-1,1]){
    cube(parent,side*9.65,1.05,0,.18,.13,78,'#d0a5ff',true);
    cube(parent,side*9.65,.4,0,.18,.16,78,'#6b6677');
    for(const z of[-24,24]){
      const frame=cube(parent,side*9.55,3,z,.12,2.2,1.2,'#43394f');frame.material=industrialMaterial('concrete');
      cube(parent,side*9.45,3,z,.08,1.7,.9,'#51ba9d',true);
      pipe(parent,side*8.8,7.15,z,.42,1.7,dark).rotation.z=Math.PI/2;
    }
  }
}
export function lightPool(parent,color,width,length){
  const mat=new T.MeshBasicMaterial({color,map:softTexture('light'),transparent:true,opacity:.17,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  const mesh=new T.Mesh(new T.PlaneGeometry(width,length),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=.025;mesh.userData.cpuTextureOnly=true;parent.add(mesh);return mesh;
}
export function borderDetail(group,cube){
  for(const side of[-1,1]){
    for(const dz of[-22,-10,10,22]){cube(group,side*12,1.5,dz,.12,3,.12,'#717d89');cube(group,side*12,1.3,dz,.04,.08,12,'#98a4af');cube(group,side*12,2.4,dz,.04,.08,12,'#98a4af');}
    const booth=cube(group,side*10.7,1.6,-8,3.3,3.2,4.2,'#8b9098');booth.material=industrialMaterial('concrete');
    cube(group,side*10.7,2,-10.15,2.8,1,.08,'#b0bd94',true);cube(group,side*10.7,3.3,-8,4.1,.24,5,'#273750');
    cube(group,side*8.1,2.2,-11,.12,4.4,.12,'#757981');cube(group,side*8.1,4.4,-11,.7,.2,.5,'#fff0c2',true);
  }
}
