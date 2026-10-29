import * as T from './vendor/three.module.min.js';

function typed(value,Type){return value instanceof Type?value:new Type(Uint8Array.from(atob(value),c=>c.charCodeAt(0)).buffer);}
const clamp=T.MathUtils.clamp;

// One opaque scalp and continuous wavy locks, all baked into the existing hair draw.
// No alpha cards, per-strand objects or extra frame-time simulation.
export function adaptOculaireHair(source){
 const p=[],normals=[],colors=[],indices=[];const symmetry=-source.META.center[0];
 const color=new T.Color(),tmp=new T.Vector3();let strands=0;
 const azimuths=96,latitudes=64,envelope=new Float32Array(azimuths*latitudes),scalpCenter=new T.Vector3(symmetry,.10,-.10);
 const skin=source.SURFACES.find(s=>s.group==='body'&&s.finish==='skin'),skinPoints=typed(skin.p,Int16Array);
 for(let i=0;i<skinPoints.length;i+=3){
  tmp.set(skinPoints[i]/8192,skinPoints[i+1]/8192,skinPoints[i+2]/8192).sub(scalpCenter);const radius=tmp.length();
  const a=Math.floor((Math.atan2(tmp.x,tmp.z)+Math.PI)/(Math.PI*2)*azimuths)%azimuths,b=clamp(Math.floor(Math.acos(clamp(tmp.y/radius,-1,1))/Math.PI*latitudes),0,latitudes-1);
  envelope[b*azimuths+a]=Math.max(envelope[b*azimuths+a],radius);
 }
 function fitScalp(v,margin=.045){
  const direction=v.clone().sub(scalpCenter),radius=direction.length(),a=Math.floor((Math.atan2(direction.x,direction.z)+Math.PI)/(Math.PI*2)*azimuths),b=Math.floor(Math.acos(clamp(direction.y/radius,-1,1))/Math.PI*latitudes);let skinRadius=0;
  for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const row=clamp(b+y,0,latitudes-1),col=(a+x+azimuths)%azimuths;skinRadius=Math.max(skinRadius,envelope[row*azimuths+col]);}
  return v.copy(scalpCenter).addScaledVector(direction.normalize(),Math.max(radius,skinRadius+margin));
 }
 function vertex(position,normal,pigment){p.push(...position);normals.push(...normal);color.set(pigment);colors.push(color.r,color.g,color.b);return p.length/3-1;}
 function quad(a,b,c,d){indices.push(a,b,c,a,c,d);}
 function palette(phi,t,fiber=0){
  const front=Math.cos(phi),side=Math.sin(phi),band=Math.sin(phi*17+t*4.6+Math.sin(t*8)*.5);
  const black=side<0?'#050714':'#100511';
  const accent=side<-.1?(band>.2?'#00bbdf':'#263ad9'):side>.1?(band>.2?'#d11869':'#ec263d'):'#6530b6';
  const strength=fiber?(.32+.27*Math.sin(t*Math.PI)):(.10+.19*Math.max(0,band))*(.5+.5*Math.sin(t*Math.PI));
  const base=new T.Color(black),glint=new T.Color(accent);base.lerp(glint,strength);return base;
 }
 const capRings=20,capSides=128,cap=[];
 function capPoint(phi,t){
  const front=(Math.cos(phi)+1)/2,edge=2.55-front*1.20,theta=.012+(edge-.012)*t;
  return fitScalp(new T.Vector3(symmetry+.84*Math.sin(theta)*Math.sin(phi),.10+1.24*Math.cos(theta),-.10+1.10*Math.sin(theta)*Math.cos(phi)));
 }
 for(let ring=0;ring<=capRings;ring++){
  const row=[];
  for(let i=0;i<=capSides;i++){
   const phi=i/capSides*Math.PI*2,t=ring/capRings,v=capPoint(phi,t);
   const n=new T.Vector3((v.x-symmetry)/(.88*.88),(v.y-.11)/(1.34*1.34),(v.z+.10)/(1.28*1.28)).normalize();
   row.push(vertex(v.toArray(),n.toArray(),palette(phi,t*.6).multiplyScalar(.86+.14*(.5+.5*Math.sin(phi*47+t*9)))));
  }cap.push(row);
 }
 for(let j=0;j<capRings;j++)for(let i=0;i<capSides;i++)quad(cap[j][i],cap[j+1][i],cap[j+1][i+1],cap[j][i+1]);
 // Close the crown so skin can never show through a ring of sparse cards.
 const pole=vertex(fitScalp(new T.Vector3(symmetry,1.34,-.10)).toArray(),[0,1,0],'#080714');for(let i=0;i<capSides;i++)indices.push(pole,cap[0][i],cap[0][i+1]);
 function ribbon(point,width,pigment,segments=28,cross=4){
  const rows=[];
  for(let j=0;j<=segments;j++){
   const t=j/segments,center=point(t),a=point(Math.max(0,t-.003)),b=point(Math.min(1,t+.003)),tangent=b.sub(a).normalize();
   // Cross the flow with an outward normal to form a curved lock, not a flat card.
   const outward=new T.Vector3(center.x-symmetry,.18,center.z+.1).normalize();
   const across=new T.Vector3().crossVectors(tangent,outward).normalize();
   const normal=new T.Vector3().crossVectors(across,tangent).normalize();if(normal.dot(outward)<0)normal.negate();
   const row=[],w=width(t);
   for(let k=0;k<=cross;k++){
    const u=k/cross*2-1,bulge=Math.sqrt(Math.max(0,1-u*u))*w*.27;
    const v=center.clone().addScaledVector(across,u*w).addScaledVector(normal,bulge);
    const n=normal.clone().addScaledVector(across,u*.42).normalize();
    row.push(vertex(v.toArray(),n.toArray(),pigment(t,u)));
   }rows.push(row);
  }
  for(let j=0;j<segments;j++)for(let k=0;k<cross;k++)quad(rows[j][k],rows[j+1][k],rows[j+1][k+1],rows[j][k+1]);
  strands++;
 }
 // Long paired locks frame the face while remaining outside the outer eyes.
 const longLocks=23;
 for(const side of[-1,1])for(let i=0;i<longLocks;i++){
  const phi=side*(1.08+i/(longLocks-1)*(Math.PI-1.08)),phase=i*.63;
  function point(t){
   const top=Math.min(1,t/.49),theta=.35+top*1.23;
   const fitted=fitScalp(new T.Vector3(symmetry+.88*Math.sin(theta)*Math.sin(phi),.10+1.24*Math.cos(theta),-.10+1.16*Math.sin(theta)*Math.cos(phi)),.055);
   const x=fitted.x-symmetry,z=fitted.z;
   const fall=Math.max(0,(t-.49)/.51),wave=Math.sin(fall*Math.PI*2.1+phase)*fall;
   const flare=1+Math.sin(fall*Math.PI)*.13;
   return new T.Vector3(symmetry+x*flare+side*wave*.065,fitted.y-fall*(1.52+Math.sin(i*.8)*.055),z+wave*.08);
  }
  ribbon(point,t=>.070*(.85+Math.sin(t*Math.PI)*.6)*(1-.72*Math.pow(t,8)),(t,u)=>{
   const c=palette(phi,t);return c.multiplyScalar((.74+.26*Math.sqrt(Math.max(0,1-u*u)))*(.84+.16*(.5+.5*Math.sin(u*19+t*.6))));
  });
  // Fine continuous highlights follow the same wave and never expose the scalp.
  for(let stripe=0;stripe<2;stripe++){
   const pointFiber=t=>{const v=point(t);v.x+=side*(stripe?-.019:.019);v.z+=Math.cos(phi)*.027;return v;};
   ribbon(pointFiber,t=>.0018+.0013*Math.sin(t*Math.PI),(t)=>palette(phi+stripe*.08,t,true),28,1);
  }
 }
 // Soft curtain fringe: a symmetrical sweep, with a clear gap above all five eyes.
 for(const side of[-1,1])for(let i=0;i<10;i++){
  const q=i/9;
  const curve=new T.CubicBezierCurve3(
   new T.Vector3(symmetry+side*(.025+q*.025),1.30-q*.025,.23+q*.07),
   new T.Vector3(symmetry+side*(.13+q*.24),1.24,.81+q*.09),
   new T.Vector3(symmetry+side*(.44+q*.20),.62,1.20-q*.08),
   new T.Vector3(symmetry+side*(.35+q*.38),.20-q*.035,1.15-q*.14));
  ribbon(t=>fitScalp(curve.getPoint(t),.065),t=>(.035+q*.025)*(1-.65*Math.pow(t,7)),(t,u)=>palette(side*(.35+q*.55),t).multiplyScalar(.8+.2*(1-u*u)),26,4);
 }
 const hairPositions=new Float32Array(p),hairNormals=new Float32Array(normals),hairColors=new Float32Array(colors);
 // Normalize winding once. Double-sided rendering still preserves the original finish.
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];const v0=new T.Vector3().fromArray(p,a*3),v1=new T.Vector3().fromArray(p,b*3),v2=new T.Vector3().fromArray(p,c*3);
  const n=new T.Vector3().fromArray(normals,a*3);if(v1.sub(v0).cross(v2.sub(v0)).dot(n)<0)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 }
 const min=new T.Vector3(Infinity,Infinity,Infinity),max=new T.Vector3(-Infinity,-Infinity,-Infinity);
 const decoded=source.SURFACES.filter(s=>!(s.group==='body'&&s.finish==='hair')).map(s=>({...s,p:typed(s.p,Int16Array)}));
 for(const s of decoded)for(let i=0;i<s.p.length;i+=3){tmp.set(s.p[i]/8192,s.p[i+1]/8192,s.p[i+2]/8192);min.min(tmp);max.max(tmp);}
 for(let i=0;i<hairPositions.length;i+=3){tmp.fromArray(hairPositions,i);min.min(tmp);max.max(tmp);}
 const center=min.clone().add(max).multiplyScalar(.5),height=max.y-min.y;
 const hair={group:'body',finish:'hair',p:new Int16Array(hairPositions.length),n:Int8Array.from(hairNormals,x=>Math.round(clamp(x,-1,1)*127)),c:Uint8Array.from(hairColors,x=>Math.round(clamp(x,0,1)*255)),i:new Uint16Array(indices)};
 for(let i=0;i<hair.p.length;i+=3)for(let axis=0;axis<3;axis++)hair.p[i+axis]=Math.round((hairPositions[i+axis]-center.getComponent(axis))*8192);
 const surfaces=decoded.map(s=>{
  const p=new Int16Array(s.p.length);for(let i=0;i<p.length;i+=3)for(let axis=0;axis<3;axis++)p[i+axis]=s.p[i+axis]-Math.round(center.getComponent(axis)*8192);
  return {...s,p};
 });surfaces.push(hair);
 const removed=source.SURFACES.find(s=>s.group==='body'&&s.finish==='hair');
 const triangles=source.META.triangles-typed(removed.i,Uint16Array).length/3+indices.length/3;
 const vertices=source.META.vertices-typed(removed.p,Int16Array).length/3+hair.p.length/3;
 return {SURFACES:surfaces,META:{...source.META,height,center:source.META.center.map((v,i)=>v+center.getComponent(i)),eyes:source.META.eyes.map(p=>p.map((v,i)=>v-center.getComponent(i))),mouths:source.META.mouths.map(p=>p.map((v,i)=>v-center.getComponent(i))),triangles,vertices,hair:{locks:strands,triangles:indices.length/3,opaque:true}}};
}
