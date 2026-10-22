import * as T from './vendor/three.module.min.js';
// Cluster distant geometry once; preserve material/UV seams and hard normal changes.
const cache=new WeakMap();
export function distantGeometry(source){
 if(cache.has(source))return cache.get(source);
 const p=source.attributes.position,n=source.attributes.normal,uv=source.attributes.uv,c=source.attributes.color;
 const cells=new Map(),mapping=[],sums=[];
 for(let i=0;i<p.count;i++){
  const key=[Math.round(p.getX(i)/.12),Math.round(p.getY(i)/.12),Math.round(p.getZ(i)/.12),Math.floor(n.getX(i)*2),Math.floor(n.getY(i)*2),Math.floor(n.getZ(i)*2),Math.floor((uv?.getX(i)||0)*16),Math.floor((uv?.getY(i)||0)*16),c?Math.round(c.getX(i)*255):0,c?Math.round(c.getY(i)*255):0,c?Math.round(c.getZ(i)*255):0].join(',');
  if(!cells.has(key)){cells.set(key,sums.length);sums.push({p:[0,0,0],n:[0,0,0],uv:[0,0],c:[0,0,0],count:0});}
  const id=cells.get(key),a=sums[id];mapping[i]=id;a.count++;
  for(let j=0;j<3;j++){a.p[j]+=p.array[i*3+j];a.n[j]+=n.array[i*3+j];if(c)a.c[j]+=c.array[i*3+j];}
  if(uv){a.uv[0]+=uv.getX(i);a.uv[1]+=uv.getY(i);}
 }
 const positions=[],normals=[],coords=[],colors=[],indices=[];
 for(const a of sums){positions.push(...a.p.map(v=>v/a.count));const normal=new T.Vector3(...a.n).normalize();normals.push(...normal.toArray());coords.push(...a.uv.map(v=>v/a.count));if(c)colors.push(...a.c.map(v=>v/a.count));}
 const length=source.index?.count??p.count;
 for(let i=0;i<length;i+=3){const tri=[0,1,2].map(j=>mapping[source.index?source.index.getX(i+j):i+j]);if(new Set(tri).size===3)indices.push(...tri);}
 if(indices.length<3){cache.set(source,source);return source;}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(coords,2));if(c)geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();cache.set(source,geometry);return geometry;
}
export function setVehicleDetail(vehicle,low){
 const level=low?'distant':'close';if(vehicle.userData.detail===level)return;
 if(!vehicle.userData.detailMeshes&&low){
  const list=[];vehicle.traverse(o=>{if(o.isMesh&&!o.userData.cpuTextureOnly&&o!==vehicle.userData.flame&&o!==vehicle.userData.blue&&o!==vehicle.userData.red)list.push({mesh:o,high:o.geometry,low:distantGeometry(o.geometry)});});vehicle.userData.detailMeshes=list;
 }
 for(const item of vehicle.userData.detailMeshes||[])item.mesh.geometry=low?item.low:item.high;
 vehicle.userData.detail=level;
}
