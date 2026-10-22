import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('portal audio and Pages marker remain byte-identical',()=>{
 const hashes={'ambient-loop-22s.wav':'ceffba72edbf63660e4c0071846a3b2b00611d9c','click-tone.wav':'d8073216ba1071ba66adefae75bd8bd399d239dd','.nojekyll':'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'};
 for(const [path,sha] of Object.entries(hashes)){const bytes=readFileSync(new URL('../../'+path,import.meta.url));assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),sha,path);}
});
