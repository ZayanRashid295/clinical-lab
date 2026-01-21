import mammoth from "mammoth";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { convertMarkdownToExplanationBlocks } from "./markdown-parser-utils";

export interface ExtractedImage {
  buffer: ArrayBuffer;
  contentType: string;
  originalRef?: string;
}

export interface ParsedDocxContent {
  text: string;
  html: string;
  images: ExtractedImage[];
  imageMapping: Record<string, string>; // originalRef -> uploadedUrl
}

/**
 * Validate if a file is a valid DOCX file (ZIP archive)
 */
function isValidDocxFile(arrayBuffer: ArrayBuffer): boolean {
  const view = new Uint8Array(arrayBuffer);
  // DOCX files are ZIP archives, which start with "PK" (0x50 0x4B)
  return view.length >= 2 && view[0] === 0x50 && view[1] === 0x4B;
}

/**
 * Extract text, HTML, and images from a DOCX file
 */
export async function parseDocxFile(file: File): Promise<ParsedDocxContent> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Validate file is actually a DOCX (ZIP archive)
  if (!isValidDocxFile(arrayBuffer)) {
    throw new Error(
      "Invalid DOCX file. The file does not appear to be a valid DOCX document. " +
      "Please ensure the file was created in Microsoft Word or similar software. " +
      "If you have a text file, please convert it to DOCX format first."
    );
  }
  
  const imageMapping: Record<string, string> = {};
  const extractedImages: ExtractedImage[] = [];
  let imageCounter = 0;

  const questionsService = new QuestionsService();

  // Convert DOCX to HTML with image extraction
  let html: string;
  let messages: any[];
  
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            // Extract image data
            const imageBuffer = await image.read();
            const contentType = image.contentType || "image/png";
            const originalRef = `image_${imageCounter++}`;

            // Store extracted image
            extractedImages.push({
              buffer: imageBuffer.buffer,
              contentType,
              originalRef,
            });

            // Convert to File object
            const blob = new Blob([imageBuffer.buffer], { type: contentType });
            const extension = contentType.split("/")[1] || "png";
            const fileName = `docx_image_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}.${extension}`;
            const imageFile = new File([blob], fileName, { type: contentType });

            // Upload image
            try {
              const result = await questionsService.uploadImage(imageFile);
              imageMapping[originalRef] = result.url;
              return { src: result.url };
            } catch (uploadError) {
              console.error("Failed to upload image:", uploadError);
              // Return placeholder if upload fails
              return { src: `[IMAGE_UPLOAD_FAILED:${originalRef}]` };
            }
          } catch (error) {
            console.error("Error processing image:", error);
            return { src: "[IMAGE_ERROR]" };
          }
        }),
      }
    );
    html = result.value;
    messages = result.messages;
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.message && error.message.includes("zip file")) {
      throw new Error(
        "Invalid DOCX file format. The file does not appear to be a valid DOCX document. " +
        "Please ensure:\n" +
        "1. The file was created in Microsoft Word, Google Docs (exported as DOCX), or similar software\n" +
        "2. The file extension is .docx\n" +
        "3. The file is not corrupted\n\n" +
        "If you have a text file, please convert it to DOCX format first."
      );
    }
    throw new Error(`Failed to parse DOCX file: ${error.message || "Unknown error"}`);
  }

  // Convert HTML to plain text (for AI processing)
  const text = html
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  return {
    text,
    html,
    images: extractedImages,
    imageMapping,
  };
}

/**
 * Replace image placeholders in text/HTML with uploaded URLs
 */
export function replaceImageUrls(
  content: string,
  imageMapping: Record<string, string>
): string {
  let result = content;
  
  // Replace placeholders like [IMAGE_UPLOAD_FAILED:image_0] or image references
  for (const [originalRef, url] of Object.entries(imageMapping)) {
    // Replace various possible formats
    result = result.replace(
      new RegExp(`\\[IMAGE_UPLOAD_FAILED:${originalRef}\\]`, "g"),
      url
    );
    result = result.replace(new RegExp(originalRef, "g"), url);
  }

  // Replace any remaining image placeholders
  result = result.replace(/\[IMAGE_ERROR\]/g, "");
  result = result.replace(/\[IMAGE_UPLOAD_FAILED:[^\]]+\]/g, "");

  return result;
}

/**
 * Convert HTML table to markdown table format
 */
export function htmlTableToMarkdown(html: string): string {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tables = doc.querySelectorAll("table");

  if (tables.length === 0) {
    return html; // Return original if no tables found
  }

  let markdown = "";
  tables.forEach((table) => {
    const rows: string[][] = [];
    const tableRows = table.querySelectorAll("tr");

    tableRows.forEach((row) => {
      const cells: string[] = [];
      const rowCells = row.querySelectorAll("td, th");
      rowCells.forEach((cell) => {
        const cellText = cell.textContent?.trim() || "";
        cells.push(cellText);
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    if (rows.length > 0) {
      // Generate markdown table
      const headerRow = rows[0];
      markdown += "| " + headerRow.join(" | ") + " |\n";
      markdown += "| " + headerRow.map(() => "---").join(" | ") + " |\n";

      for (let i = 1; i < rows.length; i++) {
        markdown += "| " + rows[i].join(" | ") + " |\n";
      }
      markdown += "\n";
    }
  });

  return markdown || html;
}

/**
 * Extract plain text from HTML (for AI processing)
 */
export function htmlToPlainText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
