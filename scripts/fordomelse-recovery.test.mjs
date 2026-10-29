// Verify this repair against immutable snapshots, independently of the merger.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dir = 'db/language/swedish/srts/';
const beforeRef = '6e075167bf3274c338ba37611b9b140faa90885c';
const historicalRef = 'f350695ef963a96732fb6fda2efafee1cb003c2f';
const destructiveRef = 'a9471feabddbbb3d3ea8faf5bef404c725cc7e7f';
const id = 'CwQNmKM3b04';
const name = 'Word of Life Play || Fredag morgon _ Marie-Louise Nilsson || ' + id + '.sv.srt';
const pack = 'packs/pack-000054.json';
const archive = 'srt-recovery-report/historical-variants/part-0010.json';
const git = (ref, path) => execFileSync('git', ['show', ref + ':' + path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const disk = path => readFileSync(path, 'utf8');
const snapshot = (ref, path) => JSON.parse(git(ref, path));
const oldText = snapshot(historicalRef, dir + pack).files[name];
const beforeText = snapshot(beforeRef, dir + pack).files[name];
const currentText = JSON.parse(disk(dir + pack)).files[name];
// Compare exact timestamp/body blocks; the SRT sequence numbers can change.
const cues = text => text.trim().split(/\r?\n\s*\r?\n/).map(block => block.replace(/^\d+\r?\n/, ''));
const hash = text => createHash('sha256').update(text).digest('hex');

test('history identifies the loss and the unchanged archive preserves all six original cues', () => {
  assert.equal(cues(oldText).length, 6);
  assert.match(oldText, /fördömelse/);
  assert.equal(snapshot(destructiveRef, dir + pack).files[name], beforeText);
  assert.doesNotMatch(beforeText, /fördömelse/);
  assert.equal(JSON.parse(disk(archive)).files[name], oldText);
  assert.equal(disk(archive), git(beforeRef, archive));
});

test('active subtitle contains all six historical and all eight current cues exactly once', () => {
  const expected = [...cues(beforeText), ...cues(oldText)].sort();
  assert.equal(new Set(expected).size, 14, 'the two windows have no collisions');
  assert.deepEqual(cues(currentText).sort(), expected);
  assert.match(currentText, /01:17:40,280 --> 01:17:42,880\nfördömelse/);
});

test('every other active subtitle, filename and duplicate count remains byte-for-byte unchanged', () => {
  function inventory(read) {
    const storage = JSON.parse(read(dir + 'storage.json'));
    const rows = storage.packs.flatMap(meta => Object.entries(JSON.parse(read(dir + meta.path)).files));
    return rows.map(([key, text]) => JSON.stringify([key, key === name ? 'verified separately' : hash(text)])).sort();
  }
  const before = inventory(path => git(beforeRef, path));
  assert.equal(before.length, 17914);
  assert.deepEqual(inventory(disk), before);
});

test('bundle metadata and all affected index revisions expose the repaired text to the app', () => {
  const storage = JSON.parse(disk(dir + 'storage.json'));
  const index = JSON.parse(disk(dir + 'index.json'));
  const meta = storage.packs.find(item => item.path === pack);
  const beforeStorage = snapshot(beforeRef, dir + 'storage.json');
  const beforeMeta = beforeStorage.packs.find(item => item.path === pack);
  const text = disk(dir + pack);
  assert.equal(meta.revision, beforeMeta.revision + 1);
  assert.equal(meta.bytes, Buffer.byteLength(text));
  assert.equal(meta.files, Object.keys(JSON.parse(text).files).length);
  assert(meta.bytes <= storage.maxBytes);
  assert(meta.files <= storage.maxFiles);
  const affected = index.filter(entry => entry.bundle === pack);
  assert(affected.length > 0);
  assert(affected.every(entry => entry.bundleRevision === meta.revision));
  const entry = index.find(entry => entry.link === id);
  assert.equal(entry.bundle, pack);
  assert.equal((entry.bundleKey || entry.name) + '.sv.srt', name);
  const normalize = entry => entry.bundle === pack ? { ...entry, bundleRevision: beforeMeta.revision } : entry;
  assert.deepEqual(index.map(normalize), snapshot(beforeRef, dir + 'index.json'));
  assert.deepEqual({ ...storage, packs: storage.packs.map(item => item.path === pack ? beforeMeta : item) }, beforeStorage);
});
