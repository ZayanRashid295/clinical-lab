import assert from "node:assert/strict";
import { coerceLabelString } from "../src/app/components/question-generator/metadata-label-utils.ts";

assert.equal(coerceLabelString("  Skin Diseases  "), "Skin Diseases");
assert.equal(coerceLabelString({ name: "Acute Coronary Syndrome" }), "Acute Coronary Syndrome");
assert.equal(coerceLabelString(42), "42");
assert.equal(coerceLabelString(null), "");
assert.equal(coerceLabelString(undefined), "");

console.log("metadata-label-utils: all tests passed");
