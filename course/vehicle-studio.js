import * as T from './vendor/three.module.min.js';
// A local reflection studio: broad softboxes make the body curvature legible.
// Captured once into a small PMREM; no reflection camera runs during animation.
export function studioEnvironment(renderer){
 const scene=new T.Scene();scene.background=new T.Color('#11131b');const owned=[];
 function softbox(w,h,x,y,z,rx,ry,color){const geometry=new T.PlaneGeometry(w,h),material=new T.MeshBasicMaterial({color,side:T.DoubleSide}),p=new T.Mesh(geometry,material);p.position.set(x,y,z);p.rotation.set(rx,ry,0);scene.add(p);owned.push(geometry,material);}
 softbox(5.5,1.9,0,4,0,Math.PI/2,0,new T.Color(2.2,2.3,2.6));
 softbox(1.2,4.5,-4,1,-1,0,Math.PI/2,new T.Color(1.0,1.05,1.5));
 softbox(1.0,4.0,4,1.4,1,0,-Math.PI/2,new T.Color(.7,.85,1.1));
 softbox(6,1.3,0,1.8,-5,0,0,new T.Color(1.3,1.15,1.45));
 const generator=new T.PMREMGenerator(renderer),target=generator.fromScene(scene,.06,.1,20);generator.dispose();for(const item of owned)item.dispose();return target;
}
