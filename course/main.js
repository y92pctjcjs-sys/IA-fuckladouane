import {createRace,createClock,start,pause,resume} from './simulation.js?v=fld-design-001';
import {createRenderer} from './renderer.js?v=oculaire-004';
import {createInput} from './input.js?v=fld-design-001';
import {createAudio} from './audio.js?v=fld-design-001';
import {createSave,createPreferences} from './storage.js?v=fld-design-001';
import {LENGTH,RULESET,STAGES,SECTORS,sectorAt,blockadeAhead,beatAt,screenSide} from './track.js?v=fld-design-001';
import {formatTime,resultBadge,createScoreCard} from './results.js?v=fld-design-001';
import {createAppearance,resolveSkin} from './vehicle-skins.js?v=fld-design-001';
const $=id=>document.getElementById(id);
let storage;try{storage=localStorage;}catch{storage=null;}
const save=createSave(storage),preferences=createPreferences(storage),systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
const appearance=createAppearance(storage),cosmeticQuery=new URLSearchParams(location.search);
appearance.update({fld:cosmeticQuery.get('car'),cop:cosmeticQuery.get('patrol')});
const isReduced=()=>preferences.data.motion==='reduced'||systemMotion.matches;
const renderer=createRenderer($('world'),isReduced(),undefined,preferences.data.quality,appearance.data);
$('vehicleName').textContent='fld® / '+resolveSkin('fld',appearance.data.fld).name;
let race=createRace(),clock,recorded,previousState,frame,lastTime=0,lastHud=0;
let proofURL=null,proofFile=null,proofResult=null;
const audio=createAudio(()=>{pause(race);input.clear();$('audioStatus').textContent='Audio interrompu par l’appareil. Reprenez explicitement la course pour le réactiver.';paintState();});
const input=createInput($('controls'),togglePause,()=>preferences.data);
clock=createClock(race,input.read);
for(const stage of STAGES.slice(1)){const marker=document.createElement('b');marker.style.left=`${stage.start/LENGTH*100}%`;$('routeTrack').append(marker);}
function settings(){
 const data=preferences.data;$('controls').dataset.mode=data.steering;
 audio.configure(data);renderer.configure({quality:data.quality,reduced:isReduced()});
 for(const [id,key] of [['masterVolume','master'],['musicVolume','music'],['effectsVolume','effects'],['engineVolume','engine'],['sensitivity','sensitivity']])$(id).value=data[key]*100;
 $('engineSound').checked=data.engineEnabled;
 for(const [id,key] of [['steeringMode','steering'],['quality','quality'],['motion','motion']])$(id).value=data[key];
}
for(const [id,key] of [['masterVolume','master'],['musicVolume','music'],['effectsVolume','effects'],['engineVolume','engine'],['sensitivity','sensitivity']])$(id).addEventListener('input',()=>{preferences.update({[key]:Number($(id).value)/100});if(key==='sensitivity')input.clear();audio.configure(preferences.data);});
$('engineSound').addEventListener('change',()=>{preferences.update({engineEnabled:$('engineSound').checked});audio.configure(preferences.data);});
for(const [id,key] of [['steeringMode','steering'],['quality','quality'],['motion','motion']])$(id).addEventListener('change',()=>{input.clear();preferences.update({[key]:$(id).value});settings();});
systemMotion.addEventListener?.('change',settings);settings();
function togglePause(){
 if(race.state==='PAUSE'){if(document.hidden||$('instructions').open||$('preferences').open)return;resume(race);audio.resume();}
 else{pause(race);input.clear();audio.suspend();}lastTime=performance.now();paintState();
}
function recordLabel(){return save.data.bestTime===null?'RECHERCHÉ V3 / AUCUNE ARRIVÉE ENREGISTRÉE':`RECHERCHÉ V3 / ${formatTime(save.data.bestTime)} · ${save.data.bestScore} PTS`;}
function freshSeed(){try{const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0];}catch{return (Date.now()^Math.floor(performance.now()*1000))>>>0;}}
function launch(){
 input.clear();if(proofURL)URL.revokeObjectURL(proofURL);proofURL=null;proofFile=null;proofResult=null;
 race=createRace(undefined,freshSeed());renderer.setAppearance(appearance.data,race.seed);clock=createClock(race,input.read);recorded=null;lastTime=performance.now();renderer.reset();audio.reset();start(race);audio.resume();hud();paintState();
}
$('start').addEventListener('click',launch);$('replay').addEventListener('click',launch);
$('pause').addEventListener('click',togglePause);$('resume').addEventListener('click',togglePause);
$('sound').addEventListener('click',async()=>{
 $('sound').disabled=true;const enabled=await audio.toggle();$('sound').disabled=false;$('sound').textContent=enabled?'SON ON':'SON OFF';$('sound').setAttribute('aria-pressed',String(enabled));
 $('audioStatus').textContent=enabled?'HORIZON NON DÉCLARÉ / composition originale FLD · 108 BPM. Moteur réglable séparément.':'Son désactivé. Vos volumes restent mémorisés.';
 if(race.state==='PAUSE'||document.hidden)audio.suspend();
});
function openDialog(id){pause(race);input.clear();audio.suspend();paintState();$(id).showModal();}
for(const id of ['help','menuHelp','pauseHelp'])$(id).addEventListener('click',()=>openDialog('instructions'));
for(const id of ['settings','pauseSettings'])$(id).addEventListener('click',()=>openDialog('preferences'));
for(const id of ['instructions','preferences'])$(id).addEventListener('close',()=>{input.clear();if(race.state==='MENU')$('start').focus();else if(race.state==='PAUSE')$('resume').focus();if(race.state==='MENU'&&audio.enabled)audio.resume();});
$('proof').addEventListener('click',()=>{if(proofURL)$('scoreProof').showModal();});
$('scoreProof').addEventListener('close',()=>$('proof').focus());
$('proofShare').addEventListener('click',async()=>{if(!proofFile)return;try{await navigator.share({files:[proofFile],title:'FLD — MADE IN SWAGISTAN'});}catch(error){if(error.name!=='AbortError')$('proofHint').textContent='Enregistrez l’image avec le lien ou maintenez votre doigt dessus.';}});
function prepareProof(r){
 if(!r.won||proofResult===r)return;proofResult=r;$('proof').disabled=true;$('proofStatus').textContent='Préparation de l’image…';
 const failed=()=>{$('proof').hidden=true;$('proofStatus').hidden=false;$('proofStatus').textContent='Image indisponible dans ce navigateur. Vous pouvez capturer l’écran du score.';};
 try{createScoreCard(r).toBlob(blob=>{
  if(proofResult!==r)return;
  if(!blob){failed();return;}
  try{
  proofURL=URL.createObjectURL(blob);const filename=`fld-swagistan-${r.score}.png`;
  try{proofFile=new File([blob],filename,{type:'image/png'});}catch{proofFile=null;}
  $('proofImage').src=proofURL;$('proofDownload').href=proofURL;$('proofDownload').download=filename;
  let shareable=false;try{shareable=Boolean(proofFile&&navigator.share&&navigator.canShare?.({files:[proofFile]}));}catch{}
  $('proofShare').hidden=!shareable;$('proof').disabled=false;$('proofStatus').textContent='Image prête.';$('proofStatus').hidden=true;
  }catch{failed();}
 },'image/png');}catch{failed();}
}
function showResult(){
 const r=race.result;$('resultKicker').textContent=r.won?'SWAGISTAN / ORIGINE RETROUVÉE':'DOSSIER DE SAISIE / FIN DE TRAJET';
 $('resultTitle').innerHTML=r.ending==='love'?'QUELQU’UN.<br>POUR UNE FOIS.':r.won?'MADE IN<br>SWAGISTAN.':'INTERCEPTÉ.';
 $('resultCopy').textContent=r.ending==='love'?'Après le contrôle, quelqu’un. Aucun frais de douane sur ça.':r.won?'Origine retrouvée. La douane reste de l’autre côté.':`${r.reason}. La douane a votre voiture. Pas votre prochain essai.`;
 $('resultTime').textContent=formatTime(r.time);$('resultScore').textContent=r.score.toLocaleString('fr-FR');$('resultHealth').textContent=`${Math.round(r.health)}%`;$('resultDrifts').textContent=r.drifts;
 const badge=resultBadge(r);$('resultRank').textContent=badge.rank;$('resultBadge').textContent=badge.title;$('resultRules').textContent=`${RULESET} / 13 KM`;
 $('resultNearMisses').textContent=r.nearMisses||0;$('resultEscapes').textContent=r.escapes||0;
 $('proof').hidden=!r.won;$('proofStatus').hidden=!r.won;prepareProof(r);
 $('bestResult').textContent=recordLabel();$('souvenir').hidden=!save.data.love;
}
function paintState(){
 const state=race.state,panel={MENU:'menu',PAUSE:'pausePanel',RESULTS:'results'}[state];
 document.body.dataset.raceState=state;
 if(race.result&&recorded!==race.result){save.record(race.result);recorded=race.result;}
 $('overlay').hidden=!panel;$('overlay').classList.toggle('is-centered',panel!=='menu');
 for(const id of ['menu','pausePanel','results','failure'])$(id).hidden=id!==panel;
 $('hud').hidden=state==='MENU'||state==='RESULTS';$('controls').hidden=state!=='RACE';
 $('pause').disabled=!['COUNTDOWN','RACE','ARRIVAL','INTERCEPTION','PAUSE'].includes(state);
 $('pause').setAttribute('aria-label',state==='PAUSE'?'Reprendre le jeu':'Mettre en pause');
 $('countdown').hidden=state!=='COUNTDOWN';$('cinema').hidden=!['ARRIVAL','INTERCEPTION'].includes(state);$('recordMenu').textContent=recordLabel();
 if(state==='RESULTS'){showResult();$('overlay').scrollTop=0;$('results').focus({preventScroll:true});}if(state==='PAUSE')$('resume').focus();if(state==='COUNTDOWN')document.activeElement?.blur();
 if(['RESULTS','PAUSE'].includes(state))audio.suspend();previousState=state;
}
function hud(){
 $('speed').textContent=Math.round(race.speed*3.6).toString().padStart(3,'0');$('nitro').value=race.nitro;$('health').value=race.health;$('pressure').value=race.pressure;
 $('nitroValue').textContent=Math.round(race.nitro);$('healthValue').textContent=Math.round(race.health);$('pressureValue').textContent=`${Math.round(race.pressure)}%`;
 const rear=race.cops.filter(c=>c.active&&race.s-c.s>-6&&race.s-c.s<75);
 for(const [i,c] of race.cops.entries()){
  const dot=$(`copDot${i}`);dot.hidden=!rear.includes(c);
  dot.style.left=`${Math.max(5,Math.min(95,50-(c.x-race.x)*6))}%`;dot.style.top=`${Math.max(5,Math.min(31,8+(race.s-c.s)*.3))}px`;
  dot.classList.toggle('radar-attack',['follow','flank','encircle'].includes(c.phase));
 }
 const nearest=rear.reduce((a,c)=>!a||Math.abs(race.s-c.s)<Math.abs(race.s-a.s)?c:a,null);
 $('rearThreat').textContent=nearest?`RÉTRO / ${Math.abs(nearest.x-race.x)<1.1?'DANS L’AXE':screenSide(nearest.x-race.x)}`:'RÉTRO / LIBRE';
 $('time').textContent=formatTime(race.time);$('progress').style.width=`${Math.min(100,race.s/LENGTH*100)}%`;$('sector').textContent=SECTORS[sectorAt(race.s)];
 $('remaining').textContent=`SWAGISTAN / ${Math.max(0,(LENGTH-race.s)/1000).toFixed(1).replace('.',',')} KM`;
 const row=blockadeAhead(race.s,race.speed),direction=row?screenSide(row.gap):'';
 const beat=beatAt(race.s),showBeat=race.s-beat.s<130&&race.s>100;
 const revealed=race.time-race.lastRevealTime<4;
 $('alert').classList.toggle('undercover-alert',revealed&&!row);
 $('alert').textContent=race.capture>.15?`ENCERCLÉ / REPARTEZ AVANT ${Math.ceil(4-race.capture)} S`:row?`BARRAGE ${Math.ceil((row.s-race.s)/10)*10} M / OUVERTURE ${direction}`:revealed?'VÉHICULE BANALISÉ / DOUANE À BORD':race.drifting?'DRIFT / NITRO EN RECHARGE':showBeat?beat.label:'';
 if(race.state==='COUNTDOWN')$('countdown').textContent=Math.max(1,Math.ceil(race.countdown));
 if(['ARRIVAL','INTERCEPTION'].includes(race.state)){
  const t=race.cinematic,love=race.result.ending==='love';
  $('cinemaKicker').textContent=race.result.won?t<3?'DERNIÈRE FRONTIÈRE / FRANCHIE':'SWAGISTAN / VOUS ÊTES ARRIVÉ':'CONTRÔLE TERMINÉ';
  $('cinemaText').textContent=!race.result.won?race.result.reason:t<3?'Les sirènes restent derrière.':t<5?'MADE IN SWAGISTAN.':love?t<7?'— Tu vas où ?':t<9?'— Je crois que je suis arrivé.':t<11?'— Monte.':'POUR UNE FOIS, T’AS TROUVÉ QUELQU’UN.':'L’origine n’est plus une hypothèse.';
 }
 const m=renderer.metrics;$('renderStats').textContent=`AFFICHAGE ${m.fps??'—'} FPS · DÉFINITION ×${m.ratio} · ${m.calls??'—'} DRAWS · ${m.chunks} TRONÇONS. Mesure de ce navigateur.`;
 const whisper=renderer.oculaireStatus.caption,caption=$('oculaireWhisper');
 caption.hidden=race.state!=='RACE'||!whisper||Boolean($('alert').textContent);if(caption.textContent!==whisper)caption.textContent=whisper;
}
function animate(now){
 const delta=lastTime?Math.min(.25,(now-lastTime)/1000):0;lastTime=now;clock.advance(delta);if(previousState!==race.state)paintState();
 renderer.render(race,delta);audio.update(race);if(now-lastHud>75){hud();lastHud=now;}frame=requestAnimationFrame(animate);
}
function hide(){pause(race);input.clear();audio.suspend();paintState();cancelAnimationFrame(frame);frame=null;lastTime=0;}
function show(){if(frame===null){lastTime=0;frame=requestAnimationFrame(animate);}}
document.addEventListener('visibilitychange',()=>document.hidden?hide():show());
addEventListener('pagehide',hide);addEventListener('pageshow',event=>{if(event.persisted&&storage){appearance.update(createAppearance(storage).data);renderer.setAppearance(appearance.data,race.seed);$('vehicleName').textContent='fld® / '+resolveSkin('fld',appearance.data.fld).name;}if(!document.hidden)show();});
addEventListener('blur',()=>{pause(race);input.clear();audio.suspend();paintState();});
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();hide();$('overlay').hidden=false;document.querySelectorAll('#overlay .panel').forEach(p=>p.hidden=true);$('failure').hidden=false;document.querySelector('.tools').hidden=true;$('failureMessage').textContent='Le contexte graphique a été interrompu. Rechargez la page pour reprendre la route.';});
paintState();$('start').disabled=false;$('menu').removeAttribute('aria-busy');frame=requestAnimationFrame(animate);
