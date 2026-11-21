# Swedish vocabulary review and extension — 2026-11-21

Added **206 vocabulary rows** across **30 categories**, with English hints, **497 explicit Swedish forms**, and Hindi lookup/display support for every added row.

## Review findings

The existing vocabulary is broad, with strong coverage of emotions, actions, idioms and descriptive language. Gaps remained in everyday computing, employment, household equipment, administration, reasoning and philosophical vocabulary. This update combines common practical words with more advanced expressions relevant to Swedish study and discussion.

The whole file received structural checks. Linguistic review focused on the additions and the three corrections below; this is not a claim that every existing translation or synonym has been independently verified.

- Original file: **9322 nonblank data rows** and **174 categories**.
- Updated file: **9528 nonblank data rows** and **175 categories**.
- Those totals include expansion definitions, assimilation rules and existing annotation rows, so they are not counts of distinct Swedish lemmas.
- Existing category names are unique, brackets are balanced, and there are no exact duplicate rows within a category.
- There are 308 repeated row occurrences across different categories. Their categorisation may be intentional; they were preserved.
- One category was added: **Weather and seasons**.

## Corrections

| Before | After | Reason |
| --- | --- | --- |
| `(reason, discuss)\|resonera\|rationalisering\|efterrationalisera` | `resonera` and its inflections remain under reasoning; rationalisation and post-hoc rationalisation have separate entries | Reasoning, a rationalisation noun, and justifying a decision after the fact are different meanings and word classes. Psychological rationalisation and streamlining an operation also have separate entries. |
| `(among others)\|bland annat\|` | `(among other things)\|bland annat\|` | Clarifies the distinction between things and people. `bland andra` was added separately. |
| `(tablet)\|läsplatta\|läsplattor\|` | `(e-book reader)\|läsplatta\|läsplattor\|` | Makes the reading-device sense explicit. `surfplatta` was added for a general tablet computer. |

## Coverage added

| Category | New rows |
| --- | ---: |
| Sleep and rest | 4 |
| Health and diseases, problems | 3 |
| Family, ancestry and inheritance | 4 |
| Personality: self-perception and self-pity | 4 |
| Personality: honesty and hypocrisy | 4 |
| Social relations | 4 |
| Thought, reflection and reasoning | 7 |
| Managing: tasks, work and execution | 6 |
| Knowledge, information and awareness | 8 |
| Understanding, interpretation and explanation | 4 |
| Investigation, examination and analysis | 4 |
| Logic | 21 |
| Cause and condition: causes, origins of effects and triggers | 4 |
| Comparison, similarity and difference | 3 |
| Change and stability: constancy and resistance to change | 1 |
| Change and stability: reversibility and irreversible change | 2 |
| Religion and spirituality | 14 |
| Time: scheduling, waiting and postponement | 5 |
| Lines of work, jobs, occupations, professions & related words | 12 |
| Buildings, houses etc | 4 |
| Crimes, Law, Rules, Regulation, Punishments, Justice | 8 |
| Finance, economy, business | 14 |
| Cleaning | 8 |
| Furniture, furnishings and bedding | 3 |
| Textiles, fabrics and needlework | 4 |
| Food, Drink, kitchen, Eating | 6 |
| Weather and seasons | 8 |
| IT, Software, Hardware | 20 |
| Conversational expressions and responses | 15 |
| Studies, school, education | 2 |
| **Total** | **206** |

Examples include *nymornad, krämpa, självkänsla, självförtroende, källkritik, felslut, orsakssamband, jämnmod, klocka in, uppsägningstid, folkbokföring, ränta, tvättstuga, knyppla, webbläsare,* and *ställa sig på sin spets*.

## Meaning distinctions and original usage examples

- **Självkänsla / självförtroende:** regard for one's own worth versus confidence in one's ability. “Hon har god självkänsla men svagt självförtroende när hon talar inför publik.”
- **Korrelation / orsakssamband:** statistical association does not by itself establish causation. “Vi ser en korrelation, men vi har ännu inte visat något orsakssamband.”
- **Rationalisera:** the psychological and work-efficiency senses are separate. “Hon försökte rationalisera sitt beslut efteråt.” / “Företaget rationaliserade arbetet för att minska kostnaderna.”
- **Därvid / varvid:** circumstance or event links; neither is a universal substitute for *därför*. “Hon vred på reglaget och råkade därvid stänga av ljudet.” / “Han drog ur kontakten, varvid skärmen slocknade.”
- **Knyppla:** specifically making bobbin lace; broader textile activities are separate. “Hon knypplar en spets till duken.”
- **Ställa sig på sin spets:** reach a decisive or acute point. “Frågan ställde sig på sin spets när kontraktet löpte ut.”

## Hindi support and preservation

Added **206 new English-to-Hindi keys** to the shared hint table. Two added rows reuse existing hint translations; new keys also support the two corrected English labels. Existing shared translations were preserved without modification. The existing generated Swedish Hindi catalogue, all meaning/group IDs, and line overrides were left intact. None of the three corrected rows had a group in that catalogue.

Existing rows retain their order within their original categories, except for the three documented corrections. Expansion and assimilation sections are unchanged. No subtitles, word maps, playlists, practice logs or application code were changed.

## Validation

Passed against the current repository's application modules:

- Parse every row and check balanced brackets and unique category headers.
- Verify every original row and its relative order, allowing only the three documented corrections.
- Check all 206 new English hints and all corresponding Hindi aliases using the actual hint index.
- Check Hindi display for every added row.
- Match all 497 explicit Swedish forms using the actual vocabulary matcher.
- Exercise full-file search for representative noun plurals, irregular verbs and multiword expressions.
- Verify blank/whitespace queries return no matches.
- Confirm existing Hindi translations and all expansion/assimilation data are preserved.

No application code or build dependencies changed, so an application build was not required for this data update.

## Sources consulted for selected distinctions

Definitions and examples above are original wording. These references support selected lexical distinctions; the report does not claim a dictionary lookup for every new word.

- [ISOF: surfplatta, pekplatta and läsplatta](https://frageladan.isof.se/faqs/30297).
- [Bonniers dictionary via Synonymer: rationalisera](https://www.synonymer.se/sv-syn/rationalisera).
- [Usage and inflections: efterrationalisera](https://www.synonymer.se/sv-syn/efterrationalisera).
- [Bonniers dictionary via Synonymer: knyppla](https://www.synonymer.se/sv-syn/knyppla).
- [Bonniers dictionary via Synonymer: nymornad](https://www.synonymer.se/sv-syn/nymornad).
- [Svenska Akademiens grammatik: pronominal adverbs and temporal/causal relations](https://svenska.se/SAG.pdf).
- [ISOF: joined and separate spelling, including såtillvida / så till vida](https://frageladan.isof.se/faqs/23289).
