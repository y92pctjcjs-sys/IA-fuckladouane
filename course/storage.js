import {ROUTE_ID} from './track.js';
export const LEGACY_KEY='fld.course.v1';
export const SAVE_KEY='fld.course.v2';
export const PREFS_KEY='fld.course.preferences.v2';
const load=(storage,key)=>{try{return JSON.parse(storage?.getItem(key)||'null');}catch{return null;}};
const persist=(storage,key,data)=>{try{storage?.setItem(key,JSON.stringify(data));}catch{/* Session memory remains usable. */}};
export function createSave(storage){
  const legacy=load(storage,LEGACY_KEY),saved=load(storage,SAVE_KEY);
  const data={version:2,route:ROUTE_ID,wins:0,runs:0,bestTime:null,bestScore:0,love:legacy?.love===true};
  if(saved?.version===2&&saved.route===ROUTE_ID){
    for(const key of ['wins','runs','bestScore'])if(Number.isFinite(saved[key])&&saved[key]>=0)data[key]=Math.floor(saved[key]);
    if(Number.isFinite(saved.bestTime)&&saved.bestTime>0)data.bestTime=saved.bestTime;
    data.love ||= saved.love===true;
  }
  const recorded=new WeakSet();
  return {get data(){return {...data};},get legacy(){return legacy?.version===1?{...legacy}:null;},record(result){
    if(!result||typeof result!=='object'||recorded.has(result))return {...data};
    recorded.add(result);data.runs++;
    if(result.won){data.wins++;if(Number.isFinite(result.time)&&result.time>0)data.bestTime=data.bestTime===null?result.time:Math.min(data.bestTime,result.time);if(Number.isFinite(result.score))data.bestScore=Math.max(data.bestScore,result.score);data.love ||= result.ending==='love';}
    persist(storage,SAVE_KEY,data);return {...data};
  }};
}
export const DEFAULT_PREFERENCES=Object.freeze({master:.75,music:.65,effects:.7,quality:'auto',steering:'analog',sensitivity:1,motion:'auto'});
export function createPreferences(storage){
  let data={...DEFAULT_PREFERENCES};
  function clean(update){
    for(const key of ['master','music','effects'])if(Number.isFinite(update?.[key]))data[key]=Math.min(1,Math.max(0,update[key]));
    if(Number.isFinite(update?.sensitivity))data.sensitivity=Math.min(1.5,Math.max(.6,update.sensitivity));
    for(const [key,choices] of Object.entries({quality:['auto','eco','high'],steering:['analog','buttons'],motion:['auto','reduced']}))if(choices.includes(update?.[key]))data[key]=update[key];
  }
  clean(load(storage,PREFS_KEY));
  return {get data(){return {...data};},update(update){clean(update);persist(storage,PREFS_KEY,data);return {...data};}};
}
