import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
function fixture(t, managed=true) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cupitor-runtime-owner-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const runtime=path.join(root,'db/js');fs.mkdirSync(runtime,{recursive:true});
  fs.copyFileSync(path.join(here,'build.sh'),path.join(runtime,'build.sh'));
  fs.writeFileSync(path.join(runtime,'snippet.js'),'globalThis.builtByCupitor = true;');
  fs.writeFileSync(path.join(runtime,'frame-boot.js'),'globalThis.frameBoot = true;');
  fs.writeFileSync(path.join(root,'.cupitor-deployed-files.json'),JSON.stringify({version:1,
    files:managed?['db/js/snippet.js','db/js/frame-boot.js']:['language.html']}));
  return {root,runtime,run:(...args)=>spawnSync('sh',['build.sh',...args],{cwd:runtime,encoding:'utf8'})};
}
test('a delivered Cupitor runtime is checked without legacy sources and cannot be rebuilt locally',t=>{
  const f=fixture(t),before=fs.readFileSync(path.join(f.runtime,'snippet.js'));
  const checked=f.run('--check');assert.equal(checked.status,0,checked.stderr);
  assert.match(checked.stdout,/Cupitor-built runtime/);
  const rebuilt=f.run();assert.equal(rebuilt.status,1);assert.match(rebuilt.stderr,/trexsatya\/cupitor/);
  assert.deepEqual(fs.readFileSync(path.join(f.runtime,'snippet.js')),before);
});
test('a broken delivered runtime fails validation',t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.runtime,'snippet.js'),'function {');
  assert.notEqual(f.run('--check').status,0);
});
test('before migration the legacy build and stale-bundle check still operate',t=>{
  const f=fixture(t,false);fs.mkdirSync(path.join(f.runtime,'src'));
  fs.writeFileSync(path.join(f.runtime,'src/10-fixture.js'),'globalThis.legacy = true;\n');
  const built=f.run();assert.equal(built.status,0,built.stderr);
  assert.equal(f.run('--check').status,0);
  fs.appendFileSync(path.join(f.runtime,'src/10-fixture.js'),'globalThis.changed = true;\n');
  assert.notEqual(f.run('--check').status,0);
});
