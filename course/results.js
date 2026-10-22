import {LENGTH, RULESET} from './track.js?v=pursuit3';

export function formatTime(t){const cs=Math.max(0,Math.round((Number.isFinite(t)?t:0)*100));return `${Math.floor(cs/6000)}:${String(Math.floor(cs/100)%60).padStart(2,'0')}.${String(cs%100).padStart(2,'0')}`;}
export function resultBadge(result){
  if(!result.won)return {rank:'—',title:'DOSSIER SAISI'};
  if(result.score>=36500&&result.health>=65)return {rank:'S',title:'INTROUVABLE'};
  if(result.score>=33500&&result.health>=35)return {rank:'A',title:'HORS CONTRÔLE'};
  if(result.score>=30000)return {rank:'B',title:'FRONTIÈRE FRANCHIE'};
  return {rank:'C',title:'PASSÉ DE JUSTESSE'};
}
export function createScoreCard(result,makeCanvas=()=>document.createElement('canvas')){
  const canvas=makeCanvas();canvas.width=1080;canvas.height=1440;
  const c=canvas.getContext('2d'),badge=resultBadge(result),green='#d0ff69',purple='#bca3ef';
  c.fillStyle='#0e0d1c';c.fillRect(0,0,1080,1440);
  c.font='16px monospace';c.fillStyle='#28223d';
  for(let col=0;col<18;col++)for(let row=0;row<16;row++)c.fillText(String((col*31+row*17)%100).padStart(2,'0'),36+col*61,32+row*89);
  c.strokeStyle='#73628f';c.lineWidth=2;c.strokeRect(38,38,1004,1364);
  const text=(value,x,y,size,color='#eee7f8',font='monospace')=>{c.fillStyle=color;c.font=`900 ${size}px ${font}`;c.fillText(value,x,y,940);};
  text('fld®',76,155,106,green,'Arial');text('SWAGISTAN MOTOR CLUB',78,195,22,purple);
  c.fillStyle=green;c.fillRect(77,226,926,2);
  text(RULESET,78,271,23,green);text(`${LENGTH/1000} KM / CINQ ÉTAPES / UNE ORIGINE`,78,311,19,purple);
  text(result.won?'MADE IN':'INTERCEPTÉ.',73,415,85,'#eee7f8','Arial');
  if(result.won)text('SWAGISTAN.',73,505,85,'#eee7f8','Arial');
  c.fillStyle='#1e1930';c.fillRect(77,548,926,152);
  text(badge.rank,101,667,120,green,'Arial');text(badge.title,254,620,33,green,'Arial');text(result.won?'FRONTIÈRE FRANCHIE':'LA PROCHAINE FUITE COMMENCE ICI',254,659,16,purple);
  text('SCORE',78,760,20,purple);text(Math.round(result.score).toLocaleString('fr-FR'),71,895,140,green,'Arial');
  const fields=[['CHRONO',formatTime(result.time)],['RÉSISTANCE',`${Math.round(result.health)} %`],['PASSAGES AU RAS',String(result.nearMisses||0)],['ÉCHAPPÉES',String(result.escapes||0)]];
  fields.forEach(([label,value],i)=>{
    const x=78+i%2*480,y=964+Math.floor(i/2)*115;
    text(label,x,y,18,purple);text(value,x,y+56,43,'#eee7f8');
  });
  c.save();c.translate(700,1212);c.rotate(-.09);c.strokeStyle=green;c.lineWidth=3;c.strokeRect(-207,-40,414,70);text(result.won?'RIEN À DÉCLARER':'REPRENDRE LA FUITE',-188,5,27,green);c.restore();
  text('ORIGINE NON DÉCLARÉE / SESSION LOCALE',78,1310,18,purple);
  text('ia.fuckladouane.com',78,1360,25,'#eee7f8');
  return canvas;
}
