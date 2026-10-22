import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const files=['app.js','matrix.js','arcade.js','core.js','drop.js'];
for(const folder of ['course/','course/assets/','course/tools/','course/tests/'])for(const file of readdirSync(new URL(folder,root)))if(/\.(?:mjs|cjs|js)$/.test(file))files.push(folder+file);
for(const file of files){const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL(file,root))],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`Syntaxe vérifiée : ${files.length} fichiers (portail, modules, données, outils et tests de course).`);
