#!/usr/bin/env node
// Additive recovery: current names/text/multiplicity are invariants. Historical
// alternatives are archived verbatim, never merged over newer subtitle edits.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const BASE = 'f350695ef963a96732fb6fda2efafee1cb003c2f';
const DIR = 'db/language/swedish/srts';
const REPORT_DIR = 'srt-recovery-report';
const sha = text => createHash('sha256').update(text).digest('hex');
const jsonText = data => JSON.stringify(data, null, 2) + '\n';
const bundleText = files => jsonText({ version: 1, files });
const baseOf = name => name.replace(/\.[^.]+\.srt$/i, '');
const track = name => {
  const match = name.match(/(?:^|\|\|\s*)([^|\s]+)\.([^.]+)\.srt$/i);
  if (!match) throw Error('Cannot identify subtitle: ' + name);
  return { id: match[1], language: match[2], identity: match[1] + ':' + match[2].toLowerCase(), base: baseOf(name) };
};
const indexBase = entry => entry.bundleKey || entry.name;
const inventory = rows => sha(JSON.stringify(rows.map(({ name, text }) => JSON.stringify([name, sha(text)])).sort()));

export function scan(source) {
  const storage = JSON.parse(source('storage.json')), index = JSON.parse(source('index.json'));
  const packs = new Map(), rows = [], ids = new Map();
  for (const meta of storage.packs) {
    if (packs.has(meta.path)) throw Error('Duplicate pack metadata: ' + meta.path);
    const files = JSON.parse(source(meta.path)).files;
    if (!files || Array.isArray(files) || Object.values(files).some(text => typeof text !== 'string')) throw Error('Invalid pack: ' + meta.path);
    packs.set(meta.path, { ...files });
    for (const [name, text] of Object.entries(files)) {
      const row = { name, text, pack: meta.path, ...track(name) };
      rows.push(row);
      ids.set(row.identity, [...(ids.get(row.identity) || []), row]);
    }
  }
  return { storage, index, packs, rows, ids };
}

export function planRecovery(old, current) {
  const before = current.rows.map(row => ({ ...row }));
  const currentIndex = new Map();
  for (const entry of current.index) {
    if (currentIndex.has(entry.link)) throw Error('Duplicate index link: ' + entry.link);
    currentIndex.set(entry.link, entry);
  }
  const oldIndex = new Map(old.index.map(entry => [entry.link, entry]));
  const changed = new Set(), restored = [], indexAdded = [], groups = new Map();
  const missingHistorical = old.rows.filter(row => !current.ids.has(row.identity));
  // Multiple historical filenames can describe one video/language. Restore the
  // previously indexed version; every differing alternative goes to the archive.
  for (const [identity, candidates] of old.ids) {
    if (current.ids.has(identity)) continue;
    const selected = candidates.find(row => row.base === indexBase(oldIndex.get(row.id) || {})) || candidates[0];
    const entry = currentIndex.get(selected.id);
    const sibling = current.rows.find(row => row.id === selected.id && (entry ? row.base === indexBase(entry) : true));
    const base = entry ? indexBase(entry) : sibling?.base || (oldIndex.has(selected.id) ? indexBase(oldIndex.get(selected.id)) : selected.base);
    const target = { ...selected, sourceName: selected.name, name: base + '.' + selected.language + '.srt', base };
    groups.set(base, [...(groups.get(base) || []), target]);
  }
  const size = files => Buffer.byteLength(bundleText(files));
  const fits = files => Object.keys(files).length <= current.storage.maxFiles && size(files) <= current.storage.maxBytes;
  let tail;
  function allocate(files) {
    if (tail && fits({ ...current.packs.get(tail), ...files })) return tail;
    do tail = 'packs/pack-' + String(current.storage.nextPack++).padStart(6, '0') + '.json';
    while (current.packs.has(tail));
    current.packs.set(tail, {});
    if (!fits(files)) throw Error('Historical media exceeds pack bounds: ' + Object.keys(files)[0]);
    return tail;
  }
  for (const [base, rows] of groups) {
    const id = rows[0].id, entry = currentIndex.get(id);
    const files = Object.fromEntries(rows.map(row => [row.name, row.text]));
    let pack = entry?.bundle && current.packs.has(entry.bundle) ? entry.bundle : current.rows.find(row => row.base === base)?.pack;
    if (pack && !fits({ ...current.packs.get(pack), ...files })) {
      const siblings = Object.fromEntries(Object.entries(current.packs.get(pack)).filter(([name]) => baseOf(name) === base));
      const destination = allocate({ ...siblings, ...files });
      for (const name of Object.keys(siblings)) delete current.packs.get(pack)[name];
      Object.assign(current.packs.get(destination), siblings);
      changed.add(pack);
      pack = destination;
    }
    if (!pack) pack = allocate(files);
    for (const row of rows) if (Object.hasOwn(current.packs.get(pack), row.name)) throw Error('Would replace current SRT: ' + row.name);
    Object.assign(current.packs.get(pack), files);
    changed.add(pack);
    if (entry) entry.bundle = pack;
    else {
      const copy = { ...(oldIndex.get(id) || { link: id, name: base, source: 'YouTube' }), bundle: pack };
      if (indexBase(copy) !== base) copy.bundleKey = base;
      current.index.push(copy);
      currentIndex.set(id, copy);
      indexAdded.push(id);
    }
    restored.push(...rows.map(row => ({ sourceName: row.sourceName, name: row.name, identity: row.identity, pack, sha256: sha(row.text) })));
  }
  // Repair orphaned current tracks too, including the first single-track restore.
  const afterRows = [...current.packs].flatMap(([pack, files]) => Object.entries(files).map(([name, text]) => ({ name, text, pack, ...track(name) })));
  const byId = new Map();
  for (const row of afterRows) byId.set(row.id, [...(byId.get(row.id) || []), row]);
  for (const [id, rows] of byId) {
    if (currentIndex.has(id)) continue;
    const historical = oldIndex.get(id);
    const selected = rows.find(row => historical && row.base === indexBase(historical)) || rows.find(row => row.language === 'sv') || rows[0];
    const copy = { ...(historical || { link: id, name: selected.base, source: 'YouTube' }), bundle: selected.pack };
    if (indexBase(copy) !== selected.base) copy.bundleKey = selected.base;
    current.index.push(copy);
    currentIndex.set(id, copy);
    indexAdded.push(id);
  }
  const modifications = new Map();
  for (const path of changed) {
    const files = current.packs.get(path), text = bundleText(files);
    const meta = current.storage.packs.find(pack => pack.path === path);
    const fields = { path, revision: (meta?.revision || 0) + 1, files: Object.keys(files).length, bytes: Buffer.byteLength(text) };
    if (meta) Object.assign(meta, fields); else current.storage.packs.push(fields);
    modifications.set(path, text);
  }
  const revisions = new Map(current.storage.packs.map(meta => [meta.path, meta.revision]));
  let revisionsRepaired = 0;
  for (const entry of current.index) if (entry.bundle && revisions.has(entry.bundle)) {
    if (entry.bundleRevision !== revisions.get(entry.bundle)) revisionsRepaired++;
    entry.bundleRevision = revisions.get(entry.bundle);
  }
  const keyOf = row => JSON.stringify([row.name, sha(row.text)]);
  const afterNames = new Map(), required = new Map();
  for (const row of afterRows) afterNames.set(keyOf(row), (afterNames.get(keyOf(row)) || 0) + 1);
  for (const row of before) required.set(keyOf(row), (required.get(keyOf(row)) || 0) + 1);
  for (const [key, count] of required) if (afterNames.get(key) !== count) throw Error('Current SRT altered: ' + key);
  // These checks use exactly the bundle/base/language lookup of createBundleLoader.
  for (const row of restored) {
    const entry = currentIndex.get(track(row.name).id), key = indexBase(entry) + '.' + track(row.name).language + '.srt';
    if (entry.bundle !== row.pack || sha(current.packs.get(entry.bundle)?.[key] || '') !== row.sha256) throw Error('Recovered track is not indexed: ' + row.name);
  }
  for (const id of indexAdded) {
    const entry = currentIndex.get(id);
    if (!afterRows.some(row => row.pack === entry.bundle && row.base === indexBase(entry))) throw Error('Added index entry has no tracks: ' + id);
  }
  const afterIds = new Map();
  for (const row of afterRows) afterIds.set(row.identity, [...(afterIds.get(row.identity) || []), row]);
  for (const [identity, rows] of afterIds) if (rows.length > Math.max(current.ids.get(identity)?.length || 0, 1)) throw Error('Introduced duplicate track identity: ' + identity);
  const archive = new Map();
  for (const row of old.rows) if (!afterIds.get(row.identity)?.some(copy => copy.text === row.text)) archive.set(row.name, row.text);
  for (const row of old.rows) if (!afterIds.get(row.identity)?.some(copy => copy.text === row.text) && archive.get(row.name) !== row.text) throw Error('Historical text lost: ' + row.name);
  const indexWithoutTracks = current.index.filter(entry => !afterRows.some(row => row.id === entry.link && row.pack === entry.bundle && row.base === indexBase(entry))).map(entry => entry.link);
  const report = {
    baseline: BASE, status: 'verified', historicalTracks: old.rows.length,
    currentTracksPreserved: before.length, currentInventorySha256: inventory(before),
    preservedInventorySha256: inventory(afterRows.filter(row => required.has(keyOf(row)))),
    historicalMissingNames: missingHistorical.length, activeTracksRestored: restored.length,
    activeTracksAfter: afterRows.length, historicalVariantsArchived: archive.size,
    indexEntriesAdded: indexAdded.length, indexRevisionsRepaired: revisionsRepaired,
    existingDuplicateIdentitiesPreserved: [...current.ids.values()].filter(rows => rows.length > 1).length,
    indexWithoutTracks, restored,
    historicalVariants: [...archive].map(([name, text]) => ({ name, identity: track(name).identity, sha256: sha(text) })),
    policy: 'Current filenames and SRT text are unchanged. Restore absent video/language tracks using the historical index preference. Archive all differing historical text verbatim; never auto-resolve conflicting cues. Existing duplicate identities and metadata-only index rows are retained.'
  };
  if (report.currentInventorySha256 !== report.preservedInventorySha256) throw Error('Current inventory digest changed');
  modifications.set('storage.json', jsonText(current.storage));
  modifications.set('index.json', jsonText(current.index));
  return { modifications, archive, report };
}

function main() {
  const oldFile = path => execFileSync('git', ['show', BASE + ':' + DIR + '/' + path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const curFile = path => readFileSync(join(DIR, path), 'utf8');
  const current = scan(curFile), result = planRecovery(scan(oldFile), current);
  console.log(JSON.stringify({ ...result.report, restored: undefined, historicalVariants: undefined }, null, 2));
  if (!process.argv.includes('--apply')) return;
  for (const [path, text] of result.modifications) {
    const target = join(DIR, path);
    if (existsSync(target) && curFile(path) === text) continue;
    if (existsSync(target)) {
      const backup = join(REPORT_DIR, 'backup', path);
      mkdirSync(dirname(backup), { recursive: true });
      if (!existsSync(backup)) writeFileSync(backup, curFile(path));
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
  const disk = scan(curFile), originalKeys = new Set(current.rows.map(row => JSON.stringify([row.name, sha(row.text)])));
  if (inventory(disk.rows.filter(row => originalKeys.has(JSON.stringify([row.name, sha(row.text)])))) !== result.report.currentInventorySha256) throw Error('Post-write current inventory mismatch');
  for (const row of result.report.restored) if (!disk.rows.some(copy => copy.name === row.name && copy.pack === row.pack && sha(copy.text) === row.sha256)) throw Error('Post-write recovery mismatch: ' + row.name);
  let part = {}, number = 1;
  const archives = [];
  function savePart() {
    if (!Object.keys(part).length) return;
    const path = 'historical-variants/part-' + String(number++).padStart(4, '0') + '.json';
    const target = join(REPORT_DIR, path), text = bundleText(part);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
    archives.push({ path, files: Object.keys(part).length, sha256: sha(text) });
    part = {};
  }
  for (const [name, text] of result.archive) {
    if (Object.keys(part).length >= 200 || Buffer.byteLength(bundleText({ ...part, [name]: text })) > 1024 * 1024) savePart();
    part[name] = text;
  }
  savePart();
  // Keep the first execution certificate on idempotent workflow reruns.
  const reportPath = join(REPORT_DIR, 'report.json');
  if (result.report.activeTracksRestored || result.report.indexEntriesAdded || !existsSync(reportPath)) writeFileSync(reportPath, jsonText({ ...result.report, archives }));
  console.log('Verified disk recovery; ' + result.report.activeTracksRestored + ' restored, ' + result.report.currentTracksPreserved + ' current SRTs unchanged.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
