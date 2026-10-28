#!/usr/bin/env node
// Historical additive SRT recovery. Never replaces a current subtitle track.
// Run from repository root: node scripts/recover-srt-inventory.mjs [--apply]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
const BASE = 'f350695ef963a96732fb6fda2efafee1cb003c2f';
const DIR = 'db/language/swedish/srts';
const apply = process.argv.includes('--apply');
const sha = s => createHash('sha256').update(s).digest('hex');
const oldFile = path => execFileSync('git', ['show', BASE + ':' + DIR + '/' + path], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const curFile = path => readFileSync(join(DIR,path), 'utf8');
const bundleText = files => JSON.stringify({version:1,files},null,2)+'\n';
const jsonText = data => JSON.stringify(data,null,2)+'\n';
const baseOf = n => n.replace(/\.[^.]+\.srt$/i,'');
const identity = name => {
  const match = name.match(/\|\|\s*([a-zA-Z0-9_-]{11})\.([a-z]{2,3})\.srt$/i);
  return match ? match[1]+':'+match[2].toLowerCase() : null;
};
const videoId = name => identity(name)?.split(':')[0];
function scan(source) {
  const storage = JSON.parse(source('storage.json')), index = JSON.parse(source('index.json'));
  const packs = new Map(), keys = new Map(), ids = new Map();
  for (const pack of storage.packs) {
    const files = JSON.parse(source(pack.path)).files;
    if (!files || typeof files !== 'object') throw Error('Invalid pack '+pack.path);
    packs.set(pack.path, {...files});
    for (const [name,text] of Object.entries(files)) {
      if (keys.has(name)) {
        // Existing duplicates are reported, never rewritten or resolved here.
        keys.get(name).push({pack:pack.path,text});
      } else keys.set(name,[{pack:pack.path,text}]);
      const id = identity(name);
      if (id) ids.set(id,(ids.get(id)||0)+1);
    }
  }
  return {storage,index,packs,keys,ids};
}
const old = scan(oldFile), current = scan(curFile);
const missing = [], renamed = [], updated = [], intact = [];
for (const [name,copies] of old.keys) {
  if (current.keys.has(name)) {
    (current.keys.get(name).some(c=>c.text===copies[0].text) ? intact : updated).push(name);
  } else if (identity(name) && current.ids.has(identity(name))) renamed.push(name);
  else missing.push({name,text:copies[0].text});
}
const output = {baseline:BASE, historicalTracks:old.keys.size, currentTracks:current.keys.size,
  alreadyPresent:intact.length, currentUpdatedPreserved:updated.length, renamedPreserved:renamed.length,
  missing:missing.length, historicalMissingNames:missing.map(x=>x.name),
  existingDuplicateNames:[...current.keys].filter(([,c])=>c.length>1).map(([n])=>n)};
mkdirSync('srt-recovery-report',{recursive:true});
writeFileSync('srt-recovery-report/report.json',jsonText(output));
console.log(JSON.stringify({...output,historicalMissingNames:undefined,existingDuplicateNames:output.existingDuplicateNames.slice(0,10)},null,2));
if (!apply) process.exit(0);
const originalCurrent = new Map([...current.keys].map(([k,v])=>[k,v.map(x=>({...x}))]));
const indexById = new Map(current.index.filter(x=>x?.link).map(e=>[e.link,e]));
const oldIndex = new Map(old.index.filter(x=>x?.link).map(e=>[e.link,e]));
const changedPacks = new Set(), restored = [];
const byBase = new Map();
for (const row of missing) {
  const key = baseOf(row.name);
  if (!byBase.has(key)) byBase.set(key,[]);
  byBase.get(key).push(row);
}
function size(files) {return Buffer.byteLength(bundleText(files))}
function acceptable(files) {return Object.keys(files).length <= current.storage.maxFiles && size(files) <= current.storage.maxBytes}
function allocate() {
  let path;
  do path='packs/pack-'+String(current.storage.nextPack++).padStart(6,'0')+'.json';
  while (current.packs.has(path));
  current.packs.set(path,{});
  return path;
}
for (const [base,entries] of byBase) {
  const id = videoId(entries[0].name), indexed = id && indexById.get(id);
  const historical = id && oldIndex.get(id);
  if (entries.some(e=>current.keys.has(e.name))) throw Error('Concurrent edit detected: '+base);
  let pack = indexed?.bundle && current.packs.has(indexed.bundle) ? indexed.bundle : null;
  // The existing index's path can be reused only if the requested track
  // belongs to the same indexed base. Otherwise this is a separate version.
  if (indexed && (indexed.bundleKey || indexed.name) !== base) {
    throw Error('Index name differs from historical base; manual review: '+id);
  }
  const group=Object.fromEntries(entries.map(e=>[e.name,e.text]));
  if (pack && !acceptable({...current.packs.get(pack),...group})) {
    throw Error('Existing indexed pack full; refusing to split tracks: '+base);
  }
  if (!pack) pack=allocate();
  const contents=current.packs.get(pack);
  if (!acceptable({...contents,...group})) throw Error('Historical media exceeds pack bounds: '+base);
  Object.assign(contents,group);
  changedPacks.add(pack);
  if (indexed) indexed.bundle=pack;
  else if (historical) {
    const copy={...historical,bundle:pack};
    current.index.push(copy);
    indexById.set(id,copy);
  }
  restored.push(...entries.map(e=>e.name));
}
for (const [name,copies] of originalCurrent) {
  const next=[];
  for (const [pack,files] of current.packs) if (Object.hasOwn(files,name)) next.push({pack,text:files[name]});
  if (next.length!==copies.length || copies.some(c=>!next.some(x=>x.pack===c.pack&&x.text===c.text)))
    throw Error('Current SRT inventory altered: '+name);
}
for (const row of missing) {
  if (![...current.packs.values()].some(p=>p[row.name]===row.text))
    throw Error('Missing historical track not recovered: '+row.name);
}
for (const path of changedPacks) {
  const files=current.packs.get(path), data=bundleText(files);
  const meta=current.storage.packs.find(p=>p.path===path);
  const revision=(meta?.revision||0)+1;
  if (meta) Object.assign(meta,{revision,files:Object.keys(files).length,bytes:size(files)});
  else current.storage.packs.push({path,revision,files:Object.keys(files).length,bytes:size(files)});
  for (const entry of current.index) if (entry.bundle===path) entry.bundleRevision=revision;
}
const modifications=new Map([...changedPacks].map(p=>[p,bundleText(current.packs.get(p))]));
modifications.set('storage.json',jsonText(current.storage));
modifications.set('index.json',jsonText(current.index));
const backupDir='srt-recovery-report/backup';
for (const [path] of modifications) {
  const target=join(DIR,path);
  if (existsSync(target)) {
    const backup=join(backupDir,path);
    mkdirSync(dirname(backup),{recursive:true});
    writeFileSync(backup,curFile(path));
  }
}
for (const [path,value] of modifications) {
  const target=join(DIR,path);
  mkdirSync(dirname(target),{recursive:true});
  writeFileSync(target,value);
}
const verified=scan(curFile);
for (const [name,copies] of originalCurrent) {
  const after=verified.keys.get(name);
  if (!after || after.length!==copies.length || copies.some(c=>!after.some(x=>x.pack===c.pack&&x.text===c.text)))
    throw Error('Post-write current inventory mismatch: '+name);
}
for (const row of missing) if (!verified.keys.get(row.name)?.some(c=>c.text===row.text))
  throw Error('Post-write recovery mismatch: '+row.name);
console.log('RECOVERED '+restored.length+' tracks; preserved '+originalCurrent.size+' current track names');
