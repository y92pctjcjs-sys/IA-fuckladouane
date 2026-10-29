import * as T from './vendor/three.module.min.js';
import {surface,industrialMaterial} from './materials.js?v=fld-route-003';
const box=new T.BoxGeometry(1,1,1),warm=new T.MeshBasicMaterial({color:'#d7c397',toneMapped:false});
const dark=surface('#19212a',.88),steel=industrialMaterial('steel'),concrete=industrialMaterial('concrete'),metal=surface('#69717a',.57,.46),rubber=surface('#191c21',.94),paint=surface('#4c5c5c',.6,.3);
function block(root,x,y,z,w,h,d,material){const mesh=new T.Mesh(box,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);root.add(mesh);return mesh;}
// One 80 m loading-yard prototype. Local origin is already 13 m from the road centre.
// Nearest solid point: 16.5 m from centre, outside road, guardrail and camera corridor.
export function industrialPrototype(parent,side){
 const root=new T.Group();root.name='PROTOTYPE / QUAI 01';parent.add(root);root.userData.designPrototype=true;
 const x=side*17;
 block(root,x,4.9,6,22,9.8,35,steel);
 block(root,x,.58,6,23,1.16,36,concrete);
 block(root,x,9.95,6,23,.3,36,metal);
 // A stepped office at one end breaks the long warehouse silhouette.
 block(root,x-side*6,2.4,-15,10,4.8,7,concrete);
 block(root,x-side*6,4.88,-15,10.8,.16,7.8,metal);
 for(let i=0;i<3;i++)block(root,x-side*6+(i-1)*2.6,3.1,-18.53,1.75,1.1,.025,i===1?warm:dark);
 // Two recessed dock wells, bump stops and service canopies rather than bright signage.
 for(const dz of[-4,10]){
  block(root,x-side*11.05,2.5,dz,.15,3.6,5.2,rubber);
  block(root,x-side*11.15,2.45,dz,.09,3.2,4.45,dark);
  for(let i=0;i<6;i++)block(root,x-side*11.21,1.22+i*.48,dz,.015,.025,4.43,metal);
  block(root,x-side*12.2,.45,dz,2.6,.9,5.5,concrete);
  block(root,x-side*12.2,.92,dz,2.6,.04,5.5,metal);
  block(root,x-side*11.7,4.4,dz,1.8,.14,6.2,paint);
  block(root,x-side*12.35,4.30,dz,.05,.04,5.7,warm);
  for(const k of[-1,1]){
   block(root,x-side*12.7,1.13,dz+k*2.1,.18,.42,.22,rubber);
   block(root,x-side*13.2,1.45,dz+k*3,.13,2.9,.13,metal);
  }
 }
 // Fence in a service yard; no decorative barrier crosses the driveable carriageway.
 for(const dz of[-25,28]){
  for(let i=0;i<8;i++)block(root,side*(7+i*1.2),1.6,dz,.065,3.2,.065,metal);
  for(const y of[.5,2.9])block(root,side*11.2,y,dz,8.7,.035,.045,metal);
 }
 for(const dz of[-2,12])block(root,x+side*2,10.55,dz,4,1.2,2.8,metal);
 return root;
}
