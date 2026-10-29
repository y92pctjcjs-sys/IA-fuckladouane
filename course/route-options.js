import {sample,curvature,warningDistance} from './track.js?v=fld-route-003';

// One continuous physical service road cuts inside the long forest bend.
// s remains the shared main-route progress; distance on this road is arc length.
const entry=3120,exit=4400,offset=5.2,exitOffset=3.5,handle=260;
const first=sample(entry,offset),last=sample(exit,exitOffset);
const controls=[first,{x:first.x+Math.sin(first.angle)*handle,z:first.z+Math.cos(first.angle)*handle},{x:last.x-Math.sin(last.angle)*handle,z:last.z-Math.cos(last.angle)*handle},last];
function bezier(t){const a=1-t,[p,q,r,s]=controls;return {x:a*a*a*p.x+3*a*a*t*q.x+3*a*t*t*r.x+t*t*t*s.x,z:a*a*a*p.z+3*a*a*t*q.z+3*a*t*t*r.z+t*t*t*s.z};}
function tangent(t){const a=1-t,[p,q,r,s]=controls;return {x:3*a*a*(q.x-p.x)+6*a*t*(r.x-q.x)+3*t*t*(s.x-r.x),z:3*a*a*(q.z-p.z)+6*a*t*(r.z-q.z)+3*t*t*(s.z-r.z)};}
const points=[];let length=0,previous;
for(let i=0;i<=640;i++){const t=i/640,p=bezier(t),d=tangent(t);if(previous)length+=Math.hypot(p.x-previous.x,p.z-previous.z);points.push({...p,distance:length,t,angle:Math.atan2(d.x,d.z)});previous=p;}
export const SHORTCUT=Object.freeze({id:'forest-cut',name:'LISIÈRE 89',entry,exit,offset,exitOffset,halfWidth:3.8,length,skippedMetres:exit-entry-length,entryFrom:entry-35,entryTo:entry+35});
const seamRoads=[entry,exit].map(s=>Array.from({length:91},(_,i)=>({s:s-180+i*4,...sample(s-180+i*4)})));
function seamHeight(point,y,d){
 const edge=Math.min(d,length-d);if(edge>=95)return y;
 const road=seamRoads[d<length/2?0:1];let best=Infinity,roadY=y;
 for(let i=1;i<road.length;i++){const a=road[i-1],b=road[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(dx*dx+dz*dz))),dist=Math.hypot(point.x-a.x-dx*t,point.z-a.z-dz*t);if(dist<best){best=dist;roadY=a.y+(b.y-a.y)*t;}}
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},weight=(1-smooth((best-8)/6))*smooth(edge/12);
 return y+(roadY-y)*weight;
}
export function shortcutSample(distance,lateral=0){
 const d=Math.max(0,Math.min(length,distance));let lo=0,hi=points.length-1;
 while(lo+1<hi){const mid=(lo+hi)>>1;if(points[mid].distance<d)lo=mid;else hi=mid;}
 const a=points[lo],b=points[hi],u=(d-a.distance)/Math.max(.000001,b.distance-a.distance),t=a.t+(b.t-a.t)*u,p=bezier(t),dir=tangent(t),angle=Math.atan2(dir.x,dir.z);
 // Cubic Hermite height matches both road grades at the junctions.
 const grade=s=>(sample(s+2).y-sample(s-2).y)/4,v=d/length,v2=v*v,v3=v2*v;
 const y=(2*v3-3*v2+1)*first.y+(v3-2*v2+v)*grade(entry)*length+(-2*v3+3*v2)*last.y+(v3-v2)*grade(exit)*length;
 const x=p.x+Math.cos(angle)*lateral,z=p.z-Math.sin(angle)*lateral;return {x,y:seamHeight({x,z},y,d),z,angle};
}
export const shortcutDistance=s=>(s-entry)/(exit-entry)*length;
export function driveSample(s,lateral=0,branch=null){
 if(branch!==SHORTCUT.id)return sample(s,lateral);
 if(s<entry)return sample(s,lateral+offset);if(s>exit)return sample(s,lateral+exitOffset);
 return shortcutSample(shortcutDistance(s),lateral);
}
export function drivingCurvature(r){
 if(r.branch!==SHORTCUT.id)return curvature(r.s);
 const d=shortcutDistance(r.s);return (shortcutSample(d+1).angle-shortcutSample(d-1).angle)/2;
}
export function shortcutSamples(step=8){const out=[];for(let d=0;d<length;d+=step)out.push({...shortcutSample(d),distance:d});out.push({...shortcutSample(length),distance:length});return out;}
const samples=shortcutSamples(8);
export function distanceToShortcut(x,z){let best=Infinity;for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));}return best;}
export function railOpening(s,side){return side>0&&(s>=entry-65&&s<=entry+75||s>=exit-85&&s<=exit+75);}
export function merging(r){return r.branch===SHORTCUT.id||r.time<(r.shortcutMergeUntil||0);}
export const DEBRIS=Object.freeze([
 {id:'d0',s:1060,x:5,kind:'tyres'}, {id:'d1',s:2720,x:-5,kind:'cartons'},
 {id:'d2',s:4900,x:0,kind:'tyres'}, {id:'d3',s:8480,x:5,kind:'cartons'},
 {id:'d4',s:11140,x:-5,kind:'tyres'}
].map(d=>Object.freeze({...d,type:'debris'})));
export function debrisAhead(r){return r.branch?null:DEBRIS.find(d=>d.s>r.s&&d.s-r.s<=warningDistance(r.speed))||null;}
