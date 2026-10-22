import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const files=['app.js','matrix.js','arcade.js','core.js','drop.js'];
function collect(folder){
 for(const entry of readdirSync(new URL(folder,root),{withFileTypes:true})){
  const path=folder+entry.name;
  if(entry.isDirectory()){if(path!=='course/vendor')collect(path+'/');}
  else if(/\.(?:mjs|cjs|js)$/.test(entry.name))files.push(path);
 }
}
collect('course/');
for(const file of files){const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL(file,root))],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`Syntaxe vérifiée : ${files.length} fichiers (portail, modules, données, outils et tests de course).`);
