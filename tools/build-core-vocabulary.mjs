#!/usr/bin/env node
// Compile the reviewed parallel table into Cupitor's native vocabulary format.
// Existing Spanish material is kept byte-for-byte before the new sections.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import assert from 'node:assert/strict'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const languages = [['es', 'spanish'], ['fr', 'french'], ['de', 'german']]
const table = await readFile(resolve(root, 'docs/vocabulary-es-fr-de-2026-11-26.tsv'), 'utf8')
const categories = new Set(), cues = new Set(), rows = []
let category
assert.equal(table.split('\n')[0], 'english\tspanish\tfrench\tgerman')
for (const [offset, raw] of table.trimEnd().split('\n').slice(1).entries()) {
  const line = offset + 2
  if (raw.startsWith('#')) {
    category = raw.slice(1)
    assert(category.startsWith('Core - ') && !categories.has(category), `Duplicate/invalid category at ${line}`)
    categories.add(category)
    continue
  }
  const cells = raw.split('\t')
  assert.equal(cells.length, 4, `Expected four columns at ${line}`)
  assert(category && cells.every(cell => cell && cell === cell.trim()), `Missing category or untrimmed cell at ${line}`)
  assert(!/[\[\]{}|]/u.test(cells[0]) && !cues.has(cells[0]), `Duplicate or malformed cue at ${line}`)
  let depth = 0
  for (const char of cells[0]) {
    if (char === '(') depth++
    if (char === ')') depth--
    assert(depth >= 0, `Unbalanced cue at ${line}`)
  }
  assert.equal(depth, 0, `Unbalanced cue at ${line}`)
  assert(!/[\p{Script=Cyrillic}\p{Script=Han}]/u.test(raw), `Unexpected script at ${line}`)
  cues.add(cells[0])
  const forms = cells.slice(1).map(cell => [...new Set(cell.split('|'))])
  for (const terms of forms) {
    assert(terms.every(term => term && term === term.trim() && !/[()\[\]{}<>=]/u.test(term)), `Malformed form at ${line}`)
  }
  rows.push({category, cue: cells[0], forms})
}
assert(rows.length >= 700)
assert([...categories].every(category => rows.some(row => row.category === category)))

const write = process.argv.includes('--write')
for (const [index, [code, language]] of languages.entries()) {
  const lines = []
  let previous
  for (const row of rows) {
    if (row.category !== previous) lines.push('#' + row.category)
    previous = row.category
    const id = 'entry-' + createHash('sha256').update(JSON.stringify([code, row.category, row.cue])).digest('hex')
    lines.push(`(${row.cue})|${row.forms[index].join('|')}|\t[entry:${id}]`)
  }
  const generated = lines.join('\n') + '\n'
  const directory = resolve(root, 'db/language', language)
  const file = resolve(directory, 'vocabulary.txt')
  const existing = await readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error })
  if (!existing.includes(generated)) {
    assert(write, `${language}: vocabulary differs from the source table`)
    // Refuse to overwrite hand edits or create repeated headings: the app's
    // vocabulary parser replaces a category when it sees its heading again.
    assert(!existing.split('\n').some(line => line.startsWith('#') && categories.has(line.slice(1).trim())),
      `${language}: generated categories already exist; review the edits manually`)
    await mkdir(directory, {recursive: true})
    await writeFile(file, existing + (existing && !existing.endsWith('\n') ? '\n' : '') + generated)
  }
  console.log(`${language}: ${rows.length} core entries, ${categories.size} categories, ${rows.reduce((sum, row) => sum + row.forms[index].length, 0)} forms`)
}
