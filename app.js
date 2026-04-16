
const root = document.documentElement;
const themeButtons = [document.getElementById('themeToggle'), document.getElementById('themeToggleMobile')].filter(Boolean);
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const drawer = document.getElementById('drawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const counters = document.querySelectorAll('[data-counter]');
const secretBtn = document.getElementById('secretBtn');
const secretModal = document.getElementById('secretModal');
const closeSecret = document.getElementById('closeSecret');
const searchInput = document.getElementById('knowledgeSearch');
const searchable = [...document.querySelectorAll('[data-search-item]')];
const pulseLines = document.querySelectorAll('[data-pulse-line]');

function syncThemeLabels(){
  const state = root.getAttribute('data-mode') === 'state';
  themeButtons.forEach(btn => btn.textContent = state ? 'Mode sombre' : 'Mode état');
}
const saved = localStorage.getItem('fld-v14-theme');
if(saved === 'state') root.setAttribute('data-mode', 'state');
syncThemeLabels();

themeButtons.forEach(btn => btn.addEventListener('click', ()=>{
  const state = root.getAttribute('data-mode') === 'state';
  if(state){
    root.removeAttribute('data-mode');
    localStorage.setItem('fld-v14-theme', 'dark');
  }else{
    root.setAttribute('data-mode', 'state');
    localStorage.setItem('fld-v14-theme', 'state');
  }
  syncThemeLabels();
}));

function openDrawer(){ drawer?.classList.add('open'); if(drawerBackdrop) drawerBackdrop.hidden = false; menuToggle?.setAttribute('aria-expanded', 'true');}
function closeDrawerFn(){ drawer?.classList.remove('open'); if(drawerBackdrop) drawerBackdrop.hidden = true; menuToggle?.setAttribute('aria-expanded', 'false');}
menuToggle?.addEventListener('click', openDrawer);
menuClose?.addEventListener('click', closeDrawerFn);
drawerBackdrop?.addEventListener('click', closeDrawerFn);
document.querySelectorAll('.drawer a').forEach(a => a.addEventListener('click', closeDrawerFn));

const animateCounter = (el) => {
  const target = Number(el.dataset.counter);
  let current = 0;
  const step = Math.max(20, Math.floor(target / 60));
  const timer = setInterval(() => {
    current += step;
    if(current >= target){ current = target; clearInterval(timer); }
    el.textContent = current.toLocaleString('fr-FR');
  }, 18);
};
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if(entry.isIntersecting){ animateCounter(entry.target); observer.unobserve(entry.target); }});
}, {threshold: .5});
counters.forEach(c => observer.observe(c));

searchInput?.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  searchable.forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

secretBtn?.addEventListener('click', ()=> secretModal?.showModal());
closeSecret?.addEventListener('click', ()=> secretModal?.close());
secretModal?.addEventListener('click', (e)=>{
  const rect = secretModal.getBoundingClientRect();
  const inside = rect.left <= e.clientX && e.clientX <= rect.right && rect.top <= e.clientY && e.clientY <= rect.bottom;
  if(!inside) secretModal.close();
});

let pulse = 0;
setInterval(()=>{
  pulse++;
  pulseLines.forEach((el, i) => {
    el.style.opacity = ((pulse + i) % 3 === 0) ? '1' : '.55';
  });
}, 1200);
