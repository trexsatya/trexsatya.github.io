# Vocabulary hint semantic review — 2026-11-22

The reported Hindi errors were real translation errors. The earlier pack checks
validated parsing, coverage and lookup behaviour; they did not establish that
each translation conveyed the Swedish meaning. This review corrects a wider
set of Hindi errors and all seven reported expressions across the nine
registered non-English hint languages.

## Scope and results

Pinned source commit: `ecca253785a628ef2035f96c79cf8ffc5dc7f19f`.
Swedish vocabulary blob before editing: `92156d1d370c2957c94c09641cf1968418eed2f4`.
Original shared Hindi blob: `5af46b04c1955bf12464fb2cfd9e229ec15924fe`.

| Measure | Result |
| --- | ---: |
| Eligible hinted Swedish rows | 9,370 |
| Rows explicitly given contextual Hindi review mappings | 344 |
| Row overrides including duplicate occurrences | 374 |
| Rows whose displayed Hindi hints changed | 373 |
| Shared English-to-Hindi cues corrected or completed | 432 |
| English cue rows expanded to full meanings | 8 |
| Cross-language display checks for the reported expressions | 72 |
| Cross-language corrected-alias lookup checks | 108 |
| Shared alias-to-intended-row checks | 8,025 |

Inspected all 257 current rows whose English cues contain `expression`,
`proverb` or `saying`, including ordinary vocabulary usages of those words.
Already adequate entries were retained. Also inspected the complete
Truth/Lies/Deception section, the existing generated meaning-specific Hindi
groups, and selected common shared verb and idiom cues. Equivalent duplicate
Swedish form groups receive the same correction across categories. Duplicate
propagation uses the complete normalized form set, not substring matches.

## Examples

The Hindi column shows the replacement meaning, rather than a literal rendering
of the previous English cue.

| Swedish | Previous Hindi | Corrected Hindi |
| --- | --- | --- |
| Lägga locket på | ढक्कन लगा दें | बात दबा देना; मामले की जानकारी बाहर न आने देना |
| Hålla någon på halster; Hålla någon på sträckbänken | टेंटरहूक पर रहें | किसी को बेचैनी और अनिश्चितता में इंतज़ार करवाना; जवाब न देकर उत्सुकता बनाए रखना |
| av barn och dårar får man höra sanningen | बच्चे और मूर्ख | बच्चे और नासमझ लोग बिना लाग-लपेट सच कह देते हैं |
| den drucknes tal är den nyktres tankar | नशे में बात करता है | नशे में व्यक्ति वह कह देता है जिसे होश में लोग मन में दबाए रखते हैं |
| det dunkelt sagda (är det dunkelt tänkta) | अस्पष्ट | अस्पष्ट कथन अस्पष्ट सोच को दर्शाता है |
| Sticka under stol med | छुपाएँ | बात छिपाना; खुलकर न बताना |
| Spel bakom kulisserna | पर्दे के पीछे | पर्दे के पीछे की जोड़तोड़; गुप्त सांठगांठ |
| must; juice | जरूर करें; रस | फलों का रस; बिना किण्वन वाला फलरस |
| bestrida; bestrider | प्रतियोगिता | किसी दावे या माँग को चुनौती देना; मानने से इनकार करना |
| Vassa armbågar | दबी हुई; निर्दयी | अपने फ़ायदे के लिए दूसरों को पीछे धकेलने वाला; निर्दयता से आगे बढ़ने वाला |
| Sila mygg och svälja kameler | एक गांड पर दबाव डालें और एक ऊँट को निगल लें; छोटी - मोटी बातों पर हंगामा करें और बड़ी गलतियों को नजरअंदाज करें | छोटी बातों में खोट निकालना और बड़ी गलतियाँ अनदेखी कर देना |

Other corrections include giving infinitive Hindi forms for ordinary verb cues,
removing false word senses (for example, a paper slip for accidentally revealing
a secret), using a verb rather than a noun for `kidnappa`, and translating full
proverbs rather than just naming their subjects.

`Sticka under stol med` means concealing something and is usually used with a
negation: `inte sticka under stol med` means admitting it openly. The positive
form in the current vocabulary is retained and its hint explains concealment;
negation must not be silently inserted into its translation.

## Storage and precedence

- `db/language/shared/vocabulary-meanings.json` contains curated row overrides,
  keyed by learning language, category and parsed vocabulary row. It provides
  Hindi overrides for the broader review and German, Spanish, French,
  Portuguese, Polish, Ukrainian, Thai and Simplified Chinese overrides for the
  seven reported expressions, including the duplicate drunkenness proverb.
- `db/language/shared/vocabulary-hints/hi.txt` contains corrections appropriate
  for shared English cues. Generic metadata labels and ambiguous single-word
  cues are not populated from an idiom's full meaning.
- `db/language/swedish/vocabulary.txt` expands eight English hint rows; Swedish
  forms, categories, ordering and the number of eligible rows are preserved.
- The older `vocabulary-hints-hi.json` generated pack is preserved. The existing
  application merges generated hints, its built-in seed and shared catalogs in
  that order. Row-specific overrides take precedence in both display and search.
  No application code change is required.

## Semantic reference checks

The translations were rewritten against the Swedish wording and sense, with
selected difficult expressions checked against dictionary or original-text
sources. These references support selected expressions; they are not evidence
that every remaining entry in every language has been reviewed.

- [Svenska Akademiens ordböcker: sanning](https://svenska.se/?activeTab=saob&exactMatch=true&id=9558833&q=sanning)
  for the truth proverb.
- [Svenska Akademiens ordböcker: stol](https://svenska.se/?activeTab=alla&exactMatch=true&highlightLabel=stolsrygg&q=stolsrygg)
  for concealment and the usual negative construction.
- [Wiktionary: halster](https://sv.wiktionary.org/wiki/halster) and selected entries
  in its [Swedish idiom appendix](https://sv.wiktionary.org/wiki/Appendix:Idiomatiska_uttryck/Svenska)
  for uncertainty, suppression of information and other selected idioms.
- [Svensk ordbok 2009: värdshus](https://spraakbanken.gu.se/resurser/data/karp/so-2009-webbversion/v%C3%A4rdshus.html)
  for passing without stopping to visit.
- [Svenska Akademiens ordböcker: ord](https://svenska.se/?activeTab=alla&q=ordlista)
  for the Shakespeare quotation about words without inward thought.

The corrections are an assistant editorial review, without independent
native-speaker approval. This is not a complete semantic review of all nine
language packs or of every remaining Hindi entry. Existing source attribution
and licenses for the dictionary tables remain in place.

## Validation

Used the actual committed application modules for parsing, row identity,
catalog merging, hint display and hint search. Checks include:

- Every corrected row displays its intended Hindi meaning after merging the
  legacy generated catalog, built-in seed and the new shared catalog.
- Every corrected alias searches back to the intended row, including surrounding
  whitespace. All reported expressions display and search correctly in all nine
  registered non-English languages.
- Old wrong aliases no longer select the affected row: the literal lid command,
  transliterated tenterhooks, the fragment about children and fools, a paper slip,
  obligation for fruit juice, and competition for contesting a claim.
- The generic Hindi adjective for `obscure` no longer selects the proverb about
  unclear expression. This guards against changing unrelated word senses.
- Shared aliases resolve to intended rows wherever a more specific row meaning
  does not replace them. A row override intentionally suppresses unrelated
  aliases from the shared cue table.
- Catalog schema, normalized Unicode, nonempty aliases and valid separators
  pass. Empty, whitespace-only and separator-only searches return no matches.
- Swedish forms and categories are identical before and after the eight English
  cue edits. Every eligible row retains a local hint or English fallback.

These checks verify application behaviour and preserve the reviewed meanings;
they do not substitute for linguistic review of unreviewed vocabulary.
