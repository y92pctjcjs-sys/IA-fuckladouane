export const SPIN_SECONDS=.88;
export const REDUCED_SPIN_SECONDS=1;
const TAU=Math.PI*2;
const ease=t=>t*t*t*(t*(t*6-15)+10);

// A seed chooses one of the six permutations. Every three hits use all three sounds.
export function tauntIndex(seed,serial){
 const value=seed>>>0,offset=value%3,stride=(value>>>3)&1?2:1;
 return (offset+Math.max(0,Math.floor(serial)-1)*stride)%3;
}

export function createDamageSpin(){
 let seed=null,lastSerial=0,lastClock=0,start=null,duration=SPIN_SECONDS,waiting=0,completed=0;
 let pose={active:false,angle:0,progress:0,serial:0,completed:0,variant:0};
 function reset(){seed=null;lastSerial=0;lastClock=0;start=null;waiting=completed=0;pose={active:false,angle:0,progress:0,serial:0,completed:0,variant:0};}
 return {reset,update(r,reduced=false){
  const clock=(r.time||0)+(r.cinematic||0),serial=Math.max(0,Math.floor(r.hitSerial||0));
  if(seed!==r.seed||clock<lastClock||serial<lastSerial)reset();
  seed=r.seed;lastClock=clock;
  if(r.state==='PAUSE')return {...pose};
  if(!['RACE','INTERCEPTION'].includes(r.state)){
   start=null;waiting=0;lastSerial=serial;pose={...pose,active:false,angle:0,progress:0,serial};return {...pose};
  }
  // Finish elapsed turns before queuing a new accepted hit. Repeated render frames
  // never create another turn; a missed frame can retain several accepted hits.
  while(start!==null&&clock-start>=duration-1e-10){
   completed++;if(waiting>0){waiting--;start+=duration;}else start=null;
  }
  waiting+=Math.max(0,serial-lastSerial);lastSerial=serial;
  if(start===null&&waiting>0){waiting--;start=clock;duration=reduced?REDUCED_SPIN_SECONDS:SPIN_SECONDS;}
  const active=start!==null,progress=active?Math.min(1,Math.max(0,(clock-start)/duration)):0;
  pose={active,angle:active?TAU*ease(progress):0,progress,serial,completed,variant:tauntIndex(seed,serial)};
  return {...pose};
 }};
}
