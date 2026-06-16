import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JSZip = require("jszip") as typeof import("jszip");
import { convertFilesInParallel } from "../src/modules/question-builder/converter/convertDocx";

async function loadZipDocxFiles(zipPath: string) {
  const zip = await JSZip.loadAsync(readFileSync(zipPath));
  const files: Array<{ buffer: Buffer; originalname: string }> = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir || !name.toLowerCase().endsWith(".docx")) continue;
    const buffer = await entry.async("nodebuffer");
    files.push({ buffer, originalname: path.basename(name) });
  }
  return files;
}

async function main() {
  const root = path.resolve(__dirname, "../..");
  const psoriasisZip = path.join(root, "medicineskindiseasespsoriasismcqsforsoftwarejune10.zip");
  const cvsZip = path.join(root, "medicinecvsacsmcqsforsoftwarejune1026.zip");
  const outDir = path.join(root, "data1-output-format-test");
  mkdirSync(outDir, { recursive: true });

  const psoriasisFiles = await loadZipDocxFiles(psoriasisZip);
  const psoriasisResults = await convertFilesInParallel(psoriasisFiles, outDir);
  const psoriasisOk = psoriasisResults.filter((result) => result.success);
  const psoriasisFail = psoriasisResults.filter((result) => !result.success);

  let cvsOk = 0;
  let cvsFail = 0;
  if (readFileSync(cvsZip)) {
    const cvsFiles = await loadZipDocxFiles(cvsZip);
    const cvsResults = await convertFilesInParallel(cvsFiles, outDir);
    cvsOk = cvsResults.filter((result) => result.success).length;
    cvsFail = cvsResults.filter((result) => !result.success).length;
  }

  const samplePath = path.join(outDir, "515017", "question.json");
  const sample = JSON.parse(readFileSync(samplePath, "utf-8"));
  const bodyHtml = sample.explanations?.A?.bodyHtml ?? "";
  const hasBold = bodyHtml.includes("<strong>Classic Distribution");

  const summary = {
    psoriasis: { ok: psoriasisOk.length, fail: psoriasisFail.length, failures: psoriasisFail },
    cvs: { ok: cvsOk, fail: cvsFail },
    sample515017: {
      hasBodyHtml: Boolean(bodyHtml),
      hasBoldClassicDistribution: hasBold,
      bodyHtmlSnippet: bodyHtml.slice(0, 240),
    },
  };

  writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (psoriasisFail.length > 0 || !hasBold) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
