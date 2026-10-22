// Original FLD composition: ORIGINE NON DÉCLARÉE, 108 BPM, E minor.
export const BPM=108;
export const STEP_SECONDS=60/BPM/4;
const progressions=[[40,36,43,38],[40,45,36,38],[40,41,36,35],[40,36,45,38],[40,43,36,38]];
export const frequency=midi=>440*2**((midi-69)/12);
export function scoreEvents(step,sector=0,pressure=0,arrival=false){
 const bar=Math.floor(step/16),beat=step%16,phrase=Math.floor(bar/8),stage=Math.max(0,Math.min(4,sector));
 const root=arrival?40:progressions[stage][Math.floor(bar/4)%4],events=[];
 const add=(kind,midi,duration,volume,offset=0)=>events.push({kind,midi,duration,volume,offset});
 if(arrival){
  if(beat===0&&bar%2===0)for(const n of[52,55,59,66])add('pad',n,4.1,.055);
  if(beat===4||beat===12)add('bell',[76,71,67,66][Math.floor(step/8)%4],1.4,.038);
  return events;
 }
 // Chords breathe for two bars, inversions rotate every phrase.
 if(beat===0&&bar%2===0){
  const inversion=phrase%3;
  for(const [i,n] of [0,3,7,14].entries())add('pad',root+12+n+(i<inversion?12:0),4.15,stage===2?.025:.042);
 }
 if(bar>=2&&beat%2===0){
  const pattern=phrase%2?[0,7,0,12,0,10,7,12]:[0,0,12,7,0,12,7,10];
  add('bass',root+pattern[beat/2],STEP_SECONDS*(beat===14?1.6:1.35),.15);
 }
 if(beat===0||beat===8||(bar>=8&&beat===6&&bar%4===3))add('kick',36,.24,.45);
 if(bar>=4&&(beat===4||beat===12))add('snare',0,.15,.12);
 if(bar>=4&&beat%2===1)add('hat',0,beat===15&&bar%4===3?.16:.045,beat%4===3?.045:.027,.008);
 const arpGate=bar>=8&&(stage!==2||beat%4===2);
 if(arpGate&&(beat%2===0||pressure>65&&phrase%2)){
  const pattern=phrase%3===0?[0,7,10,14,7,15,19,14]:phrase%3===1?[7,12,15,19,22,19,15,12]:[0,10,7,14,15,7,19,22];
  const octave=(phrase%4===3?12:0);
  add('arp',root+12+pattern[Math.floor(beat/2)%8]+octave,STEP_SECONDS*1.4,stage===2?.028:.045);
 }
 // A nonrepeating phrase accent every eight bars; tunnel and final stage have their own response.
 if(bar>0&&bar%8===7&&[10,12,15].includes(beat))add('bell',root+24+[7,10,14][[10,12,15].indexOf(beat)],.65,.045);
 if(stage===4&&bar>=8&&beat===0&&bar%4===0)add('bell',root+36,.9,.05);
 return events;
}
