import * as fs from "fs";
import * as path from "path";

// Types for the compact schema structure
interface Relation {
  table: string;
  type: "one-to-many" | "many-to-one";
  self?: boolean;
}

interface Table {
  name: string;
  primaryKey: string;
  relations: Relation[];
}

interface CompactSchema {
  name: string;
  description: string;
  tables: Table[];
}

class PrismaGenerator {
  private schema: CompactSchema;

  constructor(schema: CompactSchema) {
    this.schema = schema;
  }

  /**
   * Converts table name to PascalCase for Prisma model names
   */
  private toPascalCase(str: string): string {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  /**
   * Converts table name to camelCase for field names
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Generates the primary key field
   */
  private generatePrimaryKey(table: Table): string {
    return `  ${table.primaryKey} String @id @default(cuid())`;
  }

  /**
   * Generates relation fields for a table
   */
  private generateRelationFields(table: Table): string[] {
    const fields: string[] = [];

    for (const relation of table.relations) {
      if (relation.self) {
        // Self-referencing relationship (parent-child) - add both sides
        fields.push(`  parentId String?`);
        fields.push(
          `  parent ${this.toPascalCase(
            relation.table
          )}? @relation("${this.toPascalCase(
            table.name
          )}Hierarchy", fields: [parentId], references: [${table.primaryKey}])`
        );
        fields.push(
          `  children ${this.toPascalCase(
            relation.table
          )}[] @relation("${this.toPascalCase(table.name)}Hierarchy")`
        );
      } else {
        // Regular relationship
        if (relation.type === "one-to-many") {
          // This table has many of the related table
          fields.push(
            `  ${this.toCamelCase(relation.table)} ${this.toPascalCase(
              relation.table
            )}[]`
          );
        } else {
          // This table belongs to the related table (many-to-one)
          const foreignKeyField = `${this.toCamelCase(relation.table)}Id`;
          fields.push(`  ${foreignKeyField} String`);
          fields.push(
            `  ${this.toCamelCase(relation.table)} ${this.toPascalCase(
              relation.table
            )} @relation(fields: [${foreignKeyField}], references: [${this.getPrimaryKeyForTable(
              relation.table
            )}])`
          );
        }
      }
    }

    return fields;
  }

  /**
   * Gets the primary key field name for a given table
   */
  private getPrimaryKeyForTable(tableName: string): string {
    const table = this.schema.tables.find((t) => t.name === tableName);
    return table ? table.primaryKey : "id";
  }

  /**
   * Generates a single Prisma model
   */
  private generateModel(table: Table): string {
    const modelName = this.toPascalCase(table.name);
    const primaryKey = this.generatePrimaryKey(table);
    const relationFields = this.generateRelationFields(table);

    const allFields = [primaryKey, ...relationFields];

    return `model ${modelName} {
${allFields.join("\n")}
}`;
  }

  /**
   * Generates the complete Prisma schema
   */
  public generateSchema(): string {
    const header = `// Generated Prisma Schema
// Source: ${this.schema.name}
// Description: ${this.schema.description}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    const models = this.schema.tables
      .map((table) => this.generateModel(table))
      .join("\n\n");

    return header + models;
  }

  /**
   * Writes the generated schema to a file
   */
  public writeToFile(outputPath: string): void {
    const schema = this.generateSchema();
    fs.writeFileSync(outputPath, schema, "utf8");
    console.log(`Prisma schema generated successfully at: ${outputPath}`);
  }
}

/**
 * Main function to read compact.json and generate Prisma schema
 */
function main() {
  try {
    // Read the compact schema file
    const compactSchemaPath = path.join(__dirname, "compact.json");
    const compactSchemaData = fs.readFileSync(compactSchemaPath, "utf8");
    const compactSchema: CompactSchema = JSON.parse(compactSchemaData);

    // Generate Prisma schema
    const generator = new PrismaGenerator(compactSchema);
    const outputPath = path.join(__dirname, "generated-schema.prisma");

    generator.writeToFile(outputPath);

    // Also log the generated schema to console
    console.log("\n--- Generated Prisma Schema ---");
    console.log(generator.generateSchema());
  } catch (error) {
    console.error("Error generating Prisma schema:", error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

export { PrismaGenerator, CompactSchema, Table, Relation };
