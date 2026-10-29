import {sample,stageAt,STAGES,LENGTH,BLOCKADES,curvature,screenSide} from './track.js?v=fld-world-002';
export const STAGE_COLORS=Object.freeze(['#62dfff','#d0ff50','#ce9aff','#ffb54c','#f2f1ea']);
export const LANDMARKS=Object.freeze([
 {s:640,id:'quai89',name:'Quai 89',kind:'industrial',side:1,offset:31},
 {s:1280,id:'water',name:'Stock fantôme',kind:'industrial',side:-1,offset:48},
 {s:2880,id:'grove',name:'Futaie des étiquettes',kind:'open',side:1,offset:28},
 {s:3760,id:'relay',name:'Relais From Elsewhere',kind:'open',side:-1,offset:40},
 {s:5280,id:'omerta',name:'Bouche OMERTA',kind:'tunnel',side:1,offset:9.9},
 {s:7840,id:'annex',name:'Bureau annexe',kind:'control',side:1,offset:28},
 {s:9440,id:'depot',name:'Dépôt hors inventaire',kind:'control',side:-1,offset:36},
 {s:11680,id:'gates',name:'Portes du Swagistan',kind:'frontier',side:1,offset:26,bothSides:true},
 {s:12920,id:'threshold',name:'Dernier seuil',kind:'frontier',side:-1,offset:19}
]);
export function routeSamples(from=0,to=LENGTH,step=32){
 from=Math.max(0,Math.min(LENGTH,from));to=Math.max(from,Math.min(LENGTH,to));const points=[];
 for(let s=from;s<to;s+=step)points.push({s,...sample(s)});points.push({s:to,...sample(to)});return points;
}
export function routeData(stage=-1){
 const selected=Number.isInteger(stage)&&stage>=0&&stage<STAGES.length?STAGES[stage]:null,from=selected?.start??0,to=selected?.end??LENGTH;
 return {from,to,points:routeSamples(from,to),stages:STAGES.map((x,i)=>({...x,index:i,color:STAGE_COLORS[i]})).filter(s=>s.end>from&&s.start<to),landmarks:LANDMARKS.filter(x=>x.s>=from&&x.s<=to),blockades:BLOCKADES.filter(x=>x.s>=from&&x.s<=to).map(x=>({...x,opening:screenSide(x.gap)}))};
}
export function routeSvg(stage=-1,position=0){
 const data=routeData(stage),height=stage<0?1100:760,p=data.points,minX=Math.min(...p.map(v=>v.x)),maxX=Math.max(...p.map(v=>v.x)),minZ=Math.min(...p.map(v=>v.z)),maxZ=Math.max(...p.map(v=>v.z));
 const scale=Math.min(205/Math.max(1,maxX-minX), (height-130)/Math.max(1,maxZ-minZ)),left=76+(205-(maxX-minX)*scale)/2;
 const project=v=>({x:left+(v.x-minX)*scale,y:65+(maxZ-v.z)*scale}),path=points=>points.map((v,i)=>{const q=project(v);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;}).join('');
 const parts=[`<svg viewBox="0 0 640 ${height}" role="img" aria-label="Tracé exact du parcours, étapes et barrages"><defs><pattern id="atlas-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#263240" stroke-width=".5"/></pattern></defs><rect width="640" height="${height}" fill="#111923"/><rect width="640" height="${height}" fill="url(#atlas-grid)"/><path d="${path(p)}" fill="none" stroke="#3b4856" stroke-width="18" stroke-linecap="round"/>`];
 for(const s of data.stages){
  const from=Math.max(data.from,s.start),to=Math.min(data.to,s.end),points=routeSamples(from,to),q=project(sample((from+to)/2));
  parts.push(`<path d="${path(points)}" fill="none" stroke="${s.color}" stroke-width="6" stroke-linecap="round"/><path d="M${q.x+18} ${q.y}H322" stroke="${s.color}" stroke-width="1" opacity=".55"/><text x="338" y="${q.y-7}" fill="${s.color}" font-family="monospace" font-size="19" font-weight="700">0${s.index+1}</text><text x="338" y="${q.y+17}" fill="#f2f1ea" font-family="Arial,sans-serif" font-size="16">${['ORIGINES','FROM ELSEWHERE','OMERTA','CONTRÔLE','SWAGISTAN'][s.index]}</text>`);
 }
 for(let km=Math.ceil(data.from/1000);km<=Math.floor(data.to/1000);km++){
  const q=project(sample(km*1000));parts.push(`<path d="M${q.x-14} ${q.y}h-11" stroke="#9ba7b4"/><text x="25" y="${q.y+4}" fill="#b6c0cf" font-size="12" font-family="monospace">${km} KM</text>`);
 }
 for(const b of data.blockades){const q=project(sample(b.s));parts.push(`<path d="M${q.x} ${q.y-6}l6 6-6 6-6-6Z" fill="#ffb54c" stroke="#111923" stroke-width="2"><title>Contrôle ${(b.s/1000).toFixed(2)} km / ouverture ${b.opening}</title></path>`);}
 for(const l of data.landmarks){const q=project(sample(l.s));parts.push(`<circle cx="${q.x+20}" cy="${q.y}" r="3" fill="#62dfff"><title>${l.name}</title></circle>`);}
 for(const [s,label]of [[data.from,'DÉPART'],[data.to,stage<0?'SWAGISTAN':'ÉTAPE SUIVANTE']]){
  const q=project(sample(s));parts.push(`<circle cx="${q.x}" cy="${q.y}" r="8" fill="#111923" stroke="#f2f1ea" stroke-width="2"/><text x="338" y="${q.y+5}" fill="#b6c0cf" font-size="12" font-family="monospace">${label}</text>`);
 }
 const at=Math.max(0,Math.min(LENGTH,Number(position)||0));if(at>=data.from&&at<=data.to){const q=project(sample(at));parts.push(`<circle cx="${q.x}" cy="${q.y}" r="13" fill="#d0ff50" stroke="#111923" stroke-width="4"/><text x="338" y="${q.y+43}" fill="#d0ff50" font-size="12" font-family="monospace">VOUS / ${(at/1000).toFixed(1).replace('.',',')} KM</text>`);}
 parts.push('</svg>');return parts.join('');
}
export function elevationSvg(){
 const points=routeSamples(0,LENGTH,80),min=Math.min(...points.map(p=>p.y)),max=Math.max(...points.map(p=>p.y));
 const path=points.map((p,i)=>`${i?'L':'M'}${(p.s/LENGTH*600+10).toFixed(1)},${(95-(p.y-min)/(max-min)*70).toFixed(1)}`).join('');
 return `<svg viewBox="0 0 620 115" role="img" aria-label="Profil du relief des treize kilomètres"><path d="${path}L610 105H10Z" fill="#d0ff5015"/><path d="${path}" fill="none" stroke="#d0ff50" stroke-width="2"/><path d="M10 105H610" stroke="#475364"/></svg>`;
}
export function curveAt(s){const k=curvature(s);return {s,curvature:k,direction:Math.abs(k)<.0005?'OUVERT':screenSide(k),radius:Math.abs(k)<1e-7?Infinity:1/Math.abs(k),stage:stageAt(s).kind};}
