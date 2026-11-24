# Swedish vocabulary hints: remaining-pack review, 2026-11-24

This pass continues the Hindi and Thai reviews with Simplified Chinese, German,
Spanish, Portuguese, Polish, Ukrainian and French. Corrections use the Swedish
wording and category to identify the intended meaning. They do not treat an
isolated English cue as a complete definition of an idiom.

## Scope and results

- Based on `gh-pages` commit `4edae3b4ab21df66aaec669db94baa2ccc1b8fc0`.
- All 9,371 eligible hinted Swedish rows were loaded through the current app's
  vocabulary parser and hint index. The newer vocabulary additions and wording
  edits were retained; `vocabulary.txt` is not changed by this review.
- 600 rows received explicit editorial seven-language hints. A further 36
  compatible duplicates received the same meanings, for 636 contextual rows.
- All 253 current rows marked with `expression`, `proverb` or `saying` have
  row-specific hints in all seven languages. This marker count also includes a
  few ordinary language-description rows; it is not a count of distinct proverbs.
- The seven previously corrected screenshot meanings and the duplicate
  drunkenness proverb were retained and rebound to the current source wording.
- 655 Chinese cue mappings were reviewed: 648 changed, including 46 newly
  translated cues. The resulting Chinese table contains 5,709 cue mappings.
- The dictionary audit narrowed 1,763 row-language hint sets across 731 additional
  Swedish rows by removing conflicting parts of speech. These are source-backed
  grammatical corrections, separate from editorial idiom review.
- Hindi displays are preserved except for restoring the optional-wording
  screenshot group. Thai has the same restored group and one further shared
  noun-sense correction: `shed` means a storage shed in all three current rows,
  not to pour out or shed something.

The [contextual review table](vocabulary-hints-seven-pack-review-2026-11-24.tsv)
contains 644 rows: the 636 contextual rows plus eight retained source bindings.
It gives the Swedish forms, category, English source cues, and seven-language
meanings so that the changes can be reviewed without reconstructing group IDs.

## Examples

| Swedish context | Correct sense | Chinese example | French example |
| --- | --- | --- | --- |
| `rektor` | head of a school | 学校校长 | directeur d'établissement scolaire |
| `tärna`, food preparation | cut into small cubes | 切成小方块 | couper en dés |
| `drivrutin` | device driver | 设备驱动程序 | pilote de périphérique |
| `banta` | diet to lose weight | 节食减肥 | faire un régime pour maigrir |
| `must`, food/drink | unfermented fruit juice | 未发酵的果汁 | moût |
| `Lägga fingrarna emellan` | show leniency | 手下留情 | faire preuve d'indulgence |
| `Ta sig vatten över huvudet` | take on more than one can manage | 承担了超出自己能力的事 | voir trop grand, se laisser déborder |
| `Ränderna går aldrig ur` | established character/habits are hard to change | 本性难移 | les vieilles habitudes ont la vie dure |
| `Regnet står som spön i backen` | rain very heavily | 倾盆大雨 | il pleut des cordes |

The positive wording `Lägga fingrarna emellan` is not silently changed to its
common negative form and is not translated as mediating in a dispute. `inbrott`
is another important distinction: the beginning-of-process row retains both
onset and burglary, while the crime-category row only explains burglary.

## How the dictionary audit was constrained

The complete English source archive was read for the English cues used by the
current vocabulary. The retained extract contains 6,234 cue headwords with
translations in at least one relevant language. Translation records were grouped
by English part of speech and sense. Exact normalized Swedish headword matches
identified 3,173 rows with a usable unambiguous source match; 1,423 rows with
multiple possible source senses were skipped by that selection step.

Automatic narrowing requires an existing target-language alias that agrees with
the Swedish-matched source sense. It removes an alternative only when that
alternative is supported in other English parts of speech and has no support in
the selected part of speech. It preserves other aliases, including unclassified
ones. An English dictionary's first sense is never used as an automatic fallback.
Same-part-of-speech homonyms, idioms and ordinary-register choices require the
editorial corrections above. Source flags without a retained matching alias are
not automatically accepted as errors: they can reflect incomplete dictionaries,
related senses or equally valid synonyms.

Duplicate propagation compares complete normalized Swedish form sets. An
English-cue overlap or a multiword expression is required, and conflicting
reviewed meanings are not propagated. It does not use substring matches.
Existing groups, form-specific meanings, referenced meaning definitions, and
Hindi/Thai overrides are copied when adding another language. This avoids
discarding an earlier meaning by creating a competing language-only group.

## Validation

The checks import the deployed `vocabulary-hints.js`, its real parser, catalog
merger, seed and index, rather than duplicating the application logic.

- Catalog schema, UTF-8/control characters and normalized new aliases checked.
- 152,305 displayed-alias searches returned the expected Swedish row identity
  across the nine non-English languages; equivalent duplicate lines with only
  pipe-spacing differences are treated as the same row identity.
- All 636 contextual rows have translated hints in all seven target languages.
- All 253 marked rows have explicit seven-language overrides.
- The Hindi and Thai displays were compared for all 9,371 rows each; only the
  documented restored binding and Thai shed corrections changed them.
- Seven semantic anchors distinguish principal/capital, diced food/cube,
  software driver/chauffeur, fruit must/obligation, burglary/onset, waking oneself/
  waking another person, and cooking/cook as a person.
- No vocabulary source rows, language registry, application code or legacy Hindi
  table are replaced.

| Language | Displayed rows changed | Translated rows | English fallback rows |
| --- | ---: | ---: | ---: |
| Simplified Chinese | 1,472 | 7,368 | 2,003 |
| German | 886 | 7,556 | 1,815 |
| Spanish | 854 | 7,437 | 1,934 |
| Portuguese | 899 | 7,191 | 2,180 |
| Polish | 866 | 6,981 | 2,390 |
| Ukrainian | 800 | 6,015 | 3,356 |
| French | 1,202 | 7,554 | 1,817 |

These are 6,979 changed row-language displays, not 6,979 distinct Swedish rows.
Translation coverage and successful lookup tests do not establish that every
remaining dictionary-derived hint is semantically correct. This is a focused
semantic review plus full-file structural/search validation, not independent
native-speaker proofreading of every entry. Unmatched dictionary material and
unmarked expressions outside the curated scope remain candidates for review.

## Sources, attribution and license

The grammatical audit adapts translations by
[Wiktionary contributors](https://en.wiktionary.org/), extracted by
[Tatu Ylonen's Wiktextract](https://github.com/tatuylonen/wiktextract) and
distributed through the [Kaikki English dictionary](https://kaikki.org/dictionary/English/).
The archive is the 2026-10-30 extraction of the 2026-10-01 English Wiktionary dump:

- URL: <https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz>
- Compressed bytes: `534186395`
- SHA-256: `4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99`

Chinese common-cue corrections edit the existing adapted
[CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) table, originally
credited to Paul Andrew Denisowski and CC-CEDICT contributors through MDBG.
This pass does not regenerate that table from a new source release. The existing
French table's WikDict/DBnary/FreeDict attribution remains in the shared README.

The adapted translation data and contextual review table are provided under
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
Changes include selecting grammatical senses, removing conflicting alternatives,
writing contextual explanations and idiom meanings, replacing misleading Chinese
aliases, preserving prior meanings, and rebinding changed Swedish source rows.
See the [shared README](../db/language/shared/vocabulary-hints/README.md) for the
earlier source notices. This notice concerns the adapted hint data, not unrelated
repository content.
