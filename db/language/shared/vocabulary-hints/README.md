# Shared vocabulary hints

`languages.txt` lists the hint languages offered by **I know well**. English is
always available as the fallback. The registry includes Hindi (`hi`), German
(`de`), Spanish (`es`), Portuguese (`pt`), Polish (`pl`), Ukrainian (`uk`),
Thai (`th`) and Simplified Chinese (`zh-Hans`).

Each language has a UTF-8 text file using this format:

```text
English cue = translated hint | another useful alias
```

Keys are the complete English cues parsed from vocabulary rows. Keep those keys
when correcting a translation. New vocabulary rows using an existing cue inherit
the same translations. Different meanings of an English word may require several
aliases; use a row-specific override in the vocabulary editor when a distinction
must apply only to one Swedish row.

The five files added on 2026-11-21 combine dictionary translations and reviewed
common terms and expressions. English is used for cues without a reliable
translation. All 206 entries added in the preceding vocabulary extension have
hints in all five languages. The accompanying
[review report](../../../../docs/vocabulary-hints-five-languages-2026-11-21.md)
records coverage, methods and validation.

## Attribution and license for the five new files

The new `de.txt`, `es.txt`, `pt.txt`, `pl.txt` and `uk.txt` tables adapt translations
by [Wiktionary contributors](https://en.wiktionary.org/), extracted by
[Tatu Ylonen's Wiktextract](https://github.com/tatuylonen/wiktextract) and distributed
through the [Kaikki English dictionary](https://kaikki.org/dictionary/English/).
The source is the 2026-10-30 extraction of the 2026-10-01 English Wiktionary dump.
The source archive and its checksum are recorded in the review report.

Changes include selecting translations for the required English cues, matching
Swedish translations to identify senses where possible, filtering obsolete and
regional entries, limiting aliases, normalising spelling/stress marks, adding
reviewed translations, and writing meaning-based glosses for selected entries.

These five adapted tables are provided under
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
See [Wiktionary's copyright information](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)
and [Kaikki's licensing information](https://kaikki.org/dictionary/index.html).
This notice concerns these five new translation tables.

## Thai and Simplified Chinese

The `th.txt` and `zh-Hans.txt` packs add native-script hints and search aliases.
They cover all 206 entries from the preceding Swedish vocabulary extension;
English remains the fallback for other cues without a translation. The
[Thai and Chinese review report](../../../../docs/vocabulary-hints-thai-chinese-2026-11-21.md)
records current coverage, source checksums and application-level validation.

`th.txt` adapts English glosses of Thai headwords by
[Wiktionary contributors](https://en.wiktionary.org/), extracted by
[Tatu Ylonen's Wiktextract](https://github.com/tatuylonen/wiktextract) and distributed
through the [Kaikki Thai dictionary](https://kaikki.org/dictionary/Thai/).
The source is the 2026-10-30 extraction of the 2026-10-01 English Wiktionary dump.
Changes include matching exact English cues and short synonym glosses, filtering
obsolete, rare, regional, form-of and explanatory records, limiting aliases,
normalising Unicode, and adding reviewed translations and sense corrections.

`zh-Hans.txt` adapts [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict),
a community-maintained Chinese-English dictionary published by MDBG, release
2026-11-21T03:53:28Z (125,450 source entries). Credit belongs to Paul Andrew
Denisowski (CEDICT copyright 1997, 1998) and the CC-CEDICT contributors. Changes
include reversing exact English glosses for the required cues, selecting the
Simplified headword, filtering obsolete and reference-only records, limiting
aliases, preferring multi-character terms where available, and adding reviewed
translations and sense corrections. [OpenCC's Python implementation](https://github.com/yichen0831/opencc-python)
normalises Chinese aliases to Simplified script.

Both adapted tables are provided under
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
See [Wiktionary's copyright information](https://en.wiktionary.org/wiki/Wiktionary:Copyrights),
[Kaikki's licensing information](https://kaikki.org/dictionary/index.html), and the
CC-CEDICT license notice in its downloadable source. This notice applies to
`th.txt` and `zh-Hans.txt`, rather than the repository as a whole.
