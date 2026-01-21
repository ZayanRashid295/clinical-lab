# DOCX to Markdown Conversion via LLM - Workflow

## New Workflow

```
DOCX File Upload
    ↓
Extract Text & Images from DOCX
    ↓
Upload Images to Backend
    ↓
Send Text to LLM (OpenAI/Gemini) with Template
    ↓
LLM Generates Markdown (following template)
    ↓
Replace Image Placeholders with URLs
    ↓
Parse Markdown using Existing Parser
    ↓
Create Question
```

## Implementation Details

### Components Created

1. **`docx-to-markdown-converter.ts`**
   - Extracts text and images from DOCX
   - Generates prompt with template
   - Calls OpenAI or Gemini API
   - Returns structured Markdown

2. **Updated `docx-uploader.tsx`**
   - Single file upload with LLM conversion
   - API key input for LLM provider
   - Provider selection (OpenAI/Gemini)

3. **Updated `bulk-docx-uploader.tsx`**
   - Bulk upload with LLM conversion
   - Same API key configuration

### Workflow Steps

1. **User uploads DOCX file**
   - File validation (checks if it's a valid ZIP/DOCX)

2. **Extract content from DOCX**
   - Extract text content
   - Extract embedded images
   - Images stored temporarily

3. **Upload images**
   - Convert image buffers to File objects
   - Upload via `questionsService.uploadImage()`
   - Get back URLs
   - Create mapping: `{ imageName: url }`

4. **LLM Conversion**
   - Send DOCX text to LLM (OpenAI or Gemini)
   - Include template in prompt
   - LLM generates Markdown following template format
   - Images referenced as placeholders: `[IMAGE_PLACEHOLDER:image_0.png]`

5. **Replace image placeholders**
   - Replace `[IMAGE_PLACEHOLDER:filename]` with uploaded URLs

6. **Parse Markdown**
   - Use existing `parseMarkdown()` function
   - Extracts all question components
   - Creates structured question data

7. **Create Question**
   - Use existing question creation flow

## LLM Configuration

### Supported Providers

1. **OpenAI**
   - Model: `gpt-4o-mini` (default)
   - API: `https://api.openai.com/v1/chat/completions`
   - Requires: OpenAI API key

2. **Google Gemini**
   - Model: `gemini-2.0-flash-exp` (default)
   - API: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
   - Requires: Gemini API key

### API Key Handling

- API keys are entered by user in the UI
- Keys are NOT stored (used only for conversion)
- Keys are sent directly to LLM API
- No backend storage of API keys

## Template Format

The LLM receives the template from `template.md`:

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

...

**Correct Answer:** <Correct Option Letter>

---

## Explanation

### Keywords in the Stem to Identify the Correct Option
- **"<Keyword1>"** – <Explanation of relevance>  

---

## Choice-by-Choice Explanations

<Free-form rationale, key concepts, tables, images, or other supporting content can be included here.>
```

## Benefits

1. ✅ **Handles varied DOCX formats** - LLM understands structure better than rule-based parsing
2. ✅ **Uses existing Markdown parser** - No need to maintain separate parsing logic
3. ✅ **Consistent output** - LLM follows template format exactly
4. ✅ **Better table/image handling** - LLM can convert complex structures
5. ✅ **Flexible** - Works with different DOCX formats and structures

## Usage

### Single File Upload

1. Go to Question Generator Admin Dashboard
2. Click "+ New Question" → "Upload DOCX Question (LLM Conversion)"
3. Select LLM provider (OpenAI or Gemini)
4. Enter API key
5. Upload DOCX file
6. Wait for conversion (LLM processes the file)
7. Review parsed content
8. Edit if needed and save

### Bulk Upload

1. Go to Question Generator Admin Dashboard
2. Click "+ New Question" → "Bulk Upload DOCX Questions"
3. Select LLM provider and enter API key
4. Select multiple DOCX files
5. Files are processed sequentially
6. Review parsed content for each
7. Select metadata and create questions

## API Costs

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Gemini 2.0 Flash**: Free tier available, then pay-as-you-go

For typical question conversion:
- Input: ~2000-5000 tokens
- Output: ~1000-3000 tokens
- Cost per question: ~$0.001-0.005 (very low)

## Error Handling

- Invalid DOCX file: Clear error message
- Missing API key: Validation before processing
- LLM API errors: Error message with details
- Image upload failures: Warnings, continues with placeholders
- Parsing errors: Error message with context

## Future Enhancements

- Cache API keys (encrypted, user-specific)
- Batch processing optimization
- Support for more LLM providers
- Template customization
- Preview before conversion
