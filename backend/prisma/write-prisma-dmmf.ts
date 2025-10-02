/**
 * Extract Prisma DMMF (Data Model Meta Format) and write to generator specs
 *
 * This script extracts the complete schema information from the generated Prisma client
 * and writes it to a JSON file that the code generator can use for accurate code generation.
 *
 * Usage:
 *   npm run extract-dmmf
 *   or
 *   npx ts-node prisma/write-prisma-dmmf.ts
 */

import { Prisma } from "@prisma/client";
import { writeFileSync } from "fs";
import { join } from "path";

function main() {
  const datamodel = Prisma.dmmf.datamodel;

  // Create the output directory if it doesn't exist
  const outputDir = join(__dirname, "../../generator/specs/dmmf");
  const outputFile = join(outputDir, "schema-dmmf.json");

  // Write the DMMF data to JSON file
  writeFileSync(outputFile, JSON.stringify(datamodel, null, 2));

  console.log(`✅ DMMF data written to: ${outputFile}`);
  console.log(`📊 Models: ${datamodel.models.length}`);
  console.log(`📋 Enums: ${datamodel.enums.length}`);
  console.log(`🔧 Types: ${datamodel.types.length}`);
}

main();
