// Software projection of the exact meshes, for structural review only.
// Does not render Three.js materials, reflections, glazing, fog or WebGL shaders.
import * as T from './vendor/three.module.min.js';
import {createRoadPrototype} from './road-vehicles.js?v=oculaire-003';
import {setVehicleDetail} from './vehicle-detail.js?v=oculaire-003';
export function projectDesignVolumes(){
const panels=[],report={kind:'CPU_GEOMETRY_ONLY_NOT_WEBGL',models:[]};
function inspect(type,x,y,angle,label){
 const root=createRoadPrototype(type),camera=new T.PerspectiveCamera(33,1.6,.1,100);
 camera.position.set(Math.sin(angle)*7,2.9,Math.cos(angle)*7);camera.lookAt(0,.72,0);root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const light=new T.Vector3(-.4,.9,-.3).normalize(),faces=[];
 root.traverseVisible(o=>{
  if(!o.isMesh||o.userData.cpuTextureOnly)return;
  const g=o.geometry,p=g.attributes.position,uv=g.attributes.uv,idx=g.index,count=idx?.count||p.count;
  for(let i=0;i<count;i+=3){
   const ids=[0,1,2].map(j=>idx?idx.getX(i+j):i+j),v=ids.map(id=>new T.Vector3().fromBufferAttribute(p,id).applyMatrix4(o.matrixWorld)),normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize(),centre=v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1/3);
   if(normal.dot(camera.position.clone().sub(centre))<=0)continue;
   const projected=v.map(a=>a.project(camera));if(projected.some(p=>p.z<-1||p.z>1))continue;
   const color=o.material.color.clone();
   if(o.material.map?.image?.data&&uv){const image=o.material.map.image,u=uv.getX(ids[0]),offset=Math.min(image.width-1,Math.floor(u*image.width))*4;color.setRGB(image.data[offset]/255,image.data[offset+1]/255,image.data[offset+2]/255,T.SRGBColorSpace);}
   if(!o.material.isMeshBasicMaterial){const smooth=new T.Vector3(),matrix=new T.Matrix3().getNormalMatrix(o.matrixWorld);for(const id of ids)smooth.add(new T.Vector3().fromBufferAttribute(g.attributes.normal,id));smooth.applyMatrix3(matrix).normalize();color.multiplyScalar(.48+Math.max(0,smooth.dot(light))*.75);}
   faces.push({depth:centre.distanceToSquared(camera.position),d:'M'+projected.map(p=>[(p.x+1)*300,(-p.y+1)*187.5+30].map(n=>n.toFixed(1)).join(',')).join('L')+'Z',color:'#'+color.getHexString()});
  }
 });
 faces.sort((a,b)=>b.depth-a.depth);
 let out=`<g transform="translate(${x} ${y})"><rect width="600" height="430" rx="8" fill="#151b26"/><path d="M30 346H570M85 385H515" stroke="#344252"/><ellipse cx="300" cy="329" rx="185" ry="20" fill="#090b12"/>`;
 out+=faces.map(f=>`<path d="${f.d}" fill="${f.color}"/>`).join('');
 out+=`<text x="24" y="29" fill="#b6c0cf" font-size="10">${label}</text><text x="24" y="406" font-size="13" fill="#d0ff50">${type==='compact'?'B01 / COMPACTE TURBO':'C01 / CITADINE'}</text></g>`;panels.push(out);
}
for(const [i,type]of ['compact','city'].entries()){
 inspect(type,24+i*620,124,Math.PI+.62,'01 / TROIS-QUARTS ARRIÈRE');
 inspect(type,24+i*620,574,.65,'02 / TROIS-QUARTS AVANT');
 const car=createRoadPrototype(type);let near=0,far=0;car.traverseVisible(o=>{if(o.isMesh&&!o.userData.cpuTextureOnly)near+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 setVehicleDetail(car,true);car.traverseVisible(o=>{if(o.isMesh&&!o.userData.cpuTextureOnly)far+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});report.models.push({type,nearTriangles:near,farTriangles:far});
}
const svg=`<svg width="1268" height="1040" viewBox="0 0 1268 1040"><rect width="1268" height="1040" fill="#090b12"/><g font-family="Arial,sans-serif"><text x="24" y="43" fill="#f2f1ea" font-size="28" font-weight="900">fld® / VOLUMES DU PROTOTYPE</text><text x="24" y="72" fill="#b6c0cf" font-size="13">Projection des maillages réels / coques, vitrages, roues et optiques</text><text x="24" y="96" fill="#ffb54c" font-size="12">Contrôle de structure CPU — sans matières finales, reflets ni validation WebGL.</text>${panels.join('')}</g></svg>`;
return {svg,report};
}
