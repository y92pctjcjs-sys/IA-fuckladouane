// Read-only HTTP evidence. Run before changing the public base; never use timings as a GPU benchmark.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),host='https://ia.fuckladouane.com/';
const paths=new Set(['course.html','course/style.css','course/assets/fld-tribal.png']);
async function graph(path){
 if(paths.has(path)&&path!=='course/boot.js')return;
 paths.add(path);const source=await readFile(new URL(path,root),'utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.\/[^'"]+\.js)(?:\?[^'"]*)?['"]/g)){
  const next=new URL(match[1],new URL(path,root)).pathname.slice(root.pathname.length);
  if(!paths.has(next))await graph(next);
 }
}
await graph('course/boot.js');
const rows=[],queue=[...paths],sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await Promise.all(Array.from({length:4},async()=>{
 while(queue.length){const path=queue.shift(),start=performance.now();try{
  const response=await fetch(host+path,{signal:AbortSignal.timeout(25000)}),bytes=Buffer.from(await response.arrayBuffer()),local=await readFile(new URL(path,root));
  rows.push({path,status:response.status,bytes:bytes.length,transferMs:Math.round(performance.now()-start),localSha256:sha(local),servedSha256:sha(bytes),equal:response.ok&&sha(local)===sha(bytes)});
 }catch(error){rows.push({path,error:String(error)});}}
}));
rows.sort((a,b)=>a.path.localeCompare(b.path));
const report={date:new Date().toISOString(),kind:'HTTP_BYTES_NOT_WEBGL',base:'e40304b73d5127b7d6be2b5daa5b701ed0b984ec',host,allEqual:rows.every(r=>r.equal),resources:rows};
await writeFile(new URL('../validation/design-public-base.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({allEqual:report.allEqual,checked:rows.length,failures:rows.filter(r=>!r.equal)}));
if(!report.allEqual)process.exitCode=1;
