// Prepare an internal static preview without changing the GitHub Pages source tree.
import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),out=resolve(root,'dist');
const names=[...new Set(execFileSync('git',['ls-files','-co','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean))];
for(const name of names){const from=resolve(root,name),to=resolve(out,name);if(!existsSync(from))continue;mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);}
mkdirSync(resolve(root,'.openai'),{recursive:true});writeFileSync(resolve(root,'.openai/hosting.json'),JSON.stringify({static:{directory:'dist'}}));
writeFileSync(resolve(out,'index.html'),'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>OCULAIRE — contrôle de coiffure</title><style>body{background:#0b0817;color:#eee;font:18px/1.6 sans-serif;padding:32px}a{display:block;margin:24px 0;color:#c8ff4d}</style><h1>OCULAIRE / coiffure et présence</h1><a href="course/oculaire-preview.html">Atelier : chevelure, regards et poursuite</a><a href="course.html">Vrai jeu : course et finale</a>');
console.log('Preview prepared in '+out);
