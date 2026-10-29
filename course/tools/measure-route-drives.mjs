// Full fixed-step simulation with real traffic/pursuers. Not human/mobile input QA.
import {writeFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const root=process.argv[3]?pathToFileURL(resolve(process.argv[3])+'/'):new URL('../../',import.meta.url);
const [{createRace,start,createClock},{driver},{sectorAt,curvature}]=await Promise.all([import(new URL('course/simulation.js',root)),import(new URL('course/tools/driver.mjs',root)),import(new URL('course/track.js',root))]);
const options=existsSync(new URL('course/route-options.js',root))?await import(new URL('course/route-options.js',root)):null;
const SHORTCUT=options?.SHORTCUT,drivingCurvature=options?.drivingCurvature||((r)=>curvature(r.s));
const rows=[];
for(const secret of(options?[false,true]:[false]))for(let seed=1;seed<=12;seed++){
 const race=createRace(()=> 'escape',seed),sectors=new Set();start(race);
 const clock=createClock(race,()=>{
  const input=driver(race);
  if(secret&&!race.shortcutUsed&&race.s>SHORTCUT.entry-180&&race.s<SHORTCUT.entry){
   input.steer=-Math.max(-1,Math.min(1,(SHORTCUT.offset-race.x)*.38-race.vx*.12+drivingCurvature(race)*race.speed*race.speed*.065));input.nitro=false;
  }
  return input;
 });
 for(let f=0;f<60*400&&!race.result;f++){clock.advance(1/60);if(race.state==='RACE')sectors.add(sectorAt(race.s));}
 rows.push({secretRequested:secret,seed,won:race.result?.won||false,time:race.time,health:race.health,sectors:sectors.size,shortcutUsed:race.shortcutUsed,shortcutMetres:race.shortcutMetres,debrisHits:race.debrisHits,escapes:race.escapes,reason:race.result?.reason||''});
}
const report={kind:'FIXED_STEP_CONTROLLER_NOT_HUMAN_OR_IPHONE',rows,allWon:rows.every(r=>r.won),allSecretsTaken:rows.filter(r=>r.secretRequested).every(r=>r.shortcutUsed)};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));// Losing runs are part of the difficulty evidence, not an exception to hide.
if(!report.allSecretsTaken)process.exitCode=1;
