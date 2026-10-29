import {LENGTH,sample} from './track.js?v=fld-route-003';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const VICTORY_DRIVE_SECONDS=7.8;
export const departureStart=result=>result?.ending==='love'?14:7;
export const cinematicDuration=result=>result?.won?departureStart(result)+VICTORY_DRIVE_SECONDS:4.5;

function ramp(t,duration,from,to){
 const u=clamp(t/duration);return {distance:from*Math.min(t,duration)+(to-from)*duration*(u**3-u**4/2),speed:from+(to-from)*smooth(u)};
}
export function departureMotion(time,incoming=145/7){
 const t=Math.max(0,time),a=ramp(Math.min(t,.45),.45,incoming,6.5);
 if(t<=.45)return a;
 const hold=Math.min(t-.45,1.35);a.distance+=hold*6.5;a.speed=6.5;
 if(t<=1.8)return a;
 const b=ramp(Math.min(t-1.8,1.7),1.7,6.5,58);return {distance:a.distance+b.distance+Math.max(0,t-3.5)*58,speed:b.speed};
}

// Extend only the victory scenery beyond the authored 13 km route. Gameplay,
// record distance, collisions and the forest shortcut keep their original samples.
export function victorySample(s,lateral=0){
 const join=LENGTH+320;if(s<=join)return sample(s,lateral);
 const a=sample(join),slope=(a.y-sample(join-2).y)/2,d=s-join;
 return {x:a.x+Math.sin(a.angle)*d+Math.cos(a.angle)*lateral,y:a.y+slope*40*(1-Math.exp(-d/40)),z:a.z+Math.cos(a.angle)*d-Math.sin(a.angle)*lateral,angle:a.angle};
}
export function victoryPose(r,tail=0){
 if(!r.result?.won||!['ARRIVAL','RESULTS','PAUSE'].includes(r.state))return null;
 const love=r.result.ending==='love',clock=(r.cinematic||0)+(r.state==='RESULTS'?clamp(tail,0,60):0),start=departureStart(r.result),t=Math.max(0,clock-start);
 const initial=love?65:145,merge=smooth(t/2.8),base=clamp(clock/(love?5:7)),moving=clock>=start;
 const motion=departureMotion(t,love?0:145/7);
 const s=moving?LENGTH+initial+motion.distance:LENGTH+base*initial;
 const lateral=moving?(love?11:0)*(1-merge):(r.x||0)*(1-base)+(love?11:0)*base;
 const u=clamp(t/2.8),sideSpeed=love?-11*6*u*(1-u)/2.8:0;
 const yaw=moving?clamp(Math.atan2(sideSpeed,Math.max(6.5,motion.speed)),-.35,.35):(r.yaw||0)*(1-base);
 const speed=moving?motion.speed:love&&clock>=5?0:love?13:145/7;
 return {clock,start,elapsed:t,departing:moving,phase:!moving?'head-or-encounter':t<1.8?'slow-motion':t<3.5?'orbit':'horizon',s,lateral,yaw,speed,wheelDistance:moving?initial+motion.distance:base*initial,position:victorySample(s,lateral)};
}

export function victoryShot(r,aspect=1,reduced=false,tail=0){
 const pose=victoryPose(r,tail);if(!pose?.departing)return null;
 const t=pose.elapsed,capture=3.5,follow=Math.min(t,capture),u=smooth(follow/capture);
 const motion=departureMotion(follow,r.result.ending==='love'?0:145/7),initial=r.result.ending==='love'?65:145;
 const lateral=r.result.ending==='love'?11*(1-smooth(follow/2.8)):0;
 const p=victorySample(LENGTH+initial+motion.distance,lateral),angle=p.angle;
 const orbit=reduced?.32*u:Math.sin(Math.PI*u)*1.1+.5*u;
 // Fit the entire vehicle on narrow phones; no roll, shake or rapid zoom.
 const fit=Math.max(1,Math.min(1.6,.52/Math.max(.3,aspect))),radius=((reduced?10:9.4)+u*5.8)*fit,height=4.3+(reduced?-.6:-2.2)*Math.sin(Math.PI*u);
 // Stay in the road corridor: orbiting behind roadside lamp posts masks the
 // hero car. A bounded three-quarter arc gives a clear body view on phones.
 const side=-Math.sin(orbit)*(reduced?4:6.8),back=-Math.sqrt(radius*radius-side*side);
 let position=[p.x+Math.cos(angle)*side+Math.sin(angle)*back,p.y+height,p.z-Math.sin(angle)*side+Math.cos(angle)*back];
 const settle=smooth((t-capture)/1.2),horizon=victorySample(LENGTH+initial+motion.distance+180,0);
 let target=[pose.position.x*(1-settle)+horizon.x*settle,(pose.position.y+.85)*(1-settle)+(horizon.y+2.2)*settle,pose.position.z*(1-settle)+horizon.z*settle];
 const logoFocus=reduced?0:smooth((t-.75)/.5)*(1-smooth((t-2.25)/.65));
 if(logoFocus>0){
  const a=pose.position.angle+pose.yaw,c=Math.cos(a),sn=Math.sin(a),car=pose.position;
  const close=[car.x-4.6*c-.2*sn,car.y+1.12,car.z+4.6*sn-.2*c],door=[car.x-.94*c,car.y+.66,car.z+.94*sn];
  position=position.map((v,i)=>v+(close[i]-v)*logoFocus);target=target.map((v,i)=>v+(door[i]-v)*logoFocus);
 }
 return {position,target,blend:smooth(t/.7),fov:62-(reduced?3:10)*Math.sin(Math.PI*u),phase:logoFocus>.9?'brand-detail':pose.phase,logoFocus};
}

export function createVictoryTail(){
 let race=null,tail=0;
 return {reset(){race=null;tail=0;},update(r,elapsed){
  if(r.result!==race){race=r.result;tail=0;}
  if(r.state==='RESULTS'&&r.result?.won)tail=clamp(tail+Math.max(0,Math.min(.1,elapsed)),0,60);
  else if(r.state!=='PAUSE')tail=0;
  return tail;
 }};
}
