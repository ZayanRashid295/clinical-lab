/**
 * Unit tests for batch review queue helpers.
 * Run: npx tsx frontend-next/scripts/test-batch-review-utils.mjs
 */
import assert from "node:assert/strict";
import {
  countSaved,
  initialStatuses,
  nextPendingId,
} from "../src/app/components/question-generator/question-builder/batch-review-utils.ts";

const results = [
  { sourceName: "a.docx", success: true, questionId: "502120" },
  { sourceName: "b.docx", success: true, questionId: "502121" },
  { sourceName: "c.docx", success: false, error: "bad" },
  { sourceName: "d.docx", success: true, questionId: "502122" },
];

const statuses = initialStatuses(results);
assert.equal(statuses["502120"], "pending");
assert.equal(statuses["502121"], "pending");
assert.equal(statuses["502122"], "pending");
assert.equal(statuses["bad"], undefined);

assert.equal(nextPendingId(results, statuses), "502120");

statuses["502120"] = "saved";
assert.equal(nextPendingId(results, statuses, "502120"), "502121");

statuses["502121"] = "saved";
statuses["502122"] = "saved";
assert.equal(nextPendingId(results, statuses), null);
assert.equal(countSaved(results, statuses), 3);

console.log("batch-review-utils: all tests passed");
