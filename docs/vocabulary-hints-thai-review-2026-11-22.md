# Thai vocabulary hint review — 2026-11-22

Reviewed the Thai pack first, following the reported translation-quality errors.
This combines source-level screening of all 4,126 existing cues with
contextual editorial review of Swedish words and expressions. It is not an
independent native-speaker certification of every remaining dictionary entry.

## Results

| Measure | Count |
| --- | ---: |
| Original Thai cues screened | 4,126 |
| Curated cue mappings applied | 662 |
| Shared cues changed | 755 |
| Explicit Swedish row reviews | 513 |
| Specific row meanings including duplicates | 561 |
| Displayed row hints changed | 553 |
| Marked expression/proverb/saying rows reviewed | 258 |
| Current cues / aliases | 4,126 / 8,848 |
| Rows with Thai hints | 5,893 |
| Rows using English fallback | 3,477 |
| Corrected and shared-alias lookup checks | 9,441 |
| Other-language preservation checks | 74,896 |

## Examples

| Swedish meaning | Incorrect previous sense | Correct Thai hint |
| --- | --- | --- |
| tråkmåns | drilling through something | คนน่าเบื่อ |
| lämplig | slang for embezzling | เหมาะสม |
| ångest | calm and free from anxiety | ความวิตกกังวล |
| kurator | museum curator / royal adviser | นักสังคมสงเคราะห์; ผู้ให้คำปรึกษาด้านสังคมหรือสุขภาวะ |
| beväpna | a bodily arm | ติดอาวุธ |
| drivrutin | a person driving | โปรแกรมควบคุมอุปกรณ์ |
| tärna | a geometrical cube | หั่นเป็นลูกเต๋า |
| bestick | weapons | ช้อน ส้อม และมีดสำหรับกินอาหาร |
| must / juice | obligation | น้ำผลไม้ |
| ha på känn | remember / keep in mind | มีลางสังหรณ์ |

Every current row marked with `expression`, `proverb` or `saying` was inspected,
including ordinary literal uses of those words. The Truth/Lies/Deception rows,
previous meaning-specific groups and high-risk word senses were also reviewed.
Duplicate propagation matches complete normalized Swedish form sets, not
substrings. Explanatory idiom hints describe the Swedish meaning rather than
translating an English metaphor word for word.

## Source and screening

- Pinned vocabulary and catalog source: commit
  `3d0db40129e1af6c95a7070422ff9fcaaaea3e05`.
- [Kaikki Thai dictionary](https://kaikki.org/dictionary/Thai/), extracted by
  Wiktextract from English Wiktionary contributors, extraction 2026-10-30 from
  dump 2026-10-01.
- [Downloaded gzip](https://kaikki.org/dictionary/Thai/kaikki.org-dictionary-Thai.jsonl.gz):
  8,645,753 bytes; SHA-256
  `fcd83d053ccc7856192ba785fe8be00eaf9b8e50ff1efbc97b2a8758a34f2c2c`.
- Existing CC BY-SA 4.0 attribution remains in the shared hint README.

Screening traced dictionary-derived aliases back to source senses and usage
labels. Explicitly unsuitable slang, offensive, royal, obsolete or compound-only
usage was excluded where appropriate. Ordinary colloquial Thai was not rejected
just for being conversational. Editorial mappings take precedence, for example
where a common natural word is marked colloquial. Negative source definitions
were checked so that a gloss such as “free from anxiety” does not become a
translation of anxiety itself. Source labels are evidence for screening, rather
than proof that every unlabeled sense is suitable.

Swedish sense checks include [Svensk ordbok: finger](https://spraakbanken.gu.se/resurser/data/karp/so-2009-webbversion/finger.html),
[SAOB: finger](https://svenska.se/?activeTab=alla&exactMatch=true&highlightLabel=&homografNr=&id=505822&q=fingertecken),
and [Saco: kurator](https://studieval.saco.se/studieval/yrken-a-o/kurator/).
The positive `lägga fingrarna emellan` concerns leniency; its usual negative form
is unsparing. No negation was silently inserted into the source Swedish row.

Five English cue rows now correctly describe intuition, leniency, pushing,
counselling/social work and allocating resources. Swedish forms, categories,
ordering and eligible row count are preserved. The shared `onset` meaning is
clarified as beginning across all nine languages; the separate `burglary` cue
supplies the other sense of Swedish `inbrott`.

## Validation

Used the repository's actual vocabulary parser, catalog merger, row-identity,
hint-display and search-index implementations. Every corrected alias resolves to
its intended row, including padded queries. All marked rows have their reviewed
Thai meanings. Empty queries produce no matches. Incorrect anatomical,
occupational, grammatical and mathematical senses no longer select the affected
rows. The catalog schema and Thai script checks pass.

Existing Hindi and other-language display hints are unchanged except for the
intentional onset correction and five English cue repairs. Row-specific legacy
meanings are preserved when adding Thai overrides. English fallback remains
available for unmatched entries. These are data and semantic-fixture checks;
no visual application test was performed.
