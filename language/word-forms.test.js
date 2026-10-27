import { vocabularyForms, createWordFormMatcher } from "./word-forms.js";

describe("Swedish participles of -dd verbs", () => {
    test("beströdda and beströdd are related to beströ", () => {
        expect(vocabularyForms("beströdda", "sv")).toContain("beströ");
        expect(vocabularyForms("beströdd", "sv")).toContain("beströ");
        const matcher = createWordFormMatcher("sv");
        expect(matcher.related("beströ", "beströdda")).toBe(true);
        expect(matcher.related("beströ", "beströdd")).toBe(true);
    });

    test("ordinary unrelated words are not treated as the same family", () => {
        const matcher = createWordFormMatcher("sv");
        expect(matcher.related("beströ", "bestämda")).toBe(false);
        expect(matcher.related("beströ", "ström")).toBe(false);
    });

    test("the extra Swedish form does not change other languages", () => {
        expect(vocabularyForms("beströdda", "en")).not.toContain("beströ");
    });
});
