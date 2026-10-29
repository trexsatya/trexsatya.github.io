#!/usr/bin/env node
// Independent verification, using the immutable pre-reconciliation branch head.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const BASE='27441a9af815e255de8800c4bc7d02285c19069f';
const ROOT='db/language/swedish/srts/';
const ARCH='srt-recovery-report/historical-variants/';
const hash=s=>createHash('sha256').update(s).digest('hex');
const old=path=>execFileSync('git',['show',BASE+':'+path],{encoding:'utf8',maxBuffer:48*1024*1024});
const now=path=>readFileSync(path,'utf8');
function parse(text){
  const cues=[],invalid=[];
  for(const block of text.replace(/\r\n/g,'\n').replace(/^\uFEFF/,'').trim().split(/\n[ \t]*\n/)){
    if(!block.trim())continue;
    const m=block.trim().match(/^(?:\d+[ \t]*\n)?(\d+:\d\d:\d\d[,.]\d{3})\s*-->\s*(\d+:\d\d:\d\d[,.]\d{3})[^\n]*(?:\n([\s\S]*))?$/);
    if(!m){invalid.push(block);continue;}
    const toMs=s=>{const a=s.match(/^(\d+):(\d\d):(\d\d)[,.](\d{3})$/);return(+a[1]*3600+ +a[2]*60+ +a[3])*1000+ +a[4];};
    const start=toMs(m[1]),end=toMs(m[2]);
    if(end<=start){invalid.push(block);continue;}
    cues.push(JSON.stringify([start,end,(m[3]||'').replace(/\s+$/,'')]));
  }
  return {cues,invalid};
}
function snapshot(reader){
  const storage=JSON.parse(reader(ROOT+'storage.json')),index=JSON.parse(reader(ROOT+'index.json')),rows=[],packs=new Map();
  for(const meta of storage.packs){
    const path=ROOT+meta.path,raw=reader(path),files=JSON.parse(raw).files;
    assert.equal(Object.keys(files).length,meta.files,'Pack file metadata '+path);
    assert.equal(Buffer.byteLength(raw),meta.bytes,'Pack byte metadata '+path);
    assert(meta.files<=storage.maxFiles&&meta.bytes<=storage.maxBytes,'Pack bounds '+path);
    packs.set(meta.path,files);
    for(const [name,text] of Object.entries(files))rows.push({name,text,parsed:parse(text)});
  }
  return {storage,index,rows,packs};
}
const before=snapshot(old),after=snapshot(now);
assert.equal(after.rows.length,before.rows.length,'Physical track multiplicity changed');
const grouped=new Map();
for(const row of after.rows){
  if(!grouped.has(row.name))grouped.set(row.name,[]);
  grouped.get(row.name).push(row);
}
let baselineCues=0,latestCues=0;
for(const row of after.rows)latestCues+=row.parsed.cues.length;
for(const prev of before.rows){
  baselineCues+=prev.parsed.cues.length;
  const candidates=grouped.get(prev.name)||[];
  const matching=candidates.find(curr=>{
    if(curr.text===prev.text)return true;
    if(prev.parsed.invalid.length||curr.parsed.invalid.length)return false;
    const counts=new Map();
    for(const key of curr.parsed.cues)counts.set(key,(counts.get(key)||0)+1);
    for(const key of prev.parsed.cues){
      const n=counts.get(key)||0;
      if(!n)return false;
      counts.set(key,n-1);
    }
    return true;
  });
  assert(matching,'Lost or modified current physical track/cue: '+prev.name);
  candidates.splice(candidates.indexOf(matching),1);
}
const report=JSON.parse(now('srt-recovery-report/alternatives-resolution.json'));
assert.equal(report.status,'verified');
assert.equal(report.currentTracksPreserved,17914);
assert.equal(report.addedUniqueCues,latestCues-baselineCues,'New cue count does not match certificate');
assert.equal(report.estimatedEndCues,3);
assert.equal(report.malformedUnresolved,0);
assert.equal(report.sidecarFiles,report.conflictingVideoLanguages);
assert.equal(Object.keys(report.sourceArchiveHashes).length,readdirSync(ARCH).filter(s=>/^part-\d+\.json$/.test(s)).length);
for(const [part,savedHash] of Object.entries(report.sourceArchiveHashes)){
  const path=ARCH+part;
  assert.equal(hash(now(path)),hash(old(path)),'Historical archive changed: '+part);
  assert.equal(hash(now(path)),savedHash,'Historical archive report hash mismatch: '+part);
}
const idx=new Map(after.index.map(e=>[e.link,e]));
assert.equal(idx.size,after.index.length);
for(const meta of after.storage.packs){
  const refs=after.index.filter(e=>e.bundle===meta.path);
  for(const entry of refs)assert.equal(entry.bundleRevision,meta.revision,'Cache revision stale: '+entry.link);
}
for(const resolution of report.resolutions){
  const entry=idx.get(resolution.id);
  assert(entry,'Missing media index '+resolution.id);
  assert.equal(entry.historicalAlternatives?.[resolution.lang]?.path,resolution.alternativesSrt);
  const text=now(resolution.alternativesSrt),alts=parse(text);
  assert.equal(alts.invalid.length,0,'Invalid alternative SRT '+resolution.alternativesSrt);
  assert.equal(alts.cues.length,resolution.variantCount,'Missing competing alternatives '+resolution.id);
  const actual=new Set(alts.cues);
  for(const decision of resolution.decisions){
    const p=decision.original;
    const fromTime=t=>{const a=t.match(/^(\d+):(\d\d):(\d\d)[,.](\d\d\d)$/);return(+a[1]*3600+ +a[2]*60+ +a[3])*1000+ +a[4];};
    assert(actual.has(JSON.stringify([fromTime(p.start),fromTime(p.end),p.body])),'Missing alternative cue '+resolution.id);
  }
}
for(const [id,entry] of idx)if(entry.bundle){
  const base=entry.bundleKey||entry.name;
  const files=after.packs.get(entry.bundle);
  assert(files,'Missing indexed pack '+id);
  assert(Object.keys(files).some(name=>name.startsWith(base+'.')&&name.endsWith('.srt')),'Unresolvable indexed media '+id);
}
console.log('PASS independent recovery certificate: '+before.rows.length+' existing tracks and '+baselineCues+
  ' prior parsed cues preserved, '+(latestCues-baselineCues)+' additional cues, '+
  report.sidecarFiles+' accessible alternative SRTs, all historical archives unchanged.');
