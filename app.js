import {MatrixRain} from "./matrix.js?v=4";
import {Arcade} from "./arcade.js?v=4";
import {SCAN_DURATION, SCAN_STEPS, scanState, improvedRecord} from "./core.js?v=4";

const $ = id => document.getElementById(id);
const STORAGE_KEY = "fld.ia.protocol.v4";
const ACHIEVEMENTS = [
  {id: "scan", name: "Origine douteuse", hint: "Laissez le bureau rendre son verdict.", detail: "Votre veste a été reconnue coupable d’IA."},
  {id: "seams", name: "Sous les coutures", hint: "Les trois points ne sont pas décoratifs.", detail: "Étiquette, poitrine, ourlet : aucun témoin fiable."},
  {id: "human", name: "Un alibi presque crédible", hint: "Les humains adorent préciser qu’ils le sont.", detail: "C’est exactement ce qu’une IA aurait dit."},
  {id: "omerta", name: "Omerta", hint: "Le silence est aussi une commande.", detail: "Votre silence a été transmis à personne."},
  {id: "swagistan", name: "Sans frontière", hint: "Un territoire tient dans un mot.", detail: "Visa accordé. Le pays n’a jamais demandé de passeport."},
  {id: "runner", name: "Colis introuvable", hint: "Atteignez 600 points dans Douane Run.", detail: "Le bureau cherche encore dans quelle voie vous êtes."},
  {id: "breaker", name: "Abolition du poste", hint: "Effacez les 35 briques de la frontière.", detail: "Plus de mur. Le personnel est en pause indéfinie."},
  {id: "memory", name: "Mémoire restituée", hint: "Récupérez les huit paires saisies.", detail: "Toutes les pièces ont retrouvé leur double."}
];
const VALID_IDS = new Set(ACHIEVEMENTS.map(item => item.id));
function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}
const saved = readSaved();
const data = {
  unlocked: new Set(Array.isArray(saved.unlocked) ? saved.unlocked.filter(id => VALID_IDS.has(id)) : []),
  records: Object.fromEntries(["runner", "breaker", "memory"].map(id => [id, Math.max(0, Math.floor(Number(saved.records?.[id]) || 0))])),
  scans: Math.min(999999, Math.max(0, Math.floor(Number(saved.scans) || 0))),
  motion: typeof saved.motion === "boolean" ? saved.motion : !matchMedia("(prefers-reduced-motion: reduce)").matches
};
function persist() {
  try {
    // Merge another open tab's discoveries rather than erasing them with an older session.
    const latest = readSaved();
    if (Array.isArray(latest.unlocked)) latest.unlocked.filter(id => VALID_IDS.has(id)).forEach(id => data.unlocked.add(id));
    for (const game of ["runner", "breaker", "memory"]) data.records[game] = improvedRecord(game, data.records[game], latest.records?.[game]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({...data, unlocked: [...data.unlocked]}));
  } catch { /* Session state stays usable when storage is unavailable. */ }
}
let toastTimer = 0;
function notify(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => { $("toast").hidden = true; }, 4200);
}
function refreshArchives() {
  $("achievementGrid").replaceChildren();
  ACHIEVEMENTS.forEach((item, i) => {
    const unlocked = data.unlocked.has(item.id);
    const card = document.createElement("article");
    card.className = "achievement" + (unlocked ? " unlocked" : "");
    const index = document.createElement("span");
    index.textContent = String(i + 1).padStart(2, "0") + (unlocked ? " / PIÈCE RÉCUPÉRÉE" : " / SOUS SCELLÉS");
    const title = document.createElement("h3");
    title.textContent = unlocked ? item.name : "DOSSIER " + String(i + 1).padStart(2, "0");
    const detail = document.createElement("p");
    detail.textContent = unlocked ? item.detail : item.hint;
    card.append(index, title, detail);
    $("achievementGrid").append(card);
  });
  $("eggCount").textContent = data.unlocked.size + "/8";
  $("archiveCount").textContent = String(data.unlocked.size).padStart(2, "0") + " / 08 PIÈCES";
}
function unlock(id) {
  if (!VALID_IDS.has(id) || data.unlocked.has(id)) return;
  data.unlocked.add(id);
  persist();
  refreshArchives();
  notify("ARCHIVE OUVERTE / " + ACHIEVEMENTS.find(item => item.id === id).name);
}
function refreshRecords() {
  ["runner", "breaker", "memory"].forEach(id => {
    $(id + "Record").textContent = data.records[id] ? "RECORD " + data.records[id] + (id === "memory" ? " COUPS" : " PTS") : "RECORD —";
  });
}
function record(game, score) {
  data.records[game] = improvedRecord(game, data.records[game], score);
  persist();
  refreshRecords();
}

let soundOn = false, audioContext;
const ambient = $("ambient");
ambient.volume = .2;
function renderSound() {
  $("soundBtn").setAttribute("aria-pressed", String(soundOn));
  $("soundBtn").querySelector("span").textContent = soundOn ? "ON" : "OFF";
}
function tone(hz = 440) {
  if (!soundOn || !audioContext || document.hidden || audioContext.state !== "running") return;
  const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(hz, audioContext.currentTime);
  gain.gain.setValueAtTime(.025, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .09);
  oscillator.connect(gain);gain.connect(audioContext.destination);
  oscillator.start();oscillator.stop(audioContext.currentTime + .1);
}
$("soundBtn").addEventListener("click", () => {
  soundOn = !soundOn;
  renderSound();
  if (!soundOn) {ambient.pause();audioContext?.suspend().catch(() => {});return;}
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (AudioEngine) {
    try {
      audioContext ||= new AudioEngine();
      audioContext.resume().then(() => tone(520)).catch(() => {});
    } catch { /* The bundled ambience remains available without Web Audio. */ }
  }
  ambient.play().catch(() => {
    if (!soundOn) return;
    soundOn = false;
    renderSound();
    notify("Le navigateur a bloqué le son. Touchez SON pour réessayer.");
  });
});

const rain = new MatrixRain($("matrix"), data.motion);
function setMotion(moving, remember = true) {
  data.motion = moving;
  document.body.dataset.motion = moving ? "on" : "off";
  $("motionBtn").setAttribute("aria-pressed", String(moving));
  $("motionBtn").querySelector("span").textContent = moving ? "ON" : "OFF";
  rain.setMoving(moving);
  if (remember) persist();
}
setMotion(data.motion, false);
$("motionBtn").addEventListener("click", () => setMotion(!data.motion));
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", event => {
  if (event.matches) setMotion(false);
});
const arcade = new Arcade({onRecord: record, onUnlock: unlock, onSound: tone, notify});

let currentView = "scan";
let scan = {running: false, elapsed: 0, last: 0, frame: 0, step: -1, progress: -1, phase: -1};
let currentSerial = "FLD-" + String(data.scans + 1).padStart(4, "0");
let reportDate = "";
const phaseTitles = ["LECTURE\nDE L’ÉTIQUETTE.", "COUTURES\nSOUS PRESSION.", "BIENVENUE\nAU SWAGISTAN.", "LE BUREAU\nA DÉCIDÉ."];
function showView(view, focus = true) {
  if (!["scan", "arcade", "archives"].includes(view)) return;
  currentView = view;
  for (const name of ["scan", "arcade", "archives"]) $(name + "View").hidden = name !== view;
  document.querySelectorAll(".nav-link").forEach(button => {
    const selected = button.dataset.view === view;
    button.classList.toggle("active", selected);
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  arcade.setActive(view === "arcade");
  cancelAnimationFrame(scan.frame);
  scan.last = 0;
  if (view === "scan" && scan.running && !document.hidden) scan.frame = requestAnimationFrame(scanFrame);
  if (focus) {
    const heading = view === "scan" ? ($("analysisStage").hidden ? ($("resultStage").hidden ? $("scanHeading") : $("resultHeading")) : $("phaseTitle")) : $(view + "Heading");
    heading.focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: "instant"});
  }
}
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));

function stage(name) {
  $("introStage").hidden = name !== "intro";
  $("analysisStage").hidden = name !== "analysis";
  $("resultStage").hidden = name !== "result";
  $("scanExperience").dataset.stage = name;
}
function addLog(message, status = "OK") {
  const line = document.createElement("div");
  line.className = "log-line";
  const text = document.createElement("span");
  text.textContent = "> " + message;
  const flag = document.createElement("b");
  flag.textContent = status;
  line.append(text, flag);
  $("logBox").prepend(line);
  while ($("logBox").children.length > 4) $("logBox").lastElementChild.remove();
}
function renderScan() {
  const state = scanState(scan.elapsed);
  if (scan.progress !== state.progress) {
    scan.progress = state.progress;
    $("progressBar").style.width = state.progress + "%";
    $("progressLabel").replaceChildren(document.createTextNode(String(state.progress)), Object.assign(document.createElement("span"), {textContent: "%"}));
    $("progressTrack").setAttribute("aria-valuenow", String(state.progress));
    $("swagValue").textContent = (state.ratio * 99.9).toFixed(1).padStart(4, "0");
    $("humanValue").textContent = (100 - state.progress) + "%";
    $("territoryValue").textContent = state.ratio >= .52 ? "SWAGISTAN" : state.ratio >= .25 ? "EN TRANSIT" : "INCONNU";
  }
  if (scan.phase !== state.phase) {
    scan.phase = state.phase;
    $("phaseTitle").textContent = phaseTitles[state.phase];
    $("phaseCounter").textContent = "PHASE 0" + (state.phase + 1) + " / 04";
    $("systemStatus").textContent = ["CONTACT ÉTABLI", "COUTURES SOUS SURVEILLANCE", "TERRITOIRE NON RECONNU", "VERDICT EN PRÉPARATION"][state.phase];
    document.querySelectorAll(".phase-row>span").forEach((phase, i) => {
      phase.classList.toggle("active", state.phase === i);
      if (state.phase === i) phase.setAttribute("aria-current", "step");
      else phase.removeAttribute("aria-current");
    });
  }
  if (scan.step !== state.index) {
    // Catch every crossed step even if the browser renders a delayed frame.
    for (let i = scan.step + 1; i <= state.index; i++) addLog(SCAN_STEPS[i][2], SCAN_STEPS[i][3]);
    scan.step = state.index;
    tone(180 + state.phase * 85);
  }
}
function scanFrame(now) {
  if (!scan.running || currentView !== "scan" || document.hidden) return;
  if (scan.last) scan.elapsed += now - scan.last;
  scan.last = now;
  renderScan();
  if (scan.elapsed >= SCAN_DURATION) finishScan();
  else scan.frame = requestAnimationFrame(scanFrame);
}
function beginScan() {
  cancelAnimationFrame(scan.frame);
  scan = {running: true, elapsed: 0, last: 0, frame: 0, step: -1, progress: -1, phase: -1};
  $("logBox").replaceChildren();
  currentSerial = "FLD-" + String(data.scans + 1).padStart(4, "0");
  $("serialLabel").textContent = currentSerial;
  $("scannerTag").textContent = "SOUS SURVEILLANCE";
  stage("analysis");
  renderScan();
  $("phaseTitle").focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: "instant"});
  scan.frame = requestAnimationFrame(scanFrame);
}
function finishScan() {
  cancelAnimationFrame(scan.frame);
  scan.running = false;
  scan.last = 0;
  const storedScans = Math.max(0, Math.floor(Number(readSaved().scans) || 0));
  data.scans = Math.max(data.scans, Math.min(999999, storedScans)) + 1;
  currentSerial = "FLD-" + String(data.scans).padStart(4, "0");
  reportDate = new Date().toISOString().slice(0, 10);
  $("serialLabel").textContent = currentSerial;
  $("scannerTag").textContent = "IA CONFIRMÉE";
  $("systemStatus").textContent = "DOSSIER CLASSÉ / IA CONFIRMÉE";
  stage("result");
  unlock("scan");
  persist();
  $("resultHeading").focus({preventScroll: true});
  tone(660);
  window.scrollTo({top: 0, behavior: "instant"});
}
function resetScan() {
  cancelAnimationFrame(scan.frame);
  scan.running = false;
  scan.last = 0;
  stage("intro");
  $("systemStatus").textContent = "EN ATTENTE DU SUJET";
  $("scannerTag").textContent = "PRÊTE À SUSPECTER";
  $("scanHeading").focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: "instant"});
}
$("startBtn").addEventListener("click", beginScan);
$("skipBtn").addEventListener("click", finishScan);
$("finishBtn").addEventListener("click", finishScan);
$("restartBtn").addEventListener("click", beginScan);
$("cancelScanBtn").addEventListener("click", resetScan);
$("humanBtn").addEventListener("click", () => {
  $("humanBtn").classList.add("claimed");
  $("humanBtn").textContent = "C’EST EXACTEMENT CE QU’UNE IA DIRAIT.";
  addLog("Alibi humain reçu. Crédibilité : 0%.", "LOL");
  unlock("human");
  tone(140);
});

const seams = new Set();
const seamMessages = {
  label: "ÉTIQUETTE / Composition : 100 % d’intentions douteuses.",
  chest: "POITRINE / Le logo a refusé de décliner son identité.",
  hem: "OURLET / Buste raccourci. Les manches gardent leur longueur."
};
document.querySelectorAll("[data-seam]").forEach(button => button.addEventListener("click", () => {
  seams.add(button.dataset.seam);
  button.classList.add("found");
  button.setAttribute("aria-label", button.getAttribute("aria-label").replace("Inspecter", "Réinspecter"));
  $("inspectionCaption").textContent = seamMessages[button.dataset.seam];
  $("seamCount").textContent = "COUTURES " + seams.size + "/3";
  if (scan.running) addLog(seamMessages[button.dataset.seam], "SAISI");
  tone(390 + seams.size * 80);
  if (seams.size === 3) unlock("seams");
}));

document.addEventListener("visibilitychange", () => {
  cancelAnimationFrame(scan.frame);
  scan.last = 0;
  if (document.hidden) { ambient.pause();audioContext?.suspend().catch(() => {}); }
  else {
    if (scan.running && currentView === "scan") scan.frame = requestAnimationFrame(scanFrame);
    if (soundOn) {
      ambient.play().catch(() => {soundOn = false;renderSound();});
      audioContext?.resume().catch(() => {});
    }
  }
});

function terminalLine(message, command = false) {
  const line = document.createElement("p");
  line.textContent = message;
  if (command) line.className = "command";
  $("terminalOutput").append(line);
  while ($("terminalOutput").children.length > 30) $("terminalOutput").firstElementChild.remove();
  $("terminalOutput").scrollTop = $("terminalOutput").scrollHeight;
}
function command(raw) {
  const value = raw.trim().toLowerCase();
  if (!value) return;
  terminalLine("FLD> " + raw.trim(), true);
  switch (value) {
    case "help":
    case "aide":
      terminalLine("Commandes : HELP / OMERTA / SWAGISTAN / HUMAIN / MATRIX / CLEAR. Le sceau du bureau semble mal fixé.");
      break;
    case "omerta":
      terminalLine("Votre silence est approuvé. Aucune bouche. Aucun témoin. Bienvenue dans OMERTA.");
      unlock("omerta");break;
    case "swagistan":
      terminalLine("Territoire trouvé. Frontières : aucune. Douane : en reconversion. Visa : vous portez déjà le document.");
      unlock("swagistan");break;
    case "humain":
    case "human":
      terminalLine("Le bureau connaît cette technique. C’est exactement ce qu’une IA aurait écrit.");
      unlock("human");break;
    case "matrix":
      rain.dense = !rain.dense;
      terminalLine(rain.dense ? "Flux violet densifié. Les chiffres n’ont toujours aucun diplôme." : "Flux normal rétabli. Aucun chiffre n’a été licencié.");
      break;
    case "clear":
      $("terminalOutput").replaceChildren();
      terminalLine("Les traces ont disparu. Le bureau n’a rien vu.");break;
    case "404":
      terminalLine("Vous cherchez une frontière qui n’existe pas. Essayez de nommer le pays.");break;
    default:
      terminalLine("Commande non reconnue. Même au Swagistan. Tapez HELP.");
  }
  tone(290);
}
$("terminalForm").addEventListener("submit", event => {
  event.preventDefault();
  command($("terminalInput").value);
  $("terminalInput").value = "";
});
let sealTaps = 0, lastSeal = 0;
$("brandEgg").addEventListener("click", () => {
  const now = Date.now();
  sealTaps = now - lastSeal < 2500 ? sealTaps + 1 : 1;
  lastSeal = now;
  if (sealTaps === 5) {
    sealTaps = 0;
    unlock("omerta");
    showView("archives");
    terminalLine("SCEAU DÉVISSÉ. Vous n’étiez pas censé toucher cinq fois à ça.", true);
    $("terminalInput").focus({preventScroll: true});
  }
});
$("secret404").addEventListener("click", () => {
  showView("archives");
  terminalLine("404 / FRONTIÈRE NON TROUVÉE. Quel est le nom du territoire ?", true);
  $("terminalInput").focus({preventScroll: true});
});

let receiptURL = "";
$("closeReceipt").addEventListener("click", () => $("receiptDialog").close());
$("receiptDialog").addEventListener("close", () => {
  if (receiptURL) URL.revokeObjectURL(receiptURL);
  receiptURL = "";
  $("receiptImage").removeAttribute("src");
  $("receiptLink").removeAttribute("href");
});
$("downloadBtn").addEventListener("click", () => {
  // All variable content is constrained to a numeric serial and an ISO date.
  const certificate = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">' +
    '<rect width="900" height="1200" fill="#08050d"/><path d="M45 45H855V1155H45Z" fill="none" stroke="#bd94ff"/>' +
    '<g fill="#bd94ff" font-family="monospace"><text x="80" y="105" font-size="18">SWAGISTAN NETWORK / BUREAU DES ORIGINES DOUTEUSES</text>' +
    '<text x="80" y="210" font-size="24">' + currentSerial + ' / ' + reportDate + '</text></g>' +
    '<g fill="#f3eff8" font-family="Arial,sans-serif" font-weight="900" font-size="79"><text x="80" y="400">THIS GARMENT</text><text x="80" y="495">HAS BEEN</text><text x="80" y="590">MADE BY</text>' +
    '<text x="70" y="830" font-size="250" fill="#bd94ff">IA.</text></g>' +
    '<path d="M80 910H820" stroke="#bd94ff"/><g fill="#bd94ff" font-family="monospace"><text x="80" y="965" font-size="22">ORIGINE SYNTHÉTIQUE : 99.8%</text><text x="80" y="1005" font-size="18">HUMAN ALIBI : 0% / SHAME ON UR ASS</text>' +
    '<text x="80" y="1095" font-size="16">FUCKLADOUANE® / EXPÉRIENCE SATIRIQUE</text></g></svg>';
  if (receiptURL) URL.revokeObjectURL(receiptURL);
  receiptURL = URL.createObjectURL(new Blob([certificate], {type: "image/svg+xml;charset=utf-8"}));
  $("receiptImage").src = receiptURL;
  $("receiptLink").href = receiptURL;
  $("receiptLink").download = currentSerial + "-verdict.svg";
  $("receiptDialog").showModal();
});

$("serialLabel").textContent = currentSerial;
refreshRecords();
refreshArchives();
showView("scan", false);
