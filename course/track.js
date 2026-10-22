// One route definition for driving, scenery, events, audio and records. Metres.
export const ROUTE_ID = 'swagistan-13k-v3-pursuit';
export const RULESET = 'RECHERCHÉ / V3';
export const LENGTH = 13000;
export const HALF_WIDTH = 8;
export const STAGES = Object.freeze([
  {start:0, end:2200, name:'BUREAU DES ORIGINES DOUTEUSES', kind:'industrial', fog:'#181329', music:0},
  {start:2200, end:5200, name:'FROM ELSEWHERE', kind:'open', fog:'#131b33', music:1},
  {start:5200, end:7400, name:'TUNNEL OMERTA', kind:'tunnel', fog:'#261936', music:2},
  {start:7400, end:10500, name:'ZONE DE CONTRÔLE', kind:'control', fog:'#19243a', music:3},
  {start:10500, end:LENGTH, name:'DERNIÈRE FRONTIÈRE', kind:'frontier', fog:'#30253d', music:4}
]);
export const SECTORS = STAGES.map((stage,i)=>`${String(i+1).padStart(2,'0')} / ${stage.name}`);
export const sectorAt = s => {const i=STAGES.findIndex(stage=>s<stage.end);return i<0?STAGES.length-1:Math.max(0,i);};
export const stageAt = s => STAGES[sectorAt(s)];
// A new road situation about every 30–40 seconds, including breathing room.
export const BEATS = Object.freeze([
  {s:0, pressure:.55, label:'MADE IN SWAGISTAN / RETROUVEZ L’ORIGINE'},
  {s:1400, pressure:.78, label:'AVIS DE RECHERCHE / FLD 89'},
  {s:2900, pressure:.22, label:'FROM ELSEWHERE / ROUTE OUVERTE'},
  {s:4400, pressure:.82, label:'OMERTA / ENTRÉE DU TUNNEL'},
  {s:5900, pressure:.95, label:'OMERTA / GARDER LE SILENCE'},
  {s:7200, pressure:.35, label:'LA SORTIE EST DEVANT'},
  {s:8600, pressure:1, label:'CONTRÔLE DU SWAG'},
  {s:10100, pressure:.3, label:'SWAGISTAN / SIGNAL REÇU'},
  {s:11600, pressure:1, label:'DERNIÈRE FRONTIÈRE'}
]);
export function beatAt(s) {return BEATS.findLast?.(b=>s>=b.s)||[...BEATS].reverse().find(b=>s>=b.s)||BEATS[0];}
export function pressureAt(s) {return beatAt(s).pressure;}
const STEP=4,points=[];
function heading(s) {
  // Long arcs outside; measured S bends through the tunnel and control zone.
  return .40*Math.sin(s/510)+.20*Math.sin(s/190)+.10*Math.sin(s/93);
}
function elevation(s) {return 4*Math.sin(s/440)+2.5*Math.sin(s/960)+10*Math.exp(-(((s-3650)/800)**2));}
let x=0,z=0;
for(let s=0;s<=LENGTH+480;s+=STEP){
  if(s){const mid=heading(s-STEP/2);x+=Math.sin(mid)*STEP;z+=Math.cos(mid)*STEP;}
  points.push({s,x,y:elevation(s),z,angle:heading(s)});
}
export function sample(s,lateral=0){
  const q=Math.max(0,Math.min(points.length-1.001,s/STEP)),i=Math.floor(q),t=q-i,a=points[i],b=points[i+1];
  const angle=a.angle+(b.angle-a.angle)*t;
  return {x:a.x+(b.x-a.x)*t+Math.cos(angle)*lateral,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t-Math.sin(angle)*lateral,angle};
}
export const curvature=s=>(heading(s+2)-heading(s-2))/4;
export const BLOCKADES=Object.freeze([
  {s:620,xs:[-5,0]}, {s:1800,xs:[0,5]},
  {s:4100,xs:[-5,5]}, {s:5650,xs:[-5,0]},
  {s:6900,xs:[0,5]}, {s:8050,xs:[-5,5]},
  {s:9250,xs:[-5,0]}, {s:10100,xs:[0,5]},
  {s:11700,xs:[-5,5]}, {s:12600,xs:[-5,0]}
].map(row=>Object.freeze({...row,gap:[-5,0,5].find(x=>row.xs.every(o=>Math.abs(x-o)>=2.7))})));
export const warningDistance=speed=>Math.max(150,Math.max(0,speed)*3.2+25);
export function blockadeAhead(s,speed){return BLOCKADES.find(b=>b.s>s&&b.s-s<=warningDistance(speed))||null;}
export const DIMENSIONS=Object.freeze({player:{halfWidth:.95,halfLength:2.05},traffic:{halfWidth:.95,halfLength:2.05},cop:{halfWidth:.98,halfLength:2.12},barrier:{halfWidth:1.65,halfLength:.5}});
// The chase camera looks along +Z: its screen-right axis is road-local -X.
// Input stays semantic (right = +1); only this boundary converts to world space.
export const screenSteerToRoad = value => -value;
export const screenSide = lateral => lateral > 0 ? 'GAUCHE' : lateral < 0 ? 'DROITE' : 'CENTRE';
