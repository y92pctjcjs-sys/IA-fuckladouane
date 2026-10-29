import {LENGTH,ROUTE_ID,HALF_WIDTH,BLOCKADES,DIMENSIONS,blockadeAhead,screenSteerToRoad} from './track.js?v=fld-route-003';
import {SHORTCUT,DEBRIS,driveSample,drivingCurvature} from './route-options.js?v=fld-route-003';
import {drawEnding} from './ending.js?v=fld-route-003';
import {createPursuers,updatePursuit,moveCivilian} from './pursuit.js?v=fld-route-003';
export const FIXED_DT=1/120;
export const emptyInput=()=>({steer:0,brake:false,drift:false,nitro:false});
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function createRace(ending=drawEnding,seed=0xf1d2026){
  return {state:'MENU',previous:null,countdown:3,time:0,cinematic:0,s:0,x:0,vx:0,speed:0,yaw:0,steer:0,
    nitro:100,health:100,pressure:0,capture:0,invulnerable:0,impact:0,impactKind:'',hitSerial:0,
    drifts:0,driftTime:0,driftBlend:0,drifting:false,boosting:false,boostDepleted:false,scraping:false,wallTouch:false,result:null,ending,
    branch:null,shortcutUsed:false,shortcutMetres:0,shortcutMergeUntil:0,debrisHits:0,seed:seed>>>0,undercoverReveals:0,revealSerial:0,lastRevealTime:-100,heatKick:0,escapes:0,pursuitTime:0,nearMisses:0,chain:0,bestChain:0,driftDistance:0,reinforcements:[],
    contacts:new Set(),obstacles:BLOCKADES.flatMap((row,r)=>row.xs.map((x,i)=>({id:`b${r}-${i}`,s:row.s,x,type:'barrier'}))).concat(DEBRIS),
    traffic:Array.from({length:7},(_,i)=>({id:`t${i}`,s:300+i*430,x:[-5,0,5][i%3],speed:23+i%4*2,cruiseSpeed:23+i%4*2,type:'traffic',steer:0,passCounted:false,wasAhead:true})),
    cops:createPursuers(seed)};
}
export function start(r){if(r.state==='MENU')r.state='COUNTDOWN';}
export function pause(r){if(['COUNTDOWN','RACE','ARRIVAL','INTERCEPTION'].includes(r.state)){r.previous=r.state;r.state='PAUSE';}}
export function resume(r){if(r.state==='PAUSE'){r.state=r.previous;r.previous=null;}}
export function finish(r,won,reason=''){
  if(r.state!=='RACE'||r.result)return false;
  r.result=Object.freeze({won,reason,route:ROUTE_ID,time:r.time,health:r.health,drifts:r.drifts,
    nearMisses:r.nearMisses,escapes:r.escapes,bestChain:r.bestChain,undercoverReveals:r.undercoverReveals,
    shortcut:r.shortcutUsed,shortcutMetres:r.shortcutMetres,debrisHits:r.debrisHits,score:Math.max(0,Math.round((won?30000:r.s)+r.health*60+Math.min(2400,r.nearMisses*240)+Math.min(1800,r.escapes*450)+Math.min(1800,r.driftDistance*.6)-r.time*15)),ending:won?r.ending():'caught'});
  r.state=won?'ARRIVAL':'INTERCEPTION';r.cinematic=0;r.boosting=false;return true;
}
export function hit(r,damage,impulse=0,kind='impact'){
  if(r.state!=='RACE'||r.invulnerable>0)return false;
  r.health=Math.max(0,r.health-damage);r.speed*=kind==='scrape'?.88:kind==='vehicle'?.76:.68;r.vx+=impulse;r.invulnerable=1.05;r.impact=1;r.impactKind=kind;r.hitSerial++;r.chain=0;return true;
}
export function overlaps(r,object){
  const a=DIMENSIONS.player,b=DIMENSIONS[object.type]||DIMENSIONS.traffic;
  // Objects on the main road cannot hit through the forest into the branch.
  if(r.branch){
    if(Math.abs(r.s-object.s)>120)return false;
    const p=driveSample(r.s,r.x,r.branch),q=driveSample(object.s,object.x),dx=q.x-p.x,dz=q.z-p.z;
    return Math.abs(dx*Math.sin(p.angle)+dz*Math.cos(p.angle))<a.halfLength+b.halfLength-.12&&Math.abs(dx*Math.cos(p.angle)-dz*Math.sin(p.angle))<a.halfWidth+b.halfWidth-.12;
  }
  // Small tolerance at the edges makes glancing contacts forgiving.
  return Math.abs(r.s-object.s)<a.halfLength+b.halfLength-.12&&Math.abs(r.x-object.x)<a.halfWidth+b.halfWidth-.12;
}
export function step(r,dt,input=emptyInput()){
  if(['MENU','PAUSE','RESULTS'].includes(r.state))return;
  dt=clamp(dt,0,.05);
  if(r.state==='COUNTDOWN'){r.countdown-=dt;if(r.countdown<=0){r.state='RACE';r.countdown=0;}return;}
  if(r.state==='ARRIVAL'||r.state==='INTERCEPTION'){r.cinematic+=dt;if(r.cinematic>=(r.result.ending==='love'?14:r.result.won?7:4.5))r.state='RESULTS';return;}
  r.time+=dt;r.invulnerable=Math.max(0,r.invulnerable-dt);r.impact=Math.max(0,r.impact-dt*2);
  const speedFactor=1-clamp((r.speed-40)/100,0,.22),gripRequest=Boolean(input.drift&&Math.abs(r.steer)>.18&&r.speed>18);
  r.steer+=(screenSteerToRoad(clamp(input.steer,-1,1))-r.steer)*Math.min(1,dt*(input.steer?7.5:9));
  r.driftBlend+=((gripRequest?1:0)-r.driftBlend)*Math.min(1,dt*(gripRequest?7:9));
  r.drifting=r.driftBlend>.2;if(!input.nitro)r.boostDepleted=false;
  r.boosting=Boolean(input.nitro&&!r.boostDepleted&&r.nitro>.8&&!input.brake);
  const targetSpeed=input.brake?(input.drift?26:0):r.boosting?68:48;
  const acceleration=r.speed<targetSpeed?(r.boosting?18:10):input.brake?24:12;
  r.speed+=clamp(targetSpeed-r.speed,-acceleration*dt,acceleration*dt);
  r.nitro=clamp(r.nitro+(r.boosting?-26:5)*dt,0,100);if(r.boosting&&r.nitro<=.8)r.boostDepleted=true;
  const grip=6.8-r.driftBlend*4,targetVx=r.steer*(8.5+r.driftBlend*2.5)*speedFactor*Math.min(1,r.speed/18);
  r.vx+=(targetVx-r.vx)*Math.min(1,dt*grip);
  r.vx-=drivingCurvature(r)*r.speed*r.speed*dt*(.42+r.driftBlend*.22);
  r.x+=r.vx*dt;r.yaw=Math.atan2(r.vx,Math.max(r.speed,10))+r.driftBlend*r.steer*.26;
  if(r.drifting&&Math.abs(r.x)<(r.branch?SHORTCUT.halfWidth-.8:7)){r.driftTime+=dt;r.driftDistance+=r.speed*dt;r.nitro=Math.min(100,r.nitro+dt*12);}
  else if(r.driftTime>0){if(r.driftTime>.65){r.drifts++;r.nitro=Math.min(100,r.nitro+9);}r.driftTime=0;}
  const halfWidth=r.branch?SHORTCUT.halfWidth:HALF_WIDTH, scraping=Math.abs(r.x)>halfWidth-.65;
  if(scraping){r.speed=Math.max(0,r.speed-11*dt);if(!r.wallTouch&&Math.abs(r.x)>halfWidth+.55)hit(r,5,-Math.sign(r.x)*2,'scrape');r.wallTouch=Math.abs(r.x)>halfWidth+.4;r.x=clamp(r.x,-halfWidth-.6,halfWidth+.6);r.vx-=Math.sign(r.x)*dt*3;}else r.wallTouch=false;
  r.scraping=scraping;
  const previousS=r.s;
  r.s+=r.speed*dt*(r.branch?(SHORTCUT.exit-SHORTCUT.entry)/SHORTCUT.length:1);
  if(!r.branch&&previousS<SHORTCUT.entry&&r.s>=SHORTCUT.entry&&r.x>3.8){r.branch=SHORTCUT.id;r.x-=SHORTCUT.offset;r.shortcutUsed=true;}
  if(r.branch&&r.s>=SHORTCUT.exit){
    r.s=SHORTCUT.exit+(r.s-SHORTCUT.exit)*SHORTCUT.length/(SHORTCUT.exit-SHORTCUT.entry);
    r.branch=null;r.x+=SHORTCUT.exitOffset;r.shortcutMetres=SHORTCUT.skippedMetres;r.shortcutMergeUntil=r.time+2.8;
  }
  const warning=r.branch?null:blockadeAhead(r.s,r.speed);
  for(const t of r.traffic){
    moveCivilian(r,t,dt);
    if(!r.branch&&Math.abs(r.s-t.s)<6)t.passClearance=Math.min(t.passClearance??Infinity,Math.abs(r.x-t.x));
    if(!r.branch&&t.wasAhead&&!t.passCounted&&r.s-t.s>5){
      t.passCounted=true;const clearance=t.passClearance??Infinity;
      if(clearance>1.9&&clearance<3.25&&!r.contacts.has(t.id)&&r.speed-t.speed>8){r.nearMisses++;r.chain++;r.bestChain=Math.max(r.bestChain,r.chain);}
    }
    if(t.s<r.s-110&&r.s<LENGTH-650){t.s=r.s+480+Number(t.id.slice(1))*31;t.passCounted=false;t.passClearance=Infinity;t.wasAhead=true;r.contacts.delete(t.id);}
  }
  const main=driveSample(r.s),driven=driveSample(r.s,0,r.branch),isolated=r.branch&&Math.hypot(main.x-driven.x,main.z-driven.z)>12;
  const pursuitClose=updatePursuit(r,dt,warning,hit,overlaps),close=isolated?0:pursuitClose;
  for(let n=0;n<r.obstacles.length+r.traffic.length;n++){const o=n<r.obstacles.length?r.obstacles[n]:r.traffic[n-r.obstacles.length];if(!r.contacts.has(o.id)&&overlaps(r,o))if(hit(r,o.type==='barrier'?17:o.type==='debris'?6:11,(r.x>=o.x?1:-1)*(o.type==='debris'?1.2:3.5),o.type==='barrier'?'barrier':o.type==='debris'?'debris':'vehicle')){r.contacts.add(o.id);if(o.type==='debris')r.debrisHits++;}}
  r.capture=r.speed<3&&close>=2?Math.min(4,r.capture+dt):Math.max(0,r.capture-dt*2);
  if(r.health<=0)finish(r,false,'VÉHICULE HORS SERVICE');else if(r.capture>=4)finish(r,false,'IMMOBILISÉ ET ENCERCLÉ');else if(r.s>=LENGTH&&r.speed>3)finish(r,true);
}
export function createClock(race,input){
  let accumulated=0;
  return {advance(elapsed){
    if(['PAUSE','MENU','RESULTS'].includes(race.state)){accumulated=0;return;}
    accumulated+=clamp(elapsed,0,.25);
    while(accumulated+1e-10>=FIXED_DT){step(race,FIXED_DT,input());accumulated-=FIXED_DT;}
  }};
}
