import { readFileSync } from "node:fs";
import * as path from "node:path";
import {
  buildGroupedHtmlFragments,
  collectFormattedParagraphEntries,
  joinFormattedHtml,
  parseRichXml,
  sliceParagraphHtml,
  stripHtml,
} from "./richTextUtils";

function loadQ1DocxParts() {
  const zipPath = path.resolve(
    __dirname,
    "../../../../../medicineskindiseasespsoriasismcqsforsoftwarejune10.zip",
  );
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const JSZip = require("jszip") as typeof import("jszip");
  const buffer = readFileSync(zipPath);
  return JSZip.loadAsync(buffer).then(async (zip) => {
    const q1Name = Object.keys(zip.files).find((name) => / Q1 /.test(name));
    if (!q1Name) throw new Error("Q1 docx not found in psoriasis zip");
    const docxBuffer = await zip.file(q1Name)!.async("nodebuffer");
    const docxZip = await JSZip.loadAsync(docxBuffer);
    const documentXml = await docxZip.file("word/document.xml")!.async("string");
    const numberingXml = await docxZip.file("word/numbering.xml")?.async("string");
    return { documentXml, numberingXml };
  });
}

describe("richTextUtils", () => {
  it("preserves bold text in explanation paragraphs", async () => {
    const { documentXml, numberingXml } = await loadQ1DocxParts();
    const entries = collectFormattedParagraphEntries(parseRichXml(documentXml), numberingXml);
    const classicDistribution = entries.find((entry) =>
      entry.formatted.text.includes("Classic Distribution"),
    );
    expect(classicDistribution).toBeDefined();
    expect(classicDistribution!.formatted.innerHtml).toContain("<strong>Classic Distribution");
  });

  it("groups bullet list paragraphs into ul HTML", () => {
    const paragraphs = [
      {
        text: "Item one",
        innerHtml: "<strong>Item one</strong>",
        isListItem: true,
        listOrdered: false,
        listLevel: 0,
      },
      {
        text: "Item two",
        innerHtml: "Item two",
        isListItem: true,
        listOrdered: false,
        listLevel: 0,
      },
    ];
    const html = joinFormattedHtml(paragraphs);
    expect(html).toBe("<ul><li><strong>Item one</strong></li><li>Item two</li></ul>");
  });

  it("slices paragraph HTML by plain-text offset", () => {
    const paragraph = {
      "w:r": [
        { "w:t": "Q 14: " },
        {
          "w:rPr": { "w:b": {} },
          "w:t": "Classic Distribution",
        },
        { "w:t": ": details" },
      ],
    };
    const offset = "Q 14: ".length;
    const sliced = sliceParagraphHtml(paragraph, offset);
    expect(sliced).toContain("<strong>Classic Distribution</strong>");
    expect(stripHtml(sliced)).toBe("Classic Distribution: details");
  });

  it("groups consecutive ordered-list keyword paragraphs into one ol", () => {
    const fragments = buildGroupedHtmlFragments([
      {
        text: "First keyword",
        innerHtml: "<strong>First keyword</strong>",
        isListItem: true,
        listOrdered: true,
        listLevel: 0,
      },
      {
        text: "Second keyword",
        innerHtml: "<strong>Second keyword</strong>",
        isListItem: true,
        listOrdered: true,
        listLevel: 0,
      },
      {
        text: "Summary line",
        innerHtml: "Summary line",
        isListItem: false,
        listOrdered: false,
        listLevel: 0,
      },
    ]);

    expect(fragments).toHaveLength(2);
    expect(fragments[0]).toBe(
      "<ol><li><strong>First keyword</strong></li><li><strong>Second keyword</strong></li></ol>",
    );
    expect(fragments[1]).toBe("<p>Summary line</p>");
  });
});
