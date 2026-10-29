#!/usr/bin/env node
// Reconcile every historical/duplicate subtitle alternative without overwriting
// current captions. Conflicting texts are made reviewable via lossless sidecars.
// Usage: node scripts/reconcile-srt-alternatives.mjs [--apply|--verify]
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';

const ROOT='db/language/swedish/srts';
const ARCHIVE='srt-recovery-report/historical-variants';
const SIDECARS='srt-recovery-report/reconciled-alternatives';
const REPORT='srt-recovery-report/alternatives-resolution.json';
const dump=o=>JSON.stringify(o,null,2)+'\n';
const hash=s=>createHash('sha256').update(s).digest('hex');
const idOf=name=>{
  const m=name.match(/(?:^|\|\|\s*)([^|\s]+)\.([^.]+)\.srt$/i);
  if(!m)throw Error('Cannot identify SRT '+name);
  return {id:m[1],lang:m[2].toLowerCase()};
};
const baseOf=name=>name.replace(/\.[^.]+\.srt$/i,'');
function time(s){
  const m=String(s).match(/^(\d+):(\d\d):(\d\d)[,.](\d{3})$/);
  return m?((+m[1]*3600 + +m[2]*60 + +m[3])*1000 + +m[4]):NaN;
}
function fmt(ms) {
  const n=Math.max(0,Math.floor(ms));
  return [Math.floor(n/3600000),Math.floor(n/60000)%60,Math.floor(n/1000)%60].map(v=>String(v).padStart(2,'0')).join(':')+','+String(n%1000).padStart(3,'0');
}
function parse(raw) {
  const result=[],invalid=[];
  const blocks=raw.replace(/\r\n/g,'\n').replace(/^\uFEFF/,'').trim().split(/\n[ \t]*\n/);
  for(const block of blocks){
    if(!block.trim())continue;
    const m=block.trim().match(/^(?:\d+[ \t]*\n)?(\d+:\d\d:\d\d[,.]\d{3})[ \t]*-->[ \t]*(\d+:\d\d:\d\d[,.]\d{3})[^\n]*(?:\n([\s\S]*))?$/);
    if(!m){invalid.push({block,reason:'unparseable'});continue;}
    const start=time(m[1]),end=time(m[2]),body=(m[3]||'').replace(/\s+$/,'');
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start){invalid.push({block,reason:'invalid-time',start,end,body});continue;}
    result.push({start,end,body});
  }
  return {cues:result,invalid};
}
const key=c=>JSON.stringify([c.start,c.end,c.body]);
const render=cs=>cs.slice().sort((a,b)=>a.start-b.start||a.end-b.end||a.body.localeCompare(b.body))
  .map((c,i)=>String(i+1)+'\n'+fmt(c.start)+' --> '+fmt(c.end)+'\n'+c.body+'\n').join('\n');
const filesIn=(dir)=>readdirSync(dir).filter(n=>n.endsWith('.json')).sort();
const byteSize=files=>Buffer.byteLength(dump({version:1,files}));

function reconcile(){
  const storage=JSON.parse(readFileSync(join(ROOT,'storage.json'),'utf8'));
  const index=JSON.parse(readFileSync(join(ROOT,'index.json'),'utf8'));
  const byIndex=new Map(index.map(e=>[e.link,e]));
  assert.equal(byIndex.size,index.length,'Index must have unique links');
  const packs=new Map(),original=new Map(),tracks=[],byMedia=new Map();
  for(const p of storage.packs){
    const raw=readFileSync(join(ROOT,p.path),'utf8');
    const files=JSON.parse(raw).files;
    packs.set(p.path,files);original.set(p.path,raw);
    for(const [name,text] of Object.entries(files)){
      const {id,lang}=idOf(name),row={id,lang,name,text,pack:p.path};
      tracks.push(row);
      if(!byMedia.has(id))byMedia.set(id,[]);
      byMedia.get(id).push(row);
    }
  }
  const byId=(id)=>byMedia.get(id)||[];
  const primary=(id,lang)=>{
    const idx=byIndex.get(id);
    if(!idx)return null;
    const name=(idx.bundleKey||idx.name)+'.'+lang+'.srt';
    return byId(id).find(r=>r.pack===idx.bundle&&r.name===name)||null;
  };
  const sources=new Map(),historicalHashes=new Map();
  function addSource(row,kind){
    const k=row.id+':'+row.lang;
    if(!sources.has(k))sources.set(k,[]);
    sources.get(k).push({...row,kind});
  }
  const archiveFiles=filesIn(ARCHIVE).filter(n=>/^part-\d+\.json$/.test(n));
  for(const part of archiveFiles){
    const raw=readFileSync(join(ARCHIVE,part),'utf8');
    historicalHashes.set(part,hash(raw));
    for(const [name,text] of Object.entries(JSON.parse(raw).files)){
      const {id,lang}=idOf(name);
      addSource({id,lang,name,text,pack:null,archive:part},'historical');
    }
  }
  let duplicateSourceCount=0;
  const duplicateIds=new Set();
  for(const [id,rows] of byMedia){
    for(const row of rows){
      if(primary(id,row.lang)===row)continue;
      // Only alternate versions where there IS an indexed track for this language.
      if(!primary(id,row.lang))continue;
      addSource(row,'duplicate-active');
      duplicateSourceCount++;
      duplicateIds.add(id);
    }
  }
  const baseline=tracks.map(r=>({...r,parsed:parse(r.text)}));
  const conflicts=new Map(),resolutions=[],estimated=[],unresolved=[],touched=new Set();
  const sourceCoverage={exact:0,additional:0,alternate:0,invalidRecovered:0,invalidBlocked:0};
  let historicalSources=0;
  function markAlternative(id,lang,item){
    const k=id+':'+lang;
    if(!conflicts.has(k))conflicts.set(k,[]);
    const values=conflicts.get(k);
    if(!values.some(a=>key(a.cue)===key(item.cue)&&a.source===item.source))
      values.push(item);
  }
  function accept(canonical,cue,source,sourceName,wasInvalid=false){
    const indexed=parse(canonical.text);
    if(indexed.invalid.length) {unresolved.push({id:canonical.id,lang:canonical.lang,reason:'malformed indexed SRT',source:sourceName});return;}
    const duplicate=indexed.cues.find(c=>key(c)===key(cue));
    if(duplicate){sourceCoverage.exact++;return;}
    const competing=indexed.cues.filter(c=>c.start===cue.start);
    if(competing.length){
      const current=competing[0];
      // Never silently change current text, punctuation or cue duration.
      markAlternative(canonical.id,canonical.lang,{source,sourceName,cue,current,
        disposition:'preserve-indexed-primary-and-publish-alternative'});
      sourceCoverage.alternate++;
      return;
    }
    const next=indexed.cues.concat(cue);
    canonical.text=render(next);
    packs.get(canonical.pack)[canonical.name]=canonical.text;
    touched.add(canonical.id);
    sourceCoverage.additional++;
    if(wasInvalid)sourceCoverage.invalidRecovered++;
  }
  for(const [k,variants] of [...sources.entries()].sort(([a],[b])=>a.localeCompare(b))) {
    const [id,lang]=k.split(':');
    const canonical=primary(id,lang);
    if(!canonical) {unresolved.push({id,lang,reason:'no indexed current language',sources:variants.map(x=>x.name)});continue;}
    for(const variant of variants.sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name))) {
      if(variant.kind==='historical')historicalSources++;
      const parsed=parse(variant.text);
      for(const cue of parsed.cues)accept(canonical,cue,variant.kind,variant.name);
      for(const bad of parsed.invalid){
        // Historical export occasionally ends its final caption at 00:00:00.
        // Recover its actual text/start without inventing an exact end:
        // 2 seconds is explicitly an *estimated* display duration, retained in audit.
        if(variant.kind==='historical'&&bad.reason==='invalid-time'&&
           Number.isFinite(bad.start)&&bad.end===0&&bad.body.trim()&&
           !parsed.cues.some(c=>c.start===bad.start)){
          const following=parsed.cues.filter(c=>c.start>bad.start).sort((a,b)=>a.start-b.start)[0];
          const end=following?Math.min(bad.start+2000,following.start):bad.start+2000;
          const cue={start:bad.start,end,body:bad.body};
          estimated.push({id,lang,sourceName:variant.name,start:fmt(cue.start),end:fmt(cue.end),
            originalEnd:'00:00:00,000',method:'estimated 2-second display window; original preserved in archive'});
          accept(canonical,cue,'repaired-invalid-end',variant.name,true);
        }else{
          unresolved.push({id,lang,reason:bad.reason,source:variant.name,block:bad.block.slice(0,400)});
          sourceCoverage.invalidBlocked++;
        }
      }
    }
  }
  // Conflicting source cues remain separate, first-class SRTs in review data
  // with exact names/timestamps, rather than getting buried in large JSON archives.
  const sidecars=new Map();
  for(const [k,items] of [...conflicts.entries()].sort(([a],[b])=>a.localeCompare(b))){
    const [id,lang]=k.split(':');
    const indexed=primary(id,lang);
    const distinct=[...new Map(items.map(x=>[key(x.cue),x.cue])).values()];
    const path=id+'.'+lang+'.srt';
    sidecars.set(path,render(distinct));
    const resolutionsForKey=items.map(x=>({
      source:x.source,sourceName:x.sourceName,original:{start:fmt(x.cue.start),end:fmt(x.cue.end),body:x.cue.body},
      primary:{start:fmt(x.current.start),end:fmt(x.current.end),body:x.current.body},
      decision:x.disposition
    }));
    resolutions.push({id,lang,selectedIndexedTrack:{pack:indexed.pack,name:indexed.name},
      alternativesSrt:SIDECARS+'/'+path,variantCount:distinct.length,decisions:resolutionsForKey});
    const entry=byIndex.get(id);
    if(entry){
      if(!entry.historicalAlternatives)entry.historicalAlternatives={};
      entry.historicalAlternatives[lang]={path:SIDECARS+'/'+path,count:distinct.length};
      touched.add(id);
    }
  }
  // Keep every existing physical record and every cue, including duplicates.
  for(const prev of baseline){
    const candidates=byId(prev.id).filter(r=>r===tracks.find(x=>x.pack===prev.pack&&x.name===prev.name));
    if(!candidates.length)throw Error('Current physical track removed: '+prev.name);
    const current=candidates[0];
    if(prev.parsed.invalid.length){
      assert.equal(current.text,prev.text,'Malformed current record must remain exact: '+prev.name);
    }else{
      const counts=new Map();
      for(const cue of parse(current.text).cues)counts.set(key(cue),(counts.get(key(cue))||0)+1);
      for(const cue of prev.parsed.cues){
        const k=key(cue),n=counts.get(k)||0;
        if(n<1)throw Error('A current cue would be lost: '+prev.name+' '+k);
        counts.set(k,n-1);
      }
    }
  }
  // Keep this follow-up repair strictly additive: no relinking/deleting earlier duplicates.
  const modified=new Map();
  for(const [pack,files] of packs){
    const raw=dump({version:1,files});
    if(raw!==original.get(pack)){
      if(Object.keys(files).length>storage.maxFiles)
        throw Error('Pack file limit exceeded: '+pack);
      if(Buffer.byteLength(raw)>storage.maxBytes)
        throw Error('Pack byte limit exceeded: '+pack);
      modified.set(pack,raw);
      const meta=storage.packs.find(p=>p.path===pack);
      meta.revision++;
      meta.bytes=Buffer.byteLength(raw);
      meta.files=Object.keys(files).length;
    }
  }
  const revisions=new Map(storage.packs.map(p=>[p.path,p.revision]));
  for(const entry of index){
    if(entry.bundle&&revisions.has(entry.bundle))entry.bundleRevision=revisions.get(entry.bundle);
    if(touched.has(entry.link))entry.preserveCapturedContext=true;
  }
  const report={
    status:unresolved.length?'requires-review':'verified',policy:'Always prefer current indexed cue at identical start. Expose competing text in standalone SRT sidecars and index metadata; never delete or rewrite alternative sources.',
    currentTracksPreserved:baseline.length,existingDuplicateSourceTracks:duplicateSourceCount,
    existingDuplicateMedia:duplicateIds.size,historicalArchiveTracks:historicalSources,
    addedUniqueCues:sourceCoverage.additional,estimatedEndCues:sourceCoverage.invalidRecovered,
    equivalentCues:sourceCoverage.exact,alternateCueOccurrences:sourceCoverage.alternate,
    conflictingVideoLanguages:resolutions.length,sidecarFiles:sidecars.size,
    malformedUnresolved:sourceCoverage.invalidBlocked,changedPacks:modified.size,
    estimated,unresolved,resolutions,sourceArchiveHashes:Object.fromEntries(historicalHashes)
  };
  return {storage,index,modified,sidecars,report};
}
function main(){
  const result=reconcile();
  const compact={...result.report,resolutions:undefined,sourceArchiveHashes:undefined};
  console.log(JSON.stringify(compact,null,2));
  if(result.report.unresolved.length)
    throw Error('Unresolved source fragments: '+result.report.unresolved.length+'; no writes made.');
  const verify=process.argv.includes('--verify');
  if(verify){
    if(result.report.addedUniqueCues||result.report.changedPacks)throw Error('Recovery not idempotent');
    for(const [path,raw] of result.sidecars)
      if(!existsSync(join(SIDECARS,path))||readFileSync(join(SIDECARS,path),'utf8')!==raw)
        throw Error('Missing or mismatched conflict sidecar '+path);
    const saved=JSON.parse(readFileSync(REPORT,'utf8'));
    assert.equal(saved.status,'verified');
    assert.equal(saved.alternateCueOccurrences,result.report.alternateCueOccurrences);
    return;
  }
  if(!process.argv.includes('--apply'))return;
  for(const [path,raw] of result.modified){
    const dest=join(ROOT,path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,raw);
  }
  writeFileSync(join(ROOT,'storage.json'),dump(result.storage));
  writeFileSync(join(ROOT,'index.json'),dump(result.index));
  mkdirSync(SIDECARS,{recursive:true});
  for(const [path,raw] of result.sidecars)writeFileSync(join(SIDECARS,path),raw);
  writeFileSync(REPORT,dump(result.report));
}
main();
