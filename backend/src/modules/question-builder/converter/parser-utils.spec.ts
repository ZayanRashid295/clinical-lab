import {
  findFirstKeyConceptIndex,
  findPrimaryKeyConceptIndex,
  isClassicTriadHeadingLine,
  isKeyConceptHeading,
  parseOptionLine,
  splitStemAndOptionTexts,
} from "./parser-utils";

describe("parser-utils", () => {
  describe("isKeyConceptHeading", () => {
    it("matches standalone Key Concept heading", () => {
      expect(isKeyConceptHeading("Key Concept")).toBe(true);
      expect(isKeyConceptHeading("Key Concept — Summary")).toBe(true);
    });

    it("rejects inline key concept lines inside explanations", () => {
      expect(isKeyConceptHeading("Key concept: The anemia is due to inability")).toBe(false);
    });
  });

  describe("parseOptionLine", () => {
    it("parses (Option A) format", () => {
      expect(parseOptionLine("(Option A) Iron deficiency anemia:")).toEqual({
        letter: "A",
        title: "Iron deficiency anemia",
      });
    });

    it("parses A) format", () => {
      expect(parseOptionLine("A) Iron deficiency anemia")).toEqual({
        letter: "A",
        title: "Iron deficiency anemia",
      });
    });
  });

  describe("splitStemAndOptionTexts", () => {
    it("keeps last five lines as options when stem spans multiple paragraphs", () => {
      const paragraphs = [
        "Question Id: 1",
        "Q 01: Start stem",
        "Hemoglobin: 8.5 g/dL",
        "MCV: 70 fL",
        "Which is the cause?",
        "Option A",
        "Option B",
        "Option C",
        "Option D",
        "Option E",
        "ANSWER: A",
      ];
      const result = splitStemAndOptionTexts(paragraphs, 1, 10);
      expect(result.stemContinuations).toEqual([
        "Hemoglobin: 8.5 g/dL",
        "MCV: 70 fL",
        "Which is the cause?",
      ]);
      expect(result.optionTexts).toEqual([
        "Option A",
        "Option B",
        "Option C",
        "Option D",
        "Option E",
      ]);
    });
  });

  describe("findFirstKeyConceptIndex", () => {
    it("skips inline key concept text inside option explanations", () => {
      const paragraphs = [
        "Explanation",
        "(Option C) Impaired hemoglobin synthesis:",
        "Key concept: inline note",
        "(Option A) Hemolysis:",
        "Key Concept",
        "Summary text",
      ];
      expect(findFirstKeyConceptIndex(paragraphs, 1)).toBe(4);
    });
  });

  describe("findPrimaryKeyConceptIndex", () => {
    it("prefers key concept heading before metadata over later table-section label", () => {
      const paragraphs = [
        "Explanation",
        "(Option A) Correct:",
        "Key Concept of MCQ",
        "Short summary",
        "Category: FCPS-1/ JCAT",
        "Topic: Asthma",
        "Key Concept",
        "Longer table-section summary",
        "Feature",
      ];
      expect(findPrimaryKeyConceptIndex(paragraphs, 0)).toBe(2);
    });
  });

  describe("isClassicTriadHeadingLine", () => {
    it("matches common triad heading variants", () => {
      expect(isClassicTriadHeadingLine("Classic Triad in Stem (typical for ACS):")).toBe(true);
      expect(isClassicTriadHeadingLine("Classic Triad Identified in This Stem")).toBe(true);
      expect(isClassicTriadHeadingLine("Psoriasis Morphological Triad:")).toBe(true);
    });
  });
});
