// Adapted from pmndrs/racing-game Skid.tsx, Dust.tsx and Boost.tsx (MIT).
// Copyright 2021 pmdrs, contributors. License: licenses/pmndrs-MIT.txt.
// Ported to vanilla Three.js, fixed simulation time, bounded reusable pools and FLD colors.
import * as T from './vendor/three.module.min.js';
import {sample} from './track.js?v=fld-world-002';
import {softTexture} from './materials.js?v=fld-world-002';
export function createDrivingEffects(scene,reduced=false){
  const o=new T.Object3D(),v=new T.Vector3(),q=new T.Quaternion(),zero=new T.Matrix4().makeScale(0,0,0);
  const marks=new T.InstancedMesh(new T.PlaneGeometry(.23,1.4).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#07080d',transparent:true,opacity:.66,depthWrite:false}),160);
  const smoke=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:'#c6bfd4',map:softTexture('smoke'),transparent:true,opacity:.18,depthWrite:false}),48);
  const boost=new T.InstancedMesh(new T.ConeGeometry(.085,.45,5).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:'#baacff',transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending}),16);
  smoke.userData.cpuTextureOnly=true;
  for(const pool of[marks,smoke,boost]){pool.frustumCulled=false;pool.instanceMatrix.setUsage(T.DynamicDrawUsage);for(let i=0;i<pool.count;i++)pool.setMatrixAt(i,zero);scene.add(pool);}
  const puffs=Array.from({length:48},()=>({age:2,x:0,y:0,z:0,side:0}));
  let markIndex=0,puffIndex=0,lastS=0,lastTime=0;
  function clear(){for(const pool of[marks,smoke,boost]){for(let i=0;i<pool.count;i++)pool.setMatrixAt(i,zero);pool.instanceMatrix.needsUpdate=true;}for(const p of puffs)p.age=2;lastS=0;lastTime=0;markIndex=puffIndex=0;}
  return{clear,setReduced(value){reduced=value;},dispose(){for(const pool of[marks,smoke,boost]){pool.removeFromParent();pool.dispose();pool.geometry.dispose();pool.material.dispose();}},update(r,camera){
    const dt=Math.max(0,Math.min(.1,r.time-lastTime));lastTime=r.time;
    if(r.state!=='RACE'){boost.visible=smoke.visible=false;return;}boost.visible=r.boosting&&!reduced;smoke.visible=!reduced;
    if(r.drifting&&Math.abs(r.s-lastS)>.95){
      lastS=r.s;
      for(const side of[-.75,.75]){
        const p=sample(r.s-1.2,r.x+side);o.position.set(p.x,p.y+.025,p.z);o.rotation.set(0,p.angle+r.yaw,0);o.scale.set(1,1,1);o.updateMatrix();marks.setMatrixAt(markIndex++%marks.count,o.matrix);
        if(!reduced){const puff=puffs[puffIndex++%puffs.length];Object.assign(puff,{x:p.x,y:p.y+.22,z:p.z,age:0,side:Math.sign(side)});}
      }
      marks.instanceMatrix.needsUpdate=true;
    }
    camera.getWorldQuaternion(q);
    for(let i=0;i<puffs.length;i++){
      const p=puffs[i];p.age+=dt;if(p.age>1.5){smoke.setMatrixAt(i,zero);continue;}
      o.position.set(p.x+p.side*p.age*.3,p.y+p.age*.55,p.z);o.quaternion.copy(q);o.scale.setScalar((.35+p.age*.6)*(1-p.age/1.5));o.updateMatrix();smoke.setMatrixAt(i,o.matrix);
    }smoke.instanceMatrix.needsUpdate=true;
    if(boost.visible){
      const p=sample(r.s,r.x);for(let i=0;i<boost.count;i++){
        const side=i%2?-1:1,t=(r.time*2.8+i*.11)%1;o.position.set(side*.62,.33,-2.1-t*.85);o.rotation.set(0,0,0);o.scale.setScalar((1-t)*1.1);o.updateMatrix();
        v.copy(o.position).applyAxisAngle(T.Object3D.DEFAULT_UP,p.angle+r.yaw);o.position.set(p.x+v.x,p.y+v.y,p.z+v.z);o.rotation.y=p.angle+r.yaw;o.updateMatrix();boost.setMatrixAt(i,o.matrix);
      }boost.instanceMatrix.needsUpdate=true;
    }
  }};
}
