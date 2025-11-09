# Prisma Schema Generator

A generic TypeScript tool that generates Prisma schema files from compact JSON definitions containing table names, primary keys, and relationship information.

## Features

- **Generic**: Works with any compact JSON schema definition
- **Relationship Management**: Handles one-to-many, many-to-one, and self-referencing relationships
- **Valid Prisma Output**: Generates syntactically correct Prisma schema files
- **TypeScript**: Fully typed with proper interfaces

## Input Format

The generator expects a `compact.json` file with the following structure:

```json
{
  "name": "Schema Name",
  "description": "Schema description",
  "tables": [
    {
      "name": "table_name",
      "primaryKey": "id",
      "relations": [
        {
          "table": "related_table",
          "type": "one-to-many" | "many-to-one",
          "self": true // optional, for self-referencing relationships
        }
      ]
    }
  ]
}
```

## Usage

### 1. Install Dependencies

```bash
npm install
```

### 2. Prepare Your Schema

Create or update `compact.json` with your table definitions.

### 3. Generate Prisma Schema

```bash
npm run generate
```

Or directly with ts-node:

```bash
npx ts-node run-generator.ts
```

### 4. Output

The generator creates `schema.prisma` with:

- Proper Prisma model definitions
- Correct relationship mappings
- Foreign key constraints
- Self-referencing relationships (for hierarchical data)

## Generated Schema Features

- **Primary Keys**: All tables get `id String @id @default(cuid())`
- **Relationships**: Properly mapped with foreign keys and references
- **Self-References**: Handled with named relations for hierarchical structures
- **Junction Tables**: Many-to-many relationships through intermediate tables

## Example Output

```prisma
model Users {
  id String @id @default(cuid())
  addresses Addresses[]
  orders Orders[]
}

model Addresses {
  id String @id @default(cuid())
  usersId String
  users Users @relation(fields: [usersId], references: [id])
}

model Categories {
  id String @id @default(cuid())
  children Categories[] @relation("CategoriesHierarchy")
  parentId String?
  parent Categories? @relation("CategoriesHierarchy", fields: [parentId], references: [id])
}
```

## Files

- `generate-prisma.ts` - Main generator class with all logic
- `run-generator.ts` - Simple runner script
- `compact.json` - Input schema definition
- `schema.prisma` - Generated Prisma schema (output)
- `package.json` - Dependencies and scripts

## Customization

The generator is designed to be generic and can be extended:

- Modify field types in `generatePrimaryKey()`
- Add custom field generation in `generateRelationFields()`
- Change naming conventions in `toPascalCase()` and `toCamelCase()`
- Add validation or additional schema features

## Requirements

- Node.js
- TypeScript
- ts-node (for running without compilation)
