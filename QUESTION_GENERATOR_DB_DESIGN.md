# Question Generator Database Schema Design

## Overview
This document proposes a database schema design for the question-generator module that supports rich content explanations including text (markdown), tables, and images.

## Current State Analysis

### Frontend Data Structure
Based on the question-generator components, questions have:
- **Stem**: Question text
- **Options**: Array of {label, text, correct, value}
- **Subject & System**: Metadata (e.g., "Pathology", "Endocrine")
- **Tags**: Array of strings
- **Explanation**: Array of content blocks with types: `text`, `table`, `images`
- **Per-Answer Explanations**: Object with keys A-E, each containing content blocks

### Content Block Types
1. **Text Block** (`type: "text"`)
   - `data.markdown`: Markdown string with formatting

2. **Table Block** (`type: "table"`)
   - Format 1: `data.rows`, `data.cols`, `data.cells` (key-value pairs like "0-0": "content")
   - Format 2: `data.html` (HTML table string)
   - Format 3: `data.markdown` (Markdown table)

3. **Images Block** (`type: "images"`)
   - `data.count`: Number of images
   - `data.images`: Array of image URLs

### Existing Database Schema
The current `Question` model in `content.schema.prisma` is basic:
- Only has `explanation` as a simple String
- Doesn't support rich content blocks
- Doesn't support per-answer explanations
- Missing subject/system fields
- Missing tags support

## Proposed Database Schema

### Option 1: JSON-Based (Simpler, Less Queryable)
Store rich content as JSON in the database. Good for flexibility but harder to query/search.

### Option 2: Normalized Tables (More Complex, More Queryable)
Create separate tables for each content type. Better for querying but more complex.

### Option 3: Hybrid Approach (Recommended)
Store structured JSON with supporting tables for metadata and relationships.

---

## Recommended Schema Design (Option 3: Hybrid)

### 1. Enhanced Question Model

```prisma
model Question {
  id          String   @id @default(cuid())
  topicId     String?
  productTagId String?
  
  // Question Content
  stem        String   // Question text/stem
  subject     String?  // e.g., "Pathology", "Biochemistry"
  system      String?  // e.g., "Endocrine", "Cardiovascular"
  difficulty  String   @default("medium") // easy, medium, hard
  points      Int      @default(1)
  
  // Metadata
  tags        Json?    // Array of strings: ["CAH", "Enzyme deficiency"]
  isActive    Boolean  @default(true)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  topic                Topic?                 @relation(fields: [topicId], references: [id], onDelete: SetNull)
  productTag           ProductTag?            @relation(fields: [productTagId], references: [id], onDelete: SetNull)
  choices              QuestionChoice[]
  explanationBlocks    ExplanationBlock[]     @relation("QuestionExplanation")
  perAnswerExplanations PerAnswerExplanation[]
  questionPaperQuestions QuestionPaperQuestion[]
  
  @@map("questions")
}
```

### 2. QuestionChoice Model (Enhanced)

```prisma
model QuestionChoice {
  id         String   @id @default(cuid())
  questionId String
  label      String   // A, B, C, D, E
  text       String   // Choice text
  isCorrect  Boolean  @default(false)
  order      Int      @default(0) // For ordering (0=A, 1=B, etc.)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionId, order])
  @@unique([questionId, label]) // Ensure unique labels per question
  @@map("question_choices")
}
```

### 3. ExplanationBlock Model (Core Rich Content)

```prisma
model ExplanationBlock {
  id          String   @id @default(cuid())
  questionId  String?  // For main explanation
  perAnswerId String? // For per-answer explanations
  
  // Content Type
  type        ExplanationBlockType // TEXT, TABLE, IMAGES
  
  // Order within explanation
  order       Int      @default(0)
  
  // Content Data (JSON)
  // For TEXT: { markdown: string }
  // For TABLE: { rows: number, cols: number, cells: object } OR { html: string } OR { markdown: string }
  // For IMAGES: { count: number, images: string[] }
  data        Json     // Flexible JSON structure
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  question    Question?            @relation("QuestionExplanation", fields: [questionId], references: [id], onDelete: Cascade)
  perAnswer   PerAnswerExplanation? @relation(fields: [perAnswerId], references: [id], onDelete: Cascade)

  @@map("explanation_blocks")
}

enum ExplanationBlockType {
  TEXT
  TABLE
  IMAGES
}
```

### 4. PerAnswerExplanation Model

```prisma
model PerAnswerExplanation {
  id         String   @id @default(cuid())
  questionId String
  choiceLabel String  // A, B, C, D, E
  
  createdAt  DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  question   Question           @relation(fields: [questionId], references: [id], onDelete: Cascade)
  blocks     ExplanationBlock[]

  @@unique([questionId, choiceLabel])
  @@map("per_answer_explanations")
}
```

### 5. Image Storage Model (Optional - for uploaded images)

```prisma
model QuestionImage {
  id          String   @id @default(cuid())
  questionId  String?
  blockId     String?  // Reference to ExplanationBlock if part of explanation
  url         String   // Image URL or path
  alt         String?  // Alt text
  caption     String?  // Optional caption
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  question    Question?          @relation(fields: [questionId], references: [id], onDelete: Cascade)
  block       ExplanationBlock?   @relation(fields: [blockId], references: [id], onDelete: Cascade)

  @@map("question_images")
}
```

---

## Data Structure Examples

### Example 1: Text Block
```json
{
  "id": "block_123",
  "type": "TEXT",
  "order": 0,
  "data": {
    "markdown": "## Overview\n\nThis patient is **genetically male (46,XY)** with features suggestive of **17 alpha-hydroxylase deficiency**."
  }
}
```

### Example 2: Table Block (Format 1 - Cells Object)
```json
{
  "id": "block_124",
  "type": "TABLE",
  "order": 1,
  "data": {
    "rows": 5,
    "cols": 4,
    "cells": {
      "0-0": "**Enzyme**",
      "0-1": "**Defect**",
      "0-2": "**Clinical Findings**",
      "0-3": "**Key Feature**",
      "1-0": "17α-hydroxylase",
      "1-1": "↓ Cortisol, ↓ Androgens",
      "1-2": "Hypertension, XX female with XY",
      "1-3": "46,XY phenotypic female"
    }
  }
}
```

### Example 3: Table Block (Format 2 - HTML)
```json
{
  "id": "block_125",
  "type": "TABLE",
  "order": 2,
  "data": {
    "html": "<table><thead><tr><th>Enzyme</th><th>Defect</th></tr></thead><tbody><tr><td>17α-hydroxylase</td><td>↓ Cortisol</td></tr></tbody></table>",
    "markdown": "| Enzyme | Defect |\n|--------|--------|\n| 17α-hydroxylase | ↓ Cortisol |"
  }
}
```

### Example 4: Images Block
```json
{
  "id": "block_126",
  "type": "IMAGES",
  "order": 3,
  "data": {
    "count": 2,
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.png"
    ]
  }
}
```

### Example 5: Complete Question Structure
```json
{
  "id": "question_123",
  "stem": "A 13-year-old girl is brought to the clinic...",
  "subject": "Pathology",
  "system": "Endocrine",
  "tags": ["CAH", "Enzyme deficiency", "Adrenal glands"],
  "difficulty": "hard",
  "points": 2,
  "choices": [
    { "label": "A", "text": "5 alpha-reductase", "isCorrect": false, "order": 0 },
    { "label": "B", "text": "17 alpha-hydroxylase", "isCorrect": true, "order": 1 },
    { "label": "C", "text": "11 beta-hydroxylase", "isCorrect": false, "order": 2 }
  ],
  "explanationBlocks": [
    { "type": "TEXT", "order": 0, "data": { "markdown": "## Overview\n\n..." } },
    { "type": "TABLE", "order": 1, "data": { "rows": 5, "cols": 4, "cells": {...} } },
    { "type": "TEXT", "order": 2, "data": { "markdown": "## Why This Answer?\n\n..." } }
  ],
  "perAnswerExplanations": {
    "A": [
      { "type": "TEXT", "order": 0, "data": { "markdown": "5 alpha-reductase deficiency causes..." } }
    ],
    "B": [
      { "type": "TEXT", "order": 0, "data": { "markdown": "17 alpha-hydroxylase deficiency is the correct answer..." } }
    ]
  }
}
```

---

## How to Distinguish Content Types

### 1. Type Field in ExplanationBlock
The `type` enum field (`TEXT`, `TABLE`, `IMAGES`) clearly distinguishes content types.

### 2. Data Structure Patterns
- **TEXT**: Always has `data.markdown` (string)
- **TABLE**: Has either:
  - `data.rows`, `data.cols`, `data.cells` (object with cell keys)
  - `data.html` (HTML string)
  - `data.markdown` (Markdown table string)
- **IMAGES**: Always has `data.count` (number) and `data.images` (array of URLs)

### 3. Rendering Logic
The frontend `RichContentRenderer` component already handles this:
```typescript
switch (item.type) {
  case "text":
    return renderMarkdown(item, isDark)
  case "table":
    return renderTable(item, isDark)
  case "images":
    return renderImages(item)
}
```

---

## Migration Strategy

### Step 1: Add New Fields to Question
- Add `subject`, `system`, `tags` fields
- Keep existing `explanation` field for backward compatibility

### Step 2: Create New Tables
- Create `ExplanationBlock` table
- Create `PerAnswerExplanation` table
- Create `QuestionImage` table (optional)

### Step 3: Migrate Existing Data
- Convert existing `explanation` strings to `ExplanationBlock` records
- Create migration script to parse and convert

### Step 4: Update Application Code
- Update Prisma client
- Update API endpoints
- Update frontend to use new structure

---

## Query Examples

### Get Question with Full Explanation
```prisma
const question = await prisma.question.findUnique({
  where: { id: "question_123" },
  include: {
    choices: { orderBy: { order: "asc" } },
    explanationBlocks: { orderBy: { order: "asc" } },
    perAnswerExplanations: {
      include: {
        blocks: { orderBy: { order: "asc" } }
      }
    }
  }
})
```

### Get Questions with Tables Only
```prisma
const questions = await prisma.question.findMany({
  where: {
    explanationBlocks: {
      some: {
        type: "TABLE"
      }
    }
  }
})
```

### Get Questions by Subject/System
```prisma
const questions = await prisma.question.findMany({
  where: {
    subject: "Pathology",
    system: "Endocrine"
  }
})
```

---

## Benefits of This Design

1. **Flexible**: Supports all three content types (text, table, images)
2. **Queryable**: Can query by type, subject, system, tags
3. **Ordered**: Blocks maintain order within explanations
4. **Extensible**: Easy to add new content types
5. **Normalized**: Proper relationships and foreign keys
6. **Backward Compatible**: Can migrate existing data gradually

---

## Alternative: Simplified JSON Approach

If you prefer a simpler approach, you could store everything as JSON:

```prisma
model Question {
  id          String   @id @default(cuid())
  // ... other fields ...
  explanation Json?    // Store entire explanation array as JSON
  perAnswerExplanations Json? // Store per-answer explanations as JSON
}
```

**Pros**: Simpler, faster to implement
**Cons**: Less queryable, harder to search, no referential integrity

---

## Recommendations

1. **Use the Hybrid Approach** (Option 3) for better queryability and structure
2. **Store images as URLs** initially (can add file upload later)
3. **Support all three table formats** (cells object, HTML, markdown) for flexibility
4. **Add indexes** on `subject`, `system`, `type` for better query performance
5. **Consider full-text search** on `stem` and explanation markdown for search functionality

---

## Next Steps

1. Review and approve this design
2. Create Prisma schema file: `question-generator.schema.prisma`
3. Generate migration
4. Update API endpoints
5. Update frontend to use new structure
6. Create data migration script for existing questions

