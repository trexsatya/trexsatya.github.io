#!/usr/bin/env node
// Recover non-conflicting historical subtitle cues into ACTIVE packs, not just archives.
// Preserve every current cue, retain the immutable historical archive and never deploy.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = 'db/language/swedish/srts';
const ARCHIVE = 'srt-recovery-report/historical-variants';
const REPORT = 'srt-recovery-report/all-cue-recovery.json';
const HISTORICAL = 'f350695ef963a96732fb6fda2efafee1cb003c2f';
const json = value => JSON.stringify(value, null, 2) + '\n';
const sha = text => createHash('sha256').update(text).digest('hex');
const read = path => readFileSync(join(ROOT, path), 'utf8');
const identity = name => {
  const m = name.match(/(?:^|\|\|\s*)([^|\s]+)\.([^.]+)\.srt$/i);
  if (!m) throw Error('Unknown subtitle identity: ' + name);
  return { id: m[1], lang: m[2].toLowerCase(), key: m[1] + ':' + m[2].toLowerCase() };
};
const baseOf = name => name.replace(/\.[^.]+\.srt$/i, '');
const stamp = time => {
  const m = time.match(/^(\d+):(\d\d):(\d\d)[,.](\d{3})$/);
  return m ? ((+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + +m[4]) : NaN;
};
function parse(text) {
  const blocks = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').trim().split(/\n[ \t]*\n/);
  if (blocks.length === 1 && !blocks[0]) return { cues: [], invalid: [] };
  const cues = [], invalid = [];
  for (const block of blocks) {
    const m = block.trim().match(/^(?:\d+[ \t]*\n)?(\d+:\d\d:\d\d[,.]\d{3})[ \t]*-->[ \t]*(\d+:\d\d:\d\d[,.]\d{3})(?:[^\n]*)(?:\n([\s\S]*))?$/);
    if (!m) { invalid.push(block); continue; }
    const start = stamp(m[1]), end = stamp(m[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) { invalid.push(block); continue; }
    cues.push({ start, end, time: m[1].replace('.', ',') + ' --> ' + m[2].replace('.', ','), body: (m[3]||'').replace(/\s+$/, '') });
  }
  return { cues, invalid };
}
const cueKey = cue => JSON.stringify([cue.start, cue.end, cue.body]);
// Captions may overlap naturally; only competing text at the same cue start
// is an alternative. Do not throw away separate historical lines for intersecting ranges.
const overlaps = (a, b) => a.start === b.start;
const render = cues => cues.slice().sort((a,b) => a.start-b.start || a.end-b.end || a.body.localeCompare(b.body))
  .map((cue, i) => String(i+1) + '\n' + cue.time + '\n' + cue.body + '\n').join('\n');

export function restore({dir=ROOT, archive=ARCHIVE, historicalIndex=null}={}) {
  const dirRead = p => readFileSync(join(dir,p),'utf8');
  const storage = JSON.parse(dirRead('storage.json'));
  const index = JSON.parse(dirRead('index.json'));
  const idx = new Map(index.map(e => [e.link,e]));
  assert.equal(idx.size,index.length,'Duplicate index link');
  const packs = new Map();
  const rows = [];
  const beforeRaw = new Map();
  for (const meta of storage.packs) {
    const raw = dirRead(meta.path);
    const files = JSON.parse(raw).files;
    assert(files && !Array.isArray(files),'Invalid pack files');
    packs.set(meta.path, files);
    beforeRaw.set(meta.path, raw);
    for (const [name,text] of Object.entries(files)) rows.push({name,text,pack:meta.path,...identity(name)});
  }
  const currentTracks = rows.length;
  const before = rows.map(row => ({ ...row, cues: parse(row.text) }));
  const historical = new Map();
  for (const part of readdirSync(archive).filter(name => /^part-\d+\.json$/.test(name)).sort()) {
    for (const [name,text] of Object.entries(JSON.parse(readFileSync(join(archive,part),'utf8')).files)) {
      const who=identity(name);
      if(!historical.has(who.key)) historical.set(who.key,[]);
      historical.get(who.key).push({name,text,...who});
    }
  }
  const oldIndex = historicalIndex || new Map();
  const touchedMedia = new Set([...historical.keys()].map(key => key.slice(0,key.lastIndexOf(':'))));
  const errors=[], moved=[], missing=[], details=[], conflictExamples=[], invalidSamples=[], preexistingDuplicates=[], duplicateSamples=[], preexistingUnreachable=[];
  const byId = new Map();
  for (const row of rows) {
    if(!byId.has(row.id)) byId.set(row.id,[]);
    byId.get(row.id).push(row);
  }
  function group(id) { return byId.get(id)||[]; }
  function indexedRow(entry,lang) {
    if(!entry || !entry.bundle) return null;
    const name=(entry.bundleKey||entry.name)+'.'+lang+'.srt';
    return group(entry.link).find(row=>row.pack===entry.bundle && row.name===name)||null;
  }
  function move(row,pack,name) {
    if(row.pack===pack && row.name===name) return;
    const dst=packs.get(pack);
    assert(dst,'Missing destination pack: '+pack);
    if(Object.hasOwn(dst,name)) throw Error('Destination collision: '+name);
    delete packs.get(row.pack)[row.name];
    dst[name]=row.text;
    moved.push({id:row.id,from:row.pack+'/'+row.name,to:pack+'/'+name});
    row.pack=pack;row.name=name;
  }
  // The application loads all language siblings through the SAME bundle/base.
  // Fix only affected media with an unambiguous existing track in each language.
  for (const id of [...touchedMedia].sort()) {
    const entry=idx.get(id), siblings=group(id);
    if(!entry || !siblings.length) continue;
    const langCount=new Map();
    for(const row of siblings) langCount.set(row.lang,(langCount.get(row.lang)||0)+1);
    if([...langCount.values()].some(n=>n>1)) {
      preexistingDuplicates.push(id);
      if(duplicateSamples.length<9)duplicateSamples.push({id,index:{pack:entry.bundle,base:entry.bundleKey||entry.name},copies:siblings.map(r=>({pack:r.pack,base:baseOf(r.name),lang:r.lang}))});
      // Keep every duplicate copy, but make ONE existing copy of each language
      // reachable via the indexed pack/base. Relocate, never duplicate/delete.
      const canonical=entry.bundleKey||entry.name;
      const target=packs.has(entry.bundle)?entry.bundle:siblings[0].pack;
      for(const lang of langCount.keys()) {
        if(indexedRow(entry,lang))continue;
        const candidates=siblings.filter(row=>row.lang===lang).sort((a,b)=>
          Number(b.pack===target)-Number(a.pack===target)
          ||Number(baseOf(b.name)===canonical)-Number(baseOf(a.name)===canonical)
          ||a.name.localeCompare(b.name));
        const selected=candidates[0], name=canonical+'.'+lang+'.srt';
        // An extra language such as sv-orig can exceed the pack budget.
        // Do not break previously loadable tracks just to move that variant.
        const prospective={...packs.get(target),[name]:selected.text};
        if(Object.keys(prospective).length<=storage.maxFiles && size(prospective)<=8*1024*1024)
          move(selected,target,name);
      }
      entry.bundle=target;
      continue;
    }
    const canonical=entry.bundleKey||entry.name;
    const accessible=siblings.every(row=>row.pack===entry.bundle && row.name===canonical+'.'+row.lang+'.srt');
    if(accessible) continue;
    const destination=packs.has(entry.bundle)?entry.bundle:siblings[0].pack;
    for(const row of siblings) move(row,destination,canonical+'.'+row.lang+'.srt');
    entry.bundle=destination;
  }
  let restored=0, identical=0, overlapping=0, malformed=0;
  let addedTracks=0;
  // Prefer the original historically indexed name when alternate histories overlap.
  for (const [key,variants] of [...historical.entries()].sort(([a],[b])=>a.localeCompare(b))) {
    const {id,lang}=variants[0], entry=idx.get(id);
    const siblings=group(id).filter(r=>r.lang===lang);
    if(!entry) { errors.push({id,lang,issue:'no index entry'}); continue; }
    let row=indexedRow(entry,lang);
    if(!row) row=siblings.length===1?siblings[0]:null;
    if(!row && siblings.length>1) {
      // Retain all historical duplicate copies. Select the current indexed
      // pack/base if possible, otherwise pick a deterministic existing row.
      row=siblings.find(r=>r.pack===entry.bundle && baseOf(r.name)===(entry.bundleKey||entry.name))
        || siblings.find(r=>r.pack===entry.bundle)
        || siblings.find(r=>variants.some(v=>v.name===r.name))
        || siblings.slice().sort((a,b)=>a.name.localeCompare(b.name))[0];
      if(!indexedRow(entry,lang)) {
        entry.bundle=row.pack;
        if(baseOf(row.name)!==entry.name)entry.bundleKey=baseOf(row.name);
      }
    }
    if(!row && siblings.length) { errors.push({id,lang,issue:'ambiguous active track'}); continue; }
    const pref=oldIndex.get(id);
    variants.sort((a,b)=>Number(baseOf(b.name)===(pref?.bundleKey||pref?.name))-Number(baseOf(a.name)===(pref?.bundleKey||pref?.name))||a.name.localeCompare(b.name));
    if(!row) {
      const name=(entry.bundleKey||entry.name)+'.'+lang+'.srt';
      const pack=packs.has(entry.bundle)?entry.bundle:group(id)[0]?.pack;
      if(!pack) { errors.push({id,lang,issue:'no pack for historical track'}); continue; }
      row={name,text:'',pack,...identity(name)};
      packs.get(pack)[name]='';rows.push(row);
      if(!byId.has(id))byId.set(id,[]);
      byId.get(id).push(row);
      addedTracks++;
      entry.bundle=pack;
    }
    const parsed=parse(row.text);
    if(parsed.invalid.length) { errors.push({id,lang,issue:'current SRT cannot be parsed',count:parsed.invalid.length}); continue; }
    const combined=parsed.cues.slice(), keys=new Set(combined.map(cueKey));
    let added=0, held=0, duplicate=0, bad=0;
    for(const v of variants) {
      const source=parse(v.text);
      bad+=source.invalid.length;
      for(const part of source.invalid.slice(0,2))if(invalidSamples.length<20)invalidSamples.push({id,lang,part:part.slice(0,220)});
      for(const cue of source.cues) {
        // Empty cue bodies are legitimate stored SRT context, not corrupt data.
        const ck=cueKey(cue);
        if(keys.has(ck)){duplicate++;continue;}
        if(combined.some(other=>overlaps(other,cue))) {
          held++;
          if(conflictExamples.length<50)conflictExamples.push({id,lang,name:v.name,time:cue.time,body:cue.body.slice(0,120)});
          continue;
        }
        combined.push(cue); keys.add(ck); added++;
      }
    }
    restored+=added; overlapping+=held; identical+=duplicate; malformed+=bad;
    if(added) {
      row.text=render(combined);
      packs.get(row.pack)[row.name]=row.text;
    }
    if(added||held||bad||moved.some(x=>x.id===id)) {
      entry.preserveCapturedContext=true;
      details.push({id,lang,added,overlapping:held,identical:duplicate,malformed:bad});
    }
  }
  // Move a whole media group, including all language siblings, when a pack grows
  // beyond the configured hard byte/file limits. Never split siblings.
  let next=storage.nextPack;
  function size(files){return Buffer.byteLength(json({version:1,files}));}
  const oldPackLimit=storage.maxBytes;
  // A media's indexed languages must share one pack. Some existing long-form
  // subtitles exceed the previous 1 MiB budget when safely reunited.
  // Raise the pack budget to the next power of two required by such a media.
  const mediaPackGroups=new Map();
  for(const row of rows){
    const k=row.pack+'|'+row.id;
    if(!mediaPackGroups.has(k))mediaPackGroups.set(k,{});
    mediaPackGroups.get(k)[row.name]=row.text;
  }
  const largestMedia=Math.max(...[...mediaPackGroups.values()].map(size));
  if(largestMedia>storage.maxBytes){
    storage.maxBytes=2**Math.ceil(Math.log2(largestMedia));
    if(storage.maxBytes>8*1024*1024)throw Error('Media pack exceeds safe recovery bound');
  }
  function overflow(pack) {
    const files=packs.get(pack);
    return Object.keys(files).length>storage.maxFiles || size(files)>storage.maxBytes;
  }
  for (const pack of [...packs.keys()]) {
    let attempts=0;
    while(overflow(pack)){
      if(++attempts>500)throw Error('Cannot fit pack '+pack);
      const candidates=[...new Set(rows.filter(r=>r.pack===pack).map(r=>r.id))]
        .filter(id=>idx.has(id))
        .sort((a,b)=>group(b).filter(r=>r.pack===pack).reduce((s,r)=>s+Buffer.byteLength(r.text),0)-group(a).filter(r=>r.pack===pack).reduce((s,r)=>s+Buffer.byteLength(r.text),0));
      const id=candidates[0];
      if(!id)throw Error('Cannot safely relocate overflowing pack '+pack);
      // A video's extra historical variants may live in OTHER packs. Relocate
      // only the copies actually in this overflowing pack and keep all others.
      const siblings=group(id).filter(r=>r.pack===pack);
      const fresh='packs/pack-'+String(next++).padStart(6,'0')+'.json';
      const files=Object.fromEntries(siblings.map(r=>[r.name,r.text]));
      if(Object.keys(files).length>storage.maxFiles||size(files)>storage.maxBytes)throw Error('Single video exceeds pack limits '+id+' '+JSON.stringify(siblings.map(r=>({lang:r.lang,bytes:Buffer.byteLength(r.text),pack:r.pack,name:r.name.slice(0,28)}))));
      packs.set(fresh,{});
      for(const row of siblings)move(row,fresh,row.name);
      if(idx.get(id).bundle===pack)idx.get(id).bundle=fresh;
    }
  }
  storage.nextPack=next;
  // Every original current cue must still exist, including original multiplicity.
  const actualByIdentity=new Map();
  for(const row of rows){
    const p=parse(row.text);
    if(p.invalid.length) {
      // Legacy subtitles can contain empty/malformed blocks. Retain these byte-for-byte;
      // they must never block unrelated video recovery or be silently rewritten.
      if(!before.some(old=>old.id===row.id && old.lang===row.lang && old.text===row.text))
        throw Error('Previously valid active cues became invalid: '+row.name+' invalid='+JSON.stringify(p.invalid.slice(0,3)).slice(0,450)+' original='+before.filter(b=>b.id===row.id&&b.lang===row.lang).map(b=>({file:b.name,changed:b.text!==row.text,invalid:b.cues.invalid.length})).map(x=>JSON.stringify(x)).join(';'));
      continue;
    }
    if(!actualByIdentity.has(row.key))actualByIdentity.set(row.key,new Map());
    const counts=actualByIdentity.get(row.key);
    for(const cue of p.cues){const k=cueKey(cue);counts.set(k,(counts.get(k)||0)+1);}
  }
  let currentCues=0;
  for(const old of before){
    if(old.cues.invalid.length) {
      if(!rows.some(row=>row.id===old.id&&row.lang===old.lang&&row.text===old.text))
        throw Error('Unparsed current track changed '+old.name);
      continue;
    }
    const counts=actualByIdentity.get(old.key)||new Map();
    for(const cue of old.cues.cues){
      const k=cueKey(cue);
      if(!(counts.get(k)>0))throw Error('Current cue lost '+old.name+' '+k);
      counts.set(k,counts.get(k)-1);
      currentCues++;
    }
  }
  // All indexed media siblings must be loadable after a relocation.
  for(const id of touchedMedia) {
    const entry=idx.get(id);
    if(!entry)continue;
    for(const row of group(id))if(row.name!==(entry.bundleKey||entry.name)+'.'+row.lang+'.srt'||row.pack!==entry.bundle){
      if(preexistingDuplicates.includes(id))preexistingUnreachable.push({id,lang:row.lang});
      else errors.push({id,lang:row.lang,issue:'unloadable sibling'});
    }
  }
  // Every affected media/language must now be discoverable through its index.
  for(const id of touchedMedia){
    const entry=idx.get(id);
    if(!entry)continue;
    for(const lang of new Set(group(id).map(r=>r.lang)))
      if(!indexedRow(entry,lang))errors.push({id,lang,issue:'no indexed active language track'});
  }
  const modified=new Map();
  for(const [path,files] of packs){
    const raw=json({version:1,files});
    if(raw!==beforeRaw.get(path)){
      modified.set(path,raw);
      const meta=storage.packs.find(p=>p.path===path);
      if(meta){meta.revision++;meta.files=Object.keys(files).length;meta.bytes=Buffer.byteLength(raw);}
      else storage.packs.push({path,revision:1,files:Object.keys(files).length,bytes:Buffer.byteLength(raw)});
    }
    if(Object.keys(files).length>storage.maxFiles||Buffer.byteLength(raw)>storage.maxBytes)throw Error('Pack bounds '+path);
  }
  const rev=new Map(storage.packs.map(p=>[p.path,p.revision]));
  for(const entry of index)if(entry.bundle&&rev.has(entry.bundle))entry.bundleRevision=rev.get(entry.bundle);
  const report={status:errors.length?'partial-with-errors':'verified',baseline:HISTORICAL,
    currentTracks, currentCuesPreserved:currentCues, archivedTracksExamined:[...historical.values()].reduce((s,x)=>s+x.length,0),
    restoredCues:restored, updatedMedia:[...new Set(details.filter(d=>d.added).map(d=>d.id))].length,
    indexRelocations:moved.length, newTracks:addedTracks, identicalHistoricalCues:identical,
    overlappingAlternativesKeptInArchive:overlapping, invalidHistoricalCuesKeptInArchive:malformed,
    modifiedPacks:modified.size, packLimitBeforeBytes:oldPackLimit, packLimitAfterBytes:storage.maxBytes,
    duplicateSamples, preexistingDuplicateMedia:preexistingDuplicates.length,
    preexistingUnreachableSiblings:preexistingUnreachable.length, errors, conflictsSample:conflictExamples, invalidSamples, perTrack:details};
  return {storage,index,modified,report};
}
function main(){
  const historicalIndex=new Map(JSON.parse(execFileSync('git',['show',HISTORICAL+':'+ROOT+'/index.json'],{encoding:'utf8',maxBuffer:32*1024*1024})).map(e=>[e.link,e]));
  const result=restore({historicalIndex});
  const short={...result.report,perTrack:undefined,conflictsSample:undefined};
  console.log(JSON.stringify(short,null,2));
  if(result.report.errors.length)throw Error('Recovery has '+result.report.errors.length+' unresolved mappings. No data written.');
  if(process.argv.includes('--verify')){
    if(result.report.restoredCues || result.report.indexRelocations || result.report.newTracks)
      throw Error('Recovery not idempotent');
    return;
  }
  if(!process.argv.includes('--apply'))return;
  for(const [path,raw] of result.modified){
    const full=join(ROOT,path);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,raw);
  }
  if(result.modified.size||result.report.indexRelocations||result.report.newTracks){
    writeFileSync(join(ROOT,'storage.json'),json(result.storage));
    writeFileSync(join(ROOT,'index.json'),json(result.index));
  }
  if(result.report.restoredCues||result.report.indexRelocations||result.report.newTracks)
    writeFileSync(REPORT,json(result.report));
}
if(process.argv[1] && process.argv[1].endsWith('recover-srt-all-cues.mjs'))main();
