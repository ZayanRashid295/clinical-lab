# DOCX to Question Parser - Complete Workflow

## Overview
This document outlines the workflow for parsing DOCX files directly into the question format, eliminating the need for manual ChatGPT conversion to Markdown.

## Current vs. New Workflow

### Current Workflow (Manual)
```
DOCX File → ChatGPT (Manual Conversion) → MD File → parseMarkdown() → Question Data
```

### New Workflow (Automated)
```
DOCX File → DOCX Parser → AI Template Processing → Question Data
```

## Document Structure Understanding

### Input: Unstructured DOCX Format
The DOCX file contains unstructured content like:
```
Question Id: 515128
Q 01: A 22-year-old male hostel resident presents with...
Atopic dermatitis
Papular urticaria
Scabies
Pediculosis corporis
Allergic contact dermatitis
ANSWER: C

Keywords in the Stem to identify correct option
...

Explanation
(Option C) Scabies: ...
(Option A) Atopic dermatitis: ...
...

Subject: Medicine (Internal) + Infectious Diseases
System: Dermatology (Integumentary system)...
Topic: Dermatology → Infestations → Scabies
```

### Output: Structured Markdown Template
The system expects this structure (from `template.md`):
```markdown
---
title: "<Subject & Topic> — <Specific Focus>"
tags: [<Tag1>, <Tag2>]
difficulty: <easy|medium|hard>
correct_answer: <Correct Option Letter>
question_id: <Unique Question ID>
---

# <Subject & Topic> — <Specific Focus>
## Topic: <Topic or Subtopic>

## Question
<Question Stem Here>

## Options and Explanations

**A. <Option A Text>**

### Choice A Explanation
<Explanation for Option A>

**B. <Option B Text>** 

### Choice B Explanation
<Explanation for Option B>

...

**Correct Answer:** <Correct Option Letter>

---

## Explanation

### Keywords in the Stem to Identify the Correct Option
- **"<Keyword1>"** – <Explanation of relevance>  
- **"<Keyword2>"** – <Explanation of relevance>  

---

## Choice-by-Choice Explanations

<Free-form rationale, key concepts, tables, images, or other supporting content can be included here.>
```

## Explanation Block Structure

Based on `question_1.md` and parser logic:

### Main Explanation Blocks
The explanation section is split at "## Choice-by-Choice Explanations":

1. **Block 0 (Keywords Section)**: Lines 52-62
   - Contains "### Keywords in the Stem to Identify the Correct Option"
   - All content before "## Choice-by-Choice Explanations"

2. **Block 1+ (After Placeholder)**: Lines 67-90
   - Everything after "## Choice-by-Choice Explanations" header
   - Includes tables, additional text, images
   - The header itself is a placeholder marker

### Per-Answer Explanations
- Extracted inline with options (### Choice A Explanation, etc.)
- Stored separately in `perAnswerExplanations` object

## Complete Workflow Steps

### Phase 1: DOCX Parsing & Extraction

#### Step 1.1: File Upload & Validation
- Accept `.docx` files
- Validate file format
- Check file size limits

#### Step 1.2: DOCX Content Extraction
Using `mammoth` library:
- **Text Extraction**: All paragraphs, headings, lists
- **Table Extraction**: Preserve structure (rows, columns, cells)
- **Image Extraction**: 
  - Extract embedded images as binary data
  - Get image metadata (filename, content type)
  - Convert to File objects for upload

#### Step 1.3: Image Processing
- Convert binary image data → File/Blob objects
- Upload each image via `questionsService.uploadImage(file)`
- Get back URLs
- Create mapping: `{ originalRef: uploadedUrl }`

### Phase 2: AI Template Processing

#### Step 2.1: Structure Recognition
Use LLM (OpenAI/Gemini) to:
1. **Extract Metadata**:
   - Question ID (from "Question Id: 515128")
   - Subject & System (from "Subject: Medicine (Internal)...")
   - Topic (from "Topic: Dermatology → Infestations → Scabies")
   - Difficulty (infer from content or default to "medium")
   - Tags (extract from subject/system)

2. **Extract Question Stem**:
   - Identify question text (after "Q 01:" or similar)
   - Clean up formatting
   - Preserve images (replace with placeholders for now)

3. **Extract Options**:
   - Identify all options (A, B, C, D, E)
   - Extract option text
   - Identify correct answer (from "ANSWER: C")

4. **Extract Keywords Section**:
   - Find "Keywords in the Stem to identify correct option"
   - Extract all keyword explanations
   - Format as markdown list

5. **Extract Per-Answer Explanations**:
   - Find "(Option A) ...", "(Option B) ..." patterns
   - Extract explanation for each option
   - Map to choice labels (A, B, C, D, E)

6. **Extract Main Explanation**:
   - Find "Explanation" section
   - Extract content after per-answer explanations
   - Identify tables, images, additional text
   - Split at "Choice-by-Choice Explanations" if present

#### Step 2.2: Content Structuring
Convert extracted content to template format:

```typescript
{
  // YAML Frontmatter
  title: "Medicine (Internal) — Dermatology (Infestations) – Scabies",
  tags: ["Medicine", "Dermatology"],
  difficulty: "medium",
  correct_answer: "C",
  question_id: "515128",
  
  // Main Content
  subject: "Medicine (Internal)",
  system: "Dermatology",
  topic: "Dermatology – Infestations → Scabies",
  
  // Question
  stem: "A 22-year-old male hostel resident presents with...",
  
  // Options
  options: [
    { label: "A", text: "Atopic dermatitis", correct: false },
    { label: "B", text: "Papular urticaria", correct: false },
    { label: "C", text: "Scabies", correct: true },
    // ...
  ],
  
  // Main Explanation (split into blocks)
  mainExplanation: [
    {
      type: "text",
      order: 0,
      data: {
        markdown: "### Keywords in the Stem to Identify the Correct Option\n- **\"Pruritus worse at night\"** – ...\n..."
      }
    },
    {
      type: "per-answer-explanation", // Placeholder
      order: 1,
      data: { placeholder: true, isPerAnswerExplanation: true }
    },
    {
      type: "text",
      order: 2,
      data: {
        markdown: "Scabies is an ectoparasitic infestation..."
      }
    },
    {
      type: "table",
      order: 3,
      data: { /* table data */ }
    }
  ],
  
  // Per-Answer Explanations
  perAnswerExplanations: {
    A: [{ type: "text", data: { markdown: "(Option A) Atopic dermatitis: ..." } }],
    B: [{ type: "text", data: { markdown: "(Option B) Papular urticaria: ..." } }],
    C: [{ type: "text", data: { markdown: "(Option C) Scabies: ..." } }],
    // ...
  }
}
```

### Phase 3: Content Conversion

#### Step 3.1: Image URL Replacement
- Replace image placeholders with uploaded URLs
- Update in stem, explanations, and tables

#### Step 3.2: Table Conversion
- Convert DOCX tables to TipTap table format
- Preserve structure: `{ rows, cols, cells }`

#### Step 3.3: Markdown Conversion
- Convert structured content to markdown blocks
- Handle formatting (bold, italic, lists, etc.)

### Phase 4: Validation & Creation

#### Step 4.1: Validation
- Ensure required fields present (stem, options, correct answer)
- Validate option count (4-5 options)
- Check image uploads succeeded
- Verify question structure

#### Step 4.2: Question Creation
- Use existing question creation flow
- Store in database with proper relationships
- Link to topics, tags, etc.

## Technical Implementation

### Libraries Required

```json
{
  "mammoth": "^1.6.0",  // DOCX to HTML/Markdown conversion
  "jszip": "^3.10.1"    // Direct ZIP access (if needed)
}
```

### New Components

1. **`docx-parser-utils.ts`**
   - Core DOCX parsing logic
   - Image extraction and conversion
   - Table extraction

2. **`docx-uploader.tsx`**
   - Upload component for single DOCX file
   - Similar to `markdown-uploader.tsx`

3. **`bulk-docx-uploader.tsx`**
   - Bulk upload support
   - Similar to `bulk-markdown-uploader.tsx`

4. **`docx-to-question-converter.ts`**
   - AI-assisted conversion logic
   - Template mapping
   - Structure recognition

### Image Handling Flow

```typescript
// Extract images from DOCX
const { value: html, messages } = await mammoth.convertToHtml({ 
  arrayBuffer: docxFileBuffer 
}, {
  convertImage: mammoth.images.imgElement(async function(image) {
    // image.contentType: "image/png"
    // image.buffer: ArrayBuffer
    
    // Convert to File object
    const blob = new Blob([image.buffer], { type: image.contentType });
    const fileName = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${image.contentType.split('/')[1]}`;
    const file = new File([blob], fileName, { type: image.contentType });
    
    // Upload using existing service
    const result = await questionsService.uploadImage(file);
    
    // Return URL for replacement
    return { src: result.url };
  })
});
```

### AI Processing Prompt Structure

```typescript
const prompt = `
You are a medical question parser. Parse the following DOCX content and structure it according to the template.

DOCX Content:
${extractedText}

Template Structure:
- Extract question ID, subject, system, topic
- Extract question stem
- Extract options (A-E) and identify correct answer
- Extract keywords section
- Extract per-answer explanations
- Extract main explanation (split at "Choice-by-Choice Explanations" if present)
- Identify tables and images

Output as JSON matching the question data structure.
`;
```

## Benefits

1. ✅ **Eliminates Manual Step**: No ChatGPT conversion needed
2. ✅ **Direct Processing**: Parse from source DOCX
3. ✅ **Image Support**: Automatic extraction and upload
4. ✅ **Table Support**: Preserve table structures
5. ✅ **Scalable**: Works for bulk uploads
6. ✅ **Consistent**: Uses existing question structure

## Considerations

1. **DOCX Format Variations**: AI processing handles different formats
2. **Image Quality**: Images are processed and optimized by backend
3. **Table Complexity**: Complex tables may need manual review
4. **Performance**: Large files may take time to process
5. **Error Handling**: Graceful fallbacks for parsing failures

## Next Steps

1. Install required libraries (`mammoth`, `jszip`)
2. Create `docx-parser-utils.ts` with core parsing logic
3. Create `docx-to-question-converter.ts` with AI processing
4. Create `docx-uploader.tsx` component
5. Create `bulk-docx-uploader.tsx` component
6. Test with sample DOCX files
7. Integrate with existing question creation flow
