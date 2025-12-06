# Question Generator Model - Technical Overview

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Key Components](#key-components)
5. [Markdown Parser](#markdown-parser)
6. [Rich Content System](#rich-content-system)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [User Workflows](#user-workflows)

---

## Overview

The **Question Generator Model** is a comprehensive system for creating, managing, and delivering medical exam questions with rich content support. It enables educators to create questions with complex explanations including text, tables, images, and per-answer feedback.

### Key Features
- ✅ **Markdown Import**: Upload markdown files to automatically parse questions
- ✅ **Rich Content Editor**: Visual editor for creating questions with tables, images, and formatted text
- ✅ **Per-Answer Explanations**: Detailed feedback for each answer choice (A, B, C, D, E)
- ✅ **Metadata Management**: Subject, system, tags, difficulty levels
- ✅ **Bulk Upload**: Import multiple questions at once
- ✅ **Student View**: Interactive question interface for students

---

## Architecture

The system follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Admin UI   │  │  Parser      │  │  Student UI  │ │
│  │   Dashboard  │  │  Utils       │  │   View       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│              Backend (NestJS)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Controller  │  │   Service    │  │    DTOs      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕ Prisma ORM
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Questions   │  │  Choices     │  │  Blocks      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Question Creation Flow

```
1. User Input
   ├─ Option A: Upload Markdown File (.md)
   │   └─> Markdown Parser → Structured Data
   │
   └─ Option B: Manual Creation via UI
       └─> Question Creator Component → Structured Data

2. Data Transformation
   ├─ Parse markdown to content blocks
   ├─ Extract metadata (subject, system, tags)
   ├─ Convert options to QuestionChoice format
   └─ Structure explanations (main + per-answer)

3. API Request
   └─> POST /questions
       └─> CreateQuestionDto validation

4. Database Storage
   ├─ Create Question record
   ├─ Create QuestionChoice records (A, B, C, D, E)
   ├─ Create ExplanationBlock records
   └─ Create PerAnswerExplanation records

5. Response
   └─> Return complete question with all relations
```

### Question Retrieval Flow

```
1. API Request
   └─> GET /questions (with filters)

2. Database Query
   ├─ Fetch Question
   ├─ Include Choices (ordered)
   ├─ Include ExplanationBlocks (ordered)
   └─ Include PerAnswerExplanations (with blocks)

3. Data Transformation
   └─> Backend format → Frontend format

4. UI Rendering
   ├─ Question Panel (stem + choices)
   ├─ Explanation Panel (rich content)
   └─ Per-Answer Feedback (on selection)
```

---

## Key Components

### 1. **Markdown Parser** (`markdown-parser-utils.ts`)

The parser converts markdown files into structured question data.

**Input Format:**
```markdown
---
title: "Pathology — Endocrine"
tags: [CAH, Enzyme deficiency]
correct_answer: B
---

# Pathology — Endocrine
## Topic: Congenital Adrenal Hyperplasia

## Clinical Case
A 13-year-old girl presents with...

## Question
What is the most likely diagnosis?

**A.** Option A text
**B.** Option B text ✅
**C.** Option C text

### Choice B Explanation — Option B
Why it's correct: ...

## Explanation
### Overview
This patient has...
```

**Output Structure:**
```typescript
{
  stem: string,                    // Question text
  options: Array<{                 // Answer choices
    label: string,                 // A, B, C, D, E
    text: string,                  // Choice text
    correct: boolean               // Is correct answer
  }>,
  subject: string,                 // e.g., "Pathology"
  system: string,                  // e.g., "Endocrine"
  tags: string[],                  // ["CAH", "Enzyme deficiency"]
  mainExplanation: ContentBlock[], // Rich content blocks
  perAnswerExplanations: {         // Per-choice explanations
    A: ContentBlock[],
    B: ContentBlock[],
    ...
  }
}
```

**Key Parsing Features:**
- ✅ YAML frontmatter extraction (metadata)
- ✅ Section detection (Clinical Case, Question, Explanation)
- ✅ Option extraction (A., B., C., D., E.)
- ✅ Inline per-answer explanations
- ✅ Table parsing (markdown and HTML)
- ✅ Image extraction (`![alt](url)`)
- ✅ Markdown formatting preservation

### 2. **Question Creator** (`QuestionCreator.tsx`)

Visual editor for creating/editing questions.

**Features:**
- **Stem Editor**: Rich text editor for question text
- **Choice Manager**: Add/edit/delete answer choices
- **Metadata Section**: Subject, system, tags, difficulty
- **Explanation Editor**: Rich content blocks (text, tables, images)
- **Per-Answer Editor**: Individual explanations for each choice
- **Preview Panel**: Real-time preview of question

**Component Structure:**
```
QuestionCreator
├─ MetadataSection (subject, system, tags, difficulty)
├─ StemEditor (rich text with images)
├─ ChoiceManager (A, B, C, D, E)
├─ ExplanationPanel (main explanation blocks)
└─ PerAnswerExplanationEditor (per-choice feedback)
```

### 3. **Rich Content System**

Supports three types of content blocks:

#### **Text Blocks**
```typescript
{
  type: "text",
  order: 0,
  data: {
    markdown: "**Bold text** and *italic* with [links](url)"
  }
}
```

#### **Table Blocks**
```typescript
{
  type: "table",
  order: 1,
  data: {
    rows: 3,
    cols: 4,
    cells: {
      "0-0": "Header 1",
      "0-1": "Header 2",
      "1-0": "Row 1, Col 1",
      ...
    }
  }
}
```

#### **Image Blocks**
```typescript
{
  type: "images",
  order: 2,
  data: {
    count: 2,
    images: [
      "https://example.com/image1.png",
      "https://example.com/image2.png"
    ]
  }
}
```

### 4. **Admin Dashboard** (`admin-dashboard.tsx`)

Main interface for question management.

**Features:**
- Question list with search/filter
- Create new question (manual or markdown upload)
- Edit existing questions
- Bulk markdown upload
- Question preview
- Delete questions

**State Management:**
```typescript
- questions: Question[]           // All questions
- editingId: string | null        // Currently editing
- viewingId: string | null        // Currently viewing
- searchTerm: string              // Search filter
- showNewQuestion: boolean        // Create mode
- showMarkdownUploader: boolean   // Upload mode
```

---

## Markdown Parser

### Parsing Algorithm

The parser uses a **line-by-line state machine** approach:

```typescript
function parseMarkdown(content: string): ParsedQuestion {
  const lines = content.split("\n")
  let i = 0
  const questionData = {
    options: [],
    perAnswerExplanations: {},
    mainExplanation: []
  }

  // 1. Parse YAML frontmatter (if present)
  if (lines[0] === "---") {
    // Extract metadata (title, tags, correct_answer)
  }

  // 2. Parse sections
  while (i < lines.length) {
    const line = lines[i]
    
    // Detect section headers
    if (line.match(/^##+ (Clinical Case|Question)/)) {
      // Collect stem content
    }
    
    // Detect options (A., B., C., D., E.)
    if (line.match(/^[A-E]\.\s+/)) {
      // Extract option text
      // Check for inline per-answer explanation
    }
    
    // Detect main explanation
    if (line.startsWith("## Explanation")) {
      // Collect explanation content
      // Convert to content blocks
    }
    
    i++
  }

  return questionData
}
```

### Content Block Conversion

The `convertMarkdownToExplanationBlocks()` function converts markdown text into structured blocks:

```typescript
function convertMarkdownToExplanationBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = markdown.split("\n")
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect images: ![alt](url)
    if (line.match(/!\[.*\]\(.*\)/)) {
      blocks.push({ type: "images", data: {...} })
    }
    // Detect tables: | col1 | col2 |
    else if (line.startsWith("|")) {
      blocks.push({ type: "table", data: {...} })
    }
    // Regular text
    else {
      // Accumulate text into markdown block
    }
  }
  
  return blocks
}
```

---

## Rich Content System

### Content Block Structure

All content blocks follow a consistent structure:

```typescript
interface ContentBlock {
  id: string | number          // Unique identifier
  type: "text" | "table" | "images"
  order: number                // Display order
  data: {
    // Type-specific data
  }
}
```

### Block Rendering

The `RichContentRenderer` component renders blocks based on type:

```typescript
function RichContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map(block => {
      switch (block.type) {
        case "text":
          return <MarkdownRenderer content={block.data.markdown} />
        case "table":
          return <TableRenderer data={block.data} />
        case "images":
          return <ImageGallery images={block.data.images} />
      }
    })
}
```

### Per-Answer Explanations

Each answer choice (A, B, C, D, E) can have its own explanation:

```typescript
perAnswerExplanations: {
  A: ContentBlock[],  // Why A is wrong
  B: ContentBlock[],  // Why B is correct
  C: ContentBlock[],  // Why C is wrong
  ...
}
```

These are displayed when a student selects that answer.

---

## Database Schema

### Core Models

#### **Question Model**
```prisma
model Question {
  id          String   @id @default(cuid())
  topicId     String
  question    String   @db.Text        // Question stem
  explanation String?  @db.Text        // Legacy (backward compatibility)
  
  // Metadata
  subject     String?                  // Display subject
  system      String?                  // Display system
  chapterId   String?                  // Reference to Chapter
  sectionId   String?                  // Reference to Section
  tags        Json?                    // Array of strings
  difficulty  String   @default("medium")
  points      Int      @default(1)
  isActive    Boolean  @default(true)
  
  // Relations
  topic                Topic
  choices              QuestionChoice[]
  questionStemBlocks  QuestionStemBlock[]    // Rich stem content
  explanationBlocks    ExplanationBlock[]     // Main explanation
  perAnswerExplanations PerAnswerExplanation[] // Per-choice explanations
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### **QuestionChoice Model**
```prisma
model QuestionChoice {
  id         String   @id @default(cuid())
  questionId String
  text       String                  // Choice text
  isCorrect  Boolean  @default(false)
  order      Int      @default(0)    // 0=A, 1=B, 2=C, etc.
  
  question   Question @relation(...)
  
  @@unique([questionId, order])
}
```

#### **ExplanationBlock Model**
```prisma
model ExplanationBlock {
  id          String   @id @default(cuid())
  questionId  String
  type        String                  // "text", "table", "images"
  order       Int                      // Display order
  data        Json                     // Type-specific data
  
  question    Question @relation("QuestionExplanation", ...)
  
  @@map("explanation_blocks")
}
```

#### **PerAnswerExplanation Model**
```prisma
model PerAnswerExplanation {
  id          String   @id @default(cuid())
  questionId  String
  choiceLabel String                  // "A", "B", "C", "D", "E"
  blocks      ExplanationBlock[]      // Content blocks for this choice
  
  question    Question @relation(...)
  
  @@unique([questionId, choiceLabel])
}
```

### Data Relationships

```
Question (1) ──< (many) QuestionChoice
Question (1) ──< (many) ExplanationBlock
Question (1) ──< (many) PerAnswerExplanation
PerAnswerExplanation (1) ──< (many) ExplanationBlock
```

---

## API Endpoints

### Question Management

#### **Create Question**
```http
POST /questions
Content-Type: application/json
Authorization: Bearer <token>

{
  "question": "Question stem text...",
  "topicId": "topic-id",
  "subject": "Pathology",
  "system": "Endocrine",
  "tags": ["CAH", "Enzyme deficiency"],
  "difficulty": "medium",
  "choices": [
    { "text": "Option A", "isCorrect": false, "order": 0 },
    { "text": "Option B", "isCorrect": true, "order": 1 },
    ...
  ],
  "explanationBlocks": [
    { "type": "text", "order": 0, "data": {...} },
    { "type": "table", "order": 1, "data": {...} }
  ],
  "perAnswerExplanations": {
    "A": [{ "type": "text", "order": 0, "data": {...} }],
    "B": [{ "type": "text", "order": 0, "data": {...} }]
  }
}
```

#### **Get Questions**
```http
GET /questions?page=1&limit=10&subject=Pathology&system=Endocrine
Authorization: Bearer <token>
```

#### **Get Single Question**
```http
GET /questions/:id
Authorization: Bearer <token>
```

#### **Update Question**
```http
PATCH /questions/:id
Content-Type: application/json
Authorization: Bearer <token>

{ ...updated fields }
```

#### **Delete Question**
```http
DELETE /questions/:id
Authorization: Bearer <token>
```

---

## User Workflows

### Workflow 1: Upload Markdown File

```
1. Admin opens Admin Dashboard
2. Clicks "Upload Markdown" button
3. Selects .md file from computer
4. System parses markdown:
   ├─ Extracts metadata (title, tags, correct_answer)
   ├─ Parses question stem
   ├─ Extracts options (A, B, C, D, E)
   ├─ Parses main explanation → content blocks
   └─ Parses per-answer explanations → content blocks
5. Question Creator opens with pre-filled data
6. Admin reviews and edits if needed
7. Clicks "Save Question"
8. System creates question in database
9. Success message displayed
```

### Workflow 2: Manual Question Creation

```
1. Admin opens Admin Dashboard
2. Clicks "Create New Question"
3. Question Creator opens (empty)
4. Admin fills in:
   ├─ Metadata (subject, system, tags, difficulty)
   ├─ Question stem (rich text editor)
   ├─ Answer choices (A, B, C, D, E)
   ├─ Main explanation (add text/table/image blocks)
   └─ Per-answer explanations (for each choice)
5. Preview panel shows real-time preview
6. Clicks "Save Question"
7. System validates and saves to database
8. Success message displayed
```

### Workflow 3: Student Answering Question

```
1. Student opens Student Question View
2. System loads question from database
3. Question panel displays:
   ├─ Question stem (with images if any)
   └─ Answer choices (A, B, C, D, E)
4. Student selects an answer
5. System shows:
   ├─ Correct/incorrect indicator
   ├─ Main explanation (rich content)
   └─ Per-answer explanation for selected choice
6. Student can review all explanations
```

### Workflow 4: Bulk Upload

```
1. Admin opens Bulk Markdown Uploader
2. Selects multiple .md files (or folder)
3. System processes each file:
   ├─ Parses markdown
   ├─ Validates structure
   └─ Shows preview
4. Admin reviews all parsed questions
5. Clicks "Upload All"
6. System creates all questions in batch
7. Shows success count and any errors
```

---

## Technical Highlights

### 1. **Markdown Parsing Robustness**
- Handles multiple markdown formats
- Supports inline and block-level per-answer explanations
- Preserves formatting (bold, italic, links, lists)
- Extracts images and tables correctly

### 2. **Rich Content Flexibility**
- Three content block types (text, table, images)
- Ordering system for proper display
- Markdown rendering for text blocks
- HTML and markdown table support

### 3. **Database Design**
- Normalized schema (separate tables for blocks)
- JSON fields for flexible data storage
- Foreign key relationships with cascade deletes
- Indexed fields for performance

### 4. **API Design**
- RESTful endpoints
- JWT authentication
- DTO validation
- Pagination and filtering support
- Comprehensive error handling

### 5. **Frontend Architecture**
- Component-based (React/Next.js)
- Type-safe with TypeScript
- State management with React hooks
- Real-time preview
- Responsive UI

---

## Future Enhancements

Potential improvements for the system:

1. **AI Integration**
   - Auto-generate questions from medical texts
   - Suggest answer choices
   - Generate explanations

2. **Analytics**
   - Track question difficulty
   - Student performance metrics
   - Most common wrong answers

3. **Collaboration**
   - Multi-user editing
   - Question review workflow
   - Version history

4. **Export/Import**
   - Export to PDF
   - Import from other formats (Word, Excel)
   - Bulk export for backup

5. **Advanced Features**
   - Question templates
   - Question banks organization
   - Random question generation
   - Adaptive testing

---

## Summary

The Question Generator Model is a **comprehensive, flexible system** for creating and managing medical exam questions. It supports:

- ✅ **Multiple input methods** (markdown upload, manual creation)
- ✅ **Rich content** (text, tables, images)
- ✅ **Detailed feedback** (main + per-answer explanations)
- ✅ **Scalable architecture** (frontend, backend, database)
- ✅ **User-friendly interface** (admin dashboard, student view)

The system is designed to handle complex medical questions with detailed explanations, making it suitable for medical education and exam preparation platforms.

---

*Document generated for presentation purposes*











