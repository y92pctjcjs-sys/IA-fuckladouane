import * as T from './vendor/three.module.min.js';
import {LENGTH} from './track.js?v=fld-route-003';
import {victorySample} from './victory-drive.js?v=oculaire-victory-006';
export function createVictoryRoad(scene){
 const root=new T.Group();root.name='VICTOIRE / ROUTE VERS L’HORIZON';root.visible=false;scene.add(root);
 const positions=[],colors=[],color=new T.Color();
 function quad(start,end,left,right,height,pigment){
  color.set(pigment);const points=[[start,left],[start,right],[end,left],[end,left],[start,right],[end,right]];
  for(const [s,x]of points){const p=victorySample(s,x);positions.push(p.x,p.y+height,p.z);colors.push(color.r,color.g,color.b);}
 }
 for(let s=LENGTH+320;s<LENGTH+4320;s+=40){
  quad(s,s+40,-160,160,-.24,'#171624');quad(s,s+40,-8.1,8.1,0,'#272332');
  for(const side of[-1,1])quad(s,s+40,side*7.8-.09,side*7.8+.09,.025,'#c7b5d1');
 }
 for(let s=LENGTH+324;s<LENGTH+4320;s+=12)for(const x of[-2.65,2.65])quad(s,s+4,x-.07,x+.07,.035,'#a8a7ad');
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),mesh=new T.Mesh(geometry,material);root.add(mesh);
 return {root,setVisible(value){root.visible=Boolean(value);},dispose(){geometry.dispose();material.dispose();root.removeFromParent();}};
}
