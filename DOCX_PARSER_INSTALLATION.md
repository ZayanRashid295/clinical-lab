# DOCX Parser Installation and Setup

## Installation

The DOCX parser requires the `mammoth` library. Install it using:

```bash
cd frontend-next
npm install mammoth
# or
yarn add mammoth
```

## What's Implemented

### Core Components

1. **`docx-parser-utils.ts`**
   - Parses DOCX files using mammoth
   - Extracts text, HTML, and embedded images
   - Converts images to File objects and uploads them
   - Handles image URL replacement

2. **`docx-to-question-converter.ts`**
   - Converts unstructured DOCX content to structured question data
   - Rule-based parsing for common question formats
   - Extracts: question ID, subject, system, topic, stem, options, explanations
   - Converts to ParsedQuestion format compatible with existing system

3. **`docx-uploader.tsx`**
   - Single DOCX file upload component
   - Parses and populates question fields automatically
   - Handles image extraction and upload

4. **`bulk-docx-uploader.tsx`**
   - Bulk DOCX file upload component
   - Processes multiple files
   - Allows metadata selection (section, chapter, topic)
   - Creates questions in batch

### Integration

- Integrated into `admin-dashboard.tsx`
- Added menu options: "Upload DOCX Question" and "Bulk Upload DOCX Questions"
- Works with existing question creation flow

## Usage

### Single File Upload

1. Go to Question Generator Admin Dashboard
2. Click "+ New Question"
3. Select "📄 Upload DOCX Question"
4. Upload your DOCX file
5. Review parsed content
6. Edit if needed and save

### Bulk Upload

1. Go to Question Generator Admin Dashboard
2. Click "+ New Question"
3. Select "📚 Bulk Upload DOCX Questions"
4. Select multiple DOCX files
5. Review parsed content for each file
6. Select metadata (section, chapter, topic) for each question
7. Click "Create X Question(s)"

## Supported DOCX Format

The parser expects DOCX files with the following structure:

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

Subject: Medicine (Internal) + Infectious Diseases
System: Dermatology (Integumentary system)...
Topic: Dermatology → Infestations → Scabies
```

### Features

- ✅ Extracts question ID
- ✅ Extracts subject, system, topic
- ✅ Extracts question stem
- ✅ Extracts options (A-E) and identifies correct answer
- ✅ Extracts keywords section
- ✅ Extracts per-answer explanations
- ✅ Extracts main explanation
- ✅ Extracts and uploads embedded images
- ✅ Converts tables to markdown format

## Testing

To test the DOCX parser:

1. Create a test DOCX file with a question in the expected format
2. Include embedded images if testing image extraction
3. Upload via the admin dashboard
4. Verify all fields are parsed correctly
5. Check that images are uploaded and displayed

## Troubleshooting

### Images not uploading
- Check that images are embedded in the DOCX (not linked)
- Verify backend image upload endpoint is accessible
- Check browser console for errors

### Parsing errors
- Ensure DOCX format matches expected structure
- Check that question ID, options, and answer are clearly marked
- Verify subject/system/topic are present

### Missing fields
- Some fields may require manual editing after parsing
- Use the question editor to add missing information

## Future Enhancements

- AI-assisted parsing for varied formats (using OpenAI/Gemini)
- Better table extraction and formatting
- Support for more complex DOCX structures
- Batch image optimization
