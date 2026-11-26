# Spanish, French and German: Swedish-level coverage

The first 700 entries were a starter collection. This expansion uses the current
Swedish vocabulary as its coverage baseline: **9,377 lexical groups across 173
categories**, excluding the Expansions and Assimilations configuration sections.
**9,374 groups are represented in each new language**; three incomplete or
malformed source fragments are explicitly recorded for resolution below.

| Language | Additional groups | Total vocabulary entries | Distinct native forms in the expansion |
|---|---:|---:|---:|
| Spanish | 9,113 | 10,364 | 14,698 |
| French | 9,136 | 9,836 | 13,290 |
| German | 9,105 | 9,805 | 12,903 |

These are vocabulary rows and listed forms, not counts of unique dictionary
lemmas. A row can contain synonyms, inflections or a complete expression.
Identical English-cue/native-form groups within a topic are consolidated;
groups in different source categories retain their contexts. That consolidation
accounts for 261 Spanish, 238 French and 269 German source-row mappings.
Spanish's total also includes its older 551 entries and the 700 starter rows;
French and German retain their 700 starter rows.

## Meanings and source coverage

The expansion covers all 173 source categories, including movement, perception,
reasoning, emotions, personality, household life, food preparation, nature,
tools, society, work, relationships and idiomatic expressions. The added
categories are prefixed `Extended - `, preserving every preceding category and
entry byte-for-byte. Stable entry IDs link each imported group to its Swedish
source; consolidated source IDs are listed in the machine-readable report.

Translations start from the effective Swedish-context hints already used by
Cupitor, including the row-specific semantic corrections from earlier reviews.
**2,264 source groups have explicit editorial translations or corrections** in
the [corrections file](vocabulary-es-fr-de-gap-translations-2026-11-26.json).
The [review table](vocabulary-es-fr-de-gap-review-2026-11-26.tsv) places the
Swedish forms, original English cues and resulting Spanish/French/German forms
side by side. Three-language gaps are filled with lexical equivalents or
complete meaning-based expressions; an untranslated English cue is never used
as a substitute native form.

Examples of contextual decisions:

| Swedish source | Original cue | Meaning used in the new sets |
|---|---|---|
| `gå med håven` | be gullible | seek compliments or solicit donations |
| `köra om`, `omkörning` | takeover | overtake a vehicle |
| `samboavtal` | cohabitation | an agreement between cohabiting partners |
| `låsning` | Decision | deadlock or a fixed position |
| `bevingat ord` | All know | a widely known quotation or saying |
| `redig` | empty cue | lucid, clear, substantial |
| `grenverk` | empty cue | branches collectively |

Five further inherited alias problems are corrected, including plumbing pipes
versus squeaking, and incomplete German pruning prefixes. The existing Swedish
wording and its hints are unchanged by this expansion. The current data and
selected contexts were reviewed; the full collection has not received
independent native-speaker proofreading.

## Familiar-language hints

Contextual hints are linked to the new native entry IDs. Shared English-cue
translations remain reusable; a row-specific override is stored only when its
effective meaning differs from that shared translation. This preserves the
existing language-learning flow in Hindi and the other registered familiar
languages, including specific meanings and idioms. A missing familiar-language
translation retains the English fallback. Thirteen misleading cue contexts also
receive explicit Hindi wording in the new sets.

The existing split-catalog implementation is used. New content-addressed chunks
remain at or below 64 KiB. Existing global meaning definitions, shared tables,
Swedish metadata and hints, and their stream roots are preserved. The existing
Spanish catalog groups are retained alongside the imported groups; no old
catalog chunks are deleted.

## Source exceptions

Three source fragments have no reliably established intended expression:

- `skälla som en häst`: the animal comparison conflicts with the verb.
- `skälla som en`: the comparison is incomplete.
- `dingla fällstol`: the phrase is malformed and the intended meaning is unclear.

They remain untouched in the Swedish source and are excluded from the new
corpora. Their stable IDs and reasons are in the corrections file and coverage
report. Ordinary literal comparisons and register-specific words elsewhere in
the source are retained, using native equivalents or explanatory expressions.

## Validation

Run from this repository with Node 24 and a Cupitor frontend source checkout:

```sh
node tools/build-core-vocabulary.mjs
node tools/validate-core-vocabulary.mjs /path/to/cupitor/frontend/vue3/cupitor-frontend
node tools/build-expanded-vocabulary.mjs /path/to/cupitor/frontend/vue3/cupitor-frontend
```

The last command rebuilds in memory, validates against the actual app parser,
matcher, hint index and content-addressed catalog reader, and compares every
generated file with its saved contents. Add `--write` to save a reviewed
regeneration. Baseline hashes protect the Swedish source and the existing
Spanish/French/German prefixes; independent edits require reconciliation.

The expansion passes **61,552 native-form queries**, **34,580 English-cue
queries**, **384,818 localized-hint queries**, and **21,208 comparisons preserving
the preceding entries' familiar-language hints**. Stable IDs, source coverage,
unique category headings, balanced row syntax, immutable chunk hashes, and
unrelated catalog stream preservation are checked as part of the same run.
The [coverage report](vocabulary-es-fr-de-coverage-2026-11-26.json) records the
source checksum, per-language counts, consolidated mappings and stream roots.

This data is compatible with the companion
[app language support change](https://github.com/trexsatya/cupitor/pull/212).
That source change enables French and German and updates the shared catalog
consumed by the native language picker. No additional language flags are
needed for this larger vocabulary.

## Attribution and license

The reused native equivalents and contextual hints adapt the existing
[shared vocabulary packs](../db/language/shared/vocabulary-hints/README.md).
Credit belongs to Wiktionary contributors, Tatu Ylonen's Wiktextract and Kaikki,
and, for French, Karl Bartel's WikDict/FreeDict data based on Wiktionary and
DBnary. Existing Hindi, Thai, Chinese and other familiar-language attribution
remains in that shared README and the preceding review reports.

The adapted vocabulary, contextual corrections and review table are supplied
under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Changes
include selecting effective Swedish-context meanings, adding missing native
equivalents, explaining idioms, correcting misleading English cues in the new
corpora, consolidating identical groups within categories and attaching hints
to stable native-entry identities.

Contextual references include the cached Kaikki Swedish dictionary extract used
in the [dictionary review](vocabulary-hints-dictionary-review-2026-11-24.md) and
the [Swedish Wiktionary entry for gå med håven](https://sv.wiktionary.org/wiki/g%C3%A5_med_h%C3%A5ven).
