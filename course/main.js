import {createRace, createClock, start, pause, resume} from './simulation.js';
import {createRenderer} from './renderer.js';
import {createInput} from './input.js';
import {createAudio} from './audio.js';
import {createSave} from './storage.js';
import {LENGTH, SECTORS, sectorAt, BLOCKADES} from './track.js';
const $ = id => document.getElementById(id);
const formatTime = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
let storage; try { storage = localStorage; } catch { storage = null; }
const save = createSave(storage), audio = createAudio();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const renderer = createRenderer($('world'), reduced.matches);
let race = createRace(), clock, recorded, previousState, frame, lastTime = 0, lastHud = 0;
const input = createInput($('controls'), togglePause);
clock = createClock(race, input.read);
function togglePause() {
  if (race.state === 'PAUSE') { if (document.hidden || $('instructions').open) return; resume(race); audio.resume(); }
  else { pause(race); input.clear(); audio.suspend(); }
  paintState();
}
function recordLabel() { return save.data.bestTime === null ? 'RECORD / AUCUNE FUITE ENREGISTRÉE' : `MEILLEURE FUITE / ${formatTime(save.data.bestTime)} · ${save.data.bestScore} PTS`; }
function launch() {
  input.clear(); race = createRace(); clock = createClock(race, input.read); recorded = null; lastTime = performance.now();
  renderer.reset(); start(race); audio.resume(); hud(); paintState();
}
$('start').addEventListener('click', launch); $('replay').addEventListener('click', launch);
$('pause').addEventListener('click', togglePause); $('resume').addEventListener('click', togglePause);
$('sound').addEventListener('click', async () => {
  const enabled = await audio.toggle(); $('sound').textContent = enabled ? 'SON ON' : 'SON OFF'; $('sound').setAttribute('aria-pressed', String(enabled));
  if (race.state === 'PAUSE' || document.hidden) audio.suspend();
});
function help() { pause(race); input.clear(); audio.suspend(); paintState(); $('instructions').showModal(); }
for (const id of ['help', 'menuHelp', 'pauseHelp']) $(id).addEventListener('click', help);
$('instructions').addEventListener('close', () => { input.clear(); if (race.state === 'MENU') $('start').focus(); else if (race.state === 'PAUSE') $('resume').focus(); });
function result() {
  if (recorded !== race.result) { save.record(race.result); recorded = race.result; }
  const r = race.result;
  $('resultKicker').textContent = r.won ? 'DOSSIER DE FUITE / CLASSÉ SANS SUITE' : 'DOSSIER DE SAISIE / FIN DE TRAJET';
  $('resultTitle').innerHTML = r.ending === 'love' ? 'QUELQU’UN.<br>POUR UNE FOIS.' : r.won ? 'FRONTIÈRE<br>FRANCHIE.' : 'INTERCEPTÉ.';
  $('resultCopy').textContent = r.ending === 'love' ? 'AUCUN FRAIS DE DOUANE SUR ÇA.' : r.won ? 'Les gyrophares restent derrière. Votre dossier aussi.' : `${r.reason}. La douane a votre voiture. Pas votre prochain essai.`;
  $('resultTime').textContent = formatTime(r.time); $('resultScore').textContent = r.score.toLocaleString('fr-FR');
  $('resultHealth').textContent = `${Math.round(r.health)}%`; $('resultDrifts').textContent = r.drifts;
  $('bestResult').textContent = recordLabel(); $('souvenir').hidden = !save.data.love;
}
function paintState() {
  const state = race.state, panel = {MENU: 'menu', PAUSE: 'pausePanel', RESULTS: 'results'}[state];
  $('overlay').hidden = !panel;
  $('overlay').classList.toggle('is-centered', panel !== 'menu');
  for (const id of ['menu', 'pausePanel', 'results', 'failure']) $(id).hidden = id !== panel;
  $('hud').hidden = state === 'MENU' || state === 'RESULTS';
  $('controls').hidden = state !== 'RACE'; $('pause').disabled = !['COUNTDOWN','RACE','ARRIVAL','INTERCEPTION','PAUSE'].includes(state);
  $('pause').setAttribute('aria-label', state === 'PAUSE' ? 'Reprendre le jeu' : 'Mettre en pause');
  $('countdown').hidden = state !== 'COUNTDOWN'; $('cinema').hidden = !['ARRIVAL', 'INTERCEPTION'].includes(state);
  $('recordMenu').textContent = recordLabel();
  if (state === 'RESULTS') { result(); $('replay').focus(); }
  if (state === 'PAUSE') $('resume').focus();
  if (state === 'COUNTDOWN') document.activeElement?.blur();
  if (['RESULTS','PAUSE'].includes(state)) audio.suspend();
  previousState = state;
}
function hud() {
  $('speed').textContent = Math.round(race.speed * 3.6).toString().padStart(3, '0');
  $('nitro').value = race.nitro; $('health').value = race.health; $('pressure').value = race.pressure;
  $('nitroValue').textContent = Math.round(race.nitro); $('healthValue').textContent = Math.round(race.health);
  $('pressureValue').textContent = `${Math.round(race.pressure)}%`;
  $('time').textContent = formatTime(race.time); $('progress').style.width = `${Math.min(100, race.s / LENGTH * 100)}%`;
  $('sector').textContent = SECTORS[sectorAt(race.s)];
  const upcoming = BLOCKADES.find(b => b.s > race.s && b.s - race.s < 140);
  $('alert').textContent = race.capture > .15 ? `ENCERCLÉ / REPARTEZ AVANT ${Math.ceil(4 - race.capture)} S` : upcoming ? `BARRAGE / ${Math.ceil((upcoming.s - race.s) / 10) * 10} M — CHERCHEZ L’OUVERTURE` : race.drifting ? 'DRIFT / NITRO EN RECHARGE' : '';
  if (race.state === 'COUNTDOWN') $('countdown').textContent = Math.max(1, Math.ceil(race.countdown));
  if (race.state === 'ARRIVAL' || race.state === 'INTERCEPTION') {
    const t = race.cinematic, love = race.result.ending === 'love';
    $('cinemaKicker').textContent = love ? 'QUELQUE PART APRÈS LA FRONTIÈRE' : race.result.won ? 'SWAGISTAN / ENTRÉE NON DÉCLARÉE' : 'CONTRÔLE TERMINÉ';
    $('cinemaText').textContent = love ? t < 5 ? 'Les sirènes s’éloignent.' : t < 7 ? '— Tu vas où ?' : t < 9 ? '— Au Swagistan.' : t < 10.5 ? '— Monte.' : 'POUR UNE FOIS, T’AS TROUVÉ QUELQU’UN.' : race.result.won ? 'RIEN À DÉCLARER. TOUJOURS.' : race.result.reason;
  }
}
function animate(now) {
  const delta = lastTime ? Math.min(.25, (now - lastTime) / 1000) : 0; lastTime = now;
  clock.advance(delta);
  if (previousState !== race.state) paintState();
  renderer.render(race, delta); audio.update(race);
  if (now - lastHud > 50) { hud(); lastHud = now; }
  frame = requestAnimationFrame(animate);
}
function hide() { pause(race); input.clear(); audio.suspend(); paintState(); cancelAnimationFrame(frame); frame = null; lastTime = 0; }
function show() { if (frame === null) { lastTime = 0; frame = requestAnimationFrame(animate); } }
document.addEventListener('visibilitychange', () => document.hidden ? hide() : show());
addEventListener('pagehide', hide); addEventListener('pageshow', () => { if (!document.hidden) show(); });
addEventListener('blur', () => { pause(race); input.clear(); audio.suspend(); paintState(); });
$('world').addEventListener('webglcontextlost', e => { e.preventDefault(); hide(); $('overlay').hidden = false; document.querySelectorAll('#overlay .panel').forEach(p => p.hidden = true); $('failure').hidden = false; $('failureMessage').textContent = 'Le contexte graphique a été interrompu. Rechargez la page pour reprendre la route.'; });
paintState(); frame = requestAnimationFrame(animate);
