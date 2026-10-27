import { createVocabularyMatcher } from "./vocabulary-matcher.js";

const vocabulary = {
    Stars: ["(star)|stjärna|stjärnor|"],
    Sprinkle: ["(sprinkle)|beströ|strö över|"],
    Snow: ["(snow)|snö|"],
    Sun: ["(sun)|sol|"],
    Cover: ["(cover)|täcka|täckt|"],
    Illuminate: ["(illuminate)|belysa|belyst|"],
    Unrelated: ["(unrelated)|bestrida|ström|"]
};
const search = text => createVocabularyMatcher(vocabulary, { lang: "sv" })
    .search(text, { includePrefix: true });

describe("Swedish compounds with inflected components", () => {
    test("stjärnbeströdda surfaces beströ as a compound match", () => {
        const hits = search("stjärnbeströdda");
        expect(hits).toEqual(expect.arrayContaining([
            expect.objectContaining({
                category: "Sprinkle", kind: "compound",
                matched: "beströ", constituent: "beströdda"
            })
        ]));
        expect(hits.some(hit => hit.category === "Unrelated" && hit.kind === "compound")).toBe(false);
    });

    test("other compound participles continue to resolve their base words", () => {
        expect(search("snötäckt")).toEqual(expect.arrayContaining([
            expect.objectContaining({ category: "Cover", kind: "compound", constituent: "täckt" })
        ]));
        expect(search("solbelysta")).toEqual(expect.arrayContaining([
            expect.objectContaining({ category: "Illuminate", kind: "compound", constituent: "belysta" })
        ]));
    });

    test("does not match beströ for an unrelated prefix-only search", () => {
        expect(search("stjärnljus").some(hit => hit.category === "Sprinkle" && hit.kind === "compound")).toBe(false);
    });
});
