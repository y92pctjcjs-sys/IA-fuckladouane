import * as T from './vendor/three.module.min.js';
import {surface,industrialMaterial,facadeMaterial,softTexture} from './materials.js?v=atelier-002';
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
  // Textile bales and strapped cartons at selected loading bays.
  if(s%160===0)for(let i=0;i<5;i++){
    const x=side*(8+i%2*1.7),z=-18+Math.floor(i/2)*1.6,y=.6+(i%2)*.3;
    cube(parent,x,y,z,1.3,1.1,1.2,i%3?'#827b83':'#b2a5a0');
    cube(parent,x,y+.56,z,.12,.02,1.22,'#352f42');cube(parent,x,y,z-.61,.12,1.12,.02,'#352f42');
  }
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
const poolResources=new Map();
export function lightPool(parent,color,width,length){
 const key=[color,width,length].join(':');
 if(!poolResources.has(key))poolResources.set(key,{geo:new T.PlaneGeometry(width,length),mat:new T.MeshBasicMaterial({color,map:softTexture('light'),transparent:true,opacity:.17,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide})});
 const {geo,mat}=poolResources.get(key),mesh=new T.Mesh(geo,mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=.025;mesh.userData.cpuTextureOnly=true;parent.add(mesh);return mesh;
}
export function borderDetail(group,cube){
  for(const side of[-1,1]){
    for(const dz of[-22,-10,10,22]){cube(group,side*12,1.5,dz,.12,3,.12,'#717d89');cube(group,side*12,1.3,dz,.04,.08,12,'#98a4af');cube(group,side*12,2.4,dz,.04,.08,12,'#98a4af');}
    const booth=cube(group,side*10.7,1.6,-8,3.3,3.2,4.2,'#8b9098');booth.material=industrialMaterial('concrete');
    cube(group,side*10.7,2,-10.15,2.8,1,.08,'#b0bd94',true);cube(group,side*10.7,3.3,-8,4.1,.24,5,'#273750');
    cube(group,side*8.1,2.2,-11,.12,4.4,.12,'#757981');cube(group,side*8.1,4.4,-11,.7,.2,.5,'#fff0c2',true);
  }
}

const hillGeometry=new T.IcosahedronGeometry(1,1);
export function openDetail(group,s,kind,cube,positionOn){
  const terrain=new T.Group();group.add(terrain);positionOn(terrain,s+40);
  for(const side of[-1,1]){
    const hill=new T.Mesh(hillGeometry,surface(kind==='frontier'?'#353449':'#252a40',1));
    hill.position.set(side*(100+s/80%3*24),14,25);hill.scale.set(65,22+s/80%4*9,65);terrain.add(hill);
  }
  if(kind==='open'&&s%320===0){
    for(const side of[-1,1]){
      const x=side*31;cube(terrain,x,18,0,.45,36,.45,'#565269');
      for(const y of[19,29,34])cube(terrain,x,y,0,13,.24,.24,'#615b79');
      for(const dx of[-5,0,5]){cube(terrain,x+dx,33,-12,.05,.05,75,'#504866');cube(terrain,x+dx,29,-12,.05,.05,75,'#504866');}
    }
  }
  if(kind==='frontier'&&s%240===0){
    for(const side of[-1,1]){cube(terrain,side*28,3.5,0,.17,7,.17,'#77718a');cube(terrain,side*28,6,0,3.3,1.5,.09,'#b89cdb',true);}
  }
}
export function controlDetail(group,s,cube,positionOn){
  const yard=new T.Group();group.add(yard);positionOn(yard,s+40);
  for(const side of[-1,1]){
    cube(yard,side*22,.1,0,22,.15,75,'#222735');
    for(const z of[-24,0,24]){
      cube(yard,side*34,2,z,.13,4,.13,'#637187');cube(yard,side*34,2,z,.08,.08,24,'#8792a1');
      cube(yard,side*19,.15,z,10,.025,.18,'#8c8992');
    }
    if(s%160===0){
      // Parked patrols stay outside the drivable road; simple distant silhouettes.
      for(const z of[-22,23]){
        const x=side*20;
        cube(yard,x,.66,z,1.9,.55,4,'#dce3ea');cube(yard,x,1.23,z-.25,1.55,.7,2.6,'#172e4c');
        cube(yard,x,1.63,z-.2,1.5,.08,2.2,'#dce3ea');cube(yard,x,1.77,z-.2,1.15,.17,.25,'#448aff',true);
        for(const dx of[-.94,.94])for(const dz of[-1.2,1.2])cube(yard,x+dx,.34,z+dz,.15,.55,.58,'#14131c');
      }
      cube(yard,side*26,1.8,0,8,3.6,16,'#4d5a69').material=industrialMaterial('steel');
      cube(yard,side*21.95,2,0,.1,1.3,10,'#aeb9bd',true);
      cube(yard,side*17,5,12,.22,10,.22,'#6c7684');cube(yard,side*17,10,12,4,.2,1,'#ccdaee',true);
    }
  }
}
