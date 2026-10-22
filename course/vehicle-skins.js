// Cosmetics have an independent key and never change race physics or records.
export const APPEARANCE_KEY='fld.course.appearance.v1';
export const VEHICLE_SKINS=Object.freeze([
 {id:'nightrunner',kind:'fld',name:'NIGHTRUNNER',label:'ORIGINE',number:'01',color:'#bd83ff',paint:'#25182f',accent:'#d0ff54',secondary:'#ff4da8',metal:'#c7c8d4',glass:'#15293d',role:'ORIGINE NON DÉCLARÉE',copy:'Prune métallisé, carbone et tribal intégré aux volumes. La livrée fondatrice du Swagistan Motor Club.',detail:'TRIBAL ORIGINAL / CARBONE / JANTES FORGÉES'},
 {id:'seraph',kind:'fld',name:'SÉRAPHIN',label:'ANGÉLIQUE',number:'02',color:'#e9d8a7',paint:'#e4e9ef',accent:'#e9d49a',secondary:'#96dfff',metal:'#c9b47d',glass:'#3d5967',role:'RIEN À DÉCLARER AU PARADIS',copy:'Nacre froide, tribal champagne et jantes claires. Aéro à plumes métalliques et auréole arrière. Une apparition, toujours en fuite.',detail:'NACRE / OR CHAMPAGNE / AÉRO SÉRAPHIQUE'},
 {id:'cursed',kind:'fld',name:'MALÉDICTION',label:'CURSED',number:'03',color:'#fc36bf',paint:'#690088',accent:'#d5ff00',secondary:'#00f2ff',metal:'#d5bcfb',glass:'#301953',role:'LE SIGNAL EST POSSÉDÉ',copy:'Magenta ultraviolet, cyan et acide. Le tribal se dédouble dans une livrée saturée ; les pointes prolongent les ailes.',detail:'ULTRAVIOLET / GLITCH IMPRIMÉ / ACIDE'},
 {id:'patrol',kind:'cop',name:'INTERCEPTION',label:'BRIGADE',number:'04',color:'#80aaff',paint:'#e1e7eb',accent:'#1a3d62',secondary:'#e9414d',metal:'#b2bcc9',glass:'#182e43',role:'BRIGADE DU DERNIER PÉAGE',copy:'Blanc froid, bleu marine et filet rouge. Optiques affûtées, prises d’air creusées, rampe bleue et sérigraphie DOUANE.',detail:'BLEU DOUANE / CARROSSERIE SCULPTÉE'},
 {id:'infernal',kind:'cop',name:'INFERNAL',label:'DÉMONIAQUE',number:'05',color:'#ff6840',paint:'#241318',accent:'#b9291f',secondary:'#ff8d28',metal:'#9a7472',glass:'#2e1b24',role:'LE CONTRÔLE VIENT D’EN BAS',copy:'Noir calciné, rouge sombre, cornes profilées et grille à crocs. DOUANE et feux bleus restent reconnaissables.',detail:'NOIR CALCINÉ / CORNES / FEUX BLEUS'},
 {id:'wreck',kind:'cop',name:'ÉPAVE',label:'TOUT CASSÉ',number:'06',color:'#baac8f',paint:'#96958b',accent:'#34444a',secondary:'#c66d39',metal:'#7c8586',glass:'#24373c',role:'LA CARROSSERIE A DÉJÀ TOUT VU',copy:'Tôle enfoncée, capot froissé, peinture abrasée, verre fissuré et optique brisée. Une épave visuelle ; les mêmes règles de poursuite.',detail:'TÔLE DÉFORMÉE / VERRE FISSURÉ / MÉTAL EXPOSÉ'}
]);
export const skinsFor=kind=>VEHICLE_SKINS.filter(s=>s.kind===kind);
export function resolveSkin(kind='fld',id=''){return VEHICLE_SKINS.find(s=>s.kind===kind&&s.id===id)||VEHICLE_SKINS.find(s=>s.kind===kind)||VEHICLE_SKINS[0];}
export function patrolSkin(appearance,index){return appearance?.cop==='mixed'||!appearance?.cop?['patrol','infernal','wreck'][index%3]:resolveSkin('cop',appearance.cop).id;}
export function createAppearance(storage){
 let data={fld:'nightrunner',cop:'mixed'};
 function clean(update){for(const kind of ['fld','cop'])if(typeof update?.[kind]==='string'&&(kind==='cop'&&update[kind]==='mixed'||VEHICLE_SKINS.some(s=>s.kind===kind&&s.id===update[kind])))data[kind]=update[kind];}
 try{clean(JSON.parse(storage?.getItem(APPEARANCE_KEY)||'null'));}catch{}
 return {get data(){return {...data};},update(update){clean(update);try{storage?.setItem(APPEARANCE_KEY,JSON.stringify(data));}catch{}return {...data};}};
}
