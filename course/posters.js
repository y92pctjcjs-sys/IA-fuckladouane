import * as T from './vendor/three.module.min.js';
import {STAGES} from './track.js?v=fld-route-003';

// Original FLD street print series. One shared atlas; no external fonts or images.
export const POSTERS=Object.freeze([
  {title:['MADE IN','SWAGISTAN'],small:'OBJET 001 / ZIP JACKET',foot:'LE PAYS EXISTE. TROUVEZ-LE.',ink:'#ceff5f',paper:'#222331',art:'jacket'},
  {title:['ORIGINES','DOUTEUSES'],small:'BUREAU / DOSSIER OUVERT',foot:'LA COUTURE NE MENT PAS.',ink:'#231b32',paper:'#cabbe0',art:'file'},
  {title:['SAV','06:00–06:20'],small:'SERVICE APRÈS-VENTE / fld®',foot:'+33 P45 D3 R3MB0UR5EMEN7',ink:'#ffb66c',paper:'#241f35',art:'phone'},
  {title:['FROM','ELSEWHERE'],small:'EXPÉDITEUR NON LOCALISÉ',foot:'AUCUNE ADRESSE DE RETOUR.',ink:'#ded2f6',paper:'#2d3750',art:'route'},
  {title:['RIEN À','DÉCLARER'],small:'SWAGISTAN NETWORK / 89',foot:'MÊME PAS UNE EXCUSE.',ink:'#c9ff76',paper:'#24352f',art:'barcode'},
  {title:['STOCK','FANTÔME'],small:'INVENTAIRE / 000 PIÈCE SAISIE',foot:'LA PREUVE A QUITTÉ LE QUAI.',ink:'#e0b4f8',paper:'#352538',art:'jacket'},
  {title:['OMERTA.'],small:'ŒIL 0 / BOUCHE 0',foot:'TOUT CE QUI PASSE RESTE ICI.',ink:'#d3b5ff',paper:'#211c31',art:'eye'},
  {title:['CE TUNNEL','NE SAIT RIEN'],small:'CAMÉRA 04 / SIGNAL PERDU',foot:'ENREGISTREMENT : ABSENT.',ink:'#abc4f6',paper:'#1e263e',art:'camera'},
  {title:['SILENCE','EN TRANSIT'],small:'OMERTA / AUCUN TÉMOIN',foot:'LES MURS GARDENT LE RESTE.',ink:'#b8f4b0',paper:'#242f32',art:'wave'},
  {title:['CONTRÔLE','DU SWAG'],small:'SERVICE DES SAISIES / 89',foot:'VOTRE STYLE EST UNE PIÈCE À CONVICTION.',ink:'#172b41',paper:'#bac6d1',art:'barcode'},
  {title:['ALIBI','EN RUPTURE'],small:'BORDEREAU NON CONFORME',foot:'PROCHAIN ARRIVAGE : JAMAIS.',ink:'#f5af80',paper:'#342b3b',art:'file'},
  {title:['SERVICE','APRÈS FUITE'],small:'SAV / PORTE DÉFINITIVEMENT FERMÉE',foot:'ON TIENT À NOS CLIENTS. DE LOIN.',ink:'#ecc9e1',paper:'#3a253c',art:'phone'},
  {title:['AVIS DE','RECHERCHE'],small:'fld® 89 / ORIGINE NON DÉCLARÉE',foot:'NE VOUS ARRÊTEZ PAS POUR LIRE.',ink:'#252b3b',paper:'#d2c4ae',art:'car'},
  {title:['DERNIÈRE','FRONTIÈRE'],small:'DESTINATION / SWAGISTAN',foot:'L’ORIGINE EST DEVANT.',ink:'#d5ddff',paper:'#353652',art:'route'},
  {title:['SWAGISTAN','VOUS REÇOIT'],small:'RÉSEAU LOCAL / SIGNAL RETROUVÉ',foot:'RIEN À JUSTIFIER ICI.',ink:'#d6ffd0',paper:'#34413c',art:'skyline'},
  {title:['LA VESTE','AVAIT RAISON'],small:'MADE IN SWAGISTAN / fld®',foot:'ORIGINE RETROUVÉE.',ink:'#f4d9e9',paper:'#443649',art:'jacket'}
]);
const families=[[0,1,2,5,4],[3,4,5,2],[6,7,8,6,8,7],[9,10,12,11,4],[13,14,15,3]];
export const POSTER_SITES=Object.freeze(STAGES.flatMap((stage,index)=>{
  const spacing=index===2?140:210,sites=[];
  for(let s=stage.start+100,n=0;s<stage.end-70;s+=spacing,n++)sites.push(Object.freeze({
    s,side:n%2?1:-1,poster:families[index][n%families[index].length],kind:stage.kind,pair:n%4===2
  }));
  return sites;
}));
let resources;
export function posterAtlas(){
  if(resources)return resources;
  const w=256,h=384,canvas=document.createElement('canvas');canvas.width=w*4;canvas.height=h*4;
  const c=canvas.getContext('2d');
  const line=(points,close=false)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();c.stroke();};
  for(const [id,p] of POSTERS.entries()){
    c.save();c.translate(id%4*w,Math.floor(id/4)*h);
    c.fillStyle=p.paper;c.fillRect(0,0,w,h);c.strokeStyle=p.ink;c.fillStyle=p.ink;c.lineWidth=2;c.strokeRect(10,10,236,364);
    c.font='bold 9px monospace';c.fillText('SWAGISTAN NETWORK     fld®',22,31);
    c.font='900 29px Arial';p.title.forEach((text,i)=>c.fillText(text,20,77+i*32,217));
    c.font='bold 8px monospace';c.fillText(p.small,21,143,214);
    c.save();c.translate(26,174);c.lineWidth=3;
    if(p.art==='jacket'){
      line([[76,0],[102,0],[113,15],[147,27],[174,98],[147,110],[128,70],[128,139],[48,139],[48,70],[30,110],[4,98],[30,27],[65,15],[76,0]],true);
      line([[76,0],[65,30],[89,41],[113,15]]);line([[89,41],[89,137]]);c.font='900 19px Arial';c.fillText('fld®',97,71,33);
    }else if(p.art==='eye'){
      line([[8,55],[47,25],[88,11],[131,25],[172,55],[131,85],[88,99],[47,85],[8,55]],true);
      c.beginPath();c.arc(88,55,28,0,Math.PI*2);c.stroke();c.fillRect(82,35,12,40);line([[8,122],[172,122]]);
    }else if(p.art==='route'){
      line([[8,140],[37,115],[17,91],[62,62],[95,83],[123,46],[172,10]]);
      for(const [x,y] of [[8,140],[62,62],[123,46],[172,10]]){c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.stroke();}
      c.font='bold 13px monospace';c.fillText('89 → ORIGINE',15,15,155);
    }else if(p.art==='phone'){
      c.font='900 51px monospace';c.fillText('06:00',4,48);c.fillText('06:20',4,103);line([[5,122],[174,122]]);
    }else if(p.art==='car'){
      line([[8,96],[8,59],[29,52],[51,22],[128,22],[150,52],[173,59],[173,96],[8,96]],true);
      line([[30,52],[150,52]]);c.fillRect(18,66,27,10);c.fillRect(136,66,27,10);c.fillRect(28,99,21,20);c.fillRect(133,99,21,20);
    }else if(p.art==='camera'){
      line([[20,26],[147,26],[147,85],[20,85],[20,26]],true);line([[147,41],[174,23],[174,87],[147,69]]);line([[15,134],[173,2]]);c.fillRect(51,98,11,30);c.fillRect(27,126,61,4);
    }else if(p.art==='wave'){
      for(let i=0;i<24;i++)c.fillRect(i*7,68-((i*17)%45),3,12+((i*17)%45)*2);line([[0,137],[175,137]]);
    }else if(p.art==='skyline'){
      for(let i=0;i<10;i++){const height=30+(i*29)%100;c.fillRect(i*18,140-height,12,height);}
    }else if(p.art==='file'){
      c.strokeRect(14,2,148,141);for(let i=0;i<7;i++)c.fillRect(25,16+i*17,i%3?117:75,3);
      c.save();c.translate(29,102);c.rotate(-.18);c.fillRect(0,0,128,32);c.fillStyle=p.paper;c.font='900 16px Arial';c.fillText('NON CONFORME',5,23,118);c.restore();
    }else{
      for(let i=0,x=5;i<46;i++){const width=1+(i*7)%4;c.fillRect(x,2,width,116+(i%3)*4);x+=width+1;}
      c.font='bold 12px monospace';c.fillText('0 0 8 9   /   F L D',9,143);
    }
    c.restore();c.fillStyle=p.ink;c.font='bold 8px monospace';c.fillText(p.foot,21,347,214);
    for(let n=0;n<16;n++){c.globalAlpha=.08;c.fillRect(12+(n*67)%222,40+(n*31)%280,1+(n%3),11);}c.globalAlpha=1;
    c.restore();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
  const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});
  const geometries=POSTERS.map((_,id)=>{
    const geo=new T.PlaneGeometry(1,1),uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(id%4+uv.getX(i))/4,1-(Math.floor(id/4)+1-uv.getY(i))/4);
    return geo;
  });
  resources={texture,material,geometries};return resources;
}
export function addRoadPosters(parent,start,cube,positionOn){
  const atlas=posterAtlas();
  for(const site of POSTER_SITES){
    if(site.s<start||site.s>=start+80)continue;
    const tunnel=site.kind==='tunnel',group=new T.Group();parent.add(group);
    positionOn(group,site.s,site.side*(tunnel?9.5:13.4),tunnel?3.5:2.9);
    group.rotation.y+=site.side<0?Math.PI*.78:-Math.PI*.78;
    const count=site.pair?2:1;
    for(let n=0;n<count;n++){
      const x=(n-(count-1)/2)*2.05,id=n?(site.poster+1)%POSTERS.length:site.poster;
      const panel=new T.Mesh(atlas.geometries[id],atlas.material);panel.position.set(x,0,.055);panel.scale.set(1.8,2.7,1);group.add(panel);
      cube(group,x,0,.015,1.93,2.83,.07,'#4d4859');
      if(!tunnel){cube(group,x-.62,-1.75,.02,.09,1.3,.12,'#62565c');cube(group,x+.62,-1.75,.02,.09,1.3,.12,'#62565c');}
    }
  }
}
