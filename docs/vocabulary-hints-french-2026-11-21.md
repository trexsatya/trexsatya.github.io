# French vocabulary hints — 2026-11-21

Registered French (`fr`) in the shared **I know well** language list and added
its UTF-8 hint table. The existing registry loader, `Intl.DisplayNames`, hint
renderer and search index handle the new pack without application code changes.

## Coverage

Validated against Swedish vocabulary in commit
`f0bb2cfe6119df879e55c347a44a9bac606a5c93`, vocabulary blob
`92156d1d370c2957c94c09641cf1968418eed2f4`.

| Measure | Count |
| --- | ---: |
| Current English cues | 8,476 |
| Eligible hinted Swedish rows | 9,370 |
| French translated cues | 5,900 |
| French search aliases | 14,038 |
| Rows with French hints | 7,504 |
| Rows retaining English fallback | 1,866 |

Every cue from the 206 recent additions and three corrected rows is present
(210 distinct current cues). The pack includes 253 contextual cue mappings
for that extension and selected common or ambiguous words. For example, `fine`
maps to `amende` for Swedish `böter`, and `intake` maps to `prise d'air` /
`entrée d'air` for `insuget`.

## Source and method

- Source: [WikDict downloads](https://www.wikdict.com/page/download),
  English–French FreeDict+WikDict dictionary by Karl Bartel, based on Wiktionary
  contributors via DBnary; source metadata also credits the FreeDict project.
- [Source archive](https://download.wikdict.com/dictionaries/stardict/wikdict-en-fr.zip):
  4,024,424 bytes; release 2026-06-23; 76,103 dictionary records. Downloaded on
  2026-11-21. The HTTP Last-Modified value was 2026-06-23T21:22:07Z.
- Archive SHA-256: `23c4fadd44fb15cdaa4e00f378e5aeee75f99da3f0057c6764341777c42d58c8`.
- The archive's `stardict.ifo` explicitly licenses its data under
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  The adapted `fr.txt` table uses the same license. Attribution and changes are
  recorded in the shared hint [README](../db/language/shared/vocabulary-hints/README.md).

Match complete English dictionary headwords to Cupitor's normalized English
cues. Read the StarDict binary index and extract French translation fields from
the associated HTML, excluding pronunciation and grammar fields. Reject senses
marked archaic, obsolete, dated, rare, dialectal, regional, historical or
nonstandard where those labels are available. Deduplicate aliases, normalize
NFC Unicode and retain up to four dictionary aliases per cue. Contextual
mappings override dictionary candidates for the recent extension and reviewed
ambiguous terms.

The full dictionary collection has not received an independent native-speaker
review. Shared English cues may represent multiple senses across Swedish rows;
use the existing row-specific hint override to narrow a particular row. Missing
cues keep English. Source fields lacking usage labels can still contain uncommon
terms. New vocabulary using an existing English cue inherits its French hints.

## Validation

Checks passed using the repository's actual vocabulary parser, translation
parser, registry parser and `createVocabularyHintIndex` implementation:

- All eight existing registered languages are preserved; `fr` appears once and
  is displayed as French through `Intl.DisplayNames`.
- Every table row has a unique current English cue and nonempty valid aliases,
  with no malformed lines, markup, replacement characters or invalid separators.
- Every one of the 14,038 aliases searches back to an intended Swedish row.
  Uppercase queries and surrounding whitespace pass the same checks.
- All 210 recent/corrected cues are present; every eligible row has French hints
  or retains its original English hints.
- `boire`, `connaissance`, `apprendre`, `écrire`, `amende`, `mot de passe` and
  `marge de manœuvre` return matches.
- Empty, whitespace-only and separator-only queries return no matches.

This is a data and search validation with sampled sense review, rather than a
visual application test or a native-speaker review of every dictionary sense.
