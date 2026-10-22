// Original FLD composition: HORIZON NON DÉCLARÉ, 108 BPM, E minor / G major.
export const BPM=108;
export const STEP_SECONDS=60/BPM/4;
const progressions=[[40,36,43,38],[43,38,40,36],[40,41,36,35],[40,36,45,38],[43,38,45,40]];
const melody=[[7,14,12,10,7,5,3,7],[14,19,17,14,12,10,7,10],[7,10,14,12,19,17,14,10],[12,14,19,22,19,17,14,12]];
export const frequency=midi=>440*2**((midi-69)/12);
export function scoreEvents(step,sector=0,pressure=0,arrival=false){
 const bar=Math.floor(step/16),beat=step%16,phrase=Math.floor(bar/8),stage=Math.max(0,Math.min(4,sector));
 const root=arrival?40:progressions[stage][Math.floor(bar/4)%4],events=[],major=[36,43,41,38].includes(root);
 const chordTone=n=>major?({10:11,15:16,22:23}[n]??n):n;
 const add=(kind,midi,duration,volume,offset=0,pan=0)=>events.push({kind,midi,duration,volume,offset,pan});
 if(arrival){
  if(beat===0&&bar%2===0)for(const [i,n] of[55,59,62,69].entries())add('pad',n,4.1,.038,0,(i-1.5)*.25);
  if(beat===4||beat===12)add('bell',[79,74,71,69][Math.floor(step/8)%4],1.4,.038);
  return events;
 }
 // Chords breathe for two bars, inversions rotate every phrase.
 if(beat===0&&bar%2===0){
  const inversion=phrase%3;
  const chord=[0,major?4:3,7,major?11:10];
  for(const [i,n] of chord.entries())add('pad',root+12+n+(i<inversion?12:0),4.15,stage===2?.018:.027,0,(i-1.5)*.27);
 }
 if(bar>=2&&beat%2===0){
  const pattern=phrase%2?[0,7,0,12,0,10,7,12]:[0,0,12,7,0,12,7,10];
  add('bass',root+chordTone(pattern[beat/2]),STEP_SECONDS*(beat===14?1.6:1.35),.18);
 }
 if(beat===0||beat===8||(bar>=8&&beat===6&&bar%4===3))add('kick',36,.24,.45);
 if(bar>=4&&(beat===4||beat===12))add('snare',0,.15,.12);
 if(bar>=4&&beat%2===1)add('hat',0,beat===15&&bar%4===3?.16:.045,beat%4===3?.045:.027,.008);
 const arpGate=bar>=8&&(stage!==2||beat%4===2);
 if(arpGate&&(beat%2===0||pressure>65&&phrase%2)){
  const pattern=phrase%3===0?[0,7,10,14,7,15,19,14]:phrase%3===1?[7,12,15,19,22,19,15,12]:[0,10,7,14,15,7,19,22];
  const octave=(phrase%4===3?12:0);
  add('arp',root+12+chordTone(pattern[Math.floor(beat/2)%8])+octave,STEP_SECONDS*1.4,stage===2?.025:.041,0,beat%4?.45:-.45);
 }
 // A nonrepeating phrase accent every eight bars; tunnel and final stage have their own response.
 if(bar>0&&bar%8===7&&[10,12,15].includes(beat))add('bell',root+24+[7,10,14][[10,12,15].indexOf(beat)],.65,.045);
 if(stage===4&&bar>=8&&beat===0&&bar%4===0)add('bell',root+36,.9,.05);
 // A long, original lead develops in 16-bar calls/responses rather than an arpeggio alone.
 if(bar>=16&&stage!==2&&phrase%4!==2&&[0,6,10,14].includes(beat)){
  const index=(bar%2)*4+[0,6,10,14].indexOf(beat),motif=melody[(Math.floor(bar/16)+stage)%melody.length];
  add('lead',64+motif[index]-(stage===0?12:0),STEP_SECONDS*(beat===14?4.8:3.6),.042,0,Math.sin(bar*.7)*.22);
 }
 if(stage===2&&bar%4===3&&beat===14)add('bell',root+31,1.2,.034,0,-.4);
 return events;
}
