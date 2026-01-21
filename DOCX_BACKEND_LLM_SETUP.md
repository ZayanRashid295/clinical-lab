# DOCX to Markdown Conversion - Backend LLM Setup

## Overview

The DOCX parser now uses OpenAI GPT-4o (backend) to convert DOCX files to Markdown format, which is then parsed by the existing markdown parser.

## Workflow

```
DOCX File Upload (Frontend)
    ↓
Extract Text & Images (Frontend)
    ↓
Upload Images to Backend
    ↓
Send Text to Backend API
    ↓
Backend: Convert to Markdown using OpenAI GPT-4o
    ↓
Return Markdown to Frontend
    ↓
Replace Image Placeholders with URLs
    ↓
Parse Markdown using Existing Parser
    ↓
Create Question
```

## Backend Setup

### 1. Install Dependencies

Already installed:
- `openai` package

### 2. Environment Variable

Add to your `.env` file in the backend:

```env
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Model Used

**GPT-4o** - Best model for:
- Structured output
- Following templates precisely
- Complex formatting
- Medical/technical content understanding

### 4. API Endpoint

**POST** `/questions/convert-docx-to-markdown`

**Request Body:**
```json
{
  "textContent": "Question Id: 515131\nQ 04: A 30-year-old man...",
  "imagePlaceholders": ["image_0.png", "image_1.jpg"]
}
```

**Response:**
```json
{
  "markdown": "---\ntitle: \"...\"\n..."
}
```

**Authentication:** Required (JWT Bearer token)

## Frontend Changes

### Removed
- ❌ API key input field
- ❌ LLM provider selection (OpenAI/Gemini)
- ❌ Frontend LLM API calls

### Updated
- ✅ Calls backend endpoint for conversion
- ✅ Simplified UI (no API key needed)
- ✅ Uses GPT-4o automatically

## Benefits

1. **Security**: API key stored securely in backend
2. **Consistency**: Always uses GPT-4o (best model)
3. **Simplicity**: No user configuration needed
4. **Cost Control**: Centralized API usage tracking
5. **Better Results**: GPT-4o provides superior structured output

## Cost Estimation

**GPT-4o Pricing:**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens

**Typical Question Conversion:**
- Input: ~2,000-5,000 tokens
- Output: ~1,000-3,000 tokens
- **Cost per question: ~$0.01-0.05**

## Testing

1. Set `OPENAI_API_KEY` in backend `.env`
2. Restart backend server
3. Upload DOCX file through frontend
4. Check backend logs for OpenAI API calls
5. Verify Markdown output quality

## Error Handling

- Missing API key: Clear error message
- API errors: Detailed error response
- Invalid DOCX: Validation before processing
- Network issues: Retry logic (can be added)

## Next Steps

1. Add API key to backend `.env`
2. Restart backend server
3. Test with a DOCX file
4. Monitor OpenAI API usage
5. Adjust temperature/max_tokens if needed
