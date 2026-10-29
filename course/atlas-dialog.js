import {LENGTH} from './track.js?v=fld-route-003';
// Shared by the actual game and the component fixture. Opening never resumes a race.
export function createAtlasDialog(dialog,frame){
 const win=dialog.ownerDocument.defaultView,origin=win.location.origin;
 const closeFromMap=event=>{
  if(event.origin!==origin||event.source!==frame.contentWindow||event.data?.type!=='fld-atlas-close'||!dialog.open)return;
  dialog.close();
 };
 win.addEventListener('message',closeFromMap);
 return {open(position=0,branch=null,discovered=false){
  const url=new URL('./map.html',import.meta.url);url.searchParams.set('embedded','1');if(branch)url.searchParams.set('branch',branch);if(discovered)url.searchParams.set('discovered','1');url.searchParams.set('at',String(Math.round(Math.max(0,Math.min(LENGTH,Number(position)||0)))));
  frame.src=url.href;if(!dialog.open)dialog.showModal();
 },dispose(){win.removeEventListener('message',closeFromMap);}};
}
