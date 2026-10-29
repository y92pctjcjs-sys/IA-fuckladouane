import {routeData,routeSvg,elevationSvg,STAGE_COLORS} from './route-atlas.js?v=fld-world-002';
import {STAGES,LENGTH} from './track.js?v=fld-world-002';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),at=Math.max(0,Math.min(LENGTH,Number(query.get('at'))||0));
addEventListener('keydown',event=>{if(event.key==='Escape'&&query.get('embedded')==='1'){event.preventDefault();parent.postMessage({type:'fld-atlas-close'},location.origin);}});
if(query.get('embedded')==='1'){document.body.classList.add('embedded');$('returnToRace').hidden=true;}
let stage=-1,zoom=1;
for(const [i,label]of ['13 KM / EN ENTIER',...STAGES.map((s,i)=>`0${i+1} / ${['ORIGINES','FORÊT','OMERTA','CONTRÔLE','SWAGISTAN'][i]}`)].entries()){
 const button=document.createElement('button');button.textContent=label;button.dataset.stage=i-1;button.setAttribute('aria-pressed',String(i===0));button.addEventListener('click',()=>{stage=i-1;zoom=1;render();});$('stages').append(button);
}
const descriptions={industrial:'Béton, quais et entrepôts. L’origine est encore un dossier ouvert.',open:'Talus boisés, clairières et lignes lointaines. Gardez les bords de route en vue.',tunnel:'Le ciel disparaît. Le rythme des lumières guide la traversée.',control:'Voies de service, clôtures et bâtiments de contrôle.',frontier:'La ville se dessine. La dernière frontière prépare l’arrivée.'};
function render(){
 const data=routeData(stage);$('routeMap').innerHTML=routeSvg(stage,at);$('routeMap').style.width=zoom*100+'%';$('mapTitle').textContent=stage<0?'PARCOURS ENTIER / 13 KM':`0${stage+1} / ${STAGES[stage].name}`;
 for(const button of $('stages').children)button.setAttribute('aria-pressed',String(Number(button.dataset.stage)===stage));
 $('places').replaceChildren();for(const place of data.landmarks){
  const i=STAGES.findIndex(s=>place.s>=s.start&&place.s<s.end),card=document.createElement('article');card.className='place-card';card.style.setProperty('--stage-color',STAGE_COLORS[i]);
  const km=document.createElement('small');km.textContent=`${(place.s/1000).toFixed(2).replace('.',',')} KM / 0${i+1}`;const title=document.createElement('h2');title.textContent=place.name;const copy=document.createElement('p');copy.textContent=descriptions[place.kind];card.append(km,title,copy);$('places').append(card);
 }
 $('blockades').replaceChildren();for(const row of data.blockades){const div=document.createElement('div');div.className='control-row';const km=document.createElement('span');km.textContent=(row.s/1000).toFixed(2).replace('.',',')+' KM';const side=document.createElement('b');side.textContent='OUVERTURE '+row.opening;div.append(km,side);$('blockades').append(div);}
 $('elevation').innerHTML=elevationSvg();$('zoomOut').disabled=zoom<=1;$('zoomIn').disabled=zoom>=2;
}
$('zoomIn').addEventListener('click',()=>{zoom=Math.min(2,zoom+.5);$('routeMap').style.width=zoom*100+'%';$('zoomOut').disabled=false;$('zoomIn').disabled=zoom>=2;});
$('zoomOut').addEventListener('click',()=>{zoom=Math.max(1,zoom-.5);$('routeMap').style.width=zoom*100+'%';$('zoomIn').disabled=false;$('zoomOut').disabled=zoom<=1;});
render();
