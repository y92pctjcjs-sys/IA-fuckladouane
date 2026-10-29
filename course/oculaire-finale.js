import * as T from './vendor/three.module.min.js';
import {LENGTH,sample} from './track.js?v=oculaire-003';
import {softTexture} from './materials.js?v=oculaire-003';
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
const rand=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};
const IMPACT=4.7,PALETTE=['#31f6ec','#ff31b5','#dfff31','#fff6e3'];
function from64(value,Type){return new Type(Uint8Array.from(atob(value),c=>c.charCodeAt(0)).buffer);}
function backMark(data){
 const group=new T.Group();group.name='douaniere — mèches décolorées';group.visible=false;
 const canvas=globalThis.document?.createElement('canvas'),ctx=canvas?.getContext('2d');if(!ctx?.getImageData)return group;
 canvas.width=512;canvas.height=128;ctx.clearRect(0,0,512,128);ctx.fillStyle='white';ctx.font='900 86px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('douaniere',256,65,470);
 const pixels=ctx.getImageData(0,0,512,128).data,grid=96,zField=new Float32Array(grid*grid).fill(Infinity);
 for(const surface of data.SURFACES.filter(s=>s.group==='body')){
  const points=from64(surface.p,Int16Array);
  for(let i=0;i<points.length;i+=3){const x=points[i]/8192,y=points[i+1]/8192,z=points[i+2]/8192;
   const u=Math.round((x+1.05)/2.1*(grid-1)),v=Math.round((y+1.32)/2.64*(grid-1));if(u>=0&&u<grid&&v>=0&&v<grid)zField[v*grid+u]=Math.min(zField[v*grid+u],z);
  }
 }
 function rear(x,y){let best=Infinity;const u=Math.round((x+1.05)/2.1*(grid-1)),v=Math.round((y+1.32)/2.64*(grid-1));
  for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const z=zField[(v+j)*grid+u+i];if(Number.isFinite(z))best=Math.min(best,z);}
  return Number.isFinite(best)?best-.014:-.68;
 }
 const p=[],c=[];const color=new T.Color();
 // Each mark is a thin curved lock on the actual rear envelope, never a title card.
 for(let y=8;y<120;y+=3)for(let x=12;x<500;x+=3){if(pixels[(y*512+x)*4+3]<150)continue;
  const px=(.5-x/512)*1.68,py=.43+(.5-y/128)*.44,z=rear(px,py),w=.0045,h=.014;
  p.push(px-w,py-h,z,px+w,py-h,z,px+w,py+h,rear(px,py+h),px-w,py-h,z,px+w,py+h,rear(px,py+h),px-w,py+h,rear(px,py+h));
  color.set(y%9===0?'#a7faff':'#fff1ba');for(let i=0;i<6;i++)c.push(color.r,color.g,color.b);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,fog:false,toneMapped:false}));group.add(mesh);return group;
}
function shards(data,mark){
 const triangles=[];
 const inputs=data.SURFACES.map(s=>({p:from64(s.p,Int16Array),n:from64(s.n,Int8Array),c:from64(s.c,Uint8Array),idx:from64(s.i,Uint16Array)}));
 for(const mesh of mark.children){const a=mesh.geometry.attributes,p=Int16Array.from(a.position.array,x=>Math.round(x*8192)),n=new Int8Array(p.length),c=Uint8Array.from(a.color.array,x=>Math.round(x*255));for(let i=2;i<n.length;i+=3)n[i]=-127;inputs.push({p,n,c,idx:Uint16Array.from({length:a.position.count},(_,i)=>i)});}
 for(const {p,n,c,idx} of inputs){
  for(let j=0;j<idx.length;j+=3){const ids=[idx[j],idx[j+1],idx[j+2]],center=[0,0,0];
   for(const id of ids)for(let a=0;a<3;a++)center[a]+=p[id*3+a]/8192/3;
   const q=center.map(x=>T.MathUtils.clamp(Math.floor((x+2)*32),0,127));let key=0;for(let b=0;b<7;b++)for(let a=0;a<3;a++)key|=((q[a]>>b)&1)<<(b*3+a);
   triangles.push({p,n,c,ids,center,key});
  }
 }
 triangles.sort((a,b)=>a.key-b.key);const positions=[],colors=[],centers=[],motion=[];const count=1000;
 for(let group=0;group<count;group++){
  const start=Math.floor(group*triangles.length/count),end=Math.floor((group+1)*triangles.length/count),center=[0,0,0];
  for(let i=start;i<end;i++)for(let a=0;a<3;a++)center[a]+=triangles[i].center[a]/(end-start);
  const vx=center[0]*1.8+(rand(group*3)-.5)*1.8,vy=1.5+rand(group*7)*3.3,vz=center[2]*1.1+(rand(group*11)-.5)*2;
  for(let i=start;i<end;i++)for(const id of triangles[i].ids){const t=triangles[i],light=.55+.45*Math.max(0,(t.n[id*3]*.3+t.n[id*3+1]*.6+t.n[id*3+2]*.7)/127);
   for(let a=0;a<3;a++){positions.push(t.p[id*3+a]/8192);colors.push(Math.round(t.c[id*3+a]*light));centers.push(center[a]);}
   motion.push(vx,vy,vz,(rand(group*17)-.5)*7);
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.BufferAttribute(new Uint8Array(colors),3,true));geo.setAttribute('aCenter',new T.Float32BufferAttribute(centers,3));geo.setAttribute('aMotion',new T.Float32BufferAttribute(motion,4));
 const uniforms={uTime:{value:0},uReduced:{value:1}};
 const mat=new T.ShaderMaterial({uniforms,side:T.DoubleSide,vertexColors:true,vertexShader:`
 attribute vec3 aCenter;attribute vec4 aMotion;uniform float uTime;uniform float uReduced;varying vec3 pigment;
 void main(){float t=uTime;vec3 axis=normalize(aCenter+vec3(.13,.07,.11));vec3 v=position-aCenter;float angle=aMotion.w*t*uReduced;
 vec3 spun=v*cos(angle)+cross(axis,v)*sin(angle)+axis*dot(axis,v)*(1.-cos(angle));
 vec3 p=aCenter+spun+aMotion.xyz*t*uReduced;p.y-=2.8*t*t;float floorY=${(-data.META.height/2+.012).toFixed(6)};
 p.y=max(floorY+abs(sin(t*5.+aMotion.w))*.025,p.y);pigment=color;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 pigment;void main(){gl_FragColor=vec4(pigment,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const mesh=new T.Mesh(geo,mat);mesh.name='1000 fragments de surface';mesh.frustumCulled=false;mesh.visible=false;return mesh;
}
function fireworks(){
 const count=420,p=new Float32Array(count*3),color=new Float32Array(count*3),geometry=new T.BufferGeometry(),c=new T.Color();
 geometry.setAttribute('position',new T.BufferAttribute(p,3));geometry.setAttribute('color',new T.BufferAttribute(color,3));
 for(let i=0;i<count;i++){c.set(PALETTE[Math.floor(i/70)%4]);c.toArray(color,i*3);}
 const material=new T.PointsMaterial({size:.8,map:softTexture('spark'),vertexColors:true,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending,fog:false,toneMapped:false});
 const points=new T.Points(geometry,material);points.frustumCulled=false;points.visible=false;return points;
}
export function createOculaireFinale(scene,face,data){
 const effects=new T.Group();effects.name='OCULAIRE / arrivée';scene.add(effects);
 const mark=backMark(data),fracture=shards(data,mark),sparks=fireworks();effects.add(fracture,sparks);
 const ground=sample(LENGTH+148,-7),cameraSpot=sample(LENGTH+86,1),height=24,scale=height/data.META.height;
 const landingY=ground.y+height*.5,initialY=ground.y+60;
 let lastTime=-1;
 function pose(t){
  const y=t<1.7?T.MathUtils.lerp(initialY,ground.y+31,smooth(t/1.7)):t<3.7?ground.y+31-(t-1.7)*1.6:T.MathUtils.lerp(ground.y+27.8,landingY,Math.min(1,((t-3.7)/1)**2));
  const turn=Math.PI*smooth((t-.75)/1.1);
  return {y,turn};
 }
 function reset(){effects.visible=false;fracture.visible=false;sparks.visible=false;mark.visible=false;face.visible=true;lastTime=-1;}
 reset();
 return {mark,effects,
  gpuBytes:Object.values(fracture.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0),
  reset,
  shot(r){
   if(!r.result?.won||!['ARRIVAL','PAUSE','RESULTS'].includes(r.state))return null;
   const t=r.cinematic||0;if(t>5.7)return null;const p=pose(t);
   return {position:new T.Vector3(cameraSpot.x,cameraSpot.y+8,cameraSpot.z),target:new T.Vector3(ground.x,Math.max(ground.y+12,p.y-1),ground.z),blend:smooth(t/.7)*(1-smooth((t-5.0)/.7))};
  },
  update(r,root,camera,reduced){
   const t=r.cinematic||0,paused=r.state==='PAUSE';effects.visible=true;root.scale.setScalar(scale);
   const p=pose(t);root.position.set(ground.x,p.y,ground.z);
   root.rotation.set(0,ground.angle+Math.PI+p.turn,reduced?0:Math.sin(t*2)*.025);
   mark.visible=t>=1.85&&t<IMPACT;face.visible=t<IMPACT;
   fracture.visible=t>=IMPACT&&t<7;fracture.position.set(ground.x,landingY,ground.z);fracture.rotation.set(0,ground.angle+Math.PI*2,0);fracture.scale.setScalar(scale);
   fracture.material.uniforms.uTime.value=Math.max(0,t-IMPACT);fracture.material.uniforms.uReduced.value=reduced?.38:1;
   sparks.visible=t<6.5;const attr=sparks.geometry.attributes.position;
   for(let i=0;i<attr.count;i++){
    const burst=Math.floor(i/70),local=i%70,age=t-burst*.7-.05,angle=local*2.399963+burst,vertical=1-2*(local+.5)/70,radial=Math.sqrt(1-vertical*vertical),v=12+rand(i*43)*9;
    const active=age>=0&&age<1.8,u=Math.max(0,age),spread=reduced?.55:1,side=burst%2?1:-1;
    attr.setXYZ(i,active?ground.x+side*(15+burst*2)+Math.cos(angle)*radial*u*v*spread:ground.x,active?ground.y+35+(burst%3)*6+vertical*u*v*spread-4*u*u:-1000,ground.z+Math.sin(angle)*radial*u*v*spread);
   }attr.needsUpdate=true;lastTime=t;
   return {phase:t<.75?'fireworks':t<1.85?'fall':t<3.7?'reverse':t<IMPACT?'impact-approach':'fracture',fragments:t>=IMPACT?1000:0,paused};
  },
  dispose(){for(const mesh of[fracture,sparks,...mark.children]){mesh.geometry.dispose();mesh.material.dispose();}effects.removeFromParent();}
 };
}
