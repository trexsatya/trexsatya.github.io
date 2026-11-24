# Dictionary-derived vocabulary hints: review, 2026-11-24

This pass reviews the dictionary-derived material left after the preceding
seven-language review. It covers Simplified Chinese, German, Spanish, Portuguese,
Polish, Ukrainian and French. The starting data commit is
`ec653ec78340d529ec9fdd850da249e498814ca3`.

## Results

- The complete 9,371-row vocabulary and its effective hints were audited against
  Swedish definitions, English translation records and native usage qualifiers.
- 770 rows received direct editorial corrections in 4,280 row-language hint sets.
  Corrections include ambiguous ordinary words, unmarked idioms, grammatical
  mismatches, misleading fragments and inappropriate register.
- 76 rows were checked and accepted without a semantic change. Different
  grammatical labels across languages are not, by themselves, translation errors.
- 27 equivalent rows received compatible duplicate corrections. Conflicting
  meanings are not propagated between homonyms.
- Every one of the 737 rows flagged by the Swedish-definition grammatical audit
  has a recorded correction or acceptance, including equivalent duplicates. The
  nine Chinese rows whose only dictionary alias had an unsuitable usage label
  were also checked directly.
- Additional conservative source corrections applied to 1,762 row-language sets
  using Swedish-definition/part-of-speech evidence, 146 using target-language
  usage labels, and 133 Chinese sets using CC-CEDICT usage labels. These counts
  describe applied proposal steps; a row-language set may have more than one
  type of evidence.
- The resulting data changes 6,272 displayed row-language hints across 1,632
  touched Swedish rows. Hindi and Thai displays are unchanged for every row.

The [editorial review table](vocabulary-hints-dictionary-review-2026-11-24.tsv)
contains 789 rows with the final app-visible seven-language hints: the 770 direct
editorial rows plus 19 additional editorial duplicates outside the automatic
correction set. Empty native-language cells retain the existing English fallback.

## Examples of corrected meanings

| Swedish | Intended meaning | Corrected example |
| --- | --- | --- |
| `försegla` | close with a seal, not a seal animal | French `sceller`, `fermer hermétiquement` |
| `klinga` | make a ringing sound, not jewellery | French `tinter`, `résonner` |
| `ha sitt på det torra` | be financially secure, not a chemical solvent | German `finanziell abgesichert sein` |
| `glada tillrop`, `hejarop` | words of encouragement, not drinking toasts | Portuguese `gritos de incentivo` |
| `bisyssla` | a secondary occupation, not standing side by side | French `activité secondaire`, `emploi complémentaire` |
| `nära skjuter ingen hare` | almost succeeding is not enough, not narrowly escaping danger | French `presque réussir ne suffit pas` |
| `nagga`, preparing food | prick small holes with a fork | French `piquer avec une fourchette` |
| `rektor` and similar earlier corrections | existing specific meanings | retained from the preceding review |
| `rättfärdig`, `rättrådig` | righteous or upright, not slang for cool | Chinese `正直的`, `坚守正道的` |
| `hur dags` | what time | Chinese `几点`, `什么时候` |
| `decennium` | a ten-year period | Chinese `十年`, `十年期` |

Some source entries need contextual care. The intended `stalp` row describes an
older past-tense form meaning fell or toppled, which is documented in Söderwall's
historical dictionary. It is not replaced by the unrelated noun sense precipice
merely because that noun is the only entry in one machine-readable dictionary.
The new hints explicitly mark the older form. `sträck` is explained through its
uninterrupted-sequence sense, supported by Isof's guidance on `i (ett) sträck`.
`ledning`, in the Logic category, retains the guidance/indication sense rather
than selecting a cable, pipeline or a verb meaning lead.

## Audit method

All current rows were examined through the deployed app parser and effective
catalog merger. The Swedish source extract contains 12,079 relevant headwords,
covering 7,423 vocabulary rows with at least one definition or inflection record.
Swedish definitions supplied usable grammatical evidence for 7,206 rows;
unmatched or ambiguous labels were not used to guess replacements.

Automatic grammatical narrowing is restricted to noun, verb, adjective and adverb
cases with an English cue explicitly present in a Swedish lexical definition.
It requires an existing retained translation supported by the relevant part of
speech and only removes independently identified conflicts. It does not generate
new translations from the first English sense. A total of 2,250 flagged
row-language sets, covering 737 rows, required direct decisions; the accepted
cases demonstrate why grammatical differences alone cannot settle meaning.

The usage audit screened 40,481 translated row-language sets in the six European
languages against English-Wiktionary translation qualifiers. It does not reject
ordinary colloquial usage or general Brazilian, European, Latin American or
Canadian standard variants. Source rows explicitly marked as archaic, vulgar or
otherwise register-specific are protected from blanket neutralization.

The Chinese usage audit screened 6,204 dictionary-derived displayed rows outside
the previous common-cue/editorial scope. It removes a marked archaic, literary,
slang or dialect-only alternative only when an ordinary source-supported alias
remains; cases with no such alternative were reviewed directly. Chinese aliases
are not rejected merely for having a different English part of speech.
The ordinary abandon cue is also corrected to `放弃`, `抛弃`.

Explicit editorial hints take precedence over source-derived suggestions.
Duplicate propagation compares complete normalized Swedish form sets and
compatible cues or full expressions, with conflicting reviewed meanings kept
separate. Existing form-specific meanings and other-language overrides remain
attached when a catalog group gains another language.

This is a whole-dataset source audit with direct semantic review of flagged
material. Source agreement and automated checks are evidence for the corrections;
they do not constitute independent native-speaker certification of every synonym.

## Validation

Validation imports the deployed `vocabulary-hints.js`, its seed and the real app
catalog merger, display selector and search index.

- All 4,280 explicit editorial hint sets exactly match the displayed app result.
- All 144,163 displayed native aliases return the expected Swedish row identity.
- Hindi and Thai results are identical to the starting commit for all 9,371 rows
  each, including earlier row-specific semantic corrections.
- Fourteen independent semantic fixtures cover exercise/train, earning income,
  financial solvency, blunt speech, righteousness, food preparation, near misses,
  metal fittings, cheering, sealing, consecutive sequences, historical `stalp`
  and decade vocabulary.
- Catalog schema, Unicode normalization, control characters and group/meaning
  references pass checks. There are no missing editorial overrides or duplicate
  display issues in this pass.
- Vocabulary source rows, the language registry, application code, Hindi/Thai
  packs and the legacy Hindi catalog are preserved.

| Language | Displayed rows changed | Translated rows | English fallback rows |
| --- | ---: | ---: | ---: |
| Simplified Chinese | 723 | 7,405 | 1,966 |
| German | 908 | 7,580 | 1,791 |
| Spanish | 847 | 7,469 | 1,902 |
| Portuguese | 835 | 7,241 | 2,130 |
| Polish | 845 | 7,058 | 2,313 |
| Ukrainian | 785 | 6,163 | 3,208 |
| French | 1,329 | 7,568 | 1,803 |

## Sources, attribution and license

The Swedish definitions and English translation records are by
[Wiktionary contributors](https://en.wiktionary.org/), extracted by
[Tatu Ylonen's Wiktextract](https://github.com/tatuylonen/wiktextract), and
distributed through [Kaikki](https://kaikki.org/). Both archives are from the
2026-10-30 extraction of the 2026-10-01 English Wiktionary dump.

| Source | Compressed bytes | SHA-256 |
| --- | ---: | --- |
| [Swedish archive](https://kaikki.org/dictionary/Swedish/kaikki.org-dictionary-Swedish.jsonl.gz) | 34,178,064 | `b9c5b0f7dfe4f4895582449c5970c0efaa232f9861f5fe3527012555a234ae91` |
| [English archive](https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz) | 534,186,395 | `4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99` |

Chinese qualifier evidence comes from
[CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict), published by
MDBG and credited to Paul Andrew Denisowski and CC-CEDICT contributors. The
downloaded release is 2026-11-24T00:04:08Z, containing 125,472 entries. Its archive
SHA-256 is `dbb9d79208dec5149c73834c10ec7cb21cf3cd96d7f8b2a7b53d701a3bdcece8`.
This pass edits effective row hints; it does not replace the shared Chinese pack
with a blind reverse-gloss regeneration.

Additional contextual checks:

- [Söderwall via Språkbanken: older *stiälpa*, past *stalp*](https://spraakbanken.gu.se/fsvreader/lexseasy/stolpe--stulpi--sti%C3%A4lpa--sti%C3%A4lp)
- [Isof: *i ett sträck*, *två timmar i sträck*](https://frageladan.isof.se/faqs/27078)

The adapted hint data and review table are supplied under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Changes include contextual explanations, part-of-speech narrowing, usage-label
filtering, ordinary native equivalents and preserved sense bindings. Existing
WikDict/DBnary/FreeDict notices for the underlying French pack remain in the
[shared README](../db/language/shared/vocabulary-hints/README.md). This license
notice concerns the adapted vocabulary data, not unrelated repository content.
