/**
 * DOCX to Markdown Converter
 * Extracts content from DOCX and sends to backend for LLM conversion
 */

import mammoth from "mammoth";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { applyDocxHtmlOrderFixes, getHtmlMediaSequence } from "./docx-html-order";

// Options interface removed - conversion is handled by backend

/**
 * Extract text content from DOCX file
 */
export async function extractDocxText(file: File): Promise<{
  text: string;
  html: string;
  images: Array<{ buffer: ArrayBufferLike; contentType: string; name: string }>;
}> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Validate file is actually a DOCX (ZIP archive)
  const view = new Uint8Array(arrayBuffer);
  if (view.length < 2 || view[0] !== 0x50 || view[1] !== 0x4B) {
    throw new Error(
      "Invalid DOCX file. The file does not appear to be a valid DOCX document. " +
      "Please ensure the file was created in Microsoft Word or similar software."
    );
  }

  const extractedImages: Array<{ buffer: ArrayBuffer; contentType: string; name: string }> = [];
  let imageCounter = 0;

  // Convert DOCX to HTML and extract images
  const { value: html, messages } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        try {
          const imageBuffer = await image.read();
          const contentType = image.contentType || "image/png";
          const imageName = `image_${imageCounter++}.${contentType.split("/")[1] || "png"}`;
          
          // Convert to ArrayBuffer - imageBuffer is Uint8Array
          // Create a new ArrayBuffer from the Uint8Array data
          const buffer = new ArrayBuffer(imageBuffer.byteLength);
          new Uint8Array(buffer).set(imageBuffer);
          
          extractedImages.push({
            buffer: buffer,
            contentType,
            name: imageName,
          });

          // Return placeholder for now - images will be uploaded separately
          return { src: `[IMAGE_PLACEHOLDER:${imageName}]` };
        } catch (error) {
          console.error("Error processing image:", error);
          return { src: "[IMAGE_ERROR]" };
        }
      }),
    }
  );

  // Return HTML with image placeholders already in place
  // The HTML preserves document structure (tables, formatting, etc.)
  // Images are already replaced with [IMAGE_PLACEHOLDER:filename] in the HTML
  // This HTML will be sent to LLM which can better understand structure

  return {
    text: html, // Keep text field for backward compatibility, but it's actually HTML now
    html,
    images: extractedImages,
  };
}

// Template and prompt generation moved to backend

/**
 * Main function to convert DOCX to Markdown using backend OpenAI (gpt-4o)
 * Sends HTML content (with image placeholders) to LLM for better structure understanding
 */
export async function convertDocxToMarkdown(
  file: File
): Promise<{
  markdown: string;
  images: Array<{ buffer: ArrayBufferLike; contentType: string; name: string }>;
}> {
  // Extract HTML (with image placeholders) and images from DOCX
  const { html, images } = await extractDocxText(file);

  // Get image placeholders
  const imagePlaceholders = images.map((img) => img.name);

  // Convert HTML to Markdown using backend service
  // LLM will see the full document structure and place images correctly
  const questionsService = new QuestionsService();
  const { markdown: rawMarkdown } = await questionsService.convertDocxToMarkdown(
    html,
    imagePlaceholders,
  );

  const markdown = applyDocxHtmlOrderFixes(rawMarkdown, html, imagePlaceholders);

  if (process.env.NODE_ENV === "development" && imagePlaceholders.length > 0) {
    const htmlSeq = getHtmlMediaSequence(html)
      .map((x) => (x.type === "image" ? `image:${x.key}` : `table:${x.index}`))
      .join(" → ");
  }

  return {
    markdown,
    images,
  };
}
