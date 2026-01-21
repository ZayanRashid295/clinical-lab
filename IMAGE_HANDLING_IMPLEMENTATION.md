# Image Handling in DOCX Parser - Complete Implementation

## Image Processing Flow

### Step-by-Step Process

1. **Extract Images from DOCX**
   - `mammoth` library extracts embedded images
   - Images stored as ArrayBuffer with metadata (contentType, name)
   - Placeholders created: `[IMAGE_PLACEHOLDER:image_0.png]`

2. **Upload Images to Backend**
   - Convert ArrayBuffer → Blob → File
   - Upload via `questionsService.uploadImage()`
   - Get back URLs from backend
   - Create mapping: `{ imageName: uploadedUrl }`

3. **Send Text to LLM**
   - Text includes image placeholders: `[IMAGE_PLACEHOLDER:filename]`
   - LLM prompt includes detailed image handling instructions
   - LLM knows about all available images

4. **LLM Generates Markdown**
   - LLM converts placeholders to Markdown format: `![alt]([IMAGE_PLACEHOLDER:filename])`
   - Preserves placeholder format for replacement
   - Places images in appropriate locations

5. **Replace Placeholders with URLs**
   - Multiple replacement patterns supported:
     - `![alt]([IMAGE_PLACEHOLDER:name])` → `![alt](url)`
     - `[IMAGE_PLACEHOLDER:name]` → `url`
     - `[IMAGE: description] [IMAGE_PLACEHOLDER:name]` → `![description](url)`
   - All placeholders replaced with actual uploaded URLs

6. **Parse Markdown**
   - Existing parser handles images in Markdown format
   - Images converted to image blocks
   - URLs preserved in content blocks

## Image Extraction Details

### From DOCX
```typescript
// mammoth extracts images during HTML conversion
convertImage: mammoth.images.imgElement(async (image) => {
  const imageBuffer = await image.read();
  const imageName = `image_${counter}.${extension}`;
  
  // Store for upload
  extractedImages.push({
    buffer: imageBuffer.buffer,
    contentType: image.contentType,
    name: imageName,
  });
  
  // Return placeholder in HTML
  return { src: `[IMAGE_PLACEHOLDER:${imageName}]` };
})
```

### Text Extraction with Placeholders
- HTML converted to text while preserving placeholders
- Format: `[IMAGE: description] [IMAGE_PLACEHOLDER:filename]`
- Ensures LLM sees image context

## Image Upload

### Process
```typescript
for (const image of images) {
  const blob = new Blob([image.buffer], { type: image.contentType });
  const imageFile = new File([blob], image.name, { type: image.contentType });
  const result = await questionsService.uploadImage(imageFile);
  imageMapping[image.name] = result.url; // Store URL
}
```

### Error Handling
- Failed uploads: Placeholder becomes `[IMAGE_UPLOAD_FAILED:name]`
- Continues processing other images
- Warning logged for failed uploads

## LLM Image Instructions

The backend prompt includes:

```
IMPORTANT - IMAGE HANDLING:
The document contains N embedded image(s).
Image placeholders: [IMAGE_PLACEHOLDER:filename]

When you see [IMAGE_PLACEHOLDER:filename]:
1. Preserve it EXACTLY as [IMAGE_PLACEHOLDER:filename]
2. Place it in appropriate location
3. Convert to: ![Description]([IMAGE_PLACEHOLDER:filename])
4. Use descriptive alt text

Available placeholders:
  - [IMAGE_PLACEHOLDER:image_0.png] (Image 1)
  - [IMAGE_PLACEHOLDER:image_1.jpg] (Image 2)
```

## Placeholder Replacement

### Supported Formats

1. **Markdown format with placeholder:**
   ```
   ![alt text]([IMAGE_PLACEHOLDER:image_0.png])
   ```
   → `![alt text](https://example.com/uploads/image.png)`

2. **Standalone placeholder:**
   ```
   [IMAGE_PLACEHOLDER:image_0.png]
   ```
   → `https://example.com/uploads/image.png`

3. **With description:**
   ```
   [IMAGE: Diagram showing anatomy] [IMAGE_PLACEHOLDER:image_0.png]
   ```
   → `![Diagram showing anatomy](https://example.com/uploads/image.png)`

4. **LLM might use filename directly:**
   ```
   ![alt](image_0.png)
   ```
   → `![alt](https://example.com/uploads/image.png)`

## Image Block Conversion

The markdown parser (`convertMarkdownToExplanationBlocks`) automatically:
- Detects `![alt](url)` patterns
- Creates image blocks when images are on their own line
- Includes images in text blocks when part of content
- Preserves image URLs in content

## Testing Image Handling

### Test Cases

1. **DOCX with 1 image in question stem**
   - ✅ Image extracted
   - ✅ Uploaded to backend
   - ✅ URL in question stem

2. **DOCX with multiple images in explanation**
   - ✅ All images extracted
   - ✅ All uploaded
   - ✅ URLs in explanation blocks

3. **DOCX with images in tables**
   - ✅ Images extracted
   - ✅ Tables converted to Markdown
   - ✅ Images preserved in table context

4. **DOCX with images in per-answer explanations**
   - ✅ Images in each explanation
   - ✅ URLs properly mapped

## Error Scenarios Handled

1. **Image upload fails**
   - Placeholder: `[IMAGE_UPLOAD_FAILED:name]`
   - Processing continues
   - Warning logged

2. **Placeholder not found in Markdown**
   - Warning logged
   - Image URL not replaced (will show placeholder)

3. **Invalid image format**
   - Error logged
   - Processing continues
   - Placeholder preserved

## Logging

Comprehensive logging at each step:
- Image extraction count
- Upload progress (image X of Y)
- Upload success/failure
- Replacement count
- Final URL count in Markdown

## Summary

✅ **Complete Image Handling:**
- Extraction from DOCX
- Upload to backend
- LLM awareness
- Placeholder replacement
- Markdown conversion
- Block creation

The system handles images end-to-end from DOCX extraction to final question display!
