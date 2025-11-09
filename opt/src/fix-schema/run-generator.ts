#!/usr/bin/env ts-node

import { PrismaGenerator } from "./generate-prisma";
import * as fs from "fs";
import * as path from "path";

/**
 * Simple runner script to generate Prisma schema from compact.json
 */
function runGenerator() {
  try {
    // Read compact.json
    const compactPath = path.join(__dirname, "compact.json");

    if (!fs.existsSync(compactPath)) {
      console.error("Error: compact.json file not found in current directory");
      process.exit(1);
    }

    const compactData = fs.readFileSync(compactPath, "utf8");
    const compactSchema = JSON.parse(compactData);

    // Generate Prisma schema
    const generator = new PrismaGenerator(compactSchema);
    const outputPath = path.join(__dirname, "schema.prisma");

    generator.writeToFile(outputPath);

    console.log("\n✅ Prisma schema generation completed successfully!");
    console.log(`📁 Output file: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the generator
runGenerator();
