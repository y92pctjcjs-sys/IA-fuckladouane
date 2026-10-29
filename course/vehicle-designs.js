import * as T from './vendor/three.module.min.js';
import {surface,softTexture} from './materials.js?v=fld-route-003';
import {vehicleLivery,atlasUV} from './vehicle-livery.js?v=fld-route-003';
import {resolveSkin} from './vehicle-skins.js?v=fld-route-003';
import {primitive,patch,grid,mesh,block,tube,panel,mergeStatic} from './vehicle-mesh.js?v=fld-route-003';

// Metres, front +Z, axle X. Cosmetics stay within the existing collision footprint.
export const VEHICLE_DESIGNS=Object.freeze({fld:{id:'fld-89-nightrunner',name:'fld® / 89 GT',length:4.13,width:2.08,wheelbase:2.52},cop:{id:'douane-d89-interception',name:'DOUANE / D-89 GT',length:4.17,width:2.08,wheelbase:2.52}});
const templates=new Map(),materials=new Map(),wheelCache=new Map();
const wheelZ=[-1.25,1.27],wheelY=.365,archRadius=.411;
const basic=color=>new T.MeshBasicMaterial({color,toneMapped:false});
const M={rubber:surface('#0b0d12',.93,.02),dark:surface('#0c111a',.48,.30),seal:surface('#11151c',.62,.05),chrome:surface('#a8b2bf',.26,.90),blue:basic('#499dff'),red:basic('#ff2745'),white:basic('#e7efff'),amber:basic('#ffb657'),crack:basic('#9cabb3')};
for(const [key,mat]of Object.entries(M))mat.name=key;
function carbon(){
 if(materials.has('carbon'))return materials.get('carbon');
 const n=128,data=new Uint8Array(n*n*4),normal=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,a=Math.floor(x/8)%2,b=Math.floor(y/8)%2,f=a===b?14+(x%8)*2:17+(y%8)*2;data.set([f,f+1,f+7,255],i);normal.set([128+Math.sin(x*Math.PI/4)*5,128+Math.cos(y*Math.PI/4)*5,254,255],i);}
 const map=new T.DataTexture(data,n,n),bump=new T.DataTexture(normal,n,n);map.colorSpace=T.SRGBColorSpace;for(const t of[map,bump]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(6,6);t.needsUpdate=true;}
 const mat=new T.MeshPhysicalMaterial({map,normalMap:bump,normalScale:new T.Vector2(.11,.11),roughness:.43,metalness:.55,clearcoat:.7});mat.name='Carbon weave';materials.set('carbon',mat);return mat;
}
function finish(s){
 if(materials.has(s.id))return materials.get(s.id);
 const paint=vehicleLivery(s.kind==='cop',s.id),alloy=new T.MeshPhysicalMaterial({map:paint.map,metalness:.90,roughness:s.id==='wreck'?.49:.27,clearcoat:.45});alloy.name='Forged alloy / '+s.id;
 const glass=new T.MeshPhysicalMaterial({color:s.glass,metalness:.32,roughness:s.id==='wreck'?.27:.10,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.15});glass.name='Glass / '+s.id;
 const underglow=new T.MeshBasicMaterial({map:softTexture('glow'),color:s.accent,transparent:true,opacity:.16,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending});
 const f={paint,alloy,glass,accent:basic(s.accent),secondary:basic(s.secondary),carbon:carbon(),underglow};materials.set(s.id,f);return f;
}
const profiles={
 fld:[[-2.02,.83,.78,.82],[-1.72,.95,.87,.91],[-1.25,.98,.96,.91],[-.70,.92,.89,.89],[.40,.91,.86,.86],[1.27,.98,.90,.82],[1.73,.93,.79,.75],[2.02,.83,.69,.70]],
 cop:[[-2.04,.86,.94,.98],[-1.70,.95,.99,1.02],[-1.25,.98,1.02,1.0],[-.60,.93,.96,.99],[.50,.92,.97,.99],[1.27,.97,.97,.93],[1.77,.93,.86,.84],[2.04,.85,.80,.81]]
};
function cubic(a,b,c,d,t){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
function section(police,z){
 const rows=profiles[police?'cop':'fld'];let i=0;while(i<rows.length-2&&z>rows[i+1][0])i++;const b=rows[i],c=rows[i+1],t=T.MathUtils.clamp((z-b[0])/(c[0]-b[0]),0,1);return[1,2,3].map(j=>cubic(rows[Math.max(0,i-1)][j],b[j],c[j],rows[Math.min(rows.length-1,i+2)][j],t));
}
function topY(police,z,x){const[w,h,c]=section(police,z),a=Math.min(1,Math.abs(x)/w);return T.MathUtils.lerp(c,h,a*a)+.018*Math.sin(Math.PI*a);}
function sidePoint(police,side,z,t){
 const[w,h]=section(police,z);let bottom=.27;for(const wz of wheelZ){const d=z-wz;if(Math.abs(d)<archRadius)bottom=Math.max(bottom,wheelY+Math.sqrt(archRadius**2-d*d));}
 return[side*(w-.065*(1-t)+.022*Math.sin(Math.PI*t)-.024*Math.exp(-Math.pow((t-.46)/.19,2))),T.MathUtils.lerp(bottom,h,t),z];
}
function body(root,police,f){
 const rear=police?-2.04:-2.02,front=-rear;
 for(const [a,b,count]of[[rear,.83,43],[.83,1.88,28],[1.88,front,5]]){
  const hood=a===.83;
  mesh(root,grid(20,count,(u,v)=>{const z=T.MathUtils.lerp(a,b,v),w=section(police,z)[0],x=(u*2-1)*w;return[x,topY(police,z,x),z];},(u,v,p)=>hood?atlasUV('hood',.5+p[0]/1.8,1-v):atlasUV('blank',.5,.5),true),f.paint,'Sculpted bonnet / shoulders');
 }
 for(const side of[-1,1]){
  mesh(root,grid(100,9,(u,v)=>sidePoint(police,side,T.MathUtils.lerp(rear,front,u),v),(u,v,p)=>atlasUV('side',side>0?1-u:u,(p[1]-.27)/.75),side>0),f.paint,'Integrated side wrap');
  for(const wz of wheelZ){
   mesh(root,grid(32,4,(u,v)=>{const a=u*Math.PI,r=archRadius+.037*v,z=wz+Math.cos(a)*r,y=wheelY+Math.sin(a)*r;return[side*(section(police,z)[0]+.012+.018*Math.sin(Math.PI*v)),y,z];},null,side<0),f.paint,'Rolled wheel arch');
   tube(root,Array.from({length:17},(_,i)=>{const a=i/16*Math.PI,z=wz+Math.cos(a)*archRadius;return[side*(section(police,z)[0]+.012),wheelY+Math.sin(a)*archRadius,z];}),.007,M.dark);
  }
  const skirt=panel(root,side*.965,.29,0,1.48,.105,.08,f.carbon,.025);skirt.rotation.y=side*Math.PI/2;
  const accent=block(root,side*1.008,.30,0,.012,.016,1.35,f.accent);accent.rotation.y=-side*.015;
  const seam=[[-.66,.86],[-.69,.72],[-.65,.38],[-.47,.34],[.49,.36],[.64,.47],[.65,.82]];
  tube(root,seam.map(([z,y])=>{const[w,h]=section(police,z);return[side*(w-.008),police?y+.09:y,z];}),.0038,M.dark,'Door shutline');
  const handle=panel(root,side*.935,police?.88:.78,-.38,.15,.023,.013,M.chrome,.009);handle.rotation.y=side*Math.PI/2;
 }
 // Properly closed curved end caps, with actual holes for the front air intakes.
 for(const isFront of[false,true]){
  const z=isFront?front:rear,w=section(police,z)[0],xs=[...new Set([-w,-.81,-.60,-.49,0,.49,.60,.81,w].map(x=>T.MathUtils.clamp(x,-w,w)))].sort((a,b)=>a-b),ys=[.27,.38,.40,.57,.60,.65],p=[],idx=[];
  for(let i=1;i<xs.length;i++)for(let j=0;j<ys.length;j++){
   const x0=xs[i-1],x1=xs[i],y0=ys[j],yL=j===ys.length-1?topY(police,z,x0):ys[j+1],yR=j===ys.length-1?topY(police,z,x1):ys[j+1],cx=(x0+x1)/2,cy=(y0+Math.min(yL,yR))/2;
   if(isFront&&(Math.abs(cx)<.49&&cy>.40&&cy<.60||Math.abs(cx)>.60&&Math.abs(cx)<.81&&cy>.38&&cy<.57))continue;
   const a=p.length;p.push([x0,y0,z],[x1,y0,z],[x1,yR,z],[x0,yL,z]);idx.push(isFront?[a,a+1,a+2,a,a+2,a+3]:[a,a+2,a+1,a,a+3,a+2]);
  }
  mesh(root,patch(p,idx),f.paint,'Closed curved end');
 }
 block(root,0,.245,0,1.54,.05,3.9,M.dark);
}
function mapped(root,points,region,material,reverse=false){const uv=[[0,0],[1,0],[1,1],[0,1]].map(p=>atlasUV(region,...p));return mesh(root,patch(points,reverse?[[0,2,1],[0,3,2]]:[[0,1,2],[0,2,3]],uv),material,region);}
function cockpit(root,police,tall,s,f){
 const top=police?(tall?1.56:1.30):1.28,base=police?.99:.885,back=police?(tall?-1.86:-.89):-1.05,rr=police?(tall?-1.50:-.39):-.43,rf=police?.37:.27,front=police?1.00:.92,rw=police?.71:.665,bw=police?.805:.78;
 mesh(root,grid(18,16,(u,v)=>{const x=(u*2-1)*rw,z=T.MathUtils.lerp(rr,rf,v);return[x,top+.035*Math.sin(u*Math.PI)*Math.sin(v*Math.PI),z];},(u,v)=>atlasUV('roof',u,1-v),true),f.paint,'Domed roof');
 const wind=(u,v,rear=false)=>{const x=T.MathUtils.lerp(bw,rw,v)*(u*2-1),z=T.MathUtils.lerp(rear?back:front,rear?rr:rf,v)+(rear?-.025:.025)*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);return[x,T.MathUtils.lerp(base,top-.013,v)+.015*Math.sin(u*Math.PI)*Math.sin(v*Math.PI),z];};
 for(const rear of[false,true]){
  mesh(root,grid(18,12,(u,v)=>wind(u,v,rear),null,rear),f.glass,rear?'Curved rear glass':'Curved windscreen');
  for(const v of[0,1])tube(root,Array.from({length:12},(_,i)=>wind(i/11,v,rear)),.012,M.seal);
 }
 for(const side of[-1,1]){
  const p=(u,v)=>[side*T.MathUtils.lerp(bw,rw,v)+side*.012*Math.sin(u*Math.PI)*Math.sin(v*Math.PI),T.MathUtils.lerp(base,top-.013,v),T.MathUtils.lerp(T.MathUtils.lerp(back,front,u),T.MathUtils.lerp(rr,rf,u),v)];
  mesh(root,grid(18,10,p,null,side>0),f.glass,'Convex side glass');
  for(const u of[0,1])tube(root,Array.from({length:10},(_,i)=>p(u,i/9)),.020,f.paint,'Painted A/C pillar');
  for(const v of[0,1])tube(root,Array.from({length:12},(_,i)=>p(i/11,v)),.011,M.seal);
  for(const z of(police&&tall?[-.74,.01]:[-.06])){
   const u=(z-back)/(front-back);tube(root,Array.from({length:8},(_,i)=>p(u,i/7)),.018,M.dark,'Flush B pillar');
  }
  block(root,side*.87,base+.09,.64,.15,.027,.05,M.dark);
  if(!(s.id==='wreck'&&side>0)){
   const mirror=panel(root,side*.970,base+.11,.63,.12,.075,.09,f.carbon,.028);mirror.rotation.y=side*.08;
   block(root,side*.977,base+.11,.576,.10,.043,.005,M.chrome);
  }
 }
 // Windscreen sun strip uses the same branded atlas, on the actual curved surface.
 mesh(root,grid(18,3,(u,v)=>{const p=wind(u,.84+v*.155);p[2]+=.003;return p;},(u,v)=>atlasUV('banner',u,v)),f.paint,'Windscreen signature');
 for(const side of[-1,1])tube(root,[[side*.14,base+.022,front+.022],[side*.50,base+.027,front+.025]],.006,M.dark,'Wiper');
 if(!police)for(let i=0;i<7;i++){
  const v=.12+i*.10,p=wind(.5,v,true),l=block(root,0,p[1]+.012,p[2]-.008,1.40-v*.17,.019,.038,f.carbon);l.rotation.x=-.47;
 }
 if(s.id==='wreck'){
  const centre=[.31,.39],onGlass=(u,v)=>{const p=wind(T.MathUtils.clamp(u,.02,.98),T.MathUtils.clamp(v,.02,.81));p[2]+=.005;return p;};
  for(let ray=0;ray<9;ray++){
   const a=ray*Math.PI*2/9,points=[];for(let j=0;j<6;j++){const r=j*.063,bend=Math.sin(ray*4+j*3)*.013;points.push(onGlass(centre[0]+Math.cos(a)*r+Math.sin(a)*bend,centre[1]+Math.sin(a)*r+Math.cos(a)*bend));}
   tube(root,points,.00125,M.crack,'Branched glass fracture');
   const u=centre[0]+Math.cos(a)*.16,v=centre[1]+Math.sin(a)*.16;tube(root,[onGlass(u,v),onGlass(u+Math.cos(a+.8)*.07,v+Math.sin(a+.8)*.07),onGlass(u+Math.cos(a+.8)*.12,v+Math.sin(a+.8)*.12)],.0009,M.crack);
  }
  for(const radius of[.065,.14]){const p=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI*2,r=radius*(1+.10*Math.sin(i*7));p.push(onGlass(centre[0]+Math.cos(a)*r,centre[1]+Math.sin(a)*r));}tube(root,p,.0009,M.crack,'Impact fracture ring');}
 }
 return top;
}
function intake(root,z,x,y,w,h,f){
 const inset=.027,d=.074,p=[[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[x-w/2+inset,y-h/2+inset,z-d],[x+w/2-inset,y-h/2+inset,z-d],[x+w/2-inset,y+h/2-inset,z-d],[x-w/2+inset,y+h/2-inset,z-d]];
 mesh(root,patch(p,[[0,1,5,0,5,4],[1,2,6,1,6,5],[2,3,7,2,7,6],[3,0,4,3,4,7],[4,5,6,4,6,7]]),f.carbon,'Recessed intake');
 for(let i=0;i<4;i++)block(root,x,y-h*.34+i*h*.22,z-d+.012,w-.045,.008,.018,M.dark);
}
function fascia(root,police,s,f){
 const front=police?2.04:2.02,rear=-front,fy=police?.750:.643;
 intake(root,front+.001,0,.50,.98,.20,f);for(const side of[-1,1])intake(root,front+.001,side*.705,.475,.21,.19,f);
 panel(root,0,.294,front-.003,1.86,.056,.07,f.carbon,.025,'Front splitter');
 for(const side of[-1,1]){
  const broken=s.id==='wreck'&&side<0;
  panel(root,side*.60,fy,front-.008,.48,.105,.036,M.dark,.023,'Lens housing');
  for(let i=0;i<3;i++){
   const m=panel(root,side*(.44+i*.105),fy+.005,front+.018,.066,.036,.008,broken&&i!==1?M.seal:s.id==='infernal'?M.amber:M.white,.008,'Projector');
   if(broken&&i===1)m.rotation.z=.25;
  }
  const led=panel(root,side*.60,fy-.057,front+.018,.43,.012,.008,s.id==='infernal'?f.secondary:s.kind==='fld'?f.secondary:M.white,.005,'LED blade');led.rotation.z=-side*.055;
  block(root,side*.831,.36,front+.022,.035,.025,.008,M.amber);
  panel(root,side*.57,.656,rear-.012,.60,.105,.032,M.dark,.023,'Tail housing');
  for(let j=0;j<3;j++)block(root,side*(.37+j*.17),.668,rear-.034,.14,.022,.008,M.red);
  const exhaust=mesh(root,primitive('exhaust',()=>new T.CylinderGeometry(.059,.063,.12,16,1,true)),M.chrome);exhaust.rotation.x=Math.PI/2;exhaust.position.set(side*.63,.267,rear+.025);
  const hole=mesh(root,primitive('exhaust-hole',()=>new T.CircleGeometry(.051,16)),M.dark);hole.rotation.y=Math.PI;hole.position.set(side*.63,.267,rear-.037);
 }
 const tail=panel(root,0,.760,rear-.007,1.61,.015,.012,s.id==='seraph'?f.accent:police?M.red:f.secondary,.006,'Tail signature');
 panel(root,0,.312,rear+.005,1.84,.075,.08,f.carbon,.032,'Rear bumper');
 for(let i=-2;i<=2;i++){const fin=block(root,i*.21,.265,rear+.055,.014,.115,.13,f.carbon);fin.rotation.x=-.14;}
 panel(root,0,.458,rear-.018,.85,.153,.015,M.dark,.015,'Plate surround');
 mapped(root,[[.412,.390,rear-.037],[-.412,.390,rear-.037],[-.412,.526,rear-.037],[.412,.526,rear-.037]],'plate',f.paint);
 mesh(root,grid(16,3,(u,v)=>{const x=.60-u*1.20,top=topY(police,rear,x)-.009;return[x,top-.125+.125*v,rear-.003];},(u,v)=>atlasUV('rear',u,v)),f.paint,'Integrated rear signature');
 mapped(root,[[-.13,.628,front+.013],[.13,.628,front+.013],[.13,.687,front+.013],[-.13,.687,front+.013]],'front',f.paint);
 for(const side of[-1,1])for(let i=0;i<4;i++){
  const z=1.19+i*.095,x=side*.72,y=topY(police,z,x)+.004;
  const vent=panel(root,x,y,z,.17,.022,.045,f.carbon,.009,'Bonnet extraction');vent.rotation.x=-Math.PI/2;
 }
 if(police){
  for(const side of[-1,1]){block(root,side*.78,.46,front+.020,.032,.235,.035,M.dark);}
  block(root,0,.394,front+.024,1.60,.035,.032,M.dark);
  for(const side of[-1,1])for(let i=0;i<5;i++){
   const x=side*(.18+i*.13),y=.87,p=[[x-.04,y,rear-.008],[x+.02,y,rear-.008],[x+.10,y+.105,rear-.008],[x+.04,y+.105,rear-.008]];mesh(root,patch(p,side>0?[[0,2,1],[0,3,2]]:[[0,1,2],[0,2,3]]),i%2?M.red:f.accent);
  }
 }
}
function tapered(root,points,radius,material,name){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=curve.computeFrenetFrames(12,false),p=[],idx=[];
 for(let j=0;j<=12;j++){const centre=curve.getPointAt(j/12),r=radius*(1-j/12)+.002;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,pt=centre.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);p.push(pt.toArray());if(j){const n=(j-1)*8+i,k=(i+1)%8;idx.push([n,(j-1)*8+k,j*8+i],[(j-1)*8+k,j*8+k,j*8+i]);}}
 }
 mesh(root,patch(p,idx),material,name);
}
function aero(root,police,tall,roof,s,f){
 if(!police){
  mesh(root,grid(18,5,(u,v)=>{const x=(u*2-1)*.96,z=-1.69-v*.29+.08*Math.abs(u*2-1);return[x,1.04+.026*Math.sin(v*Math.PI)+.032*Math.abs(u*2-1),z];}),f.carbon,'Sculpted wing');
  for(const side of[-1,1]){
   const bracket=panel(root,side*.55,.96,-1.78,.10,.20,.035,f.carbon,.018);bracket.rotation.y=Math.PI/2;
   const plate=mesh(root,patch([[side*.97,1.0,-1.95],[side*.97,1.13,-1.95],[side*.97,1.12,-1.64],[side*.97,1.02,-1.68]],side>0?[[0,1,2],[0,2,3]]:[[0,2,1],[0,3,2]]),f.paint,'Wing endplate');
   tube(root,[[side*.974,1.10,-1.93],[side*.974,1.09,-1.70]],.006,f.accent);
  }
 }
 if(police){
  panel(root,0,roof+.058,-.31,1.19,.047,.23,M.dark,.028,'Lightbar foundation');
  tube(root,[[.48,roof,-.88],[.49,roof+.13,-.90],[.51,roof+(tall?.49:.19),-.96]],.008,M.dark,'Antenna');
  if(tall)for(const side of[-1,1])tube(root,[[side*.63,roof+.04,-1.35],[side*.64,roof+.07,-.8],[side*.64,roof+.04,.14]],.014,M.chrome,'Roof rail');
 }
 if(s.id==='seraph'){
  for(const side of[-1,1])for(let i=0;i<4;i++){
   const x0=side*.30,x1=side*(.83+i*.045),z=-1.09-i*.19,y=1.08+i*.025;
   const p=[[x0,y,z+.12],[x1,y+.11,z-.04],[x1,y+.08,z-.16],[x0,y-.014,z+.01]];
   const top=side>0?[[0,1,2],[0,2,3]]:[[0,2,1],[0,3,2]],q=[...p,...p.map(([x,y,z])=>[x,y-.014,z])],indices=[...top,...top.map(t=>t.map(v=>v+4).reverse())];
   for(let j=0;j<4;j++){const k=(j+1)%4;indices.push([j,k,k+4],[j,k+4,j+4]);}
   mesh(root,patch(q,indices),f.alloy,'Seraph feather aero');tube(root,[[x0,y+.005,z+.12],[x1,y+.113,z-.04]],.005,f.accent);
  }
  const halo=mesh(root,new T.TorusGeometry(.34,.010,6,64),f.accent,'Seraph halo');halo.rotation.x=Math.PI/2;halo.position.set(0,1.49,-1.13);
  for(const side of[-1,1])tube(root,[[side*.15,1.20,-1.12],[side*.18,1.45,-1.13]],.006,M.chrome,'Halo support');
 }
 if(s.id==='infernal'){
  for(const side of[-1,1]){
   tapered(root,[[side*.43,roof+.015,-.12],[side*.51,roof+.16,-.34],[side*.58,roof+.31,-.63],[side*.63,roof+.36,-.90]],.07,f.alloy,'Infernal horn');
   for(let i=0;i<3;i++){const x=side*(.15+i*.17),p=[[x-.035,.60,2.047],[x+.035,.60,2.047],[x,.43,2.047]];mesh(root,patch(p,[[0,1,2]]),f.alloy,'Grille fang');}
  }
 }
 if(s.id==='cursed')for(const side of[-1,1])for(let i=0;i<3;i++){
  const z=.98+i*.20,p=[[side*.88,.48,z],[side*1.02,.65,z-.14],[side*.94,.53,z-.25]];mesh(root,patch(p,side>0?[[0,2,1]]:[[0,1,2]]),i%2?f.accent:f.carbon,'Cursed canard');
 }
}
function wreckWarp(x,y,z){
 const dent=Math.exp(-Math.pow((x-.65)/.42,2)-Math.pow((z-1.55)/.52,2)),crease=Math.sin(z*29+x*17)*Math.sin(x*13)*.052*Math.exp(-Math.pow((z-1.4)/.66,2))*Math.max(0,y-.48);
 const door=Math.exp(-Math.pow((x-.92)/.12,2)-Math.pow((z+.30)/.48,2));
 return[x-dent*.14-door*.10,y-dent*.14+crease,z-dent*.22];
}
function wheelParts(s,f){
 if(wheelCache.has(s.id))return wheelCache.get(s.id);const root=new T.Group();
 const shape=[[.235,-.107],[.29,-.109],[.344,-.087],[.363,-.045],[.363,.045],[.344,.087],[.29,.109],[.235,.107]].map(p=>new T.Vector2(...p));
 const tyre=mesh(root,new T.LatheGeometry(shape,40),M.rubber);tyre.rotation.z=-Math.PI/2;
 const barrel=mesh(root,new T.CylinderGeometry(.257,.257,.175,40,1,true),M.rubber);barrel.rotation.z=Math.PI/2;
 const rotor=mesh(root,new T.CylinderGeometry(.214,.214,.023,40),f.alloy);rotor.rotation.z=Math.PI/2;rotor.position.x=.063;
 const lip=mesh(root,new T.TorusGeometry(.267,.012,6,40),f.alloy);lip.rotation.y=Math.PI/2;lip.position.x=.109;
 const count=s.kind==='cop'?5:7;
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2;for(const split of[-1,1]){
   const angle=a+split*.052,p=[];
   for(const back of[false,true])for(const [r,t]of[[.068,-.018],[.068,.018],[.259,.009],[.259,-.009]])p.push([back?.089:.135-(r-.068)*.10,Math.sin(angle)*r+Math.cos(angle)*t,Math.cos(angle)*r-Math.sin(angle)*t]);
   mesh(root,patch(p,[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]]),f.alloy,'Split forged spoke');
  }
  const bolt=mesh(root,primitive('hub-bolt',()=>new T.CylinderGeometry(.008,.008,.022,6)),f.alloy);bolt.rotation.z=Math.PI/2;bolt.position.set(.128,Math.sin(a)*.053,Math.cos(a)*.053);
 }
 const hub=mesh(root,new T.CylinderGeometry(.074,.079,.035,24),f.alloy);hub.rotation.z=Math.PI/2;hub.position.x=.124;
 const badge=mesh(root,new T.CircleGeometry(.066,32),f.alloy,'Branded centre cap');badge.rotation.y=Math.PI/2;badge.position.x=.143;
 const buv=badge.geometry.attributes.uv;for(let i=0;i<buv.count;i++)buv.setXY(i,...atlasUV('rim',buv.getX(i),buv.getY(i)));badge.geometry.userData.atlas=true;
 root.traverse(o=>{if(o.isMesh&&o.material===f.alloy&&!o.geometry.userData.atlas){const g=o.geometry.clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,704/1024,1-960/1024);o.geometry=g;}});
 mergeStatic(root,null);wheelCache.set(s.id,root);return root;
}
function wheels(root,s,f){
 root.userData.wheels=[];
 for(const side of[-1,1])for(const z of wheelZ){
  const steering=new T.Group(),rolling=new T.Group(),face=new T.Group();steering.position.set(side*.885,wheelY,z);face.rotation.y=side<0?Math.PI:0;face.add(wheelParts(s,f).clone(true));rolling.add(face);steering.add(rolling);root.add(steering);
  const caliper=panel(steering,side*.067,.06,.19,.062,.14,.055,s.kind==='cop'?M.red:f.accent,.017,'Fixed brake caliper');root.userData.wheels.push({steering,rolling,caliper,front:z>0});
 }
}
function strobes(roof,side,s){const g=new T.Group();for(let i=0;i<5;i++)panel(g,side*(.17+i*.071),roof+.095,-.31,.057,.052,.19,M.blue,.011);panel(g,side*.35,.548,2.043,.13,.032,.014,M.blue,.01);panel(g,side*.47,.716,-2.05,.16,.025,.012,M.blue,.008);mergeStatic(g,null,s.id==='wreck'?wreckWarp:null);return g.children[0].geometry;}
const shadowMaterial=new T.MeshBasicMaterial({map:softTexture(),transparent:true,opacity:.78,depthWrite:false});
const boostMaterial=new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.72,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
function boostGeometry(s,f){
 const g=new T.Group();for(const side of[-1,1])for(const inner of[false,true]){const cone=mesh(g,new T.ConeGeometry(inner?.031:.058,inner?.20:.35,10),inner?M.white:f.secondary);cone.rotation.x=-Math.PI/2;cone.position.set(side*.63,.267,-(s.kind==='cop'?2.04:2.02)-(inner?.085:.13));}mergeStatic(g,null);return g.children[0].geometry;
}
export function createDesignedVehicle(kind='fld',variant=0,skinId=''){
 const s=resolveSkin(kind,skinId),police=kind==='cop',tall=police&&variant%2===0,f=finish(s),key=s.id+':'+(tall?'estate':'coupe');
 if(!templates.has(key)){
  const shell=new T.Group();body(shell,police,f);const roof=cockpit(shell,police,tall,s,f);fascia(shell,police,s,f);aero(shell,police,tall,roof,s,f);mergeStatic(shell,f.paint,s.id==='wreck'?wreckWarp:null);shell.userData.roof=roof;templates.set(key,shell);
 }
 const shell=templates.get(key),g=new T.Group();g.name=VEHICLE_DESIGNS[kind].name+' / '+s.name;g.add(shell.clone(true));g.userData={kind,skin:s.id,paint:f.paint,designId:VEHICLE_DESIGNS[kind].id,staticBatched:true,wheelbase:2.52,wheelRadius:.363,cosmeticOnly:true};wheels(g,s,f);
 if(police)for(const [name,side]of[['blue',-1],['red',1]])g.userData[name]=mesh(g,primitive(key+':flash:'+side,()=>strobes(shell.userData.roof,side,s)),M.blue,'Blue strobes');
 g.userData.flame=mesh(g,primitive('boost:'+s.id,()=>boostGeometry(s,f)),boostMaterial,'Twin nitro plumes');g.userData.flame.visible=false;
 const shadow=mesh(g,primitive('shadow',()=>new T.PlaneGeometry(2.8,4.9)),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.userData.cpuTextureOnly=true;
 if(!police){const glow=mesh(g,primitive('underglow',()=>new T.PlaneGeometry(2.6,4.3)),f.underglow);glow.rotation.x=-Math.PI/2;glow.position.y=.017;glow.userData.cpuTextureOnly=true;}
 return g;
}
