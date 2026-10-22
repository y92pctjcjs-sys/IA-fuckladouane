import {LENGTH, BLOCKADES, pressureAt} from './track.js?v=pursuit3';

export const PURSUIT = Object.freeze({maxSpeed:61, acceleration:9.2, braking:18, grace:2.4, recycleDistance:180});
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function randomFor(seed) {
  let value=seed>>>0;
  return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}
export function createPursuers(seed) {
  const random=randomFor(seed);
  return Array.from({length:3},(_,i)=>({
    id:`c${i}`,type:'cop',variant:i,undercover:i>0,active:false,
    s:i?410+(i-1)*1130+random()*180:-28,x:i?[-5,0,5][Math.floor(random()*3)]:4.5,
    speed:i?25+i*1.5:0,civilSpeed:25+i*1.5,
    role:['follow','flank','encircle'][i],phase:i?'civilian':'approach',
    offset:random()*3,side:random()>.5?1:-1,steer:0,aimX:0,reaction:0,
    grace:0,recover:0,engaged:false,escaped:false,reveals:0
  }));
}
export function moveCivilian(r,car,dt){
  const cruise=car.civilSpeed??car.cruiseSpeed;
  const row=BLOCKADES.find(b=>b.s>car.s-8&&b.s-car.s<150);
  let desiredSpeed=cruise,wantedX=car.x;
  if(row){
    if(r.s<row.s+25){
      wantedX=row.xs[Number(car.id.slice(1))%2];
      desiredSpeed=Math.min(cruise,Math.sqrt(16*Math.max(0,row.s-9-car.s)));
    }else{
      wantedX=row.gap;
      if(row.s-car.s<42&&Math.abs(car.x-row.gap)>.35)desiredSpeed=0;
    }
  }
  car.x+=clamp(wantedX-car.x,-3*dt,3*dt);
  car.speed+=clamp(desiredSpeed-car.speed,-12*dt,5*dt);
  car.s+=car.speed*dt;car.steer=clamp((wantedX-car.x)*.12,-.4,.4);
}
function reveal(r,c) {
  c.active=true;c.phase='reveal';c.grace=PURSUIT.grace;c.reveals++;
  c.recover=0;c.reaction=0;c.engaged=true;c.escaped=false;
  r.undercoverReveals++;r.revealSerial++;r.lastRevealTime=r.time;r.heatKick=Math.min(48,r.heatKick+32);
}
export function updatePursuit(r,dt,warning,hit,overlaps) {
  const intensity=pressureAt(r.s);
  let close=0;
  r.heatKick=Math.max(0,r.heatKick-dt*4.5);
  for(let i=0;i<r.cops.length;i++) {
    const c=r.cops[i];let gap=r.s-c.s;
    if(!c.undercover&&r.s>90)c.active=true;
    if(c.undercover&&!c.active) {
      // The same civilian model and position survive the reveal. No spawn at the player's door.
      if(gap>-24&&gap<32&&r.speed>12)reveal(r,c);
      else {moveCivilian(r,c,dt);c.phase='civilian';continue;}
    }
    if(!c.active) {
      c.speed+=clamp(r.speed-c.speed,-PURSUIT.braking*dt,PURSUIT.acceleration*dt);
      c.s+=c.speed*dt;continue;
    }
    c.grace=Math.max(0,c.grace-dt);c.recover=Math.max(0,c.recover-dt);
    const cycle=(r.time+c.offset+i*4.7)%19;
    const attack=!warning&&intensity>.48&&cycle<8.5&&c.grace===0&&c.recover===0&&!(c.undercover&&c.escaped);
    c.phase=c.undercover&&c.escaped?'withdraw':c.grace>0?'reveal':c.recover>0||cycle>14?'recover':attack?c.role:'approach';
    const desiredGap=warning?46+i*8:c.phase==='recover'?46+i*8:attack?(c.role==='encircle'?-6:c.role==='flank'?1:3):17+i*5;
    let wanted=clamp(r.speed+(gap-desiredGap)*.55,0,PURSUIT.maxSpeed-i*.35);
    if(c.phase==='withdraw')wanted=Math.max(18,r.speed-10);
    const row=BLOCKADES.find(b=>b.s>c.s-8&&b.s-c.s<150);
    if(row&&row.s-c.s<48&&Math.abs(c.x-row.gap)>.4)wanted=Math.min(wanted,Math.sqrt(22*Math.max(0,row.s-8-c.s)));
    c.speed+=clamp(wanted-c.speed,-PURSUIT.braking*dt,PURSUIT.acceleration*dt);
    c.s+=c.speed*dt;
    c.reaction-=dt;
    if(c.reaction<=0) {
      c.reaction=.52+i*.06;
      c.aimX=clamp(r.x+r.vx*.28+(attack&&c.role==='flank'?c.side*1.55:attack?0:Math.sin(r.time*.35+i)*3),-6.4,6.4);
    }
    let wantedX=c.aimX;
    // Cops and civilians clear the announced escape lane before the player reaches it.
    if(row)wantedX=row.gap;
    const dx=clamp(wantedX-c.x,-3.25*dt,3.25*dt);c.x+=dx;c.steer=dx/Math.max(dt,1e-6)/8;
    if(Math.abs(gap)<22)close++;
    if(Math.abs(gap)<65)c.engaged=true;
    if(c.engaged&&!c.escaped&&gap>110) {c.escaped=true;r.escapes++;}
    if(overlaps(r,c)&&hit(r,8,Math.sign(r.x-c.x||c.side)*3,'vehicle')) {
      c.recover=4.8;c.speed=Math.max(0,c.speed-7);
    }
    // An escaped unmarked car can return later as traffic, always beyond both render limits.
    if(c.undercover&&gap>PURSUIT.recycleDistance&&r.s<LENGTH-1300) {
      const oldS=c.s;
      c.s=r.s+570+i*80;c.x=c.side*5;c.active=false;c.phase='civilian';
      c.speed=c.civilSpeed;c.grace=0;c.recover=0;c.engaged=false;c.escaped=false;
      r.reinforcements.push({from:oldS,to:c.s,player:r.s});
      if(r.reinforcements.length>8)r.reinforcements.shift();
    }
  }
  const proximity=r.cops.filter(c=>c.active).reduce((total,c)=>total+Math.max(0,1-Math.abs(r.s-c.s)/110)*32,0);
  r.pressure=clamp(proximity+r.heatKick,0,100);
  if(r.pressure>45)r.pursuitTime+=dt;
  return close;
}
