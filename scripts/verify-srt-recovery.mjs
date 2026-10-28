#!/usr/bin/env node
// Read-only certificate verification against immutable pre-recovery Git snapshots.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ORIGINAL = '748567dc100fba17f923076bea918f68c07042bb';
const HISTORICAL = 'f350695ef963a96732fb6fda2efafee1cb003c2f';
const DIR = 'db/language/swedish/srts/';
const REPORT_DIR = 'srt-recovery-report/';
const hash = text => createHash('sha256').update(text).digest('hex');
const disk = path => readFileSync(DIR + path, 'utf8');
const git = ref => path => execFileSync('git', ['show', ref + ':' + DIR + path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const identity = name => name.split(' || ').at(-1).replace(/\.([^.]+)\.srt$/, (_, language) => '.' + language.toLowerCase());
const baseOf = name => name.replace(/\.[^.]+\.srt$/, '');
const key = row => JSON.stringify([row.name, hash(row.text)]);
const digest = rows => hash(JSON.stringify(rows.map(key).sort()));
function snapshot(read) {
  const storage = JSON.parse(read('storage.json')), index = JSON.parse(read('index.json'));
  const rows = [], packs = new Map();
  for (const meta of storage.packs) {
    const raw = read(meta.path), files = JSON.parse(raw).files;
    packs.set(meta.path, { raw, files, meta });
    for (const [name, text] of Object.entries(files)) rows.push({ name, text, pack: meta.path });
  }
  return { storage, index, rows, packs };
}
const before = snapshot(git(ORIGINAL)), historical = snapshot(git(HISTORICAL)), after = snapshot(disk);
const report = JSON.parse(readFileSync(REPORT_DIR + 'report.json', 'utf8'));
assert.equal(report.baseline, HISTORICAL);
assert.equal(report.status, 'verified');
const count = rows => { const result = new Map(); for (const row of rows) result.set(key(row), (result.get(key(row)) || 0) + 1); return result; };
const originalCounts = count(before.rows), actualCounts = count(after.rows);
for (const [nameAndHash, copies] of originalCounts) assert.equal(actualCounts.get(nameAndHash), copies, 'Current track changed or duplicated: ' + nameAndHash);
assert.equal(digest(before.rows), report.currentInventorySha256);
assert.equal(digest(after.rows.filter(row => originalCounts.has(key(row)))), report.preservedInventorySha256);
assert.equal(before.rows.length, report.currentTracksPreserved);
assert.equal(after.rows.length, report.activeTracksAfter);
for (const { raw, files, meta } of after.packs.values()) {
  assert.equal(Buffer.byteLength(raw), meta.bytes, 'Wrong bytes: ' + meta.path);
  assert.equal(Object.keys(files).length, meta.files, 'Wrong file count: ' + meta.path);
  assert.ok(meta.files <= after.storage.maxFiles, 'Too many files: ' + meta.path);
  assert.ok(meta.bytes <= after.storage.maxBytes, 'Too many bytes: ' + meta.path);
}
const oldIndex = new Map(before.index.map(entry => [entry.link, entry]));
const afterIndex = new Map(after.index.map(entry => [entry.link, entry]));
assert.equal(afterIndex.size, after.index.length, 'Duplicate index links');
function load(snapshot, entry, language) {
  return snapshot.packs.get(entry.bundle)?.files[(entry.bundleKey || entry.name) + '.' + language + '.srt'];
}
for (const entry of after.index) if (entry.bundle) {
  assert.ok(after.packs.has(entry.bundle), 'Index refers to missing pack: ' + entry.link);
  assert.equal(entry.bundleRevision, after.packs.get(entry.bundle).meta.revision, 'Stale revision: ' + entry.link);
  assert.ok(Object.keys(after.packs.get(entry.bundle).files).some(name => baseOf(name) === (entry.bundleKey || entry.name)), 'Index base has no files: ' + entry.link);
}
for (const entry of before.index) {
  const updated = afterIndex.get(entry.link);
  assert.ok(updated, 'Current index row removed: ' + entry.link);
  for (const language of ['sv', 'en', 'sv-orig']) {
    const previous = load(before, entry, language);
    if (previous !== undefined) assert.equal(load(after, updated, language), previous, 'Current indexed track no longer loads: ' + entry.link + ':' + language);
  }
}
const archive = new Map();
for (const file of report.archives) {
  const raw = readFileSync(REPORT_DIR + file.path, 'utf8');
  assert.equal(hash(raw), file.sha256, 'Archive hash mismatch: ' + file.path);
  const files = JSON.parse(raw).files;
  assert.equal(Object.keys(files).length, file.files);
  for (const [name, text] of Object.entries(files)) {
    assert.ok(!archive.has(name), 'Duplicate archive filename');
    archive.set(name, text);
  }
}
assert.equal(archive.size, report.historicalVariantsArchived);
const actualHistorical = new Set(after.rows.map(row => JSON.stringify([identity(row.name), hash(row.text)])));
for (const row of historical.rows) assert.ok(actualHistorical.has(JSON.stringify([identity(row.name), hash(row.text)])) || archive.get(row.name) === row.text, 'Unrecovered historical text: ' + row.name);
const historicalNames = new Map(historical.rows.map(row => [row.name, row.text]));
for (const row of report.restored) {
  assert.equal(hash(historicalNames.get(row.sourceName)), row.sha256);
  const language = row.name.split('.').at(-2), id = row.name.split(' || ').at(-1).replace(/\.[^.]+\.srt$/, '');
  assert.equal(hash(load(after, afterIndex.get(id), language)), row.sha256, 'Restored text is not loadable: ' + row.name);
}
for (const row of report.historicalVariants) assert.equal(hash(archive.get(row.name)), row.sha256);
assert.equal(report.restored.length, report.activeTracksRestored);
assert.equal(after.index.length - before.index.length, report.indexEntriesAdded);
assert.deepEqual(after.index.filter(entry => !entry.bundle).map(entry => entry.link).sort(), report.indexWithoutTracks.slice().sort());
const perIdentity = rows => { const counts = new Map(); for (const row of rows) counts.set(identity(row.name), (counts.get(identity(row.name)) || 0) + 1); return counts; };
const beforeIds = perIdentity(before.rows);
for (const [id, n] of perIdentity(after.rows)) assert.ok(n <= Math.max(beforeIds.get(id) || 0, 1), 'New duplicate identity: ' + id);
console.log('PASS: ' + before.rows.length + ' current SRTs byte-for-byte preserved; all ' + historical.rows.length + ' historical texts present in active data or verified archives; ' + report.activeTracksRestored + ' restored tracks load through the index.');
