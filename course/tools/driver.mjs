// Deterministic logic-test driver, not a human or an iPhone playtest.
import {BLOCKADES,curvature} from '../track.js';
import {SHORTCUT,DEBRIS,drivingCurvature} from '../route-options.js';
const clamp=n=>Math.max(-1,Math.min(1,n));
const memories=new WeakMap();
export function driver(r,skilled=true){
 let memory=memories.get(r);if(!memory){memory={target:r.x,next:0};memories.set(r,memory);}
 const row=r.branch?null:BLOCKADES.find(b=>b.s>r.s-9&&b.s-r.s<230);
 const civilians=r.branch?[]:[...r.traffic,...r.cops.filter(c=>!c.active&&c.undercover)];
 const threats=skilled&&!r.branch?r.cops.filter(c=>c.active&&Math.abs(c.s-r.s)<42):[];
 const choices=(r.branch?[-2,0,2]:[-5,-2.5,0,2.5,5]).map(x=>{
  let cost=Math.abs(x-r.x)*.35+Math.abs(x-memory.target)*.15;
  if(!r.branch)for(const d of DEBRIS)if(d.s-r.s>-5&&d.s-r.s<150)cost+=Math.max(0,2.8-Math.abs(d.x-x))*40;
  if(!r.branch&&r.s>SHORTCUT.entry-180&&r.s<SHORTCUT.entry+5&&x>3)cost+=60;
  if(row)cost+=row.xs.reduce((n,b)=>n+Math.max(0,3.2-Math.abs(b-x))*80,0);
  for(const t of civilians)if(t.s-r.s>-6&&t.s-r.s<115)cost+=Math.max(0,3.05-Math.abs(t.x-x))*Math.max(0,1-(t.s-r.s)/120)*75;
  for(const c of threats){
   const future=c.x+Math.max(-2,Math.min(2,c.aimX-c.x));
   cost+=(Math.max(0,2.9-Math.abs(c.x-x))+Math.max(0,2.5-Math.abs(future-x)))*(c.phase==='recover'?1:4);
  }
  return {x,cost};
 });
 choices.sort((a,b)=>a.cost-b.cost);
 if(r.time>=memory.next){memory.target=choices[0].x;memory.next=r.time+.25;}
 const target=memory.target;
 const steer=-clamp((target-r.x)*.38-r.vx*.12+drivingCurvature(r)*r.speed*r.speed*.065);
 const brake=skilled&&civilians.some(t=>t.s-r.s>0&&t.s-r.s<18&&Math.abs(t.x-r.x)<2.2&&r.speed>t.speed+4);
 const nitro=skilled&&!brake&&!r.boostDepleted&&(!row||row.s-r.s>160||Math.abs(row.gap-r.x)<1.2)&&((r.boosting&&r.nitro>10)||(r.nitro>65&&r.pressure>35));
 return {steer,brake,drift:false,nitro};
}
