# Thai and Simplified Chinese vocabulary hints — 2026-11-21

Added `th` and `zh-Hans` to the shared **I know well** registry, with UTF-8 hint
tables that use the existing hint display, search index and English fallback.
Chinese means Simplified Chinese in this pack. No application code change is
required: language names are supplied by `Intl.DisplayNames` and translation
files are loaded from the registry.

## Coverage

Validated against Swedish vocabulary at commit
`919df1f041e99c6e03bbc8c392070f8ccd2b4a10`: 8,476 unique English cues across
9,370 eligible hinted vocabulary rows. Expansion, assimilation and unhinted
annotation rows are excluded.

| Pack | Translated cues | Search aliases | Rows with local hints | Rows retaining English fallback |
| --- | ---: | ---: | ---: | ---: |
| Thai (`th`) | 4,126 | 9,552 | 5,816 | 3,554 |
| Simplified Chinese (`zh-Hans`) | 5,663 | 15,367 | 7,277 | 2,093 |

Both packs cover every cue in the 206 newly added vocabulary rows and the three
corrected rows from the earlier extension (210 distinct still-current cues).
New rows that reuse a translated English cue inherit its aliases automatically.

The tables combine dictionary-backed aliases with 321 reviewed cue mappings per
language. Those mappings include the recent extension and common ambiguous
terms. The full dictionary-derived collection has not received independent
native-speaker review. Since shared cues may represent several Swedish senses,
multiple aliases can appear on different rows using the same cue. Existing
row-specific hint overrides remain the way to narrow a particular row's sense.
Unmatched cues retain English; no unreviewed machine-generated translations
were included.

## Sources and changes

### Thai

- Source: [Kaikki Thai dictionary](https://kaikki.org/dictionary/Thai/), based on
  English Wiktionary contributors and Tatu Ylonen's Wiktextract.
- [Downloaded gzip](https://kaikki.org/dictionary/Thai/kaikki.org-dictionary-Thai.jsonl.gz):
  8,645,753 bytes; 21,085 parsed entries; extraction 2026-10-30 from dump 2026-10-01.
- SHA-256: `fcd83d053ccc7856192ba785fe8be00eaf9b8e50ff1efbc97b2a8758a34f2c2c`.
- Reverse-match exact English glosses and short synonym lists to current cues;
  remove parenthetical qualifiers and initial articles/infinitive markers;
  exclude obsolete, archaic, rare, dialectal, form-of, literary, historical,
  compound-only and explanatory records. Proper-name, particle and interjection
  records are excluded. Keep at most four dictionary aliases per cue and apply
  reviewed mappings last.

### Simplified Chinese

- Source: [CC-CEDICT, published by MDBG](https://www.mdbg.net/chinese/dictionary?page=cc-cedict).
- [Downloaded gzip](https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz):
  3,986,424 bytes; release 2026-11-21T03:53:28Z; 125,450 source entries.
- SHA-256: `3ced10407463910ab7c931727e9f4ab51ccf0c2570c30ddae9aa8cd7a4efad1c`.
- Reverse-match exact English glosses, removing parenthetical qualifiers and
  initial articles/infinitive markers. Exclude classifiers, variants, surname,
  abbreviation, reference-only, archaic and dialectal records; use Simplified
  headwords and prefer multi-character candidates where available. Limit
  dictionary aliases to four per cue; reviewed mappings override these choices.
- Normalise all Chinese aliases with
  [OpenCC's Python implementation](https://github.com/yichen0831/opencc-python),
  using `t2s`; every final alias is a fixed point of that conversion.

Both adapted tables are distributed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Wiktionary/Kaikki and CC-CEDICT attribution notices are retained in the shared
hint [README](../db/language/shared/vocabulary-hints/README.md). Credit for
CC-CEDICT includes Paul Andrew Denisowski (CEDICT copyright 1997, 1998) and the
CC-CEDICT community. The license applies to the two new tables.

## Validation

Checks passed using the repository's actual `parseVocabularyFile`,
`parseVocabularyHintLanguages`, `parseVocabularyHintTranslations`,
`createVocabularyHintIndex` and `hintsFor` implementations:

- Registry preserves all six existing languages and includes `th` and `zh-Hans`.
- Every data line has a unique, current English cue and nonempty native-script
  aliases; no malformed lines, replacement characters or markup are present.
- Every one of the Thai and Chinese aliases searches back to an intended Swedish
  source row, including queries with leading or trailing whitespace.
- Every eligible row has local hints or retains its original English hints.
- All 210 recent/corrected cues are present in both packs.
- Native-script probes `ดื่ม`, `ความรู้`, `เรียนรู้`, `ค่าปรับ`, `喝`, `知识`,
  `学习` and `罚款` return matches. Empty, whitespace-only and separator-only
  queries return no matches.
- Runtime display names are Thai and Simplified Chinese; all Chinese aliases
  pass Simplified-script normalisation.

These are data and search checks, with sampled sense review. They do not amount
to a native-speaker review of every dictionary sense or a visual application test.
