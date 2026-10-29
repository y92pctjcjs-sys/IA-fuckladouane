import * as T from './vendor/three.module.min.js';
import {atlasUV} from './vehicle-livery.js?v=fld-route-003';
const primitives=new Map();
export function primitive(key,make){if(!primitives.has(key))primitives.set(key,make());return primitives.get(key);}
export function patch(points,indices,uv=null){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv?uv.flat():points.flatMap(()=>atlasUV('blank',.5,.5)),2));g.setIndex(indices.flat());g.computeVertexNormals();if(uv)g.userData.atlas=true;return g;}
export function grid(cols,rows,point,uv=null,reverse=false){
 const p=[],coords=[],index=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows;p.push(point(u,v));coords.push(uv?uv(u,v,p.at(-1)):atlasUV('blank',.5,.5));if(i&&j){const a=(j-1)*(cols+1)+i-1,b=a+1,c=a+cols+1,d=c+1;index.push(reverse?[a,c,b,b,c,d]:[a,b,c,b,d,c]);}}
 return patch(p,index,coords);
}
export function mesh(parent,geometry,material,name=''){const m=new T.Mesh(geometry,material);m.name=name;parent.add(m);return m;}
export function block(parent,x,y,z,w,h,d,material,name=''){const m=mesh(parent,primitive('box',()=>new T.BoxGeometry()),material,name);m.position.set(x,y,z);m.scale.set(w,h,d);return m;}
export function tube(parent,points,radius,material,name='',segments=0){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
 return mesh(parent,new T.TubeGeometry(curve,segments||Math.max(2,points.length-1),radius,6,false),material,name);
}
export function roundedShape(width,height,radius=.06){const x=-width/2,y=-height/2,r=Math.min(radius,width/2,height/2),s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
export function panel(parent,x,y,z,w,h,d,material,r=.04,name=''){const key=`panel:${w}:${h}:${d}:${r}`;const geo=primitive(key,()=>{const g=new T.ExtrudeGeometry(roundedShape(w,h,r),{depth:d,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1,steps:1,curveSegments:3});g.translate(0,0,-d/2);return g;});const m=mesh(parent,geo,material,name);m.position.set(x,y,z);return m;}
const lamps=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});lamps.name='Lamp colours';
export function mergeStatic(root,paint,deform=null){
 root.updateMatrixWorld(true);const groups=new Map(),owned=new Set();
 root.traverse(o=>{
  if(!o.isMesh)return;const flat=o.material.isMeshBasicMaterial&&!o.material.map&&!o.material.transparent,mat=flat?lamps:o.material;
  if(!groups.has(mat))groups.set(mat,[]);groups.get(mat).push({g:o.geometry,m:o.matrixWorld.clone(),color:flat?o.material.color:null});
  if(![...primitives.values()].includes(o.geometry))owned.add(o.geometry);
 });
 root.clear();
 for(const [material,items] of groups){
  const ps=[],ns=[],uv=[],colors=[],useColors=items.some(p=>p.color);
  for(const item of items){
   let geo=item.g.clone();geo.applyMatrix4(item.m);
   if(deform){const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,...deform(p.getX(i),p.getY(i),p.getZ(i)));geo.computeVertexNormals();}
   const indexed=geo;if(geo.index)geo=geo.toNonIndexed();
   ps.push(...geo.attributes.position.array);ns.push(...geo.attributes.normal.array);
   const coords=geo.attributes.uv,blank=atlasUV('blank',.5,.5);
   for(let i=0;i<geo.attributes.position.count;i++){
    if(material===paint&&!item.g.userData.atlas)uv.push(...blank);else uv.push(coords?.getX(i)??0,coords?.getY(i)??0);
    if(useColors)colors.push(item.color?.r??1,item.color?.g??1,item.color?.b??1);
   }
   geo.dispose();if(geo!==indexed)indexed.dispose();
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(ps,3));geo.setAttribute('normal',new T.Float32BufferAttribute(ns,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(useColors)geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingBox();geo.computeBoundingSphere();mesh(root,geo,material,material===paint?'Chassis':material.name);
 }
 for(const geo of owned)geo.dispose();return root;
}
