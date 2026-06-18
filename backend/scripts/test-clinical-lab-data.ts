import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import * as path from "node:path";
import { convertFilesInParallel } from "../src/modules/question-builder/converter/convertDocx";
import type { QuestionData } from "../src/modules/question-builder/converter/types";

function walkDocx(dataDir: string): Array<{ buffer: Buffer; originalname: string; fullPath: string }> {
  const files: Array<{ buffer: Buffer; originalname: string; fullPath: string }> = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.toLowerCase().endsWith(".docx")) {
        files.push({
          buffer: readFileSync(full),
          originalname: path.relative(dataDir, full),
          fullPath: full,
        });
      }
    }
  }
  walk(dataDir);
  return files;
}

interface QualityCheck {
  file: string;
  questionId?: string;
  issues: string[];
}

function checkJsonQuality(dataDir: string, questionId: string, sourceName: string): QualityCheck {
  const jsonPath = path.join(dataDir, questionId, "question.json");
  const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as QuestionData;
  const issues: string[] = [];

  const keywords = data.keywords as string[] | undefined;
  if (!keywords?.length) issues.push("missing keywords");

  const explanations = data.explanations as Record<string, { title?: string; body?: string }> | undefined;
  for (const letter of ["A", "B", "C", "D", "E"]) {
    const exp = explanations?.[letter];
    if (!exp?.title?.trim()) issues.push(`missing explanation title for ${letter}`);
    if (!exp?.body?.trim()) issues.push(`missing explanation body for ${letter}`);
  }

  if (!(data.keyConcept as string)?.trim()) issues.push("missing keyConcept");

  const hasTable1 = (data.table1?.rows?.length ?? 0) > 0;
  const hasTable2 = (data.table2?.rows?.length ?? 0) > 0;
  const hasImages = (data.diagram?.images?.length ?? 0) > 0;

  if (hasTable1 && !data.table1?.heading?.trim()) {
    issues.push("table1 rows present but heading is empty");
  }
  if (hasTable2 && !data.table2?.heading?.trim()) {
    issues.push("table2 rows present but heading is empty");
  }
  if (hasImages && !data.diagram?.description?.trim() && !data.diagram?.heading?.trim()) {
    issues.push("diagram image present but heading/description missing");
  }

  return { file: sourceName, questionId, issues };
}

async function inspectFailed(fullPath: string, error?: string) {
  console.log(`  Error: ${error}`);
}

async function main() {
  const root = path.resolve(__dirname, "../..");
  const dataDir = path.join(root, "clinical lab data");
  const outDir = path.join(root, "clinical-lab-data-test-output");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const files = walkDocx(dataDir);
  console.log(`Testing ${files.length} DOCX files from clinical lab data...\n`);

  const results = await convertFilesInParallel(
    files.map((f) => ({ buffer: f.buffer, originalname: f.originalname })),
    outDir,
  );

  const failed = results.filter((r) => !r.success);
  const ok = results.filter((r) => r.success);

  console.log(`Results: ${ok.length} OK, ${failed.length} failed\n`);

  for (const f of failed) {
    const fullPath = files.find((file) => file.originalname === f.sourceName)?.fullPath;
    console.log(`FAIL: ${f.sourceName}`);
    console.log(`  ${f.error}`);
    if (f.validation?.errors) {
      for (const e of f.validation.errors) console.log(`  - [${e.code}] ${e.message}`);
    }
    if (fullPath) {
      await inspectFailed(fullPath, f.error);
    }
    console.log();
  }

  const qualityIssues: QualityCheck[] = [];
  for (const r of ok) {
    if (!r.questionId) continue;
    const check = checkJsonQuality(outDir, r.questionId, r.sourceName);
    if (check.issues.length) qualityIssues.push(check);
  }

  console.log(`Quality issues in successful conversions: ${qualityIssues.length}`);
  for (const q of qualityIssues) {
    console.log(`  ${q.questionId} (${q.file}): ${q.issues.join("; ")}`);
  }

  writeFileSync(
    path.join(outDir, "test-summary.json"),
    `${JSON.stringify({ ok: ok.length, failed: failed.length, failures: failed, qualityIssues }, null, 2)}\n`,
  );

  if (failed.length > 0 || qualityIssues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
