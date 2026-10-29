// Geometry inspection through the real chase camera. This is NOT a WebGL screenshot,
// shader/reflection validation or performance benchmark. No game code is replaced.
import * as T from '../vendor/three.module.min.js';
import {createRace} from '../simulation.js';
import * as model from '../assets/oculaire/portrait-data.js';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createCanvas,ImageData,Image:NativeImage}=require('@napi-rs/canvas');
const output=resolve(process.argv[2]||'course/validation/world-raster');mkdirSync(output,{recursive:true});
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.devicePixelRatio=1;globalThis.addEventListener=globalThis.removeEventListener=()=>{};
globalThis.Image=class extends NativeImage{set src(value){super.src=typeof value==='string'&&value.startsWith('file:')?fileURLToPath(value):value;}get src(){return super.src;}};
const {createRenderer}=await import('../renderer.js');
const {brandReady}=await import('../vehicle-livery.js?v=fld-route-003');if(!await brandReady)throw new Error('Original FLD tribal logo could not be loaded for CPU inspection.');
let scene,camera;
const sink={setPixelRatio(){},setSize(){},dispose(){},info:{},render(s,c){scene=s;camera=c;}};
const textures=new WeakMap(),light=new T.Vector3(-.4,.7,-.2).normalize();
const channel=(c,k)=>c[['r','g','b'][k]];
const srgb=x=>{x=T.MathUtils.clamp(x,0,1);return x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055;};
function textureData(texture){
 if(!texture)return null;if(textures.has(texture))return textures.get(texture);
 const image=texture.image;let value=null;
 if(image?.data&&ArrayBuffer.isView(image.data))value={data:image.data,width:image.width,height:image.height};
 else if(image?.getContext)value=image.getContext('2d').getImageData(0,0,image.width,image.height);
 textures.set(texture,value);return value;
}
function raster(width,height){
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const rgb=new Uint8ClampedArray(width*height*4),depth=new Float32Array(width*height).fill(Infinity),bg=scene.background;
 for(let i=0;i<rgb.length;i+=4){rgb[i]=srgb(bg.r)*255;rgb[i+1]=srgb(bg.g)*255;rgb[i+2]=srgb(bg.b)*255;rgb[i+3]=255;}
 const projection=camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse),frustum=new T.Frustum().setFromProjectionMatrix(projection);
 let faces=0,instances=0;const im=new T.Matrix4();
 function meshRaster(mesh,matrix){
  const geom=mesh.geometry,a=geom.attributes,mat=mesh.material;if(!a.position||Array.isArray(mat)||mat.isShaderMaterial||mat.opacity<.55)return;
  const bounds=geom.boundingSphere||(geom.computeBoundingSphere(),geom.boundingSphere);
  if(!frustum.intersectsSphere(bounds.clone().applyMatrix4(matrix)))return;
  const count=a.position.count,screen=new Float32Array(count*3),invW=new Float32Array(count),shade=new Float32Array(count*3),fog=new Float32Array(count),uv=new Float32Array(count*2);
  const normalMatrix=new T.Matrix3().getNormalMatrix(matrix),pos=new T.Vector3(),normal=new T.Vector3(),v4=new T.Vector4(),base=mat.color||new T.Color('white'),tex=textureData(mat.map);
  for(let i=0;i<count;i++){
   pos.fromBufferAttribute(a.position,i).applyMatrix4(matrix);v4.set(pos.x,pos.y,pos.z,1).applyMatrix4(projection);invW[i]=1/v4.w;
   screen[i*3]=(v4.x/v4.w*.5+.5)*(width-1);screen[i*3+1]=(1-(v4.y/v4.w*.5+.5))*(height-1);screen[i*3+2]=v4.z/v4.w;
   if(a.normal)normal.fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize();else normal.set(0,1,0);
   const diffuse=mat.isMeshBasicMaterial?1:.42+Math.max(0,normal.dot(light))*.95;
   for(let k=0;k<3;k++)shade[i*3+k]=channel(base,k)*(mat.vertexColors&&a.color?a.color.getComponent(i,k):1)*diffuse;
   const distance=pos.distanceTo(camera.position);fog[i]=mat.fog&&scene.fog?1-Math.exp(-((scene.fog.density*distance)**2)):0;
   if(a.uv){uv[i*2]=a.uv.getX(i);uv[i*2+1]=a.uv.getY(i);}
  }
  const ids=geom.index?.array||Uint32Array.from({length:count},(_,i)=>i);
  for(let j=0;j<ids.length;j+=3){
   const ia=ids[j],ib=ids[j+1],ic=ids[j+2];if(invW[ia]<=0||invW[ib]<=0||invW[ic]<=0)continue;
   const ax=screen[ia*3],ay=screen[ia*3+1],bx=screen[ib*3],by=screen[ib*3+1],cx=screen[ic*3],cy=screen[ic*3+1];
   const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<.00001||mat.side===T.FrontSide&&den>0||mat.side===T.BackSide&&den<0)continue;
   const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx))),y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
   if(x0>x1||y0>y1)continue;
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/den,v=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/den,w=1-u-v;if(u<0||v<0||w<0)continue;
    const z=u*screen[ia*3+2]+v*screen[ib*3+2]+w*screen[ic*3+2],pixel=y*width+x;if(z>=depth[pixel]||z< -1||z>1)continue;
    const pu=u*invW[ia],pv=v*invW[ib],pw=w*invW[ic],sum=pu+pv+pw,F=(pu*fog[ia]+pv*fog[ib]+pw*fog[ic])/sum;
    let ti=0;if(tex){let tu=(pu*uv[ia*2]+pv*uv[ib*2]+pw*uv[ic*2])/sum,tv=(pu*uv[ia*2+1]+pv*uv[ib*2+1]+pw*uv[ic*2+1])/sum;tu=mat.map.wrapS===T.RepeatWrapping?tu-Math.floor(tu):T.MathUtils.clamp(tu,0,.999999);tv=mat.map.wrapT===T.RepeatWrapping?tv-Math.floor(tv):T.MathUtils.clamp(tv,0,.999999);if(mat.map.flipY)tv=1-tv;ti=(Math.min(tex.height-1,Math.floor(tv*tex.height))*tex.width+Math.min(tex.width-1,Math.floor(tu*tex.width)))*4;if(tex.data[ti+3]<128)continue;}
    depth[pixel]=z;
    for(let k=0;k<3;k++){let value=(pu*shade[ia*3+k]+pv*shade[ib*3+k]+pw*shade[ic*3+k])/sum;if(tex){const q=tex.data[ti+k]/255;value*=mat.map.colorSpace===T.SRGBColorSpace?(q<=.04045?q/12.92:((q+.055)/1.055)**2.4):q;}rgb[pixel*4+k]=srgb(value*(1-F)+((scene.fog?channel(scene.fog.color,k):0))*F)*255;}
   }faces++;
  }
 }
 scene.traverseVisible(mesh=>{if(!mesh.isMesh)return;if(mesh.isInstancedMesh){for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,im);meshRaster(mesh,mesh.matrixWorld.clone().multiply(im));instances++;}}else meshRaster(mesh,mesh.matrixWorld);});
 const canvas=createCanvas(width,height);canvas.getContext('2d').putImageData(new ImageData(rgb,width,height),0,0);return {png:canvas.toBuffer('image/png'),faces,instances};
}
const victoryMode=process.argv.includes('--victory');
const views= victoryMode ? [['slow',7.7,'escape'],['orbit',8.8,'escape'],['rear',10.5,'escape'],['horizon',13,'escape'],['love-departure',15.6,'love']] : [['forest',2800],['forest-turn',3520],['secret-entry',3170,'forest-cut'],['secret-mid',3700,'forest-cut'],['secret-exit',4370,'forest-cut'],['debris',1020],['tunnel-entry',5180],['tunnel-exit',7380],['control',7800],['swagistan',11610]],report=[];
for(const [width,height]of [[390,844],[844,390]]){
 globalThis.innerWidth=width;globalThis.innerHeight=height;
 const view=createRenderer({},!victoryMode,()=>sink,'auto',undefined,{oculaire:{loadModel:()=>model}});await new Promise(setImmediate);
 if(view.oculaireStatus.state!=='ready')throw Error('OCULAIRE unavailable');
 const race=createRace();race.state='RACE';race.speed=48;race.cops.forEach(c=>c.active=false);
 for(const [name,s,branch]of views){
  Object.assign(race,victoryMode?{s:13000,time:280,cinematic:s,state:'ARRIVAL',result:{won:true,ending:branch},branch:null}:{s,time:s/48,branch:branch||null});race.traffic.forEach((t,i)=>{t.s=s+45+i*54;});view.reset();for(let i=0;i<12;i++)view.render(race,1/60);
  const result=raster(width,height),file=`${name}-${width}x${height}.png`;writeFileSync(resolve(output,file),result.png);report.push({file,s,branch:branch||null,width,height,faces:result.faces,instances:result.instances,camera:camera.position.toArray(),victory:view.inspectVictory()});console.log(file,result.faces);
 }view.dispose();
}
writeFileSync(resolve(output,'report.json'),JSON.stringify({kind:'CPU_GEOMETRY_RASTER_REAL_CHASE_CAMERA_NOT_WEBGL',report},null,2)+'\n');
