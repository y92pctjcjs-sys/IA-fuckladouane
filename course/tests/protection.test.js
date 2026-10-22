import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url));
const blobHash=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
test('original protocol modules, stylesheet, tests and domain remain byte-identical to main',()=>{
 const originals={
 'app.js':'228ffee32cf4d91f0aaf715c2e3fea0f26a40723',
 'arcade.js':'a0fa9dafde93eb68e86fe76d08ca45b0db014dcd',
 'core.js':'ec5e55609b36ec3d88c55385c7d2c906911b8e83',
 'drop.js':'27540ed100cb8007a2d365afcaa2f4aa7b0eddec',
 'matrix.js':'08f97e494b4cf19e647d373fbdd3913ea9ee602a',
 'styles.css':'a9f2bf94e4a749e2b7eca3060913009628daa919',
 'CNAME':'7c783958c06a77cf730f8e509017785d986e51c9',
 'tests/core.test.js':'c638926af3bc370cf347edd6da4fcef51c0e401f',
 'tests/drop.test.js':'5873393b3ca52f74131408eb542bd58dd8a82abc'};
 for(const [p,sha] of Object.entries(originals)) assert.equal(blobHash(read(p)),sha,p);
});
test('index has precisely two additions: an isolated stylesheet and a new-tab link after the intact footer',()=>{
 let html=read('index.html').toString();
 assert.match(html,/href="\.\/course.html" target="_blank" rel="noopener"/);
 assert.ok(html.indexOf('class="fld-course-entry"')>html.indexOf('id="secret404"'));
 html=html.replace('  <link rel="stylesheet" href="./course-entry.css">\n','').replace(/^  <aside class="fld-course-entry".*<\/aside>\n/m,'');
 assert.equal(blobHash(Buffer.from(html)),'0fa94b82587811392bd9eb37b008b0a9f987f0cc');
 const references=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);assert.equal(references.some(p=>p.startsWith('./course/')),false);
});
test('button stylesheet selectors are prefixed and the engine is a locally vendored precise version',()=>{
 const css=read('course-entry.css').toString();
 const selectors=css.replace(/@media[^\{]+\{/g,'').split('}').map(rule=>rule.split('{')[0].trim()).filter(Boolean);
 selectors.forEach(s=>assert.ok(s.startsWith('.fld-course-entry'),s));
 const vendor=read('course/vendor/three.module.min.js').toString();assert.match(vendor,/160/);assert.match(read('course/vendor/LICENSE-three.txt').toString(),/MIT License/);
 for(const p of readdirSync(new URL('../',import.meta.url)).filter(p=>p.endsWith('.js'))){const text=read('course/'+p).toString();assert.doesNotMatch(text,/(?:fetch\(|https?:\/\/|from\s+['"]https?:)/,p);}
});
