export {tauntIndex} from './oculaire-reactions.js?v=oculaire-impact-005';
export const TAUNTS=Object.freeze([
 Object.freeze({id:'rire-cascade',label:'Ha-ha-ha / rire en cascade',duration:.78}),
 Object.freeze({id:'gnagnagna',label:'Gna-gna-gnère / moquerie nasale',duration:.82}),
 Object.freeze({id:'prout-ricanement',label:'Prrt-hi-hi / souffle et ricanement',duration:.76})
]);
const VOWELS={a:[760,1190,2650],e:[430,1910,2700],i:[310,2250,3000]};
const SYLLABLES=[
 [[.025,.12,355,265,'a'],[.20,.115,330,245,'a'],[.37,.13,300,215,'a'],[.56,.16,255,185,'a']],
 [[.025,.145,235,265,'e'],[.205,.145,265,290,'e'],[.395,.13,240,225,'e'],[.56,.21,290,195,'e']],
 [[.04,.17,115,85,'rasp'],[.30,.13,400,345,'i'],[.49,.19,360,230,'i']]
];
const TABLE=Float32Array.from({length:2049},(_,i)=>Math.sin(i/2048*Math.PI*2));
function sine(phase){const t=(phase-Math.floor(phase))*2048,i=t|0;return TABLE[i]+(TABLE[i+1]-TABLE[i])*(t-i);}

// Original, nonverbal formant synthesis. Render once at AudioContext creation;
// the game reuses three short mono buffers, never speech synthesis or a network file.
export function synthesizeTaunt(index,sampleRate=48000){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new RangeError('OCULAIRE: fréquence audio hors plage 8000–192000 Hz.');
 if(!Number.isInteger(index)||!TAUNTS[index])throw new RangeError('OCULAIRE: moquerie inconnue.');
 const data=new Float32Array(Math.ceil(TAUNTS[index].duration*sampleRate));let random=0x91f3+index*97;
 const noise=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/2147483648-1;};
 for(const [offset,length,high,low,vowel]of SYLLABLES[index]){
  const count=Math.floor(length*sampleRate),begin=Math.floor(offset*sampleRate),formants=VOWELS[vowel];let phase=0;
  const harmonics=Math.min(22,Math.floor(sampleRate*.43/Math.max(high,low))),weights=[];
  for(let h=1;h<=harmonics;h++){
   const hz=h*(high+low)*.5;
   weights[h]=formants?(.045+formants.reduce((sum,f,n)=>sum+[1,.66,.25][n]*Math.exp(-(((hz-f)/[170,230,350][n])**2)),0))/Math.sqrt(h):1/h;
  }
  for(let n=0;n<count&&begin+n<data.length;n++){
   const u=n/count,t=n/sampleRate,envelope=Math.sin(Math.PI*u)**.65*Math.min(1,t/.009,(length-t)/.016);
   const f0=high+(low-high)*u+Math.sin(t*73)*3;phase+=f0/sampleRate;let voiced=0;
   for(let h=1;h<=harmonics;h++)voiced+=sine(phase*h)*weights[h];
   const flutter=vowel==='rasp'?.25+.75*Math.sin(t*30*Math.PI)**2:1;
   const breath=noise()*(vowel==='rasp'?.18:.035)*(1-u);
   data[begin+n]+=(voiced*flutter+breath)*envelope;
  }
 }
 let mean=0;for(const value of data)mean+=value/data.length;
 let peak=0;for(let i=0;i<data.length;i++){data[i]-=mean;peak=Math.max(peak,Math.abs(data[i]));}
 for(let i=0;i<data.length;i++){
  const edge=Math.min(1,i/(sampleRate*.004),(data.length-1-i)/(sampleRate*.008));data[i]=data[i]/(peak||1)*.82*edge;
 }
 return data;
}
