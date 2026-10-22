import {createRace,createClock,start,pause,resume} from './simulation.js';
import {createRenderer} from './renderer.js';
import {createInput} from './input.js';
import {createAudio} from './audio.js';
import {createSave,createPreferences} from './storage.js';
import {LENGTH,STAGES,SECTORS,sectorAt,blockadeAhead,beatAt} from './track.js';
const $=id=>document.getElementById(id);
const formatTime=t=>`${Math.floor(t/60)}:${(t%60).toFixed(2).padStart(5,'0')}`;
let storage;try{storage=localStorage;}catch{storage=null;}
const save=createSave(storage),preferences=createPreferences(storage),systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
const isReduced=()=>preferences.data.motion==='reduced'||systemMotion.matches;
const renderer=createRenderer($('world'),isReduced(),undefined,preferences.data.quality);
let race=createRace(),clock,recorded,previousState,frame,lastTime=0,lastHud=0;
const audio=createAudio(()=>{pause(race);input.clear();$('audioStatus').textContent='Audio interrompu par l’appareil. Reprenez explicitement la course pour le réactiver.';paintState();});
const input=createInput($('controls'),togglePause,()=>preferences.data);
clock=createClock(race,input.read);
for(const stage of STAGES.slice(1)){const marker=document.createElement('b');marker.style.left=`${stage.start/LENGTH*100}%`;$('routeTrack').append(marker);}
function settings(){
 const data=preferences.data;$('controls').dataset.mode=data.steering;
 audio.configure(data);renderer.configure({quality:data.quality,reduced:isReduced()});
 for(const [id,key] of [['masterVolume','master'],['musicVolume','music'],['effectsVolume','effects'],['sensitivity','sensitivity']])$(id).value=data[key]*100;
 for(const [id,key] of [['steeringMode','steering'],['quality','quality'],['motion','motion']])$(id).value=data[key];
}
for(const [id,key] of [['masterVolume','master'],['musicVolume','music'],['effectsVolume','effects'],['sensitivity','sensitivity']])$(id).addEventListener('input',()=>{preferences.update({[key]:Number($(id).value)/100});if(key==='sensitivity')input.clear();audio.configure(preferences.data);});
for(const [id,key] of [['steeringMode','steering'],['quality','quality'],['motion','motion']])$(id).addEventListener('change',()=>{input.clear();preferences.update({[key]:$(id).value});settings();});
systemMotion.addEventListener?.('change',settings);settings();
function togglePause(){
 if(race.state==='PAUSE'){if(document.hidden||$('instructions').open||$('preferences').open)return;resume(race);audio.resume();}
 else{pause(race);input.clear();audio.suspend();}lastTime=performance.now();paintState();
}
function recordLabel(){return save.data.bestTime===null?'13 KM / AUCUNE ARRIVÉE ENREGISTRÉE':`13 KM / ${formatTime(save.data.bestTime)} · ${save.data.bestScore} PTS`;}
function launch(){
 input.clear();race=createRace();clock=createClock(race,input.read);recorded=null;lastTime=performance.now();renderer.reset();audio.reset();start(race);audio.resume();hud();paintState();
}
$('start').addEventListener('click',launch);$('replay').addEventListener('click',launch);
$('pause').addEventListener('click',togglePause);$('resume').addEventListener('click',togglePause);
$('sound').addEventListener('click',async()=>{
 $('sound').disabled=true;const enabled=await audio.toggle();$('sound').disabled=false;$('sound').textContent=enabled?'SON ON':'SON OFF';$('sound').setAttribute('aria-pressed',String(enabled));
 $('audioStatus').textContent=enabled?'ORIGINE NON DÉCLARÉE / composition originale FLD · 108 BPM.':'Son désactivé. Vos volumes restent mémorisés.';
 if(race.state==='PAUSE'||document.hidden)audio.suspend();
});
function openDialog(id){pause(race);input.clear();audio.suspend();paintState();$(id).showModal();}
for(const id of ['help','menuHelp','pauseHelp'])$(id).addEventListener('click',()=>openDialog('instructions'));
for(const id of ['settings','pauseSettings'])$(id).addEventListener('click',()=>openDialog('preferences'));
for(const id of ['instructions','preferences'])$(id).addEventListener('close',()=>{input.clear();if(race.state==='MENU')$('start').focus();else if(race.state==='PAUSE')$('resume').focus();if(race.state==='MENU'&&audio.enabled)audio.resume();});
function showResult(){
 const r=race.result;$('resultKicker').textContent=r.won?'SWAGISTAN / ORIGINE RETROUVÉE':'DOSSIER DE SAISIE / FIN DE TRAJET';
 $('resultTitle').innerHTML=r.ending==='love'?'QUELQU’UN.<br>POUR UNE FOIS.':r.won?'MADE IN<br>SWAGISTAN.':'INTERCEPTÉ.';
 $('resultCopy').textContent=r.ending==='love'?'Après le contrôle, quelqu’un. Aucun frais de douane sur ça.':r.won?'La veste annonçait une origine. Vous venez de la rejoindre. Les gyrophares restent de l’autre côté.':`${r.reason}. La douane a votre voiture. Pas votre prochain essai.`;
 $('resultTime').textContent=formatTime(r.time);$('resultScore').textContent=r.score.toLocaleString('fr-FR');$('resultHealth').textContent=`${Math.round(r.health)}%`;$('resultDrifts').textContent=r.drifts;
 $('bestResult').textContent=recordLabel();$('souvenir').hidden=!save.data.love;
}
function paintState(){
 const state=race.state,panel={MENU:'menu',PAUSE:'pausePanel',RESULTS:'results'}[state];
 if(race.result&&recorded!==race.result){save.record(race.result);recorded=race.result;}
 $('overlay').hidden=!panel;$('overlay').classList.toggle('is-centered',panel!=='menu');
 for(const id of ['menu','pausePanel','results','failure'])$(id).hidden=id!==panel;
 $('hud').hidden=state==='MENU'||state==='RESULTS';$('controls').hidden=state!=='RACE';
 $('pause').disabled=!['COUNTDOWN','RACE','ARRIVAL','INTERCEPTION','PAUSE'].includes(state);
 $('pause').setAttribute('aria-label',state==='PAUSE'?'Reprendre le jeu':'Mettre en pause');
 $('countdown').hidden=state!=='COUNTDOWN';$('cinema').hidden=!['ARRIVAL','INTERCEPTION'].includes(state);$('recordMenu').textContent=recordLabel();
 if(state==='RESULTS'){showResult();$('replay').focus();}if(state==='PAUSE')$('resume').focus();if(state==='COUNTDOWN')document.activeElement?.blur();
 if(['RESULTS','PAUSE'].includes(state))audio.suspend();previousState=state;
}
function hud(){
 $('speed').textContent=Math.round(race.speed*3.6).toString().padStart(3,'0');$('nitro').value=race.nitro;$('health').value=race.health;$('pressure').value=race.pressure;
 $('nitroValue').textContent=Math.round(race.nitro);$('healthValue').textContent=Math.round(race.health);$('pressureValue').textContent=`${Math.round(race.pressure)}%`;
 $('time').textContent=formatTime(race.time);$('progress').style.width=`${Math.min(100,race.s/LENGTH*100)}%`;$('sector').textContent=SECTORS[sectorAt(race.s)];
 $('remaining').textContent=`SWAGISTAN / ${Math.max(0,(LENGTH-race.s)/1000).toFixed(1).replace('.',',')} KM`;
 const row=blockadeAhead(race.s,race.speed),direction=row?row.gap<0?'GAUCHE':row.gap>0?'DROITE':'CENTRE':'';
 const beat=beatAt(race.s),showBeat=race.s-beat.s<130&&race.s>100;
 $('alert').textContent=race.capture>.15?`ENCERCLÉ / REPARTEZ AVANT ${Math.ceil(4-race.capture)} S`:row?`BARRAGE ${Math.ceil((row.s-race.s)/10)*10} M / OUVERTURE ${direction}`:race.drifting?'DRIFT / NITRO EN RECHARGE':showBeat?beat.label:'';
 if(race.state==='COUNTDOWN')$('countdown').textContent=Math.max(1,Math.ceil(race.countdown));
 if(['ARRIVAL','INTERCEPTION'].includes(race.state)){
  const t=race.cinematic,love=race.result.ending==='love';
  $('cinemaKicker').textContent=race.result.won?t<3?'DERNIÈRE FRONTIÈRE / FRANCHIE':'SWAGISTAN / VOUS ÊTES ARRIVÉ':'CONTRÔLE TERMINÉ';
  $('cinemaText').textContent=!race.result.won?race.result.reason:t<3?'Les sirènes restent derrière.':t<5?'MADE IN SWAGISTAN.':love?t<7?'— Tu vas où ?':t<9?'— Je crois que je suis arrivé.':t<11?'— Monte.':'POUR UNE FOIS, T’AS TROUVÉ QUELQU’UN.':'L’origine n’est plus une hypothèse.';
 }
 const m=renderer.metrics;$('renderStats').textContent=`AFFICHAGE ${m.fps??'—'} FPS · DÉFINITION ×${m.ratio} · ${m.calls??'—'} DRAWS · ${m.chunks} TRONÇONS. Mesure de ce navigateur.`;
}
function animate(now){
 const delta=lastTime?Math.min(.25,(now-lastTime)/1000):0;lastTime=now;clock.advance(delta);if(previousState!==race.state)paintState();
 renderer.render(race,delta);audio.update(race);if(now-lastHud>75){hud();lastHud=now;}frame=requestAnimationFrame(animate);
}
function hide(){pause(race);input.clear();audio.suspend();paintState();cancelAnimationFrame(frame);frame=null;lastTime=0;}
function show(){if(frame===null){lastTime=0;frame=requestAnimationFrame(animate);}}
document.addEventListener('visibilitychange',()=>document.hidden?hide():show());
addEventListener('pagehide',hide);addEventListener('pageshow',()=>{if(!document.hidden)show();});
addEventListener('blur',()=>{pause(race);input.clear();audio.suspend();paintState();});
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();hide();$('overlay').hidden=false;document.querySelectorAll('#overlay .panel').forEach(p=>p.hidden=true);$('failure').hidden=false;document.querySelector('.tools').hidden=true;$('failureMessage').textContent='Le contexte graphique a été interrompu. Rechargez la page pour reprendre la route.';});
paintState();frame=requestAnimationFrame(animate);
