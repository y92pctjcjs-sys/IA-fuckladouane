import * as T from './vendor/three.module.min.js';
import {sample} from './track.js?v=fld-route-003';
import {SHORTCUT,DEBRIS,shortcutSample,shortcutSamples} from './route-options.js?v=fld-route-003';
import {surface,asphaltMaterial} from './materials.js?v=fld-route-003';
import {forestTemplate} from './world-landscape.js?v=fld-route-003';
const box=new T.BoxGeometry(1,1,1),tyre=new T.TorusGeometry(.44,.16,6,16),hub=new T.CylinderGeometry(.29,.29,.08,12);
const materials={rubber:surface('#27292c',.96),metal:surface('#8b9090',.54,.3),paper:surface('#a89576',.96),tape:surface('#d0c3a1',.8),amber:new T.MeshBasicMaterial({color:'#ffb54c',toneMapped:false}),edge:surface('#9b9f91',.78),earth:surface('#30392e',1)};
function block(root,x,y,z,w,h,d,material){const mesh=new T.Mesh(box,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);root.add(mesh);return mesh;}
function bake(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map();root.traverse(o=>{if(o.isMesh){if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(o);}});
 for(const [material,meshes]of buckets){
  const positions=[],normals=[],uvs=[];
  for(const m of meshes){const g=m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)),a=g.index?g.toNonIndexed():g,p=a.attributes.position,n=a.attributes.normal,u=a.attributes.uv;
   for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(u?.getX(i)||0,u?.getY(i)||0);}if(a!==g)a.dispose();g.dispose();m.removeFromParent();
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();root.add(new T.Mesh(geometry,material));
 }
}
const debrisTemplates=new Map();
export function debrisModel(kind){
 if(debrisTemplates.has(kind))return debrisTemplates.get(kind).clone(true);
 const root=new T.Group();root.name='DÉBRIS / '+kind;root.userData.debris=true;
 if(kind==='tyres'){
  for(const [i,x]of [-.43,.45].entries()){
   const ring=new T.Mesh(tyre,materials.rubber);ring.rotation.x=Math.PI/2;ring.rotation.z=i*.2;ring.position.set(x,.20+i*.15,i?.23:-.23);root.add(ring);
   const rim=new T.Mesh(hub,materials.metal);rim.position.copy(ring.position);root.add(rim);
  }
  block(root,-.45,.37,-.24,.15,.035,.64,materials.tape);
 }else{
  for(const [x,z,w,h,d]of [[-.42,0,1.0,.62,1.3],[.51,.1,.72,.44,.84]]){block(root,x,h/2,z,w,h,d,materials.paper);block(root,x,h+.012,z,.12,.025,d+.01,materials.tape);}
  const flap=block(root,-.45,.62,-.45,1.0,.04,.45,materials.paper);flap.rotation.x=-.23;
 }
 // Small reflective tabs belong to the pile and stay inside its collision footprint.
 for(const x of[-.74,.74])block(root,x,.20,-.78,.16,.22,.045,materials.amber);
 bake(root);debrisTemplates.set(kind,root);return root.clone(true);
}
export function createDebrisScenery(scene){
 const list=DEBRIS.map(d=>{const g=debrisModel(d.kind),p=sample(d.s,d.x);g.position.set(p.x,p.y+.015,p.z);g.rotation.y=p.angle;g.userData.s=d.s;g.userData.id=d.id;scene.add(g);return g;});
 return {update(r){for(const g of list)g.visible=!r.branch&&g.userData.s>r.s-45&&g.userData.s<r.s+380;},dispose(){for(const g of list)g.removeFromParent();}};
}
export function createShortcutScenery(scene){
 const root=new T.Group();root.name='LISIÈRE 89 / CHAUSSÉE CONTINUE';root.userData.shortcut=true;scene.add(root);
 const owned=[];
 function strip(left,right,height,material){
  const positions=[],uvs=[],indices=[],count=Math.ceil(SHORTCUT.length/4),columns=right-left>10?Math.ceil((right-left)/6):1;
  for(let i=0;i<=count;i++)for(let col=0;col<=columns;col++){
   const d=i/count*SHORTCUT.length,lateral=left+(right-left)*col/columns,p=shortcutSample(d,lateral);positions.push(p.x,p.y+height,p.z);uvs.push((lateral-left)/3,d/3);
   if(i&&col){const a=(i-1)*(columns+1)+col-1,b=a+1,c=a+columns+1,e=c+1;indices.push(a,c,b,b,c,e);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();owned.push(g);const m=new T.Mesh(g,material);m.material.side=T.DoubleSide;root.add(m);return m;
 }
 strip(-34,34,-.17,materials.earth);
 const road=strip(-SHORTCUT.halfWidth,SHORTCUT.halfWidth,.018,asphaltMaterial());road.name='LISIÈRE / ASPHALTE';
 for(const side of[-1,1])strip(side*3.42,side*3.55,.035,materials.edge);
 const posts=new T.Group();root.add(posts);
 for(let d=52;d<SHORTCUT.length-52;d+=26)for(const side of[-1,1]){
  const p=shortcutSample(d,side*4.45),g=new T.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.angle;posts.add(g);
  block(g,0,.48,0,.12,.96,.14,materials.metal);block(g,0,.83,-.08,.14,.14,.03,materials.tape);
 }
 // Bake the posts into two draws; shared tree templates keep the same forest language.
 bake(posts);
 const template=forestTemplate('oak',false),trees=[];
 for(let d=90;d<SHORTCUT.length-70;d+=32)for(const side of[-1,1]){
  const p=shortcutSample(d,side*(13+(d%7)));let clear=true;
  for(let s=SHORTCUT.entry-120;s<SHORTCUT.exit+120;s+=16){const q=sample(s);if(Math.hypot(q.x-p.x,q.z-p.z)<17){clear=false;break;}}
  if(clear)trees.push(p);
 }
 const treeNear=template.geometry,treeFar=forestTemplate('oak',true).geometry;
 const forest=new T.InstancedMesh(template.geometry,template.material,trees.length),dummy=new T.Object3D();forest.userData.branchForest=true;
 for(const [i,p]of trees.entries()){dummy.position.set(p.x,p.y-.15,p.z);dummy.rotation.y=i*1.8;dummy.scale.setScalar(.9+(i%4)*.07);dummy.updateMatrix();forest.setMatrixAt(i,dummy.matrix);}forest.instanceMatrix.needsUpdate=true;forest.computeBoundingSphere();root.add(forest);
 const entrance=new T.Group();scene.add(entrance);const p=sample(SHORTCUT.entry-65,10.2);entrance.position.set(p.x,p.y,p.z);entrance.rotation.y=p.angle;
 block(entrance,0,.68,0,.14,1.36,.14,materials.metal);block(entrance,0,1.36,0,1.5,.55,.11,materials.earth);
 // Two modest acid strokes lead towards the opening, without a blocking prompt.
 const ink=new T.MeshBasicMaterial({color:'#d0ff50',toneMapped:false});
 for(const x of[-.3,.2]){const m=block(entrance,x,1.36,-.065,.13,.32,.025,ink);m.rotation.z=-.65;}
 bake(entrance);
 return {root,update(r,economy=false){forest.geometry=economy||!r.branch?treeFar:treeNear;root.visible=r.s>SHORTCUT.entry-420&&r.s<SHORTCUT.exit+230;entrance.visible=r.s>SHORTCUT.entry-350&&r.s<SHORTCUT.entry+100;},dispose(){forest.dispose();for(const g of owned)g.dispose();for(const group of[posts,entrance])group.traverse(o=>{if(o.geometry)o.geometry.dispose();});ink.dispose();root.removeFromParent();entrance.removeFromParent();}};
}
