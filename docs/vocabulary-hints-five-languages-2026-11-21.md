# Vocabulary hint languages — 2026-11-21

Added German (`de`), Spanish (`es`), Portuguese (`pt`), Polish (`pl`) and Ukrainian (`uk`) to the shared hint-language registry. English remains the built-in fallback and Hindi is preserved.

The Swedish source has **8,473 distinct English cues** across **9,368 vocabulary rows with English cues**. The new tables provide **26,258 cue translations** and **54,016 search aliases** in total. All **206 entries added in the preceding vocabulary extension** have hints in all five languages.

## Coverage

| Language | Translated cues | Swedish rows with translated hints | Rows using English fallback | Search aliases |
|---|---:|---:|---:|---:|
| German | 5,867 | 7,499 | 1,869 | 12,561 |
| Spanish | 5,724 | 7,368 | 2,000 | 13,075 |
| Portuguese | 5,383 | 7,111 | 2,257 | 9,459 |
| Polish | 5,201 | 6,883 | 2,485 | 10,293 |
| Ukrainian | 4,083 | 5,895 | 3,473 | 8,628 |

A row may contain several English cues. One translated cue is enough for a translated display, so row coverage differs from cue coverage. Two pre-existing lexical rows (`redig` and `grenverk`) have no English cues; those rows and the annotation-only rows were preserved.

## Translation method and quality

Dictionary translations were selected from Wiktionary data distributed by Kaikki. Where possible, Swedish translations in the same dictionary sense were matched against the actual Cupitor forms. Obsolete, rare and regional variants were filtered; aliases were normalised and limited. **286 cues per language** received reviewed additions or corrections, including all recent vocabulary additions, common ambiguous words, technical terms and idioms.

| Language | Dictionary cues | Reviewed cues | Cues using English fallback |
|---|---:|---:|---:|
| German | 5,581 | 286 | 2,606 |
| Spanish | 5,438 | 286 | 2,749 |
| Portuguese | 5,097 | 286 | 3,090 |
| Polish | 4,915 | 286 | 3,272 |
| Ukrainian | 3,797 | 286 | 4,390 |

Automatic translation candidates were excluded after sampling found mistranslations. A missing cue intentionally uses the existing English fallback. The tables are dictionary-backed data with selected reviewed corrections; they are not a claim that every dictionary sense has received an independent linguistic review.

Examples of reviewed distinctions: `fine` means a monetary penalty for the current Swedish row; `spring` covers a mechanical spring, a water source and springing motion; `patient` refers to patience; `object` is a verb expressing an objection. `Självkänsla` and `självförtroende` have separate hints. Idioms such as `ställa sig på sin spets` and `hamna i skymundan` use meaning-based glosses.

## App integration and preservation

The current app loads the language registry dynamically and labels choices using `Intl.DisplayNames`. No application code change or new build was needed. The new files use the existing English-cue-to-alias format. They work with display, the native-language search index and the existing vocabulary hint editor.

The Swedish vocabulary, English cues, Hindi table, generated Hindi meaning/group IDs, word maps, playlists and application settings were not changed. Existing per-row and shared overrides retain their precedence.

## Validation

Passed using the current published app modules:

- Parse all five UTF-8 tables; validate unique English keys, nonempty aliases and safe single-line values.
- Verify all **54,016 aliases** find an intended Swedish row through the actual hint index.
- Check translated display or the existing English fallback for every one of the **9,368 eligible rows**, in all five languages.
- Verify hints for every cue in the preceding 206 additions and the associated corrected rows.
- Check representative native-script, accented-letter, case and whitespace searches.
- Confirm blank queries return no matches and a missing translation leaves English available.
- Verify the new registry codes resolve to the five expected language names.

## Sources, attribution and license

The five new tables adapt translations by [Wiktionary contributors](https://en.wiktionary.org/), extracted by [Wiktextract](https://github.com/tatuylonen/wiktextract) and distributed in the [Kaikki English dictionary](https://kaikki.org/dictionary/English/). The source is the 2026-10-30 extraction from the 2026-10-01 English Wiktionary dump.

- [Source archive](https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz).
- Source archive SHA-256: `4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99`.
- Swedish input snapshot: [`0fc02c47ecd3f6b4f37ea5620251232dc0106f24`](https://github.com/trexsatya/trexsatya.github.io/commit/0fc02c47ecd3f6b4f37ea5620251232dc0106f24).

The new `de.txt`, `es.txt`, `pt.txt`, `pl.txt` and `uk.txt` tables are adaptations under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See the [shared-hints README](../db/language/shared/vocabulary-hints/README.md) for attribution and the nature of modifications.
