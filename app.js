const root = document.documentElement;
const tabButtons = [...document.querySelectorAll('.tab-btn[data-tab], .side-link[data-tab]')];
const panels = [...document.querySelectorAll('[data-tab-panel]')];
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const drawer = document.getElementById('drawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const scanTrigger = document.getElementById('scanTrigger');
const logList = document.getElementById('logList');

function setTab(tab){
  document.querySelectorAll('.tab-btn[data-tab], .side-link[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  panels.forEach(panel => panel.classList.toggle('active', panel.dataset.tabPanel === tab));
  history.replaceState(null, '', `#${tab}`);
  closeDrawer();
}

for (const btn of tabButtons) btn.addEventListener('click', () => setTab(btn.dataset.tab));
document.querySelectorAll('[data-jump]').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.jump)));

const hash = location.hash.replace('#','');
if (hash && panels.some(panel => panel.dataset.tabPanel === hash)) setTab(hash);

function openDrawer(){
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  drawerBackdrop.hidden = false;
  menuToggle?.setAttribute('aria-expanded','true');
}
function closeDrawer(){
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  drawerBackdrop.hidden = true;
  menuToggle?.setAttribute('aria-expanded','false');
}
menuToggle?.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
menuClose?.addEventListener('click', closeDrawer);
drawerBackdrop?.addEventListener('click', closeDrawer);

function syncThemeLabel(){
  themeToggle.textContent = root.getAttribute('data-mode') === 'state' ? 'Mode sombre' : 'Mode état';
}
if (localStorage.getItem('laww-v6-theme') === 'state') root.setAttribute('data-mode','state');
syncThemeLabel();
themeToggle?.addEventListener('click', () => {
  if (root.getAttribute('data-mode') === 'state') {
    root.removeAttribute('data-mode');
    localStorage.setItem('laww-v6-theme', 'dark');
  } else {
    root.setAttribute('data-mode','state');
    localStorage.setItem('laww-v6-theme', 'state');
  }
  syncThemeLabel();
});

function getDailyRage(){
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const curve = Math.sin((hour + minute / 60) / 24 * Math.PI) * 42 + 38;
  const noise = Math.cos((hour + minute / 60) / 24 * Math.PI * 3) * 8;
  return Math.max(8, Math.min(96, Math.round(curve + noise)));
}

function updateRage(){
  const rage = getDailyRage();
  const fill = document.getElementById('rageFill');
  const pct = document.getElementById('ragePercent');
  const state = document.getElementById('rageState');
  const hint = document.getElementById('rageHint');
  fill.style.width = `${rage}%`;
  pct.textContent = `${rage}%`;
  if (rage < 30) {
    state.textContent = 'Stable';
    hint.textContent = 'Calme relatif.';
  } else if (rage < 65) {
    state.textContent = 'Tension';
    hint.textContent = 'Pression administrative modérée.';
  } else {
    state.textContent = 'Critique';
    hint.textContent = 'Charge émotionnelle élevée.';
  }
}

function randomFrom(list){ return list[Math.floor(Math.random() * list.length)]; }
function runScan(){
  const friction = 48 + Math.floor(Math.random() * 45);
  const recours = 22 + Math.floor(Math.random() * 67);
  const statuses = ['exploitable', 'instable', 'sous lecture', 'archivé partiel'];
  document.getElementById('scanFriction').textContent = `${friction}%`;
  document.getElementById('scanRecours').textContent = `${recours}%`;
  document.getElementById('scanStatus').textContent = randomFrom(statuses);
  document.getElementById('anomalyState').textContent = randomFrom(['détection partielle','incohérence détectée','signal faible']);
  document.getElementById('readState').textContent = randomFrom(['ouverte','verrouillée','surveillée']);
  document.getElementById('exitState').textContent = randomFrom(['protocole disponible','en attente','sortie différée']);
  pushLog(`analyse relancée — friction ${friction}%`);
}

function pushLog(text){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const li = document.createElement('li');
  li.textContent = `${hh}:${mm} — ${text}`;
  logList.prepend(li);
  while (logList.children.length > 5) logList.removeChild(logList.lastChild);
}

scanTrigger?.addEventListener('click', runScan);

updateRage();
runScan();
pushLog('couche principale chargée');
pushLog('mascotte authentique initialisée');
pushLog('logo buggé caché armé');
setInterval(updateRage, 60000);
setInterval(() => pushLog(randomFrom([
  'activité enregistrée',
  'lecture d’archives actualisée',
  'surcouche bug surveillée',
  'signature R revalidée',
  'état du portail stabilisé'
])), 9000);
