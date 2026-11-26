#!/usr/bin/env node
// Reuse the app's effective, Swedish-context meanings, with explicit gap fixes.
// node tools/build-expanded-vocabulary.mjs /path/to/cupitor-frontend [--write]
import assert from 'node:assert/strict'
import {readFile, writeFile, mkdir} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {pathToFileURL, fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
assert(process.argv[2], 'Pass the Cupitor frontend source directory.')
const appModule = file => import(pathToFileURL(resolve(process.argv[2], 'public/language', file)))
const {parseVocabularyFile, isProperlyBracketed} = await appModule('vocab-merge.js')
const {vocabularyEntries, adoptVocabularyEntryIds} = await appModule('vocabulary-entries.js')
const {createVocabularyHintIndex, parseVocabularyHintTranslations, parseVocabularyHintLanguages,
  mergeVocabularyCatalogs, vocabularyLineParts, parseVocabularyCatalog} = await appModule('vocabulary-hints.js')
const {createVocabularyCatalogReader, packVocabularyCatalog, catalogJSON, VOCABULARY_STORAGE_INDEX,
  } = await appModule('vocabulary-catalog-storage.js')
const {vocabularyHintSeed} = await appModule('vocabulary-hint-seed.js')
const {createVocabularyMatcher} = await appModule('vocabulary-matcher.js')
const {isVocabularyStopWord} = await appModule('vocab-search.js')
const hash = text => createHash('sha256').update(text).digest('hex')
const read = async path => readFile(resolve(root, path), 'utf8').catch(error => {
  if (error.code === 'ENOENT') return null
  throw error
})
const sharedRead = path => read('db/language/shared/' + path)
const write = process.argv.includes('--write')
const manifestFile = 'docs/vocabulary-es-fr-de-gap-translations-2026-11-26.json'
const reportFile = 'docs/vocabulary-es-fr-de-coverage-2026-11-26.json'
const manifest = JSON.parse(await read(manifestFile))
const previousReport = JSON.parse(await read(reportFile) || 'null')
const sourceText = await read('db/language/swedish/vocabulary.txt')
assert.equal(hash(sourceText), manifest.sourceSha256, 'The Swedish baseline changed; reconcile its entry IDs before rebuilding.')
const sourceVocabulary = parseVocabularyFile(sourceText)
const rows = vocabularyEntries(sourceVocabulary).filter(row => row.line.trim()
  && !['__empty__', 'expansions', 'Expansions', '_expansions', 'Assimilations'].includes(row.category))
  .filter(row => vocabularyLineParts(row.line).forms.some(form => /\p{L}/u.test(form)))
  .map((row, index) => ({...row, index, entryId: row.id, ...vocabularyLineParts(row.line), hintsByLanguage:{}}))
assert.equal(rows.length, 9377)
const hintLanguages = parseVocabularyHintLanguages(await read('db/language/shared/vocabulary-hints/languages.txt'))
const targets = [['es','spanish'], ['fr','french'], ['de','german']]
const knownSourceIds = new Set(rows.map(row => row.id))
for (const id of Object.keys(manifest.corrections)) assert(knownSourceIds.has(id), `Unknown correction ${id}`)
for (const id of Object.keys(manifest.excluded)) assert(knownSourceIds.has(id), `Unknown exclusion ${id}`)
const sharedTables = new Map(), defaultCatalogs = new Map()
for (const language of hintLanguages) {
  const reader = createVocabularyCatalogReader({read: sharedRead, target:'sv', vocabulary:()=>sourceVocabulary})
  await reader.initialize()
  await reader.loadLanguage(language)
  const catalog = mergeVocabularyCatalogs(vocabularyHintSeed, await reader.catalog())
  const table = parseVocabularyHintTranslations(await read(`db/language/shared/vocabulary-hints/${language}.txt`), language)
  sharedTables.set(language, table)
  defaultCatalogs.set(language, mergeVocabularyCatalogs(vocabularyHintSeed, {
    version:1, groups:{}, meanings:{}, sharedHints:catalog.sharedHints,
  }))
  const index = createVocabularyHintIndex(rows, 'sv', catalog, language, table)
  for (const row of rows) row.hintsByLanguage[language] = index.hintsFor(row.line, row.index)
}
const clean = values => [...new Set(values.map(value => value.normalize('NFC').trim().replace(/\s+/gu,' ')).filter(Boolean))]
const same = (a, b) => JSON.stringify(clean(a).sort()) === JSON.stringify(clean(b).sort())
const sources = rows.filter(row => !Object.hasOwn(manifest.excluded, row.id))
for (const row of sources) {
  const correction = manifest.corrections[row.id]
  row.english = correction?.english || row.hints.join(', ')
  assert(row.english, `Missing English meaning for ${row.id}`)
  for (const [language] of targets) {
    row.hintsByLanguage[language] = clean(correction?.forms[language] || row.hintsByLanguage[language])
    assert(row.hintsByLanguage[language].length, `Untranslated source ${language}: ${row.line}`)
  }
  for (const [language, hints] of Object.entries(correction?.hints || {})) row.hintsByLanguage[language] = clean(hints)
}
const originalIndex = JSON.parse(await sharedRead(VOCABULARY_STORAGE_INDEX))
const baselineStreams = previousReport?.baselineStreams || originalIndex.streams
const baselineHintLanguages = previousReport?.baselineHintLanguages || originalIndex.hintLanguages
const outputFiles = new Map(), newGroups = {}, targetReport = {}
const allNativeRows = new Map()
for (const [code, name] of targets) {
  const file = `db/language/${name}/vocabulary.txt`
  const current = await read(file)
  const boundary = current.indexOf('#Extended - ')
  const baseline = boundary < 0 ? current : current.slice(0, boundary)
  assert.equal(hash(baseline), manifest.baselineSha256[name], `Existing ${name} material changed; preserve and reconcile it first.`)
  if (boundary >= 0) assert(previousReport && hash(current) === previousReport.languages[code].outputSha256,
    `The expanded ${name} vocabulary was edited; reconcile it before regenerating.`)
  const baseVocabulary = await adoptVocabularyEntryIds(parseVocabularyFile(baseline), code)
  // Preserve existing catalog groups, including the Spanish seed identities.
  const existingReader = createVocabularyCatalogReader({read:sharedRead, target:code, vocabulary:()=>baseVocabulary})
  await existingReader.initialize()
  for (const language of hintLanguages) {
    await existingReader.loadLanguage(language)
    for (const [id, group] of Object.entries((await existingReader.catalog()).groups)) {
      if (id.startsWith(code + '-sv-')) continue
      const previous = newGroups[id]
      newGroups[id] = {...group, hintOverrides:{...previous?.hintOverrides, ...group.hintOverrides}}
    }
  }
  const byKey = new Map(), unique = [], mapping = []
  for (const row of sources) {
    const forms = row.hintsByLanguage[code]
    const line = `(${row.english})|${forms.join('|')}|`
    assert(isProperlyBracketed(line) && !/[\r\n\t<>]/u.test(line), `${name}: unsafe native row ${row.id}: ${line}`)
    // Consolidate identical cue/form groups within a topic. Keep different
    // source categories separate so their contextual meanings remain distinct.
    const key = JSON.stringify([row.category,row.english.normalize('NFC').toLowerCase(),forms.map(form=>form.toLowerCase()).sort()])
    let group = byKey.get(key)
    if (!group) {
      const id = code + '-sv-' + row.id
      assert(id.length <= 80)
      group = {id, entryId:id, category:'Extended - ' + row.category, line, sourceRows:[], hints:{}}
      byKey.set(key, group)
      unique.push(group)
    }
    group.sourceRows.push(row.id)
    for (const language of hintLanguages) group.hints[language] = clean([...(group.hints[language] || []), ...row.hintsByLanguage[language]])
    mapping.push([row.id,group.id])
  }
  // Render every category only once: repeated headings overwrite earlier rows.
  const categories = new Map()
  for (const group of unique) {
    if (!categories.has(group.category)) categories.set(group.category, [])
    categories.get(group.category).push(`${group.line}\t[entry:${group.id}]`)
  }
  const generated = [...categories].map(([category, lines]) => '#'+category+'\n'+lines.join('\n')).join('\n')+'\n'
  const output = baseline + generated
  outputFiles.set(file, output)
  const vocabulary = await adoptVocabularyEntryIds(parseVocabularyFile(output), code)
  const matcher = createVocabularyMatcher(vocabulary, {lang:code})
  const nativeRows = matcher.rows.filter(row => row.entryId?.startsWith(code + '-sv-'))
  assert.equal(nativeRows.length, unique.length)
  allNativeRows.set(code,{vocabulary,nativeRows,unique,matcher,baseVocabulary})
  // Only store contextual overrides when shared English-cue hints differ.
  // Reusing the shared tables avoids copying every alias into three corpora.
  let contextualOverrides = 0
  const uniqueById = new Map(unique.map(group => [group.id,group]))
  for (const language of hintLanguages) {
    if (language === code) continue
    const defaults = createVocabularyHintIndex(nativeRows, code, defaultCatalogs.get(language), language, sharedTables.get(language))
    for (const [i,row] of nativeRows.entries()) {
      const group = uniqueById.get(row.entryId)
      const expected = group.hints[language] || []
      if (same(defaults.hintsFor(row.line,row.index), expected)) continue
      if (!newGroups[group.id]) newGroups[group.id] = {
        language:code, category:group.category, line:group.line, entryId:group.id, forms:[], meanings:[], hintOverrides:{},
      }
      newGroups[group.id].hintOverrides[language] = expected
      contextualOverrides++
    }
  }
  const allEntries = vocabularyEntries(vocabulary).filter(row=>row.line.trim() && row.category !== '__empty__')
  targetReport[code] = {
    language:name, sourceGroupsCovered:mapping.length, addedGroups:unique.length,
    consolidatedDuplicates:mapping.length-unique.length, totalEntries:allEntries.length,
    addedCategories:categories.size, outputSha256:hash(output), contextualOverrides,
    nativeForms:unique.reduce((sum,group)=>sum+vocabularyLineParts(group.line).forms.length,0),
    distinctNativeForms:new Set(unique.flatMap(group=>vocabularyLineParts(group.line).forms.map(form=>form.toLowerCase()))).size,
    duplicateSourceMappings:mapping.filter(([source,target])=>target !== code+'-sv-'+source),
  }
  console.log(code, JSON.stringify({...targetReport[code],duplicateSourceMappings:targetReport[code].duplicateSourceMappings.length}))
}
const packed = await packVocabularyCatalog({version:1, meanings:{}, sharedHints:{}, groups:newGroups})
for (const name of Object.keys(packed.index.streams)) {
  assert(/^(?:metadata\/(es|fr|de)|hints\/(es|fr|de)\/)/u.test(name), `Unexpected write to ${name}`)
  const current = originalIndex.streams[name]
  const expected = previousReport?.generatedStreams[name] ?? baselineStreams[name]
  assert.equal(current, expected, `The ${name} catalog changed independently; reconcile it first.`)
}
const mergedIndex = {...originalIndex, streams:{...originalIndex.streams,...packed.index.streams},
  hintLanguages:[...new Set([...(originalIndex.hintLanguages || []),...packed.index.hintLanguages])].sort()}
for (const [name,oldRoot] of Object.entries(baselineStreams)) {
  if (!Object.hasOwn(packed.index.streams,name)) assert.equal(mergedIndex.streams[name],oldRoot, `Unrelated stream changed: ${name}`)
}
for (const [path,text] of packed.files) {
  if (path !== VOCABULARY_STORAGE_INDEX) outputFiles.set('db/language/shared/'+path,text)
}
outputFiles.set('db/language/shared/'+VOCABULARY_STORAGE_INDEX,catalogJSON(mergedIndex))
const readNext = async path => outputFiles.get('db/language/shared/'+path) ?? sharedRead(path)
let nativeChecks = 0, englishChecks = 0, localizedChecks = 0, preservedHintChecks = 0
for (const [code,{vocabulary,nativeRows,unique,matcher,baseVocabulary}] of allNativeRows) {
  const grouped = new Map(unique.map(group=>[group.id,group]))
  const english = createVocabularyHintIndex(nativeRows,code,parseVocabularyCatalog(null),'en')
  for (const row of nativeRows) {
    for (const cue of vocabularyLineParts(row.line).hints) {
      assert(english.search(cue).some(hit=>hit.entryId === row.entryId), `${code}: missing English cue ${cue}`)
      englishChecks++
    }
    for (const form of vocabularyLineParts(row.line).forms) {
      if (isVocabularyStopWord(form)) continue
      assert(matcher.matchLine(row.line,form), `${code}: missing native form ${form}`)
      nativeChecks++
    }
  }
  const reader = createVocabularyCatalogReader({read:readNext,target:code,vocabulary:()=>vocabulary})
  const beforeReader = createVocabularyCatalogReader({
    read:async path=>path===VOCABULARY_STORAGE_INDEX
      ? catalogJSON({...originalIndex,streams:baselineStreams,hintLanguages:baselineHintLanguages})
      : sharedRead(path),
    target:code,vocabulary:()=>baseVocabulary,
  })
  await reader.initialize()
  await beforeReader.initialize()
  const baseRows = createVocabularyMatcher(baseVocabulary,{lang:code}).rows.filter(row=>row.line.trim())
  const afterById = new Map(matcher.rows.map(row=>[row.entryId,row]))
  for (const language of hintLanguages) {
    if (language === code) continue
    await reader.loadLanguage(language)
    await beforeReader.loadLanguage(language)
    const catalog = mergeVocabularyCatalogs(vocabularyHintSeed,await reader.catalog())
    const hints = createVocabularyHintIndex(nativeRows,code,catalog,language,sharedTables.get(language))
    for (const row of nativeRows) {
      const expected = grouped.get(row.entryId).hints[language] || []
      assert(same(hints.hintsFor(row.line,row.index),expected), `${code}/${language}: changed meaning for ${row.entryId}`)
      for (const alias of expected) {
        assert(hints.search(alias).some(hit=>hit.entryId===row.entryId), `${code}/${language}: missing hint ${alias}`)
        localizedChecks++
      }
    }
    const beforeHints = createVocabularyHintIndex(baseRows,code,
      mergeVocabularyCatalogs(vocabularyHintSeed,await beforeReader.catalog()),language,sharedTables.get(language))
    const afterHints = createVocabularyHintIndex(matcher.rows,code,catalog,language,sharedTables.get(language))
    for (const row of baseRows) {
      const after = afterById.get(row.entryId)
      assert(after && after.line===row.line,`${code}: previous vocabulary entry changed`)
      assert(same(beforeHints.hintsFor(row.line,row.index),afterHints.hintsFor(after.line,after.index)),
        `${code}/${language}: previous familiar-language hints changed for ${row.entryId}`)
      preservedHintChecks++
    }
  }
}
const report = {version:1, sourceSha256:manifest.sourceSha256, sourceEntries:rows.length,
  sourceGroupsCovered:sources.length, sourceCategories:new Set(sources.map(row=>row.category)).size,
  contextualGapCorrections:Object.keys(manifest.corrections).length, sourceExceptions:manifest.excluded,
  languages:targetReport, validation:{nativeChecks,englishChecks,localizedChecks,preservedHintChecks},
  baselineStreams,baselineHintLanguages, generatedStreams:packed.index.streams,
  catalogFiles:packed.files.size-1,catalogBytes:[...packed.files.values()].reduce((sum,text)=>sum+Buffer.byteLength(text),0)}
outputFiles.set(reportFile,JSON.stringify(report,null,2)+'\n')
const reviewColumns = ['source_entry','category','source_english','swedish','english_meaning','spanish','french','german']
const review = [reviewColumns.join('\t'), ...sources.filter(row=>manifest.corrections[row.id]).map(row=>[
  row.id,row.category,row.hints.join(', '),row.forms.join('|'),row.english,
  ...targets.map(([code])=>row.hintsByLanguage[code].join('|')),
].join('\t'))].join('\n')+'\n'
outputFiles.set('docs/vocabulary-es-fr-de-gap-review-2026-11-26.tsv',review)
for (const [path,text] of outputFiles) {
  const existing = await read(path)
  if (write) {
    await mkdir(dirname(resolve(root,path)),{recursive:true})
    if (existing !== text) await writeFile(resolve(root,path),text)
  } else assert(existing===text,`${path}: generated output differs`)
}
console.log(JSON.stringify({validation:report.validation,catalogFiles:report.catalogFiles,catalogBytes:report.catalogBytes}))
