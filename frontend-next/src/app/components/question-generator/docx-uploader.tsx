"use client";

import { useState, useRef } from "react";
import { Card } from "@/shared/ui/card";
import { parseMarkdown } from "./markdown-parser-utils";
import { convertDocxToMarkdown, extractDocxText } from "./docx-to-markdown-converter";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { replaceImagePaths, replaceImagePathsInBlocks } from "./markdown-parser-utils";

interface DocxUploaderProps {
  onQuestionParsed: (questionData: any) => void;
}

export default function DocxUploader({ onQuestionParsed }: DocxUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionsService = new QuestionsService();

  // Helper to yield control back to browser
  const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      setError("Please upload a .docx or .doc file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setProgress("Initializing...");

    try {
      // Yield to browser to keep UI responsive
      await yieldToBrowser();

      // Step 1: Extract HTML (with image placeholders) and images from DOCX
      setProgress("Extracting content from DOCX file...");
      console.log("[DocxUploader] Step 1: Extracting content from DOCX file:", file.name);
      const { html, images } = await extractDocxText(file);
      console.log("[DocxUploader] Extracted:", {
        htmlLength: html.length,
        imagesCount: images.length,
        imageNames: images.map(img => img.name),
      });
      
      // Yield after heavy extraction
      await yieldToBrowser();

      // Step 2: Upload images first (BEFORE LLM conversion)
      const imageMapping: Record<string, string> = {};
      if (images.length > 0) {
        setProgress(`Uploading ${images.length} image(s)...`);
        console.log("[DocxUploader] Step 2: Uploading", images.length, "image(s)...");
        for (let idx = 0; idx < images.length; idx++) {
          const image = images[idx];
          try {
            setProgress(`Uploading image ${idx + 1}/${images.length}...`);
            // Convert ArrayBuffer to Blob
            const blob = new Blob([image.buffer], { type: image.contentType });
            const imageFile = new File([blob], image.name, { type: image.contentType });
            
            console.log(`[DocxUploader] Uploading image ${idx + 1}/${images.length}: ${image.name} (${image.contentType}, ${image.buffer.byteLength} bytes)`);
            const result = await questionsService.uploadImage(imageFile);
            imageMapping[image.name] = result.url;
            console.log(`[DocxUploader] ✅ Uploaded image: ${image.name} -> ${result.url}`);
            
            // Yield periodically during uploads
            if (idx % 2 === 0) await yieldToBrowser();
          } catch (uploadError: any) {
            console.error(`[DocxUploader] ❌ Failed to upload image ${image.name}:`, uploadError);
            // Continue with placeholder - will be replaced later
            imageMapping[image.name] = `[IMAGE_UPLOAD_FAILED:${image.name}]`;
          }
        }
        console.log("[DocxUploader] Image upload complete. Mapping:", Object.keys(imageMapping).length, "images");
      } else {
        console.log("[DocxUploader] No images found in DOCX file");
      }
      
      // Yield before LLM call
      await yieldToBrowser();

      // Step 3: Convert DOCX to Markdown using backend LLM service
      setProgress("Converting to Markdown using AI (this may take 30-60 seconds)...");
      console.log("[DocxUploader] Step 3: Converting to Markdown using OpenAI (backend)...");
      
      // Add timeout wrapper for LLM call
      const convertWithTimeout = Promise.race([
        convertDocxToMarkdown(file),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Conversion timeout: The AI processing is taking too long. Please try again.")), 120000) // 2 minute timeout
        )
      ]);
      
      const { markdown } = await convertWithTimeout;
      console.log("[DocxUploader] Generated Markdown length:", markdown.length);
      
      // Yield after LLM call
      await yieldToBrowser();

      // Step 4: Replace image placeholders with uploaded URLs
      setProgress("Processing Markdown and replacing image placeholders...");
      let processedMarkdown = markdown;
      console.log("[DocxUploader] Step 4: Replacing image placeholders...");
      console.log("[DocxUploader] Image mapping:", Object.keys(imageMapping).length, "images mapped");
      
      // Track replacements for logging
      let replacementCount = 0;
      
      // Replace placeholders in multiple formats that LLM might use
      for (const [imageName, url] of Object.entries(imageMapping)) {
        const escapedName = imageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let found = false;
        
        // Format 1: ![alt]([IMAGE_PLACEHOLDER:name]) - LLM might use this
        const format1Pattern = new RegExp(`!\\[([^\\]]*)\\]\\(\\[IMAGE_PLACEHOLDER:${escapedName}\\]\\)`, "g");
        if (format1Pattern.test(processedMarkdown)) {
          processedMarkdown = processedMarkdown.replace(format1Pattern, (match, alt) => {
            found = true;
            replacementCount++;
            return `![${alt || "Image"}](${url})`;
          });
        }
        
        // Format 2: [IMAGE_PLACEHOLDER:name] - Standalone placeholder
        const format2Pattern = new RegExp(`\\[IMAGE_PLACEHOLDER:${escapedName}\\]`, "g");
        if (format2Pattern.test(processedMarkdown)) {
          processedMarkdown = processedMarkdown.replace(format2Pattern, () => {
            if (!found) replacementCount++;
            found = true;
            return url;
          });
        }
        
        // Format 3: [IMAGE: description] [IMAGE_PLACEHOLDER:name] - Our format with description
        const format3Pattern = new RegExp(`\\[IMAGE:[^\\]]+\\]\\s*\\[IMAGE_PLACEHOLDER:${escapedName}\\]`, "g");
        if (format3Pattern.test(processedMarkdown)) {
          processedMarkdown = processedMarkdown.replace(format3Pattern, (match) => {
            const descMatch = match.match(/\[IMAGE:\s*([^\]]+)\]/);
            const description = descMatch ? descMatch[1] : "Image";
            if (!found) replacementCount++;
            found = true;
            return `![${description}](${url})`;
          });
        }
        
        // Format 4: ![alt](name) - LLM might use just the filename
        const format4Pattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedName}\\)`, "g");
        if (format4Pattern.test(processedMarkdown)) {
          processedMarkdown = processedMarkdown.replace(format4Pattern, (match, alt) => {
            if (!found) replacementCount++;
            found = true;
            return `![${alt || "Image"}](${url})`;
          });
        }
        
        if (found) {
          console.log(`[DocxUploader] ✅ Replaced placeholders for image: ${imageName}`);
        }
      }
      
      const finalImageUrlCount = (processedMarkdown.match(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi) || []).length;
      console.log("[DocxUploader] After replacement:", {
        replacements: replacementCount,
        imageURLsInMarkdown: finalImageUrlCount,
        expectedImages: images.length,
      });
      
      // Warn if not all images were replaced
      if (replacementCount < images.length) {
        console.warn(`[DocxUploader] ⚠️ Only replaced ${replacementCount} of ${images.length} image placeholders`);
      }

      // Step 5: Parse Markdown using existing parser
      setProgress("Parsing Markdown content...");
      console.log("[DocxUploader] Step 5: Parsing Markdown...");
      const parsed = parseMarkdown(processedMarkdown);
      console.log("[DocxUploader] Parsed question:", {
        subject: parsed.subject,
        system: parsed.system,
        optionsCount: parsed.options.length,
      });
      
      // Yield before final processing
      await yieldToBrowser();

      // Step 6: Replace image paths in parsed content
      const updatedStem = replaceImagePaths(parsed.stem || "", imageMapping);
      const updatedMainExplanation = replaceImagePathsInBlocks(
        parsed.mainExplanation || [],
        imageMapping
      );
      const updatedPerAnswerExplanations: Record<string, any[]> = {};
      for (const [key, blocks] of Object.entries(parsed.perAnswerExplanations || {})) {
        updatedPerAnswerExplanations[key] = replaceImagePathsInBlocks(blocks, imageMapping);
      }

      // Format for question creator
      const questionData = {
        stem: updatedStem,
        subject: parsed.subject,
        system: parsed.system,
        options: parsed.options,
        explanation: updatedMainExplanation,
        perAnswerExplanations: updatedPerAnswerExplanations,
        tags: parsed.tags,
        questionId: parsed.questionId,
        topic: parsed.topic,
      };

      setProgress("Finalizing...");
      onQuestionParsed(questionData);
      setSuccess(true);
      setProgress("");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("[DocxUploader] Error:", err);
      let errorMessage = "Failed to parse DOCX file";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Format multi-line error messages for display
        if (errorMessage.includes("\n")) {
          errorMessage = errorMessage.split("\n").join(" ");
        }
      }
      
      setError(errorMessage);
      setProgress("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-lg border-2 border-dashed border-primary/30">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">Upload DOCX Question (AI Conversion)</h3>
          <p className="text-sm text-muted-foreground">
            Upload a .docx file. It will be converted to Markdown using OpenAI GPT-4o, then parsed automatically. Images will be extracted and uploaded.
          </p>
        </div>

        {/* File Input Area */}
        <div
          className="relative border-2 border-dashed border-border rounded-lg p-8 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
          />

          <div className="text-center">
            <div className="mb-3 text-4xl">📄</div>
            <p className="font-semibold text-foreground mb-1">Drop your DOCX file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2">Supported format: .docx, .doc</p>
          </div>
        </div>

        {/* Status Messages */}
        {isLoading && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 text-sm">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="font-medium">Processing...</div>
                {progress && (
                  <div className="text-xs text-blue-500/80 mt-1">{progress}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm">
            ✓ Successfully parsed DOCX! Question fields have been populated.
          </div>
        )}

        {/* Info */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            ℹ️ What gets extracted?
          </summary>
          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
            <p>• Question ID, Subject, System, Topic</p>
            <p>• Question stem</p>
            <p>• Options (A, B, C, D, E) with correct answer</p>
            <p>• Keywords section</p>
            <p>• Per-answer explanations</p>
            <p>• Main explanation with tables and images</p>
            <p>• Embedded images (automatically uploaded)</p>
          </div>
        </details>
      </div>
    </Card>
  );
}
