import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  annotationsToHighlightItems,
  blockTargetKey,
  findPhraseOffsets,
  matchesTarget,
} from "./annotation-highlight";
import {
  buildHighlightSegments,
  resolvePhraseRange,
} from "./highlight-text-utils";

function textNodes(...parts: string[]): Text[] {
  return parts.map((text) => ({ textContent: text }) as Text);
}

describe("exact selection targeting", () => {
  it("annotationsToHighlightItems uses only selectedText for the target", () => {
    const items = [
      {
        id: "1",
        targetKey: "stem:sel-1",
        selectedText: "jaundice and fatigue",
        severity: "MAJOR",
        body: "issue",
      },
      {
        id: "2",
        targetKey: "stem:sel-2",
        selectedText: null,
        body: "whole section comment",
      },
      {
        id: "3",
        targetKey: "option:A:sel-1",
        selectedText: "hemolytic",
        body: "wrong option",
      },
    ];

    const stem = annotationsToHighlightItems(items, "stem");
    assert.equal(stem.length, 1);
    assert.equal(stem[0].id, "1");
    assert.equal(stem[0].text, "jaundice and fatigue");

    const option = annotationsToHighlightItems(items, "option:A");
    assert.equal(option.length, 1);
    assert.equal(option[0].text, "hemolytic");
  });

  it("does not invent full-block highlights when selectedText is missing", () => {
    const items = [
      {
        id: "1",
        targetKey: "explanation:block-1",
        selectedText: "",
        body: "comment without selection",
      },
    ];
    assert.deepEqual(
      annotationsToHighlightItems(items, "explanation:block-1"),
      []
    );
  });

  it("does not let block-1 steal block-10 annotations", () => {
    assert.equal(
      matchesTarget("explanation:block-10:sel-1", "explanation:block-1"),
      false
    );
    assert.equal(
      matchesTarget("explanation:block-1:sel-1", "explanation:block-1"),
      true
    );
    assert.equal(
      blockTargetKey("explanation:block-1:sel-9"),
      "explanation:block-1"
    );
  });

  it("does not transfer a selection from another target by phrase match", () => {
    const items = [
      {
        id: "x",
        targetKey: "option:B:sel-1",
        selectedText: "shared phrase",
        body: "on option B",
      },
    ];
    // Stem contains same words elsewhere — must not highlight without matching target
    assert.deepEqual(annotationsToHighlightItems(items, "stem"), []);
    assert.equal(annotationsToHighlightItems(items, "option:B").length, 1);
  });

  it("resolvePhraseRange refuses markdown rewriting fallbacks", () => {
    // Selected rendered text is never recovered by stripping markdown markers
    assert.equal(
      resolvePhraseRange("This is **bold** text", "This is bold text"),
      null
    );
    // Exact substring of what appears on screen is fine
    const hit = resolvePhraseRange(
      "jaundice and fatigue today",
      "jaundice and fatigue"
    );
    assert.ok(hit);
    assert.equal(hit!.start, 0);
    assert.equal(hit!.length, "jaundice and fatigue".length);
  });

  it("allows whitespace-normalized match of the same selection", () => {
    const hit = resolvePhraseRange(
      "jaundice   and\nfatigue",
      "jaundice and fatigue"
    );
    assert.ok(hit);
    assert.equal(
      "jaundice   and\nfatigue".slice(hit!.start, hit!.start + hit!.length),
      "jaundice   and\nfatigue"
    );
  });

  it("buildHighlightSegments only wraps the exact selected phrase", () => {
    const text = "A 24-year-old man presents with jaundice and fatigue.";
    const segments = buildHighlightSegments(text, [
      {
        id: "a",
        text: "jaundice and fatigue",
        targetKey: "stem:sel-1",
        severity: "MINOR",
      },
    ]);
    const marked = segments.filter((s) => s.item);
    assert.equal(marked.length, 1);
    assert.equal(marked[0].text, "jaundice and fatigue");
  });

  it("findPhraseOffsets locates selection across nested node splits", () => {
    const nodes = textNodes(
      "Clinical Presentation (",
      "bullet-separated",
      " features)"
    );
    const offsets = findPhraseOffsets(
      nodes,
      "Clinical Presentation (bullet-separated features)"
    );
    assert.ok(offsets);
    assert.equal(offsets!.start, 0);
    assert.equal(
      offsets!.end,
      "Clinical Presentation (bullet-separated features)".length
    );
  });

  it("findPhraseOffsets refuses a phrase the reviewer did not select", () => {
    const nodes = textNodes("Clinical Presentation (bullet-separated features)");
    assert.equal(
      findPhraseOffsets(nodes, "something never selected"),
      null
    );
  });
});
