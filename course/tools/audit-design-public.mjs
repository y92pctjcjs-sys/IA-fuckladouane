// Read-only HTTP evidence. Run before changing the public base; never use timings as a GPU benchmark.
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),host='https://ia.fuckladouane.com/';
const base=process.argv[2]||'e40304b73d5127b7d6be2b5daa5b701ed0b984ec';
const localVersion=path=>execFileSync('git',['show',base+':'+path],{cwd:fileURLToPath(root),maxBuffer:8*1024*1024});
const paths=new Set(['course.html','course/style.css','course/assets/fld-tribal.png']);
async function graph(path){
 if(paths.has(path)&&path!=='course/boot.js')return;
 paths.add(path);const source=localVersion(path).toString('utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.\/[^'"]+\.js)(?:\?[^'"]*)?['"]/g)){
  const next=new URL(match[1],new URL(path,root)).pathname.slice(root.pathname.length);
  if(!paths.has(next))await graph(next);
 }
}
await graph('course/boot.js');
const rows=[],queue=[...paths],sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await Promise.all(Array.from({length:4},async()=>{
 while(queue.length){const path=queue.shift(),start=performance.now();try{
  const response=await fetch(host+path+'?design-audit='+base.slice(0,7),{signal:AbortSignal.timeout(25000)}),bytes=Buffer.from(await response.arrayBuffer()),local=localVersion(path);
  rows.push({path,status:response.status,bytes:bytes.length,transferMs:Math.round(performance.now()-start),localSha256:sha(local),servedSha256:sha(bytes),equal:response.ok&&sha(local)===sha(bytes)});
 }catch(error){rows.push({path,error:String(error)});}}
}));
rows.sort((a,b)=>a.path.localeCompare(b.path));
const report={date:new Date().toISOString(),kind:'HTTP_BYTES_NOT_WEBGL',base,host,allEqual:rows.every(r=>r.equal),resources:rows};
await writeFile(new URL('../validation/'+(process.argv[3]||'design-public-base.json'),import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({allEqual:report.allEqual,checked:rows.length,failures:rows.filter(r=>!r.equal)}));
if(!report.allEqual)process.exitCode=1;
