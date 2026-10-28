import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scan, planRecovery } from './recover-srt-inventory.mjs';

const pack = 'packs/pack-000001.json';
const name = (title, id, language) => title + ' || ' + id + '.' + language + '.srt';
const entry = (title, id, extra = {}) => ({ link: id, name: title + ' || ' + id, source: 'YouTube', bundle: pack, bundleRevision: 1, ...extra });
function fixture(files, index, maxFiles = 200) {
  const sources = new Map([[pack, JSON.stringify({ version: 1, files })]]);
  sources.set('index.json', JSON.stringify(index));
  sources.set('storage.json', JSON.stringify({ format: 'cupitor-srt-bundles', version: 1, maxFiles, maxBytes: 1048576, nextPack: 2,
    packs: [{ path: pack, revision: 1, files: Object.keys(files).length, bytes: Buffer.byteLength(sources.get(pack)) }] }));
  return { sources, read: () => scan(path => sources.get(path)) };
}
function lookup(result, id, language) {
  const index = JSON.parse(result.modifications.get('index.json'));
  const item = index.find(row => row.link === id);
  const files = JSON.parse(result.modifications.get(item.bundle)).files;
  return files[(item.bundleKey || item.name) + '.' + language + '.srt'];
}

test('missing English sibling uses the current renamed Swedish base and revision', () => {
  const id = '8f4cZIEtktk';
  const old = fixture({ [name('Old title', id, 'sv')]: 'old Swedish', [name('Old title', id, 'en')]: 'English' }, [entry('Old title', id)]);
  const currentName = name('New title', id, 'sv');
  const current = fixture({ [currentName]: 'new Swedish' }, [entry('New title', id)]);
  const result = planRecovery(old.read(), current.read());
  assert.equal(lookup(result, id, 'en'), 'English');
  assert.equal(lookup(result, id, 'sv'), 'new Swedish');
  assert.equal(result.archive.get(name('Old title', id, 'sv')), 'old Swedish');
  assert.equal(result.report.activeTracksRestored, 1);
  assert.equal(JSON.parse(result.modifications.get('index.json'))[0].bundleRevision, 2);
  assert.equal(result.report.currentInventorySha256, result.report.preservedInventorySha256);
});

test('conflicting and shortened current text is never replaced or automatically merged', () => {
  const id = 'ivOW01v4VXc', key = name('Title', id, 'sv');
  const historical = '1\n00:00:01,000 --> 00:00:02,000\nold wording\n\n2\n00:00:03,000 --> 00:00:04,000\nextra historical cue\n';
  const newer = '1\n00:00:01,000 --> 00:00:02,000\ncorrected wording\n';
  const old = fixture({ [key]: historical }, [entry('Title', id)]);
  const current = fixture({ [key]: newer }, [entry('Title', id)]);
  const snapshot = current.read(), result = planRecovery(old.read(), snapshot);
  assert.equal(snapshot.packs.get(pack)[key], newer);
  assert.equal(result.archive.get(key), historical);
  assert.equal(result.report.activeTracksRestored, 0);
});

test('historical duplicate identities use the historical index and archive alternatives', () => {
  const id = 'JWM0EtR7pkw';
  const old = fixture({ [name('Alternative', id, 'sv')]: 'alternative text', [name('Indexed', id, 'sv')]: 'indexed text' }, [entry('Indexed', id)]);
  const current = fixture({}, []);
  const result = planRecovery(old.read(), current.read());
  assert.equal(lookup(result, id, 'sv'), 'indexed text');
  assert.equal(result.archive.get(name('Alternative', id, 'sv')), 'alternative text');
  assert.equal(result.report.historicalMissingNames, 2);
  assert.equal(result.report.activeTracksRestored, 1);
});

test('overflow moves only siblings, preserves unrelated files and indexes orphaned tracks', () => {
  const id = '8f4cZIEtktk', other = 'eWKShBhCSCQ';
  const old = fixture({ [name('Title', id, 'en')]: 'English' }, [entry('Title', id)]);
  const current = fixture({ [name('Title', id, 'sv')]: 'Swedish', [name('Unrelated', other, 'sv')]: 'unrelated' }, [entry('Title', id)], 2);
  const result = planRecovery(old.read(), current.read());
  assert.equal(lookup(result, id, 'en'), 'English');
  assert.equal(lookup(result, id, 'sv'), 'Swedish');
  assert.equal(lookup(result, other, 'sv'), 'unrelated');
  assert.deepEqual(JSON.parse(result.modifications.get(pack)).files, { [name('Unrelated', other, 'sv')]: 'unrelated' });
  assert.equal(result.report.currentTracksPreserved, 2);
});

test('a second recovery is a no-op for active data and index revisions', () => {
  const id = '8f4cZIEtktk';
  const old = fixture({ [name('Old', id, 'en')]: 'English' }, [entry('Old', id)]);
  const current = fixture({ [name('Current', id, 'sv')]: 'Swedish' }, [entry('Current', id)]);
  const first = planRecovery(old.read(), current.read());
  for (const [path, text] of first.modifications) current.sources.set(path, text);
  const second = planRecovery(old.read(), current.read());
  assert.equal(second.report.activeTracksRestored, 0);
  assert.equal(second.report.indexEntriesAdded, 0);
  assert.equal(second.report.indexRevisionsRepaired, 0);
  for (const [path, text] of second.modifications) assert.equal(text, current.sources.get(path));
});
