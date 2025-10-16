import * as fs from 'fs';
import * as path from 'path';

// Type definitions for the JSON schema
interface Field {
  name: string;
  type: string;
  primaryKey?: boolean;
  nullable?: boolean;
  default?: string;
  unique?: boolean;
  foreignKey?: {
    table: string;
    column: string;
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
}

interface Index {
  name: string;
  columns: string[];
  unique?: boolean;
}

interface Table {
  name: string;
  description?: string;
  fields: Field[];
  indexes?: Index[];
}

interface Schema {
  name: string;
  description?: string;
  version?: string;
  tables: Table[];
}

export class SQLGenerator {
  private schema: Schema;

  constructor(schemaPath: string) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    this.schema = JSON.parse(schemaContent);
  }

  /**
   * Generate complete SQL DDL script from the schema
   */
  generateSQL(): string {
    const statements: string[] = [];
    
    // Add header comment
    statements.push(this.generateHeader());
    
    // Generate ENUM types first
    statements.push(this.generateEnums());
    
    // Generate tables
    for (const table of this.schema.tables) {
      statements.push(this.generateTable(table));
    }
    
    // Generate foreign key constraints
    statements.push(this.generateForeignKeys());
    
    // Generate indexes
    statements.push(this.generateIndexes());
    
    return statements.join('\n\n');
  }

  /**
   * Generate header comment for the SQL file
   */
  private generateHeader(): string {
    const timestamp = new Date().toISOString();
    return `-- ${this.schema.name}
-- ${this.schema.description || 'Generated SQL schema'}
-- Version: ${this.schema.version || '1.0.0'}
-- Generated on: ${timestamp}
-- 
-- This file contains the complete database schema for the ecommerce platform.
-- Execute this script to create all tables, indexes, and constraints.

`;
  }

  /**
   * Generate ENUM types from the schema
   */
  private generateEnums(): string {
    const enums = new Map<string, Set<string>>();
    
    // Collect all ENUM values from fields
    for (const table of this.schema.tables) {
      for (const field of table.fields) {
        if (field.type.startsWith('ENUM(')) {
          const enumName = this.extractEnumName(field.type);
          const enumValues = this.extractEnumValues(field.type);
          
          if (!enums.has(enumName)) {
            enums.set(enumName, new Set());
          }
          
          enumValues.forEach(value => enums.get(enumName)!.add(value));
        }
      }
    }
    
    const statements: string[] = [];
    
    for (const [enumName, values] of enums) {
      const valuesList = Array.from(values).map(v => `'${v}'`).join(', ');
      statements.push(`CREATE TYPE ${enumName} AS ENUM (${valuesList});`);
    }
    
    return statements.length > 0 ? statements.join('\n') + '\n' : '';
  }

  /**
   * Generate CREATE TABLE statement for a single table
   */
  private generateTable(table: Table): string {
    const statements: string[] = [];
    
    // Add table comment
    if (table.description) {
      statements.push(`-- ${table.description}`);
    }
    
    // Start CREATE TABLE statement
    statements.push(`CREATE TABLE ${table.name} (`);
    
    // Generate field definitions
    const fieldDefinitions = table.fields.map(field => this.generateField(field));
    statements.push(fieldDefinitions.map(field => `  ${field}`).join(',\n'));
    
    // Close CREATE TABLE statement
    statements.push(');');
    
    return statements.join('\n');
  }

  /**
   * Generate field definition for a single field
   */
  private generateField(field: Field): string {
    const parts: string[] = [];
    
    // Field name
    parts.push(field.name);
    
    // Field type
    parts.push(field.type);
    
    // Primary key constraint
    if (field.primaryKey) {
      parts.push('PRIMARY KEY');
    }
    
    // Nullable constraint
    if (field.nullable === false) {
      parts.push('NOT NULL');
    }
    
    // Default value
    if (field.default !== undefined) {
      parts.push(`DEFAULT ${field.default}`);
    }
    
    // Unique constraint
    if (field.unique) {
      parts.push('UNIQUE');
    }
    
    return parts.join(' ');
  }

  /**
   * Generate foreign key constraints
   */
  private generateForeignKeys(): string {
    const statements: string[] = [];
    
    for (const table of this.schema.tables) {
      for (const field of table.fields) {
        if (field.foreignKey) {
          const constraintName = `fk_${table.name}_${field.name}`;
          const statement = `ALTER TABLE ${table.name} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${field.name}) REFERENCES ${field.foreignKey.table}(${field.foreignKey.column}) ON DELETE ${field.foreignKey.onDelete};`;
          statements.push(statement);
        }
      }
    }
    
    return statements.length > 0 ? statements.join('\n') + '\n' : '';
  }

  /**
   * Generate indexes
   */
  private generateIndexes(): string {
    const statements: string[] = [];
    
    for (const table of this.schema.tables) {
      if (table.indexes) {
        for (const index of table.indexes) {
          const uniqueKeyword = index.unique ? 'UNIQUE ' : '';
          const columns = index.columns.join(', ');
          const statement = `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${table.name} (${columns});`;
          statements.push(statement);
        }
      }
    }
    
    return statements.length > 0 ? statements.join('\n') + '\n' : '';
  }

  /**
   * Extract ENUM name from ENUM type string
   */
  private extractEnumName(enumType: string): string {
    const match = enumType.match(/ENUM\((.+)\)/);
    if (!match) return '';
    
    // Use the first value to determine enum name (this is a simplified approach)
    const firstValue = match[1].split(',')[0].trim().replace(/'/g, '');
    return `${firstValue}_enum`;
  }

  /**
   * Extract ENUM values from ENUM type string
   */
  private extractEnumValues(enumType: string): string[] {
    const match = enumType.match(/ENUM\((.+)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(value => value.trim().replace(/'/g, ''))
      .filter(value => value.length > 0);
  }

  /**
   * Generate SQL for a specific table
   */
  generateTableSQL(tableName: string): string {
    const table = this.schema.tables.find(t => t.name === tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found in schema`);
    }
    
    return this.generateTable(table);
  }

  /**
   * Generate SQL for multiple tables
   */
  generateTablesSQL(tableNames: string[]): string {
    const statements: string[] = [];
    
    for (const tableName of tableNames) {
      statements.push(this.generateTableSQL(tableName));
    }
    
    return statements.join('\n\n');
  }

  /**
   * Get list of all table names in the schema
   */
  getTableNames(): string[] {
    return this.schema.tables.map(table => table.name);
  }

  /**
   * Get table information
   */
  getTableInfo(tableName: string): Table | undefined {
    return this.schema.tables.find(t => t.name === tableName);
  }

  /**
   * Save generated SQL to file
   */
  saveToFile(outputPath: string): void {
    const sql = this.generateSQL();
    fs.writeFileSync(outputPath, sql, 'utf-8');
    console.log(`SQL schema saved to: ${outputPath}`);
  }

  /**
   * Generate migration script (for adding new tables/fields)
   */
  generateMigrationSQL(newSchemaPath: string, outputPath: string): void {
    const newGenerator = new SQLGenerator(newSchemaPath);
    const currentTables = new Set(this.getTableNames());
    const newTables = newGenerator.getTableNames();
    
    const statements: string[] = [];
    statements.push('-- Migration script');
    statements.push('-- Generated on: ' + new Date().toISOString());
    statements.push('');
    
    // Find new tables
    const addedTables = newTables.filter(table => !currentTables.has(table));
    
    if (addedTables.length > 0) {
      statements.push('-- New tables:');
      for (const tableName of addedTables) {
        statements.push(newGenerator.generateTableSQL(tableName));
        statements.push('');
      }
    }
    
    // Find removed tables (for reference)
    const removedTables = Array.from(currentTables).filter(table => !newTables.includes(table));
    if (removedTables.length > 0) {
      statements.push('-- Removed tables (manual cleanup required):');
      for (const tableName of removedTables) {
        statements.push(`-- DROP TABLE IF EXISTS ${tableName};`);
      }
      statements.push('');
    }
    
    const migrationSQL = statements.join('\n');
    fs.writeFileSync(outputPath, migrationSQL, 'utf-8');
    console.log(`Migration script saved to: ${outputPath}`);
  }
}

// CLI usage example
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: ts-node sql-generator.ts <schema.json> [output.sql]');
    console.log('Example: ts-node sql-generator.ts ecommerce-schema.json ecommerce-schema.sql');
    process.exit(1);
  }
  
  const schemaPath = args[0];
  const outputPath = args[1] || 'generated-schema.sql';
  
  try {
    const generator = new SQLGenerator(schemaPath);
    generator.saveToFile(outputPath);
    
    console.log('\nTable names in schema:');
    generator.getTableNames().forEach(name => console.log(`  - ${name}`));
    
  } catch (error) {
    console.error('Error generating SQL:', error);
    process.exit(1);
  }
}
