#!/usr/bin/env node
// Validate published data with Cupitor's actual parser, matcher and hint index.
// node tools/validate-core-vocabulary.mjs /path/to/cupitor/frontend/vue3/cupitor-frontend
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
assert(process.argv[2], 'Pass the Cupitor frontend source directory.')
const moduleAt = name => import(pathToFileURL(resolve(process.argv[2], 'public/language', name)))
const {parseVocabularyFile, isProperlyBracketed, vocabularyToText} = await moduleAt('vocab-merge.js')
const {vocabularyEntries} = await moduleAt('vocabulary-entries.js')
const {createVocabularyMatcher} = await moduleAt('vocabulary-matcher.js')
const {vocabularyLineParts, createVocabularyHintIndex, parseVocabularyCatalog} = await moduleAt('vocabulary-hints.js')
const {isVocabularyStopWord} = await moduleAt('vocab-search.js')
execFileSync(process.execPath, [resolve(root, 'tools/build-core-vocabulary.mjs')], {stdio:'inherit'})
for (const [code, name] of [['es','spanish'], ['fr','french'], ['de','german']]) {
  const text = await readFile(resolve(root, 'db/language', name, 'vocabulary.txt'), 'utf8')
  const categories = text.split('\n').filter(line => line.startsWith('#')).map(line => line.slice(1).trim())
  assert.equal(new Set(categories).size, categories.length, 'Repeated headings would hide earlier entries')
  const vocabulary = parseVocabularyFile(text)
  const core = vocabularyEntries(vocabulary).filter(row => row.line.trim() && row.category.startsWith('Core - '))
  assert.equal(core.length, 700)
  const roundTrip = vocabularyEntries(parseVocabularyFile(vocabularyToText(vocabulary)))
  for (const row of core) assert(roundTrip.some(item => item.id === row.id && item.line === row.line && item.category === row.category))
  const matcher = createVocabularyMatcher(vocabulary, {lang:code})
  const hints = createVocabularyHintIndex(matcher.rows, code, parseVocabularyCatalog(null), 'en')
  let nativeChecks = 0, hintChecks = 0
  for (const row of core) {
    assert(row.id && isProperlyBracketed(row.line))
    const parts = vocabularyLineParts(row.line)
    assert(parts.hints.length && parts.forms.length)
    for (const cue of parts.hints) {
      assert(hints.search(cue).some(hit => hit.entryId === row.id || hit.line === row.line), `${name}: missing English hint ${cue}`)
      hintChecks++
    }
    for (const form of parts.forms) {
      if (isVocabularyStopWord(form)) continue // The study app deliberately suppresses common-word-only native queries.
      assert(matcher.matchLine(row.line, form), `${name}: native form did not match ${form}`)
      nativeChecks++
    }
  }
  if (name !== 'spanish') assert.deepEqual(JSON.parse(await readFile(resolve(root, 'db/language', name, 'srts/index.json'), 'utf8')), [])
  console.log(`${name}: parser/identity round trip, ${nativeChecks} native searches and ${hintChecks} English hint searches passed`)
}
