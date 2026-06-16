/**
 * Simulates batch save flow: mark saved, advance, keep queue intact.
 * Run: npx tsx frontend-next/scripts/test-batch-save-flow.mjs
 */
import assert from "node:assert/strict";
import {
  initialStatuses,
  nextPendingId,
  countSaved,
} from "../src/app/components/question-generator/question-builder/batch-review-utils.ts";

const batchResults = [
  { sourceName: "q6.docx", success: true, questionId: "502120" },
  { sourceName: "q7.docx", success: true, questionId: "502121" },
  { sourceName: "q8.docx", success: true, questionId: "502122" },
  { sourceName: "q9.docx", success: true, questionId: "502123" },
  { sourceName: "q10.docx", success: true, questionId: "502124" },
];

let statuses = initialStatuses(batchResults);
let activeId = "502120";

function simulateSave(id) {
  assert.equal(activeId, id);
  statuses = { ...statuses, [id]: "saved" };
  const nextId = nextPendingId(batchResults, statuses, id);
  activeId = nextId;
  return nextId;
}

// Save first question — queue must remain 5 items
simulateSave("502120");
assert.equal(batchResults.length, 5);
assert.equal(statuses["502120"], "saved");
assert.equal(activeId, "502121");

simulateSave("502121");
assert.equal(countSaved(batchResults, statuses), 2);
assert.equal(activeId, "502122");

simulateSave("502122");
simulateSave("502123");
const last = simulateSave("502124");
assert.equal(last, null);
assert.equal(activeId, null);
assert.equal(countSaved(batchResults, statuses), 5);

console.log("batch-save-flow: all tests passed");
