// Geometry proof only: a native CPU raster, not browser/WebGL/Safari validation.
import * as T from '../vendor/three.module.min.js';
import {createOculaire} from '../oculaire.js';
import {META,SURFACES} from '../assets/oculaire/portrait-data.js';
import {createRace,hit} from '../simulation.js';
import {SPIN_SECONDS} from '../oculaire-reactions.js';
import {sample} from '../track.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const output=resolve(process.argv[2]||'course/validation/hair-cpu');mkdirSync(output,{recursive:true});
const require=createRequire(import.meta.url),{createCanvas}=require('@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(512,128)};
const scene=new T.Scene(),view=createOculaire(scene,{loadModel:async()=>({META,SURFACES})});await view.ready;
if(view.status.state!=='ready')throw new Error(view.status.error);
const r=createRace();Object.assign(r,{state:'RACE',s:3000,x:0,time:70,speed:48});r.cops.forEach(c=>c.active=false);
const player=new T.Group(),p=sample(r.s),behind=sample(r.s-12),ahead=sample(r.s+24);player.position.set(p.x,p.y,p.z);scene.add(player);
const chase=new T.PerspectiveCamera(62,390/844,.3,4200);chase.position.set(behind.x,behind.y+4.3,behind.z);chase.lookAt(ahead.x,ahead.y+1.1,ahead.z);chase.updateMatrixWorld(true);view.update(r,player,chase);
const impactMode=process.argv.includes('--impact'),width=impactMode?400:800,height=impactMode?500:1000,light=new T.Vector3(-.4,.7,1).normalize(),restFrame=view.root.matrixWorld.clone().invert();
function srgb(v){v=T.MathUtils.clamp(v,0,1);return v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;}
function render(name,angle,up=.05){
 const image=new Uint8Array(width*height*3),depth=new Float32Array(width*height).fill(Infinity);for(let i=0;i<image.length;i+=3){image[i]=8;image[i+1]=7;image[i+2]=16;}
 const cam=new T.PerspectiveCamera(35,width/height,.01,20);cam.position.set(Math.sin(angle)*6,up,Math.cos(angle)*6);cam.lookAt(0,0,0);cam.updateMatrixWorld(true);
 view.root.updateMatrixWorld(true);const inverse=impactMode?restFrame:view.root.matrixWorld.clone().invert(),projection=cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);let faces=0;
 view.root.traverseVisible(mesh=>{
  if(!mesh.isMesh||mesh.material.isShaderMaterial)return;
  const geom=mesh.geometry,a=geom.attributes,m=inverse.clone().multiply(mesh.matrixWorld),nm=new T.Matrix3().getNormalMatrix(m),count=a.position.count;
  const screen=new Float32Array(count*3),invW=new Float32Array(count),shade=new Float32Array(count*3);
  const pos=new T.Vector3(),normal=new T.Vector3(),v4=new T.Vector4(),eye=new T.Vector3(),half=new T.Vector3();
  for(let i=0;i<count;i++){
   pos.fromBufferAttribute(a.position,i).applyMatrix4(m);v4.set(pos.x,pos.y,pos.z,1).applyMatrix4(projection);invW[i]=1/v4.w;
   screen[i*3]=(v4.x/v4.w*.5+.5)*(width-1);screen[i*3+1]=(1-(v4.y/v4.w*.5+.5))*(height-1);screen[i*3+2]=v4.z/v4.w;
   if(a.normal)normal.fromBufferAttribute(a.normal,i).applyMatrix3(nm).normalize();else normal.set(0,0,-1);
   eye.copy(cam.position).sub(pos).normalize();if(normal.dot(eye)<0)normal.negate();half.copy(eye).add(light).normalize();
   const basic=mesh.material.isMeshBasicMaterial,diffuse=basic?1:.38+Math.max(0,normal.dot(light))*1.12;
   const specular=basic?0:Math.pow(Math.max(0,normal.dot(half)),mesh.material.roughness<.5?28:12)*.025;
   for(let k=0;k<3;k++)shade[i*3+k]=(a.color?a.color.getComponent(i,k):mesh.material.color?.getComponent?.(k)||1)*diffuse+specular;
  }
  const ids=geom.index?.array||Uint32Array.from({length:count},(_,i)=>i);
  for(let j=0;j<ids.length;j+=3){
   const ia=ids[j],ib=ids[j+1],ic=ids[j+2],ax=screen[ia*3],ay=screen[ia*3+1],bx=screen[ib*3],by=screen[ib*3+1],cx=screen[ic*3],cy=screen[ic*3+1];
   const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<.00001)continue;
   const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx))),y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/den,v=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/den,w=1-u-v;if(u<0||v<0||w<0)continue;
    const z=u*screen[ia*3+2]+v*screen[ib*3+2]+w*screen[ic*3+2],pixel=y*width+x;if(z>=depth[pixel]||z<0||z>1)continue;depth[pixel]=z;
    const pu=u*invW[ia],pv=v*invW[ib],pw=w*invW[ic],sum=pu+pv+pw;
    for(let k=0;k<3;k++)image[pixel*3+k]=Math.round(srgb((pu*shade[ia*3+k]+pv*shade[ib*3+k]+pw*shade[ic*3+k])/sum)*255);
   }faces++;
  }
 });
 writeFileSync(resolve(output,name+'.ppm'),Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`),image]));console.log(name,faces,'surface triangles');
}
const frames=[];
if(impactMode){
 hit(r,5,0,'vehicle');view.update(r,player,chase);
 for(let n=0;n<22;n++){r.time=70+SPIN_SECONDS*n/21;view.update(r,player,chase);const name=`impact-${String(n).padStart(3,'0')}`;render(name,0);frames.push({name,time:r.time-70,reaction:view.status.reaction,rotation:view.root.quaternion.toArray()});}
}else{
 render('face',0);render('three-quarter',.64);render('profile',1.57);render('crown',0,2.5);
 r.state='ARRIVAL';r.result={won:true,ending:'escape'};r.cinematic=2.6;view.update(r,player,chase);render('reverse',Math.PI);
}
writeFileSync(resolve(output,'geometry.json'),JSON.stringify({kind:'CPU_GEOMETRY_RASTER_NOT_BROWSER_WEBGL',status:view.status,inspection:view.inspect(chase),frames},null,2));view.dispose();
