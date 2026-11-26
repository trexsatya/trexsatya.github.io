# Spanish, French and German study vocabulary

The later [Swedish-coverage expansion](vocabulary-es-fr-de-expanded-2026-11-26.md)
extends these starter collections to roughly ten thousand entries per language.
The counts below describe the original starter addition.

This addition supplies 700 core vocabulary entries in each language, grouped in
33 matching semantic categories. Spanish retains its complete preceding
vocabulary file byte-for-byte, followed by the new categories. French and German
receive new vocabulary files and empty subtitle indexes. Spanish subtitles and
all other existing language data are unchanged.

| Language | Added entries | Categories | Listed forms and expressions |
|---|---:|---:|---:|
| Spanish | 700 | 33 | 2,102 |
| French | 700 | 33 | 1,878 |
| German | 700 | 33 | 1,889 |

An entry is a meaning group, not one unique dictionary lemma. Forms include
selected inflections, noun articles, plurals and complete expressions; counts
are per row and can include a word occurring in several meanings. Vocabulary
covers everyday life, family, travel, movement, work, feelings, communication,
society, reasoning and philosophy. This is a new core collection, rather than
a complete translation of the much larger Swedish vocabulary.

## Format and meanings

The app's established `(English cues)|native forms|` format is retained.
Every new row has a stable entry marker supported by the existing editor and
sync. The source table is
[vocabulary-es-fr-de-2026-11-26.tsv](vocabulary-es-fr-de-2026-11-26.tsv).

Noun articles are included as additional searchable phrases where appropriate;
German noun capitals and all accents are retained. Selected verb forms are
explicitly listed: French and German do not acquire a new automatic conjugator.
Spanish continues using its existing morphology implementation. Existing Spanish
expansion markers are preserved.

English qualifiers distinguish polysemy, such as `right (direction)` from
`right (entitlement)`, and `light (lamp)` from `light in weight`. Qualifiers use
nested parentheses so the hint parser does not mistake a noun/verb label or
an unrelated sense for a separate cue. This also prevents the existing shared
hint tables from translating a bare homonym into the wrong meaning. Familiar
language hints use existing shared translations where an exact cue matches;
otherwise the app retains its English fallback.

The expressions are translated by meaning, including `ir al grano`,
`aller droit au but`, and `auf den Punkt kommen`. European Spanish, French as
used in France and standard German are the principal varieties, with selected
common Spanish regional alternatives. These entries were authored and checked
for meaning and structure for this addition; they have not had independent
native-speaker proofreading.

## Verification and regeneration

Run from the data repository:

```sh
node tools/build-core-vocabulary.mjs
node tools/validate-core-vocabulary.mjs /path/to/cupitor/frontend/vue3/cupitor-frontend
```

The first command checks that the generated vocabulary matches the source
table. `--write` creates missing sections while preserving existing content;
it refuses to overwrite edited core sections or add duplicate headings.

The second command imports Cupitor's actual vocabulary parser, serializer,
native matcher and English hint index. It checks every new row, stable ID,
round trip, English cue and non-suppressed native form. Results:

| Language | Native queries checked | English cue queries checked |
|---|---:|---:|
| Spanish | 2,101 | 730 |
| French | 1,875 | 730 |
| German | 1,888 | 730 |

The app deliberately suppresses a few common-word-only native queries; those
are excluded from the native-query counts. English cue searches are checked
even for those entries. Category headings are checked for uniqueness, because
repeating a heading would cause the app parser to replace its earlier rows.
The Spanish baseline was also compared directly with its previous Git blob.

## App integration

The companion Cupitor source change enables `french` and `german` in the shared
study-language registry. Its build generates the same catalog consumed by the
native app's language picker, including the correct subtitle suffixes and
speech locales. The source browser regression includes native/English lookup
and switching between Spanish, French and German while preserving a Hindi
query and the familiar-language selection, on desktop and mobile.

Merge this data change before enabling the companion app change. French and
German start with vocabulary only; captured subtitles can be added through
the existing study workflow.
