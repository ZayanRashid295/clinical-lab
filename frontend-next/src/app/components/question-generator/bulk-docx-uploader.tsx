"use client";

import type React from "react";
import { useState, useRef, useMemo, useEffect } from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/use-toast";
import { parseMarkdown, replaceImagePaths, replaceImagePathsInBlocks } from "./markdown-parser-utils";
import { convertDocxToMarkdown, extractDocxText } from "./docx-to-markdown-converter";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { SystemsService } from "@/app/services/systems/systems.service";
import { TopicsService } from "@/app/services/content/topics.service";
import { SubtopicsService } from "@/app/services/content/subtopics.service";
import { CategoriesService } from "@/app/services/categories/categories.service";
import { ProductsService } from "@/app/services/products/products.service";
import { runAutoMatch } from "./metadata-auto-match";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Edit,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { convertOldQuestionToNew, convertNewQuestionToOld } from "./migration-utils";
import { QuestionCreatorData } from "./question-creator/types";

interface ProcessingResult {
  fileName: string;
  status: "success" | "error" | "skipped";
  questionId?: string;
  error?: string;
  warnings?: string[];
  questionData?: any; // Parsed question data for creation
}

interface QuestionMetadata {
  productId: string;
  systemId: string;
  topicId: string;
  subtopicId?: string;
  categoryId?: string;
  categoryName?: string;
  systemName?: string;
  topicName?: string;
  subtopicName?: string;
}

interface BulkUploadSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: ProcessingResult[];
}

interface BulkDocxUploaderProps {
  onQuestionsCreated?: (questionIds: string[]) => void;
  onCancel?: () => void;
  defaultTopicId?: string;
  onQuestionEdit?: (questionId: string) => void;
}

export default function BulkDocxUploader({
  onQuestionsCreated,
  onCancel,
  defaultTopicId,
  onQuestionEdit,
}: BulkDocxUploaderProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadMode, setUploadMode] = useState<"files" | "directory">("files");
  const [summary, setSummary] = useState<BulkUploadSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [questionMetadata, setQuestionMetadata] = useState<
    Record<string, QuestionMetadata>
  >({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [addToDbContext, setAddToDbContext] = useState<{
    type: "subject" | "chapter" | "topic";
    fileName: string;
    parsedName?: string;
  } | null>(null);
  const [addToDbLoading, setAddToDbLoading] = useState(false);
  const [addToDbError, setAddToDbError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "subject" | "chapter" | "topic";
    fileName: string;
    id: string;
    name: string;
    systemId?: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alreadyExistsMessage, setAlreadyExistsMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const questionsService = new QuestionsService();

  // Services for dropdowns
  const systemsService = useMemo(() => new SystemsService(), []);
  const topicsService = useMemo(() => new TopicsService(), []);
  const categoriesService = useMemo(() => new CategoriesService(), []);
  const productsService = useMemo(() => new ProductsService(), []);

  // State for dropdowns
  const [systems, setSystems] = useState<any[]>([]);
  const [topics, setTopics] = useState<Record<string, any[]>>({});
  const [subtopics, setSubtopics] = useState<Record<string, any[]>>({});
  const [loadingSystems, setLoadingSystems] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});
  const [loadingSubtopics, setLoadingSubtopics] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const subtopicsService = useMemo(() => new SubtopicsService(), []);

  // Track which files have had auto-match run (don't overwrite user edits)
  const autoMatchDoneRef = useRef<Set<string>>(new Set());

  // Load products on mount (for Add System)
  useEffect(() => {
    setLoadingProducts(true);
    productsService
      .getProducts({ status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || [];
        setProducts(data);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [productsService]);

  // Load categories on mount
  useEffect(() => {
    setLoadingCategories(true);
    categoriesService
      .getCategories({ status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || [];
        setCategories(data);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, [categoriesService]);

  // Auto-match parsed metadata when summary and chapters/sections/categories are ready
  useEffect(() => {
    if (!summary?.results?.length || systems.length === 0 || categories.length === 0) return;
    const getTopicsForSystem = (systemId: string) =>
      topicsService
        .getTopics({ systemId, status: "ACTIVE", listAll: true })
        .then((r) => (Array.isArray(r) ? r : (r as any)?.data || []));
    let cancelled = false;
    summary.results.forEach((result) => {
      if (result.status !== "success" || !result.questionData || autoMatchDoneRef.current.has(result.fileName))
        return;
      const matchOptions = { products, categories, getTopicsForSystem, getSubtopicsForTopic: async (topicId: string) => {
        try {
          const r = await fetch(`/api/content/subtopics?topicId=${topicId}&status=ACTIVE&limit=100`);
          const json = await r.json();
          return (Array.isArray(json) ? json : json.data) || [];
        } catch(e) { return []; }
      } };
      runAutoMatch(
        {
          parsedCategory: result.questionData.subject,
          parsedSystem: result.questionData.system,
          parsedTopic: result.questionData.topic,
          parsedSubtopic: result.questionData.subtopic,
        },
        systems,
        matchOptions
      ).then((matched) => {
        if (cancelled || (!matched.systemId && !matched.topicId && !matched.categoryId)) return;
        autoMatchDoneRef.current.add(result.fileName);
        const system = systems.find((c: any) => c.id === matched.systemId);
        const systemName = system?.name ?? "";
        const category = matched.categoryId ? categories.find((t: any) => t.id === matched.categoryId) : null;
        const categoryName = category?.name ?? (matched.categoryId ? result.questionData.subject ?? "" : "");
        const fileName = result.fileName;
        setQuestionMetadata((prev) => ({
          ...prev,
          [fileName]: {
            ...(prev[fileName] ?? { productId: "", systemId: "", topicId: "", subtopicId: "", categoryId: "", categoryName: "" }),
            productId: matched.productId || prev[fileName]?.productId || "",
            systemId: matched.systemId || prev[fileName]?.systemId || "",
            topicId: matched.topicId || prev[fileName]?.topicId || "",
            subtopicId: matched.subtopicId || prev[fileName]?.subtopicId || "",
            categoryId: matched.categoryId || prev[fileName]?.categoryId || "",
            categoryName: categoryName || prev[fileName]?.categoryName || "",
            systemName: systemName || prev[fileName]?.systemName || "",
            topicName: prev[fileName]?.topicName ?? "",
            subtopicName: prev[fileName]?.subtopicName ?? "",
          },
        }));
        if (matched.topicId && matched.systemId) {
          getTopicsForSystem(matched.systemId).then((topicsList: any[]) => {
            if (cancelled) return;
            const topic = topicsList.find((t: any) => t.id === matched.topicId);
            const topicName = topic?.name ?? result.questionData.topic ?? "";
            setQuestionMetadata((prev) => ({
              ...prev,
              [fileName]: {
                ...(prev[fileName] ?? { productId: "", systemId: "", topicId: "" }),
                ...prev[fileName],
                topicName: topicName || prev[fileName]?.topicName || "",
              },
            }));
          });
        }
        if (matched.systemId) loadTopics(matched.systemId);
        setExpandedQuestions((prev) => {
          const next = new Set(prev);
          next.add(result.fileName);
          return next;
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [summary?.results, systems.length, products.length, categories.length, topicsService]);

  // Load topics when chapter changes
  // Load topics when system changes
  const loadTopics = async (systemId: string, skipStateUpdate = false) => {
    if (!systemId) return [];
    if (!skipStateUpdate && loadingTopics[systemId]) return topics[systemId] || [];
    
    if (!skipStateUpdate) {
      setLoadingTopics((prev) => ({ ...prev, [systemId]: true }));
    }
    
    try {
      const response = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true });
      const data = Array.isArray(response) ? response : (response as any)?.data || [];
      
      if (!skipStateUpdate) {
        setTopics((prev) => ({ ...prev, [systemId]: data }));
      }
      
      return data;
    } catch (error) {
      console.error("Error loading topics:", error);
      const emptyData: any[] = [];
      if (!skipStateUpdate) {
        setTopics((prev) => ({ ...prev, [systemId]: emptyData }));
      }
      return emptyData;
    } finally {
      if (!skipStateUpdate) {
        setLoadingTopics((prev) => ({ ...prev, [systemId]: false }));
      }
    }
  };

  // Load subtopics when topic is selected for any question
  const loadSubtopics = async (topicId: string, skipStateUpdate = false): Promise<any[]> => {
    if (!topicId) return [];
    
    // Return cached data if available
    if (subtopics[topicId]) {
      return subtopics[topicId];
    }
    
    if (!skipStateUpdate) {
      setLoadingSubtopics((prev) => ({ ...prev, [topicId]: true }));
    }
    
    try {
      const response = await subtopicsService.getSubtopics({ topicId, status: "ACTIVE", listAll: true });
      const data = Array.isArray(response) ? response : (response as any)?.data || [];
      
      if (!skipStateUpdate) {
        setSubtopics((prev) => ({ ...prev, [topicId]: data }));
      }
      
      return data;
    } catch {
      const emptyData: any[] = [];
      if (!skipStateUpdate) {
        setSubtopics((prev) => ({ ...prev, [topicId]: emptyData }));
      }
      return emptyData;
    } finally {
      if (!skipStateUpdate) {
        setLoadingSubtopics((prev) => ({ ...prev, [topicId]: false }));
      }
    }
  };

  const updateQuestionMetadata = (
    fileName: string,
    updates: { 
      productId?: string; 
      systemId?: string; 
      topicId?: string; 
      subtopicId?: string; 
      categoryId?: string; 
      categoryName?: string; 
      systemName?: string; 
      topicName?: string; 
      subtopicName?: string 
    },
    skipClearing = false
  ) => {
    setQuestionMetadata((prev) => {
      const current = prev[fileName] || { productId: "", systemId: "", topicId: "", subtopicId: "" };
      const updated: any = { ...current, ...updates };

      if (skipClearing) {
        if (updates.systemId && updates.systemId !== current.systemId) {
          loadTopics(updates.systemId);
        }
        if (updates.topicId && updates.topicId !== current.topicId) {
          loadSubtopics(updates.topicId);
        }
        return { ...prev, [fileName]: updated };
      }

      // Clear dependent fields
      if (updates.productId !== undefined && updates.productId !== current.productId) {
        updated.systemId = "";
        updated.topicId = "";
        updated.subtopicId = "";
        updated.systemName = undefined;
        updated.topicName = undefined;
        updated.subtopicName = undefined;
      }
      if (updates.systemId !== undefined && updates.systemId !== current.systemId) {
        updated.topicId = "";
        updated.subtopicId = "";
        updated.topicName = undefined;
        updated.subtopicName = undefined;
        if (updates.systemId) {
          loadTopics(updates.systemId);
        }
        const selectedSystem = systems.find((c: any) => c.id === updates.systemId);
        if (selectedSystem?.productId || selectedSystem?.product?.id) {
          updated.productId = selectedSystem.productId || selectedSystem.product.id;
        }
        if (updates.systemName === undefined && selectedSystem?.name) {
          updated.systemName = selectedSystem.name;
        }
      }
      if (updates.topicId !== undefined && updates.topicId !== current.topicId) {
        updated.subtopicId = "";
        updated.subtopicName = undefined;
        if (updates.topicId) {
          loadSubtopics(updates.topicId);
          const systemId = updates.systemId || current.systemId;
          const systemTopics = systemId ? (topics[systemId] || []) : [];
          const selectedTopic = systemTopics.find((t: any) => t.id === updates.topicId);
          if (updates.topicName === undefined && selectedTopic?.name) {
            updated.topicName = selectedTopic.name;
          }
        }
      }
      if (updates.subtopicId !== undefined && updates.subtopicId !== current.subtopicId) {
        const topicId = updates.topicId || current.topicId;
        if (topicId && updates.subtopicId) {
          const topicSubtopics = subtopics[topicId] || [];
          const selectedSubtopic = topicSubtopics.find((s: any) => s.id === updates.subtopicId);
          if (updates.subtopicName === undefined && selectedSubtopic?.name) {
            updated.subtopicName = selectedSubtopic.name;
          }
        }
      }

      if (updates.systemId === "") {
        updated.systemName = undefined;
        updated.topicName = undefined;
        updated.subtopicName = undefined;
      }
      if (updates.topicId === "") {
        updated.topicName = undefined;
        updated.subtopicName = undefined;
      }
      if (updates.subtopicId === "") {
        updated.subtopicName = undefined;
      }

      return { ...prev, [fileName]: updated };
    });
  };

  // Process a single DOCX file
  const processDocxFile = async (file: File): Promise<ProcessingResult> => {
    const fileName = file.name;
    const warnings: string[] = [];

    try {
      console.log(`[BulkDocxUploader] Processing DOCX file: ${fileName}`);
      
      // Step 1: Extract HTML (with image placeholders) and images from DOCX
      const { html, images } = await extractDocxText(file);
      console.log(`[BulkDocxUploader] Extracted content from ${fileName}:`, {
        htmlLength: html.length,
        imagesCount: images.length,
      });

      // Step 2: Upload images first
      const imageMapping: Record<string, string> = {};
      if (images.length > 0) {
        for (const image of images) {
          try {
            // Convert ArrayBufferLike to ArrayBuffer for Blob constructor
            // ArrayBufferLike can be ArrayBuffer or SharedArrayBuffer, but Blob needs ArrayBuffer
            let buffer: ArrayBuffer;
            if (image.buffer instanceof ArrayBuffer) {
              buffer = image.buffer;
            } else {
              // Create a new ArrayBuffer and copy the data
              buffer = new ArrayBuffer(image.buffer.byteLength);
              new Uint8Array(buffer).set(new Uint8Array(image.buffer));
            }
            const blob = new Blob([buffer], { type: image.contentType });
            const imageFile = new File([blob], image.name, { type: image.contentType });
            const result = await questionsService.uploadImage(imageFile);
            imageMapping[image.name] = result.url;
          } catch (uploadError: any) {
            warnings.push(`Failed to upload image ${image.name}: ${uploadError.message}`);
            imageMapping[image.name] = `[IMAGE_UPLOAD_FAILED:${image.name}]`;
          }
        }
      }

      // Step 3: Convert DOCX to Markdown using backend LLM service
      const { markdown } = await convertDocxToMarkdown(file);

      // Step 4: Replace image placeholders with uploaded URLs
      let processedMarkdown = markdown;
      let replacementCount = 0;
      
      console.log(`[BulkDocxUploader] Step 4: Replacing image placeholders for ${fileName}...`);
      console.log(`[BulkDocxUploader] Image mapping:`, Object.keys(imageMapping).length, "images");
      console.log(`[BulkDocxUploader] Markdown length:`, markdown.length);
      console.log(`[BulkDocxUploader] Sample markdown (first 500 chars):`, markdown.substring(0, 500));
      
      // Check if markdown contains any placeholders
      const allPlaceholders = markdown.match(/\[IMAGE_PLACEHOLDER:[^\]]+\]/g);
      console.log(`[BulkDocxUploader] Found placeholders in markdown:`, allPlaceholders);
      
      for (const [imageName, url] of Object.entries(imageMapping)) {
        const escapedName = imageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let found = false;
        
        // Format 1: ![alt]([IMAGE_PLACEHOLDER:name])
        const format1Pattern = new RegExp(`!\\[([^\\]]*)\\]\\(\\[IMAGE_PLACEHOLDER:${escapedName}\\]\\)`, "g");
        const format1Matches = processedMarkdown.match(format1Pattern);
        if (format1Matches && format1Matches.length > 0) {
          processedMarkdown = processedMarkdown.replace(format1Pattern, (match, alt) => {
            found = true;
            replacementCount++;
            return `![${alt || "Image"}](${url})`;
          });
          console.log(`[BulkDocxUploader] ✅ Replaced Format 1 for ${imageName}`);
        }
        
        // Format 2: [IMAGE_PLACEHOLDER:name] - Standalone placeholder
        const format2Pattern = new RegExp(`\\[IMAGE_PLACEHOLDER:${escapedName}\\]`, "g");
        const format2Matches = processedMarkdown.match(format2Pattern);
        if (format2Matches && format2Matches.length > 0) {
          processedMarkdown = processedMarkdown.replace(format2Pattern, () => {
            if (!found) replacementCount++;
            found = true;
            return url;
          });
          console.log(`[BulkDocxUploader] ✅ Replaced Format 2 for ${imageName}`);
        }
        
        // Format 3: [IMAGE: description] [IMAGE_PLACEHOLDER:name]
        const format3Pattern = new RegExp(`\\[IMAGE:[^\\]]+\\]\\s*\\[IMAGE_PLACEHOLDER:${escapedName}\\]`, "g");
        const format3Matches = processedMarkdown.match(format3Pattern);
        if (format3Matches && format3Matches.length > 0) {
          processedMarkdown = processedMarkdown.replace(format3Pattern, (match) => {
            const descMatch = match.match(/\[IMAGE:\s*([^\]]+)\]/);
            const description = descMatch ? descMatch[1] : "Image";
            if (!found) replacementCount++;
            found = true;
            return `![${description}](${url})`;
          });
          console.log(`[BulkDocxUploader] ✅ Replaced Format 3 for ${imageName}`);
        }
        
        // Format 4: ![alt](name) - LLM might use just the filename
        const format4Pattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedName}\\)`, "g");
        const format4Matches = processedMarkdown.match(format4Pattern);
        if (format4Matches && format4Matches.length > 0) {
          processedMarkdown = processedMarkdown.replace(format4Pattern, (match, alt) => {
            if (!found) replacementCount++;
            found = true;
            return `![${alt || "Image"}](${url})`;
          });
          console.log(`[BulkDocxUploader] ✅ Replaced Format 4 for ${imageName}`);
        }
        
        if (!found) {
          console.warn(`[BulkDocxUploader] ⚠️ No placeholder found for image: ${imageName}`);
        }
      }
      
      const finalImageUrlCount = (processedMarkdown.match(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi) || []).length;
      console.log(`[BulkDocxUploader] After replacement:`, {
        replacements: replacementCount,
        imageURLsInMarkdown: finalImageUrlCount,
        expectedImages: images.length,
      });
      
      if (images.length > 0 && replacementCount < images.length) {
        warnings.push(`Only ${replacementCount} of ${images.length} image placeholders were replaced in Markdown`);
      }

      // Step 5: Parse Markdown using existing parser
      const parsed = parseMarkdown(processedMarkdown);
      console.log(`[BulkDocxUploader] Parsed data for ${fileName}:`, {
        hasStem: !!parsed.stem,
        optionsCount: parsed.options?.length || 0,
        hasCorrectAnswer: !!parsed.correctAnswer,
      });

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

      // Convert to question data format
      const questionData = {
        stem: updatedStem,
        productId: parsed.productId,
        system: parsed.system,
        topic: parsed.topic,
        subtopic: parsed.subtopic,
        options: parsed.options,
        explanation: updatedMainExplanation,
        perAnswerExplanations: updatedPerAnswerExplanations,
        tags: parsed.tags,
        questionId: parsed.questionId,
      };

      console.log(`[BulkDocxUploader] Final questionData for ${fileName}:`, {
        system: questionData.system,
        productId: questionData.productId,
        topic: questionData.topic,
      });

      return {
        fileName,
        status: "success",
        warnings: warnings.length > 0 ? warnings : undefined,
        questionData,
      } as any;
    } catch (err: any) {
      console.error(`[BulkDocxUploader] Error processing ${fileName}:`, err);
      return {
        fileName,
        status: "error",
        error: err.message || "Failed to parse DOCX file",
      };
    }
  };

  // Handle multiple file upload
  const handleMultipleFilesUpload = async (files: FileList) => {
    console.log("[BulkDocxUploader] handleMultipleFilesUpload called with", files.length, "files");
    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);
    setSummary(null);

    const docxFiles: File[] = [];

    // Separate DOCX files
    Array.from(files).forEach((file) => {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        docxFiles.push(file);
      }
    });

    if (docxFiles.length === 0) {
      setErrors(["No DOCX (.docx or .doc) files found in selection"]);
      setIsProcessing(false);
      return;
    }

    const results: ProcessingResult[] = [];

    // Process each DOCX file
    console.log("[BulkDocxUploader] Processing", docxFiles.length, "DOCX files");
    for (const docxFile of docxFiles) {
      console.log("[BulkDocxUploader] Processing file:", docxFile.name);
      const result = await processDocxFile(docxFile);
      console.log("[BulkDocxUploader] Result for", docxFile.name, ":", result.status, result.questionData ? "has data" : "no data");
      if (result.questionData) {
        console.log("[BulkDocxUploader] Parsed values:", {
          system: result.questionData.system,
          subject: result.questionData.subject,
          topic: result.questionData.topic,
        });
      }
      results.push(result);
    }

    // Create summary
    const summary: BulkUploadSummary = {
      total: results.length,
      successful: results.filter((r) => r.status === "success" && r.questionData).length,
      failed: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    };

    setSummary(summary);
    setIsProcessing(false);
    autoMatchDoneRef.current.clear();

    // Collect warnings
    const allWarnings = results
      .filter((r) => r.warnings && r.warnings.length > 0)
      .flatMap((r) => r.warnings || []);
    if (allWarnings.length > 0) {
      setWarnings(allWarnings);
    }
  };

  // Track which files have had auto-match run (don't overwrite user edits)
  // (autoMatchDoneRef already restored above)

  // Handle directory upload (browser limitation: treats as files)
  const handleDirectoryUpload = async (files: FileList) => {
    await handleMultipleFilesUpload(files);
  };

  // Add to DB: create Subject (product tag), System (section), Chapter, or Topic and select it
  const handleAddToDbSubmit = async () => {
    if (!addToDbContext) return;
    const { type, fileName } = addToDbContext;
    const name = (addToDbContext.parsedName || "").trim();
    if (!name) {
      setAddToDbError("Name is required");
      return;
    }
    setAddToDbError(null);
    const nameLower = name.toLowerCase();

    // Pre-check: if same name already exists in DB, show "already exists" modal and select it (don't call create)
    if (type === "subject") {
      const existingCategory = categories.find((t: any) => String(t?.name ?? "").trim().toLowerCase() === nameLower);
      if (existingCategory) {
        setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], categoryId: existingCategory.id, categoryName: existingCategory.name } }));
        setAddToDbContext(null);
        setAlreadyExistsMessage("This Category already exists. We've selected it for you.");
        return;
      }
    } else if (type === "chapter") {
      const productId = questionMetadata[fileName]?.productId || products[0]?.id;
      if (productId) {
        const existingSystem = systems.find((c: any) => (c.productId === productId || c.product?.id === productId) && String(c?.name ?? "").trim().toLowerCase() === nameLower);
        if (existingSystem) {
          setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], productId, systemId: existingSystem.id, topicId: "", systemName: existingSystem.name, topicName: undefined } }));
          loadTopics(existingSystem.id);
          setAddToDbContext(null);
          setAlreadyExistsMessage("This System already exists. We've selected it for you.");
          return;
        }
      }
    } else if (type === "topic") {
      const systemId = questionMetadata[fileName]?.systemId;
      if (systemId) {
        let topicList = topics[systemId] ?? [];
        if (topicList.length === 0) {
          const list = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true });
          topicList = Array.isArray(list) ? list : (list as any)?.data ?? [];
          setTopics((prev) => ({ ...prev, [systemId]: topicList }));
        }
        const existingTopic = topicList.find((t: any) => String(t?.name ?? "").trim().toLowerCase() === nameLower);
        if (existingTopic) {
          setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], topicId: existingTopic.id, topicName: existingTopic.name } }));
          setAddToDbContext(null);
          setAlreadyExistsMessage("This Topic already exists. We've selected it for you.");
          return;
        }
      }
    }

    setAddToDbLoading(true);
    try {
      if (type === "subject") {
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const res: any = await categoriesService.createCategory({ name, slug, isActive: true });
        const id = res?.id ?? (res?.data as any)?.id;
        if (id) {
          const list: any = await categoriesService.getCategories({ status: "ACTIVE" });
          const data = Array.isArray(list) ? list : (list as any)?.data || [];
          setCategories(data);
          setQuestionMetadata((prev) => ({
            ...prev,
            [fileName]: { ...prev[fileName], categoryId: id, categoryName: name },
          }));
          setAddToDbContext(null);
        }
      } else if (type === "chapter") {
        const productId = questionMetadata[fileName]?.productId || products[0]?.id;
        if (!productId) {
          setAddToDbError("Select a product first");
          setAddToDbLoading(false);
          return;
        }
        const res: any = await systemsService.createSystem({ productId, name, isActive: true });
        const id = res?.id ?? (res?.data as any)?.id;
        if (id) {
          const list: any = await systemsService.getSystems({ status: "ACTIVE", listAll: true });
          const data = Array.isArray(list) ? list : (list as any)?.data || [];
          setSystems(data);
          setQuestionMetadata((prev) => ({
            ...prev,
            [fileName]: { ...prev[fileName], productId, systemId: id, topicId: "", systemName: name, topicName: undefined },
          }));
          loadTopics(id);
          setAddToDbContext(null);
        }
      } else if (type === "topic") {
        const systemId = questionMetadata[fileName]?.systemId;
        if (!systemId) {
          setAddToDbError("Select a system first");
          setAddToDbLoading(false);
          return;
        }
        const res: any = await topicsService.createTopic({ systemId, name, isActive: true });
        const id = res?.id ?? (res?.data as any)?.id;
        if (id) {
          const list = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true });
          const data = Array.isArray(list) ? list : (list as any)?.data || [];
          setTopics((prev) => ({ ...prev, [systemId]: data }));
          setQuestionMetadata((prev) => ({
            ...prev,
            [fileName]: { ...prev[fileName], topicId: id, topicName: name },
          }));
          setAddToDbContext(null);
        }
      }
    } catch (e: any) {
      const rawMessage = e?.message || e?.response?.data?.message || String(e?.response?.data) || "";
      const status = e?.response?.status ?? e?.status;
      const lower = String(rawMessage).toLowerCase();
      const isDuplicate =
        lower.includes("already exists") ||
        lower.includes("unique constraint") ||
        lower.includes("duplicate") ||
        lower.includes("p2002") ||
        status === 409 ||
        (status === 500 && (lower.includes("unique") || lower.includes("duplicate")));
      const label = type === "subject" ? "Category" : type === "chapter" ? "System" : "Topic";
      
      if (isDuplicate) {
        if (type === "subject") {
          const list: any = await categoriesService.getCategories({ status: "ACTIVE" });
          const data = Array.isArray(list) ? list : (list as any)?.data || [];
          setCategories(data);
          const existing = data.find((t: any) => String(t?.name).trim().toLowerCase() === name.toLowerCase());
          if (existing) {
            setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], categoryId: existing.id, categoryName: existing.name } }));
            setAddToDbContext(null);
            setAddToDbError(null);
            setAlreadyExistsMessage(`This ${label} already exists. We've selected it for you.`);
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`);
          }
        } else if (type === "chapter") {
          const list: any = await systemsService.getSystems({ status: "ACTIVE", listAll: true });
          const data = Array.isArray(list) ? list : (list as any)?.data || [];
          setSystems(data);
          const existing = data.find((c: any) => String(c?.name).trim().toLowerCase() === name.toLowerCase());
          if (existing) {
            setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], productId: existing.productId, systemId: existing.id, topicId: "", systemName: existing.name, topicName: undefined } }));
            loadTopics(existing.id);
            setAddToDbContext(null);
            setAddToDbError(null);
            setAlreadyExistsMessage(`This ${label} already exists. We've selected it for you.`);
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`);
          }
        } else if (type === "topic") {
          const systemId = questionMetadata[fileName]?.systemId;
          if (systemId) {
            const list = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true });
            const data = Array.isArray(list) ? list : (list as any)?.data || [];
            setTopics((prev) => ({ ...prev, [systemId]: data }));
            const existing = data.find((t: any) => String(t?.name).trim().toLowerCase() === name.toLowerCase());
            if (existing) {
              setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], topicId: existing.id, topicName: existing.name } }));
              setAddToDbContext(null);
              setAddToDbError(null);
              setAlreadyExistsMessage(`This ${label} already exists. We've selected it for you.`);
            } else {
              setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`);
            }
          }
        }
      } else {
        setAddToDbError(rawMessage || "Failed to create");
      }
    } finally {
      setAddToDbLoading(false);
    }
  };

  // Delete from DB: open confirmation modal, then perform delete on confirm
  const handleDeleteCategory = (fileName: string) => {
    const id = questionMetadata[fileName]?.categoryId;
    if (!id) return;
    const category = categories.find((t) => t.id === id);
    setDeleteConfirm({ type: "subject", fileName, id, name: category?.name ?? id });
  };
  const handleDeleteSystem = (fileName: string) => {
    const id = questionMetadata[fileName]?.systemId;
    if (!id) return;
    const system = systems.find((c: any) => c.id === id);
    setDeleteConfirm({ type: "chapter", fileName, id, name: system?.name ?? id });
  };
  const handleDeleteTopic = (fileName: string) => {
    const id = questionMetadata[fileName]?.topicId;
    const systemId = questionMetadata[fileName]?.systemId;
    if (!id || !systemId) return;
    const topicList = topics[systemId] || [];
    const topic = topicList.find((t) => t.id === id);
    setDeleteConfirm({ type: "topic", fileName, id, name: topic?.name ?? id, systemId });
  };

  const performDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const { type, fileName, id, systemId } = deleteConfirm;
      if (type === "subject") {
        await categoriesService.deactivateCategory(id);
        const list: any = await categoriesService.getCategories({ status: "ACTIVE" });
        const data = Array.isArray(list) ? list : (list as any)?.data || [];
        setCategories(data);
        setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], categoryId: undefined, categoryName: undefined } }));
      } else if (type === "chapter") {
        await systemsService.delete(id);
        const list: any = await systemsService.getSystems({ status: "ACTIVE", listAll: true });
        const data = Array.isArray(list) ? list : (list as any)?.data || [];
        setSystems(data);
        setTopics((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setQuestionMetadata((prev) => ({
          ...prev,
          [fileName]: { ...prev[fileName], systemId: "", topicId: "", systemName: undefined, topicName: undefined },
        }));
      } else if (type === "topic" && systemId) {
        await topicsService.delete(id);
        const list = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true });
        const data = Array.isArray(list) ? list : (list as any)?.data || [];
        setTopics((prev) => ({ ...prev, [systemId]: data }));
        setQuestionMetadata((prev) => ({ ...prev, [fileName]: { ...prev[fileName], topicId: "", topicName: undefined } }));
      }
      setDeleteConfirm(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false);
    }
  };

  // Metadata update logic is handled by updateQuestionMetadata

  // Create questions from processed files
  const handleCreateQuestions = async () => {
    if (!summary || summary.successful === 0) {
      setErrors(["No successfully parsed questions to create"]);
      return;
    }

    const successfulResults = summary.results.filter(
      (r) => r.status === "success" && r.questionData
    );

    if (successfulResults.length === 0) {
      setErrors(["No successfully parsed questions to create"]);
      return;
    }

    // Ensure all questions have topic IDs
    const missingTopics = successfulResults.filter(
      (r) => !questionMetadata[r.fileName]?.topicId || !questionMetadata[r.fileName].topicId.trim()
    );

    if (missingTopics.length > 0) {
      setErrors([
        `Select or add a Topic for each question. Missing for: ${missingTopics
          .map((r) => r.fileName)
          .join(", ")}`,
      ]);
      return;
    }

    setIsCreating(true);
    setErrors([]);

    const createdQuestionIds: string[] = [];
    const updatedResults: ProcessingResult[] = [];

    try {
      // Import QuestionChoicesService dynamically
      const { QuestionChoicesService } = await import(
        "@/app/services/questions/question-choices.service"
      );
      const choicesService = new QuestionChoicesService();

      for (const result of successfulResults) {
        try {
          const questionData = result.questionData;
          const metadata = questionMetadata[result.fileName];
          if (!metadata?.topicId || !metadata.topicId.trim()) {
            continue; // Skip if no topic ID
          }

          const questionSubtopicId = metadata.subtopicId;
          const questionTopicId = metadata.topicId;
          const questionSystemId = metadata.systemId;
          const questionCategoryId = (metadata as any).categoryId;
          const subjectToUse = metadata.categoryName ?? categories.find((t: any) => t.id === questionCategoryId)?.name ?? questionData.subject ?? "";
          const systemToUse = metadata.systemName ?? systems.find((c: any) => c.id === questionSystemId)?.name ?? questionData.system ?? "";
          const oldFormatData = {
            stem: questionData.stem, // string stem from parser
            options: questionData.options,
            subject: subjectToUse,
            system: systemToUse,
            explanation: questionData.explanation, // blocks
            perAnswerExplanations: questionData.perAnswerExplanations, // blocks
            tags: questionData.tags || [],
            topicId: questionTopicId,
            questionId: questionData.questionId,
          };

          // Convert to new/editor format (blocks etc.)
          const newFormatData = convertOldQuestionToNew(oldFormatData);
          const fullFormatData: QuestionCreatorData = {
            stem: newFormatData.stem || [],
            choices: newFormatData.choices || [],
            perAnswerExplanations: newFormatData.perAnswerExplanations || {},
            mainExplanation: newFormatData.mainExplanation || [],
            metadata: {
              ...newFormatData.metadata,
              subject: subjectToUse,
              system: systemToUse,
              subtopicId: questionSubtopicId,
              topicId: questionTopicId,
              systemId: questionSystemId,
              categoryId: questionCategoryId,
            },
          };

          const convertedBack = convertNewQuestionToOld(fullFormatData);

          let questionText = questionData.stem || "";

          if (
            !questionText &&
            Array.isArray(convertedBack.questionStemBlocks) &&
            convertedBack.questionStemBlocks.length > 0
          ) {
            const firstTextBlock = convertedBack.questionStemBlocks.find(
              (block: any) => block.type === "TEXT" || block.type === "text"
            );
            if (firstTextBlock?.data?.markdown) {
              questionText = firstTextBlock.data.markdown;
            } else if (firstTextBlock?.data?.html) {
              questionText = firstTextBlock.data.html.replace(/<[^>]*>/g, "").trim();
            }
          }

          if (!questionText.trim()) {
            questionText = "Question from DOCX";
            console.warn(
              `[BulkDocxUploader] No question text found for ${result.fileName}, using default`
            );
          }

          const questionPayload: any = {
            subtopicId: questionSubtopicId,
            topicId: questionTopicId,
            systemId: questionSystemId,
            question: questionText.trim(),
            difficulty: "medium",
            points: 1,
            isActive: true,
          };

          if (convertedBack.subject) questionPayload.subject = convertedBack.subject;
          if (convertedBack.system) questionPayload.system = convertedBack.system;

          // Tags (including questionId marker)
          const tagsArray: string[] = [];
          if (convertedBack.tags && Array.isArray(convertedBack.tags)) {
            for (const tag of convertedBack.tags) {
              if (tag && String(tag).trim() && !String(tag).startsWith("__questionId:")) {
                tagsArray.push(String(tag).trim());
              }
            }
          }

          const parsedQuestionId =
            convertedBack.metadata?.questionId || questionData.questionId;
          if (parsedQuestionId && String(parsedQuestionId).trim()) {
            tagsArray.push(`__questionId:${String(parsedQuestionId).trim()}`);
          }

          if (tagsArray.length > 0) {
            questionPayload.tags = tagsArray;
          }

          if (questionCategoryId) {
            questionPayload.categoryId = questionCategoryId;
          }

          // Question stem blocks
          if (
            Array.isArray(convertedBack.questionStemBlocks) &&
            convertedBack.questionStemBlocks.length > 0
          ) {
            questionPayload.questionStemBlocks = convertedBack.questionStemBlocks.map(
              (block: any, idx: number) => ({
                type: block.type || "TEXT",
                order: typeof block.order === "number" ? block.order : idx,
                data: block.data || {},
              })
            );
          }

          // Explanation blocks
          if (Array.isArray(convertedBack.explanation) && convertedBack.explanation.length > 0) {
            questionPayload.explanationBlocks = convertedBack.explanation.map(
              (block: any, idx: number) => ({
                type: block.type || "TEXT",
                order: typeof block.order === "number" ? block.order : idx,
                data: block.data || {},
              })
            );
          }

          // Per-answer explanations
          if (
            convertedBack.perAnswerExplanations &&
            Object.keys(convertedBack.perAnswerExplanations).length > 0
          ) {
            questionPayload.perAnswerExplanations = {};
            for (const [label, blocks] of Object.entries(
              convertedBack.perAnswerExplanations
            )) {
              if (Array.isArray(blocks) && blocks.length > 0) {
                (questionPayload.perAnswerExplanations as any)[label] = (blocks as any[]).map(
                  (block: any, idx: number) => ({
                    type: block.type || "TEXT",
                    order: typeof block.order === "number" ? block.order : idx,
                    data: block.data || {},
                  })
                );
              }
            }
          }

          // Create question
          const created = await questionsService.createQuestion(questionPayload);
          const questionId =
            typeof created === "object" && "id" in created
              ? (created as any).id
              : (created as any).id;

          if (!questionId) {
            throw new Error("Failed to get question ID after creation");
          }

          // Create choices
          const choices = convertedBack.options || [];
          for (const choice of choices) {
            try {
              await choicesService.createQuestionChoice({
                questionId,
                text: choice.text || "",
                isCorrect: choice.correct || false,
                order:
                  choice.label === "A"
                    ? 0
                    : choice.label === "B"
                    ? 1
                    : choice.label === "C"
                    ? 2
                    : choice.label === "D"
                    ? 3
                    : 4,
              });
            } catch (choiceError: any) {
              console.error(
                `[BulkDocxUploader] Failed to create choice ${choice.label}:`,
                choiceError
              );
            }
          }

          createdQuestionIds.push(questionId);
          updatedResults.push({
            ...result,
            questionId,
          });
        } catch (err: any) {
          console.error(`Failed to create question for ${result.fileName}:`, err);
          updatedResults.push({
            ...result,
            status: "error",
            error: err.message || "Failed to create question",
          });
        }
      }

      // Update summary with created question IDs
      const updatedSummary: BulkUploadSummary = {
        ...summary,
        results: summary.results.map((r) => {
          const updated = updatedResults.find((ur) => ur.fileName === r.fileName);
          return updated || r;
        }),
      };

      setSummary(updatedSummary);
    } finally {
      setIsCreating(false);
    }

    if (createdQuestionIds.length > 0 && onQuestionsCreated) {
      onQuestionsCreated(createdQuestionIds);
    }
  };

  // Toggle question expansion
  const toggleQuestion = (fileName: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold break-words">
              DOCX Upload (AI Conversion)
            </h2>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              Upload multiple DOCX files. They will be converted to Markdown, then parsed automatically. Images will be extracted and uploaded.
            </p>
          </div>
          {onCancel && (
            <div className="flex-shrink-0">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Upload Mode Selection */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant={uploadMode === "files" ? "default" : "outline"}
            onClick={() => setUploadMode("files")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
          <Button
            variant={uploadMode === "directory" ? "default" : "outline"}
            onClick={() => setUploadMode("directory")}
            disabled
            title="Directory upload not fully supported in browsers"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Upload Directory (Coming Soon)
          </Button>
        </div>

        {/* File Input */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                handleMultipleFilesUpload(e.target.files);
              }
            }}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Select DOCX Files
              </>
            )}
          </Button>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-blue-600">Converting DOCX files to Markdown, then parsing...</span>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <h3 className="font-semibold text-destructive mb-2">Errors:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="font-semibold text-yellow-600 mb-2">Warnings:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </Card>
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </Card>
              <Card className="p-4 bg-red-500/10 border-red-500/30">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </Card>
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-600">{summary.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </Card>
            </div>

            {/* Results List */}
            <div className="space-y-2">
              <h3 className="font-semibold">Processed Files:</h3>
              {summary.results.map((result) => {
                const fileMeta = questionMetadata[result.fileName];
                const topicDisplay =
                  fileMeta?.topicId
                    ? (fileMeta?.topicName ?? (topics[fileMeta?.systemId ?? ""] ?? []).find((t: any) => t.id === fileMeta?.topicId)?.name ?? "")
                    : "";
                return (
                <Card key={result.fileName} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
                    <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                      {result.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : result.status === "error" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium break-words">
                          {result.fileName}
                        </div>
                        {result.questionData && (
                          <div className="text-xs text-muted-foreground break-words mt-0.5">
                            ({result.questionData.system} - {result.questionData.subject})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result.questionData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleQuestion(result.fileName)}
                        >
                          {expandedQuestions.has(result.fileName) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {result.questionId && onQuestionEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuestionEdit(result.questionId!)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">{result.error}</div>
                  )}

                  {expandedQuestions.has(result.fileName) && result.questionData && (
                    <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                      {/* Metadata: Parsed values from document + DB dropdowns (optional link) + Add to DB */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category (formerly Subject/Product Tag) */}
                        <div>
                          <label className="text-xs font-medium mb-1 block">Category</label>
                          {result.questionData.subject && (
                            <p className="text-[11px] text-muted-foreground mb-1 break-words">
                              Parsed: {result.questionData.subject}
                            </p>
                          )}
                          <div className="mb-1">
                            <input
                              type="text"
                              className="w-full p-1.5 border rounded text-xs"
                              placeholder={result.questionData.subject ? `Parsed: ${result.questionData.subject}` : "Name (editable)"}
                              value={fileMeta?.categoryName || ""}
                              onChange={(e) => updateQuestionMetadata(result.fileName, { categoryName: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <select
                              className="flex-1 p-1.5 border rounded text-sm bg-white"
                              value={fileMeta?.categoryId || ""}
                              onChange={(e) => {
                                const categoryId = e.target.value || "";
                                const selectedCat = categoryId ? categories.find((t: any) => t.id === categoryId) : null;
                                updateQuestionMetadata(result.fileName, { 
                                  categoryId, 
                                  categoryName: selectedCat?.name ?? (categoryId ? fileMeta?.categoryName : undefined) 
                                });
                              }}
                            >
                              <option value="">Select Category</option>
                              {categories.map((t: any) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => setAddToDbContext({ type: "subject", fileName: result.fileName, parsedName: (fileMeta?.categoryName || result.questionData.subject || "New Category").trim() })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete selected category from database"
                              disabled={!fileMeta?.categoryId}
                              onClick={() => handleDeleteCategory(result.fileName)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>



                        {/* System */}
                        <div>
                          <label className="text-xs font-medium mb-1 block">System</label>
                          {result.questionData.system && (
                            <p className="text-[11px] text-muted-foreground mb-1 break-words">
                              Parsed: {result.questionData.system}
                            </p>
                          )}
                          <div className="mb-1">
                            <input
                              type="text"
                              className="w-full p-1.5 border rounded text-xs"
                              placeholder={result.questionData.system ? `Parsed: ${result.questionData.system}` : "Name (editable)"}
                              value={
                                questionMetadata[result.fileName]?.systemId
                                  ? (questionMetadata[result.fileName]?.systemName ?? systems.find((c: any) => c.id === questionMetadata[result.fileName]?.systemId)?.name ?? "")
                                  : ""
                              }
                              onChange={(e) => setQuestionMetadata((prev) => ({
                                ...prev,
                                [result.fileName]: { ...(prev[result.fileName] ?? { productId: "", systemId: "", topicId: "", subtopicId: "" }), systemName: e.target.value || undefined },
                              }))}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <select
                              className="w-full max-w-md p-2 border rounded text-sm"
                              value={questionMetadata[result.fileName]?.systemId || ""}
                              onChange={(e) => {
                                const systemId = e.target.value;
                                updateQuestionMetadata(result.fileName, { systemId });
                              }}
                            >
                              <option value="">Select System</option>
                              {systems.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => setAddToDbContext({ type: "chapter", fileName: result.fileName, parsedName: (questionMetadata[result.fileName]?.systemName || result.questionData.system || "New System").trim() })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Topic */}
                        <div>
                          <label className="text-xs font-medium mb-1 block">Topic</label>
                          {result.questionData.topic && (
                            <p className="text-[11px] text-muted-foreground mb-1 break-words">
                              Parsed: {result.questionData.topic}
                            </p>
                          )}
                          <div className="mb-1">
                            <input
                              type="text"
                              className="w-full p-1.5 border rounded text-xs"
                              placeholder={result.questionData.topic ? `Parsed: ${result.questionData.topic}` : "Name (editable)"}
                              value={
                                questionMetadata[result.fileName]?.topicId
                                  ? (questionMetadata[result.fileName]?.topicName ?? (topics[questionMetadata[result.fileName]?.systemId ?? ""] || []).find((t: any) => t.id === questionMetadata[result.fileName]?.topicId)?.name ?? "")
                                  : ""
                              }
                              onChange={(e) => setQuestionMetadata((prev) => ({
                                ...prev,
                                [result.fileName]: { ...(prev[result.fileName] ?? { productId: "", systemId: "", topicId: "", subtopicId: "" }), topicName: e.target.value || undefined },
                              }))}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <select
                              className="w-full max-w-md p-2 border rounded text-sm"
                              value={questionMetadata[result.fileName]?.topicId || ""}
                              onChange={(e) => {
                                const topicId = e.target.value;
                                updateQuestionMetadata(result.fileName, { topicId });
                              }}
                              disabled={!questionMetadata[result.fileName]?.systemId}
                            >
                              <option value="">Select Topic</option>
                              {questionMetadata[result.fileName]?.systemId &&
                                topics[questionMetadata[result.fileName].systemId]?.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              disabled={!questionMetadata[result.fileName]?.systemId}
                              title={!questionMetadata[result.fileName]?.systemId ? "Select system first" : "Add topic to database"}
                              onClick={() => setAddToDbContext({ type: "topic", fileName: result.fileName, parsedName: (questionMetadata[result.fileName]?.topicName || result.questionData.topic || "New Topic").trim() })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Subtopic */}
                        <div>
                          <label className="text-xs font-medium mb-1 block">Subtopic</label>
                          {result.questionData.subtopic && (
                            <p className="text-[11px] text-muted-foreground mb-1 break-words">
                              Parsed: {result.questionData.subtopic}
                            </p>
                          )}
                          <div className="mb-1">
                            <input
                              type="text"
                              className="w-full p-1.5 border rounded text-xs"
                              placeholder={result.questionData.subtopic ? `Parsed: ${result.questionData.subtopic}` : "Name (editable)"}
                              value={
                                questionMetadata[result.fileName]?.subtopicId
                                  ? (questionMetadata[result.fileName]?.subtopicName ?? (subtopics[questionMetadata[result.fileName]?.topicId ?? ""] || []).find((s: any) => s.id === questionMetadata[result.fileName]?.subtopicId)?.name ?? "")
                                  : ""
                              }
                              onChange={(e) => setQuestionMetadata((prev) => ({
                                ...prev,
                                [result.fileName]: { ...(prev[result.fileName] ?? { productId: "", systemId: "", topicId: "", subtopicId: "" }), subtopicName: e.target.value || undefined },
                              }))}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <select
                              className="w-full max-w-md p-2 border rounded text-sm"
                              value={questionMetadata[result.fileName]?.subtopicId || ""}
                              onChange={(e) => {
                                const subtopicId = e.target.value;
                                updateQuestionMetadata(result.fileName, { subtopicId });
                              }}
                              disabled={!questionMetadata[result.fileName]?.topicId}
                            >
                              <option value="">Select Subtopic</option>
                              {questionMetadata[result.fileName]?.topicId &&
                                subtopics[questionMetadata[result.fileName].topicId]?.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Subject from the document is saved as text. Link to taxonomy via System/Topic/Subtopic. Questions are saved under General Principles when no system is set.</p>

                      {/* Question Preview */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Question Preview:</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            <strong>Subject:</strong> {result.questionData.subject || "N/A"}
                          </p>
                          <p>
                            <strong>Topic:</strong> {result.questionData.topic || "N/A"}
                          </p>
                          <p>
                            <strong>Stem:</strong>{" "}
                            {result.questionData.stem?.substring(0, 100) || "N/A"}
                            {result.questionData.stem && result.questionData.stem.length > 100 && "..."}
                          </p>
                          <p>
                            <strong>Options:</strong> {result.questionData.options?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
              })}
            </div>

            {/* Create Button */}
            {summary.successful > 0 && (
              <Button
                onClick={handleCreateQuestions}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Questions...
                  </>
                ) : (
                  `Create ${summary.successful} Question(s)`
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add to DB modal */}
      {addToDbContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              Add {addToDbContext?.type === "subject" ? "Subject" : addToDbContext?.type === "chapter" ? "System" : "Topic"} to Database
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded text-sm"
                  value={addToDbContext?.parsedName || ""}
                  onChange={(e) => setAddToDbContext(prev => prev ? { ...prev, parsedName: e.target.value } : null)}
                  placeholder="Enter name"
                />
              </div>
              {addToDbContext?.type === "chapter" && (
                <div>
                  <label className="text-xs font-medium mb-1 block">Product</label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={questionMetadata[addToDbContext.fileName]?.productId || ""}
                    onChange={(e) => updateQuestionMetadata(addToDbContext.fileName, { productId: e.target.value }, true)}
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {addToDbContext?.type === "topic" && (
                <div>
                  <label className="text-xs font-medium mb-1 block">System</label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={questionMetadata[addToDbContext.fileName]?.systemId || ""}
                    onChange={(e) => updateQuestionMetadata(addToDbContext.fileName, { systemId: e.target.value }, true)}
                  >
                    <option value="">Select System</option>
                    {systems.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {addToDbError && <p className="text-xs text-red-600">{addToDbError}</p>}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setAddToDbContext(null); setAddToDbError(null); }} disabled={addToDbLoading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddToDbSubmit} disabled={addToDbLoading}>
                {addToDbLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from database?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && (
                <>
                  Do you want to delete &quot;{deleteConfirm.name}&quot;? This will deactivate it in the database.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performDelete();
              }}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Already exists modal */}
      <AlertDialog open={!!alreadyExistsMessage} onOpenChange={(open) => { if (!open) setAlreadyExistsMessage(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already exists</AlertDialogTitle>
            <AlertDialogDescription>
              {alreadyExistsMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlreadyExistsMessage(null)}>OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
