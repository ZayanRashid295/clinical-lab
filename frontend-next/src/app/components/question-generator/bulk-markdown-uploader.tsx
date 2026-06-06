"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { getApiErrorMessage } from "@/app/services/base/api-http-error"
import { parseMarkdown, extractImageReferences, replaceImagePathsInBlocks, replaceImagePaths } from "./markdown-parser-utils"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { SystemsService } from "@/app/services/systems/systems.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { SubtopicsService } from "@/app/services/content/subtopics.service"
import { CategoriesService } from "@/app/services/categories/categories.service"
import { ProductsService } from "@/app/services/products/products.service"
import { runAutoMatch, fuzzyMatch, normalizeName, pickByName } from "./metadata-auto-match"
import {
  buildBulkMetadataValidationReport,
  formatBulkMetadataValidationErrors,
} from "./question-metadata-validation"
import { BulkMetadataValidationPanel } from "./bulk-metadata-validation-panel"
import { CheckCircle2, XCircle, AlertCircle, Loader2, FileText, FolderOpen, Image as ImageIcon, Edit, ChevronDown, ChevronUp, Plus, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { convertOldQuestionToNew, convertNewQuestionToOld } from "./migration-utils"
import { QuestionCreatorData } from "./question-creator/types"

interface ProcessingResult {
  fileName: string
  status: "success" | "error" | "skipped"
  questionId?: string
  error?: string
  warnings?: string[]
  questionData?: any // Parsed question data for creation
}

interface BulkUploadSummary {
  total: number
  successful: number
  failed: number
  skipped: number
  results: ProcessingResult[]
}

interface QuestionMetadata {
  productId: string
  productName?: string
  systemId: string
  topicId: string
  subtopicId?: string
  categoryId?: string
  categoryName?: string
  systemName?: string
  topicName?: string
  subtopicName?: string
  title?: string
}

interface BulkUploadSummary {
  total: number
  successful: number
  failed: number
  skipped: number
  results: ProcessingResult[]
}

interface BulkMarkdownUploaderProps {
  onQuestionsCreated?: (questionIds: string[]) => void
  onCancel?: () => void
  defaultTopicId?: string // Optional default topic ID
  onQuestionEdit?: (questionId: string) => void // Callback to edit a question
}

export default function BulkMarkdownUploader({ 
  onQuestionsCreated, 
  onCancel,
  defaultTopicId,
  onQuestionEdit,
}: BulkMarkdownUploaderProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [uploadMode, setUploadMode] = useState<"files" | "directory">("files")
  const [summary, setSummary] = useState<BulkUploadSummary | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  // Store metadata for each parsed question (frontend-only mapping; backend schema unchanged)
  const [questionMetadata, setQuestionMetadata] = useState<Record<string, QuestionMetadata>>({})
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set()) // Track expanded questions
  const [addToDbContext, setAddToDbContext] = useState<{ type: "category" | "product" | "system" | "topic" | "subtopic"; fileName: string; parsedName?: string } | null>(null)
  const [addToDbLoading, setAddToDbLoading] = useState(false)
  const [addToDbError, setAddToDbError] = useState<string | null>(null)
  const [addToDbName, setAddToDbName] = useState("")
  const [addToDbProductId, setAddToDbProductId] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "product" | "system" | "topic"
    fileName: string
    id: string
    name: string
    systemId?: string
  } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [alreadyExistsMessage, setAlreadyExistsMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const questionsService = new QuestionsService()
  
  // Services for dropdowns
  const systemsService = useMemo(() => new SystemsService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])
  const categoriesService = useMemo(() => new CategoriesService(), [])
  const productsService = useMemo(() => new ProductsService(), [])
  
  // State for dropdowns (shared across all questions)
  const [systems, setSystems] = useState<any[]>([]) 
  const [topics, setTopics] = useState<Record<string, any[]>>({}) // topics by systemId
  const [subtopics, setSubtopics] = useState<Record<string, any[]>>({}) // subtopics by topicId
  const [loadingSystems, setLoadingSystems] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({})
  const [loadingSubtopics, setLoadingSubtopics] = useState<Record<string, boolean>>({})
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  const subtopicsService = useMemo(() => new SubtopicsService(), [])
  

  // Load products on mount (for Add System)
  useEffect(() => {
    setLoadingProducts(true)
    productsService
      .getProducts({ status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setProducts(data)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [productsService])

  // Load systems on mount
  useEffect(() => {
    setLoadingSystems(true)
    systemsService
      .getSystems({ status: "ACTIVE", listAll: true })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setSystems(data)
      })
      .catch(() => setSystems([]))
      .finally(() => setLoadingSystems(false))
  }, [systemsService])

  // Load categories on mount (Subjects)
  useEffect(() => {
    setLoadingCategories(true)
    categoriesService
      .getCategories({ status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setCategories(data)
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [categoriesService])
  
  // Load systems when needed for any question
  const loadSystems = async (productId?: string, skipStateUpdate = false): Promise<any[]> => {
    if (!productId) return systems
    return systems.filter((c: any) => c.productId === productId || c.product?.id === productId)
  }
  
  // Load topics when system is selected for any question
  const loadTopics = async (systemId: string, skipStateUpdate = false): Promise<any[]> => {
    if (!systemId) return []
    
    // Return cached data if available
    if (topics[systemId]) {
      return topics[systemId]
    }
    
    if (!skipStateUpdate) {
      setLoadingTopics((prev) => ({ ...prev, [systemId]: true }))
    }
    
    try {
      const response = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true })
      const data = Array.isArray(response) ? response : (response as any)?.data || []
      
      if (!skipStateUpdate) {
        setTopics((prev) => ({ ...prev, [systemId]: data }))
      }
      
      return data
    } catch {
      const emptyData: any[] = []
      if (!skipStateUpdate) {
        setTopics((prev) => ({ ...prev, [systemId]: emptyData }))
      }
      return emptyData
    } finally {
      if (!skipStateUpdate) {
        setLoadingTopics((prev => ({ ...prev, [systemId]: false })))
      }
    }
  }

  // Load subtopics when topic is selected for any question
  const loadSubtopics = async (
    topicId: string,
    skipStateUpdate = false,
    forceRefresh = false
  ): Promise<any[]> => {
    if (!topicId) return []

    if (!forceRefresh && subtopics[topicId]?.length > 0) {
      return subtopics[topicId]
    }
    
    if (!skipStateUpdate) {
      setLoadingSubtopics((prev) => ({ ...prev, [topicId]: true }))
    }
    
    try {
      const response = await subtopicsService.getSubtopics({ topicId, status: "ACTIVE", listAll: true })
      const data = Array.isArray(response) ? response : (response as any)?.data || []
      
      if (!skipStateUpdate) {
        setSubtopics((prev) => ({ ...prev, [topicId]: data }))
      }
      
      return data
    } catch {
      const emptyData: any[] = []
      if (!skipStateUpdate) {
        setSubtopics((prev) => ({ ...prev, [topicId]: emptyData }))
      }
      return emptyData
    } finally {
      if (!skipStateUpdate) {
        setLoadingSubtopics((prev => ({ ...prev, [topicId]: false })))
      }
    }
  }

  // Auto-match parsed category/system/topic to DB entities (shared logic with bulk-docx)
  const getTopicsForSystem = (systemId: string) =>
    topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true }).then((r) => (Array.isArray(r) ? r : (r as any)?.data || []))
  const autoMatchMetadata = async (
    fileName: string,
    parsedSystem?: string,
    parsedCategory?: string,
    parsedTopic?: string,
    parsedSubtopic?: string
  ) => {
    if (!parsedSystem && !parsedCategory) return
    let productsToUse = products
    if (productsToUse.length === 0) {
      try {
        const response = await productsService.getProducts({ status: "ACTIVE" })
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        if (data.length > 0) {
          setProducts(data)
          productsToUse = data
        }
      } catch (_) {}
    }
    const matched = await runAutoMatch(
      { parsedCategory, parsedProduct: summary?.results?.find((r) => r.fileName === fileName)?.questionData?.product, parsedSystem, parsedTopic, parsedSubtopic },
      systems,
      { products: products.length > 0 ? products : [], categories, getTopicsForSystem, getSubtopicsForTopic: async (topicId) => {
          try {
            const r = await fetch(`/api/content/subtopics?topicId=${topicId}&status=ACTIVE&limit=100`);
            const json = await r.json();
            return (Array.isArray(json) ? json : json.data) || [];
          } catch(e) { return []; }
        } }
    )
    if (matched.productId || matched.systemId || matched.topicId || matched.categoryId || matched.subtopicId) {
      const result = summary?.results?.find((r) => r.fileName === fileName)
      const currentMetadata = questionMetadata[fileName]
      const system = systems.find((c: any) => c.id === matched.systemId)
      const systemName = system?.name ?? ""
      const product = matched.productId ? products.find((p: any) => p.id === matched.productId) : null
      const productName = product?.name ?? (matched.productId ? result?.questionData?.product ?? "" : (currentMetadata?.productName ?? ""))
      const category = matched.categoryId ? categories.find((t: any) => t.id === matched.categoryId) : null
      const categoryName = category?.name ?? (matched.categoryId ? parsedCategory ?? "" : (currentMetadata?.categoryName ?? ""))
      updateQuestionMetadata(
        fileName,
        {
          ...(matched.productId ? { productId: matched.productId } : {}),
          ...(matched.productId ? { productName } : {}),
          systemId: matched.systemId || "",
          topicId: matched.topicId || "",
          subtopicId: matched.subtopicId || "",
          ...(matched.categoryId ? { categoryId: matched.categoryId } : {}),
          categoryName: categoryName || currentMetadata?.categoryName || "",
          systemName: systemName || currentMetadata?.systemName || "",
          topicName: currentMetadata?.topicName ?? "",
          subtopicName: currentMetadata?.subtopicName ?? "",
        },
        true
      )
      setExpandedQuestions((prev) => new Set(prev).add(fileName))
      if (matched.topicId && matched.systemId) {
        getTopicsForSystem(matched.systemId).then((topicsList: any[]) => {
          const topic = topicsList.find((t: any) => t.id === matched.topicId)
            const topicName = topic?.name ?? parsedTopic ?? ""
            updateQuestionMetadata(fileName, { topicName }, true)
            // Note: If you want to update subtopicName here, you'd fetch the subtopic similarly
          })
        }
    }
    if (matched.systemId) loadTopics(matched.systemId)
  }

  // Reconcile parsed/editable names -> IDs so dropdowns auto-populate
  useEffect(() => {
    if (!summary?.results?.length) return
    let cancelled = false

    const run = async () => {
      for (const result of summary.results) {
        if (cancelled || result.status !== "success" || !result.questionData) continue
        const fileName = result.fileName
        const current = questionMetadata[fileName] || {}
        const parsed = result.questionData

        let nextCategoryId = current.categoryId || ""
        let nextProductId = current.productId || ""
        let nextSystemId = current.systemId || ""
        let nextTopicId = current.topicId || ""
        let nextSubtopicId = current.subtopicId || ""

        if (!nextCategoryId) {
          const m = pickByName(categories, current.categoryName || parsed.category)
          if (m?.id) nextCategoryId = m.id
        }

        if (!nextProductId) {
          const m = pickByName(products, current.productName || parsed.product)
          if (m?.id) nextProductId = m.id
        }

        if (!nextSystemId) {
          const m = pickByName(
            systems,
            current.systemName || parsed.system,
            nextProductId
              ? (item: any) => item?.productId === nextProductId || item?.product?.id === nextProductId
              : undefined
          )
          if (m?.id) {
            nextSystemId = m.id
            nextProductId = nextProductId || m.productId || m.product?.id || ""
          }
        }

        if (!nextTopicId && nextSystemId) {
          let topicList = topics[nextSystemId] || []
          if (!topicList.length) topicList = await loadTopics(nextSystemId, false)
          const m = pickByName(topicList, current.topicName || parsed.topic)
          if (m?.id) nextTopicId = m.id
        }

        if (!nextSubtopicId && nextTopicId) {
          let subtopicList = subtopics[nextTopicId] || []
          if (!subtopicList.length) subtopicList = await loadSubtopics(nextTopicId, false)
          const m = pickByName(subtopicList, current.subtopicName || parsed.subtopic)
          if (m?.id) nextSubtopicId = m.id
        }

        if (
          nextCategoryId !== (current.categoryId || "") ||
          nextProductId !== (current.productId || "") ||
          nextSystemId !== (current.systemId || "") ||
          nextTopicId !== (current.topicId || "") ||
          nextSubtopicId !== (current.subtopicId || "")
        ) {
          updateQuestionMetadata(
            fileName,
            {
              categoryId: nextCategoryId,
              productId: nextProductId,
              systemId: nextSystemId,
              topicId: nextTopicId,
              subtopicId: nextSubtopicId,
            },
            true
          )
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [summary?.results, questionMetadata, categories, products, systems, topics, subtopics])

  // Ensure system is selected when parsed/edited name exists in options
  useEffect(() => {
    if (!summary?.results?.length || systems.length === 0) return
    let changed = false
    const nextUpdates: Record<string, { systemId: string; systemName?: string }> = {}

    for (const result of summary.results) {
      if (result.status !== "success" || !result.questionData) continue
      const fileName = result.fileName
      const meta = questionMetadata[fileName] || {}
      if (meta.systemId) continue

      const desiredSystemName = String(meta.systemName || result.questionData.system || "").trim()
      if (!desiredSystemName) continue

      const candidates = systems.filter((s: any) => {
        const selectedProductId = meta.productId
        const selectedCategoryId = meta.categoryId
        const systemProductId = s.productId || s.product?.id
        const systemProduct = products.find((p: any) => p.id === systemProductId)
        const systemCategoryId = systemProduct?.categoryId
        if (selectedProductId && systemProductId !== selectedProductId) return false
        if (selectedCategoryId && !selectedProductId && systemCategoryId && systemCategoryId !== selectedCategoryId) return false
        return true
      })

      const exact = candidates.find((s: any) => normalizeName(String(s?.name || "")) === normalizeName(desiredSystemName))
      if (exact?.id) {
        nextUpdates[fileName] = { systemId: exact.id, systemName: exact.name }
        changed = true
      }
    }

    if (changed) {
      setQuestionMetadata((prev) => {
        const updated = { ...prev }
        for (const [fileName, patch] of Object.entries(nextUpdates)) {
          updated[fileName] = {
            ...(updated[fileName] ?? { productId: "", systemId: "", topicId: "", subtopicId: "", categoryId: "" }),
            ...patch,
          }
        }
        return updated
      })
    }
  }, [summary?.results, systems, products, questionMetadata])

  // Helper to get filename from path
  const getFileName = (path: string): string => {
    return path.split(/[/\\]/).pop() || path
  }

  // Helper to get directory name from path
  const getDirectoryName = (path: string): string => {
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 2] || "root"
  }

  // Process a single markdown file
  const processMarkdownFile = async (
    file: File,
    imageFiles: Map<string, File>,
    imagePathMapping: Record<string, string>
  ): Promise<ProcessingResult> => {
    const fileName = file.name
    const warnings: string[] = []

    try {
      // Read markdown content
      const content = await file.text()

      // Extract image references from markdown
      const imageRefs = extractImageReferences(content)
      
      // Upload images that are referenced
      const uploadedImageMapping: Record<string, string> = {}
      
      for (const imagePath of Array.from(imageRefs)) {
        // Normalize path (handle both images/path.png and ./images/path.png)
        const normalizedPath = imagePath.startsWith("./") ? imagePath.slice(2) : imagePath
        const imageFileName = getFileName(normalizedPath)
        
        // Try to find the image file
        let imageFile: File | undefined = imageFiles.get(imageFileName)
        
        // Also try with the full path
        if (!imageFile) {
          imageFile = imageFiles.get(normalizedPath)
        }
        
        // Try with just the filename in different directories
        if (!imageFile) {
          for (const [key, value] of Array.from(imageFiles.entries())) {
            if (getFileName(key) === imageFileName || getFileName(value.name) === imageFileName) {
              imageFile = value
              break
            }
          }
        }

        if (imageFile) {
          try {
            const uploadResult = await questionsService.uploadImage(imageFile)
            uploadedImageMapping[imagePath] = uploadResult.url
            uploadedImageMapping[normalizedPath] = uploadResult.url
          } catch (uploadError: any) {
            warnings.push(`Failed to upload image ${imagePath}: ${uploadError.message}`)
          }
        } else {
          warnings.push(`Image not found: ${imagePath}`)
        }
      }

      // Parse markdown
      console.log(`[ProcessFile] Parsing markdown for ${fileName}`)
      const parsed = parseMarkdown(content)
      console.log(`[ProcessFile] Parsed result:`, {
        system: parsed.system,
        productId: parsed.productId,
        topic: parsed.topic,
        hasStem: !!parsed.stem,
        optionsCount: parsed.options?.length || 0,
      })

      // Replace image paths in stem (string)
      const updatedStem = replaceImagePaths(parsed.stem || "", uploadedImageMapping)

      // Replace image paths in explanation blocks
      const updatedMainExplanation = replaceImagePathsInBlocks(
        parsed.mainExplanation || [],
        uploadedImageMapping
      )
      
      const updatedPerAnswerExplanations: Record<string, any[]> = {}
      for (const [key, blocks] of Object.entries(parsed.perAnswerExplanations || {})) {
        updatedPerAnswerExplanations[key] = replaceImagePathsInBlocks(blocks, uploadedImageMapping)
      }

      // Convert to question data format
      const questionData = {
        stem: updatedStem,
        productId: parsed.productId,
        product: parsed.product,
        category: parsed.category,
        title: parsed.title,
        system: parsed.system,
        topic: parsed.topic,
        subtopic: parsed.subtopic,
        options: parsed.options,
        explanation: updatedMainExplanation,
        perAnswerExplanations: updatedPerAnswerExplanations,
        tags: parsed.tags,
        questionId: parsed.questionId,
      }
      
      console.log(`[ProcessFile] Final questionData for ${fileName}:`, {
        system: questionData.system,
        productId: questionData.productId,
        topic: questionData.topic,
      })

      // Auto-match will be called after all files are processed

      // Note: We don't create the question here - we return the data
      // The parent component will handle creation with proper topicId
      return {
        fileName,
        status: "success",
        warnings: warnings.length > 0 ? warnings : undefined,
        questionData, // Include parsed data for later creation
      } as any
    } catch (err: any) {
      return {
        fileName,
        status: "error",
        error: err.message || "Failed to parse markdown file",
      }
    }
  }

  // Handle multiple file upload
  const handleMultipleFilesUpload = async (files: FileList) => {
    console.log("[BulkUpload] handleMultipleFilesUpload called with", files.length, "files")
    setIsProcessing(true)
    setErrors([])
    setWarnings([])
    setSummary(null)

    const mdFiles: File[] = []
    const imageFiles = new Map<string, File>()

    // Separate MD files from image files
    Array.from(files).forEach((file) => {
      const fileName = file.name.toLowerCase()
      if (fileName.endsWith(".md")) {
        mdFiles.push(file)
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
        imageFiles.set(file.name, file)
        // Also index by filename without path for easier lookup
        imageFiles.set(getFileName(file.name), file)
      }
    })

    if (mdFiles.length === 0) {
      setErrors(["No markdown (.md) files found in selection"])
      setIsProcessing(false)
      return
    }

    const results: ProcessingResult[] = []
    const imagePathMapping: Record<string, string> = {}

    // Process each MD file
    console.log("[BulkUpload] Processing", mdFiles.length, "MD files")
    for (const mdFile of mdFiles) {
      console.log("[BulkUpload] Processing file:", mdFile.name)
      const result = await processMarkdownFile(mdFile, imageFiles, imagePathMapping)
      console.log("[BulkUpload] Result for", mdFile.name, ":", result.status, result.questionData ? "has data" : "no data")
      if (result.questionData) {
        console.log("[BulkUpload] Parsed values:", {
          system: result.questionData.system,
          category: result.questionData.category,
          topic: result.questionData.topic,
        })
      }
      results.push(result)
    }

    // Create summary
    const summary: BulkUploadSummary = {
      total: results.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    }

    setSummary(summary)
    setIsProcessing(false)

    // Collect all warnings
    const allWarnings = results.flatMap((r) => r.warnings || [])
    if (allWarnings.length > 0) {
      setWarnings(allWarnings)
    }

    // Ensure products are loaded before auto-matching
    let productsLoaded = products.length > 0
    if (!productsLoaded) {
      // Wait for products to load (with timeout)
      let attempts = 0
      while (!productsLoaded && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        productsLoaded = products.length > 0
        attempts++
      }
      
      // If still not loaded, fetch products directly
      if (!productsLoaded) {
        try {
          const response = await productsService.getProducts({ status: "ACTIVE" })
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setProducts(data)
          productsLoaded = data.length > 0
        } catch (error) {
          console.error("Failed to load products for auto-matching:", error)
        }
      }
    }

    // Auto-match metadata for all successfully parsed questions
    console.log("[BulkUpload] Starting auto-matching for", results.length, "results")
    console.log("[BulkUpload] Products available:", products.length)
    
    for (const result of results) {
      if (result.status === "success" && result.questionData) {
        console.log(`[BulkUpload] Processing ${result.fileName}:`, {
          system: result.questionData.system,
          category: result.questionData.category,
          topic: result.questionData.topic,
        })
        await autoMatchMetadata(
          result.fileName,
          result.questionData.system,
          result.questionData.category,
          result.questionData.topic
        )
      } else {
        console.log(`[BulkUpload] Skipping ${result.fileName}: status=${result.status}`)
      }
    }
    
    console.log("[BulkUpload] Auto-matching completed")
  }

  // Handle directory upload
  const handleDirectoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setErrors([])
    setWarnings([])
    setSummary(null)

    const mdFiles: File[] = []
    const imageFiles = new Map<string, File>()

    // Process all files from directory
    Array.from(files).forEach((file) => {
      const fileName = file.name.toLowerCase()
      const relativePath = (file as any).webkitRelativePath || file.name
      
      if (fileName.endsWith(".md")) {
        mdFiles.push(file)
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
        // Store with relative path for better matching
        imageFiles.set(relativePath, file)
        imageFiles.set(getFileName(relativePath), file)
        imageFiles.set(file.name, file)
      }
    })

    if (mdFiles.length === 0) {
      setErrors(["No markdown (.md) files found in the directory"])
      setIsProcessing(false)
      return
    }

    const results: ProcessingResult[] = []
    const imagePathMapping: Record<string, string> = {}

    // Process each MD file
    console.log("[BulkUpload] Processing", mdFiles.length, "MD files")
    for (const mdFile of mdFiles) {
      console.log("[BulkUpload] Processing file:", mdFile.name)
      const result = await processMarkdownFile(mdFile, imageFiles, imagePathMapping)
      console.log("[BulkUpload] Result for", mdFile.name, ":", result.status, result.questionData ? "has data" : "no data")
      if (result.questionData) {
        console.log("[BulkUpload] Parsed values:", {
          system: result.questionData.system,
          category: result.questionData.category,
          topic: result.questionData.topic,
        })
      }
      results.push(result)
    }

    // Create summary
    const summary: BulkUploadSummary = {
      total: results.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    }

    setSummary(summary)
    setIsProcessing(false)

    // Collect all warnings
    const allWarnings = results.flatMap((r) => r.warnings || [])
    if (allWarnings.length > 0) {
      setWarnings(allWarnings)
    }

    // Ensure products are loaded before auto-matching
    let productsLoaded = products.length > 0
    if (!productsLoaded) {
      // Wait for products to load (with timeout)
      let attempts = 0
      while (!productsLoaded && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        productsLoaded = products.length > 0
        attempts++
      }
      
      // If still not loaded, fetch products directly
      if (!productsLoaded) {
        try {
          const response = await productsService.getProducts({ status: "ACTIVE" })
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setProducts(data)
          productsLoaded = data.length > 0
        } catch (error) {
          console.error("Failed to load products for auto-matching:", error)
        }
      }
    }

    // Auto-match metadata for all successfully parsed questions
    console.log("[BulkUpload] Starting auto-matching for", results.length, "results")
    console.log("[BulkUpload] Products available:", products.length)
    
    for (const result of results) {
      if (result.status === "success" && result.questionData) {
        console.log(`[BulkUpload] Processing ${result.fileName}:`, {
          system: result.questionData.system,
          category: result.questionData.category,
          topic: result.questionData.topic,
        })
        await autoMatchMetadata(
          result.fileName,
          result.questionData.system,
          result.questionData.category,
          result.questionData.topic
        )
      } else {
        console.log(`[BulkUpload] Skipping ${result.fileName}: status=${result.status}`)
      }
    }
    
    console.log("[BulkUpload] Auto-matching completed")
  }

  // Handle file selection (multiple files)
  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    await handleMultipleFilesUpload(files)
  }

  // Toggle question expansion
  const toggleQuestionExpansion = (fileName: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName)
    } else {
      newExpanded.add(fileName)
    }
    setExpandedQuestions(newExpanded)
  }

  // Update metadata for a specific question
  const updateQuestionMetadata = (
    fileName: string,
    updates: { productId?: string; productName?: string; systemId?: string; topicId?: string; subtopicId?: string; categoryId?: string; categoryName?: string; systemName?: string; topicName?: string; subtopicName?: string; title?: string },
    skipClearing = false // If true, don't clear dependent fields (used for auto-matching)
  ) => {
    setQuestionMetadata((prev) => {
      const current = prev[fileName] || { productId: "", systemId: "", topicId: "", subtopicId: "", categoryId: "" }
      const updated: any = { ...current, ...updates }
      
      // If skipClearing is true (auto-matching), just apply all updates and load data
      if (skipClearing) {
        // Load chapters if product is set
        if (updates.productId && updates.productId !== current.productId) {
          loadSystems(updates.productId)
        }
        // Load topics if system is set
        if (updates.systemId && updates.systemId !== current.systemId) {
          loadTopics(updates.systemId)
        }
        // Load subtopics if topic is set
        if (updates.topicId && updates.topicId !== current.topicId) {
          loadSubtopics(updates.topicId)
        }
        return { ...prev, [fileName]: updated }
      }
      
      // Normal behavior: clear dependent fields when parent changes
      // If product changed, clear system and topic
      if (updates.productId !== undefined && updates.productId !== current.productId) {
        updated.systemId = ""
        updated.topicId = ""
        updated.subtopicId = ""
        updated.systemName = undefined
        updated.topicName = undefined
        updated.subtopicName = undefined
        // Load chapters for new product
        if (updates.productId) {
          loadSystems(updates.productId)
        }
      }
      
      // If System changed, clear Topic and Subtopic
      if (updates.systemId !== undefined && updates.systemId !== current.systemId) {
        updated.topicId = ""
        updated.subtopicId = ""
        updated.topicName = undefined
        updated.subtopicName = undefined
        // Load topics for new system
        if (updates.systemId) {
          loadTopics(updates.systemId)
        }
        // Auto-map product from system (frontend-only) and set chapterName for text box (using chapterName as System label for now)
        const selectedSystem = systems.find((c: any) => c.id === updates.systemId)
        const derivedProductId = selectedSystem?.productId || selectedSystem?.product?.id
        if (derivedProductId) {
          updated.productId = derivedProductId
        }
        if (updates.systemName === undefined && selectedSystem?.name) {
          updated.systemName = selectedSystem.name
        }
      }

      // If Topic changed, clear Subtopic
      if (updates.topicId !== undefined && updates.topicId !== current.topicId) {
        updated.subtopicId = ""
        updated.subtopicName = undefined
        // We might need to load subtopics here if we had a loadSubtopics function
        // For now, subtopics are likely handled similarly to topics
        const systemId = updates.systemId || current.systemId
        if (systemId && updates.topicId) {
           // If we have a local cache of topics for this system, we can find the name
           const systemTopics = topics[systemId] || []
           const selectedTopic = systemTopics.find((t: any) => t.id === updates.topicId)
           if (updates.topicName === undefined && selectedTopic?.name) {
             updated.topicName = selectedTopic.name
           }
           // Load subtopics for new topic
           loadSubtopics(updates.topicId)
        }
      }

      // If Subtopic changed, set subtopicName from selection
      if (updates.subtopicId !== undefined && updates.subtopicId !== current.subtopicId) {
        const topicId = updates.topicId || current.topicId
        if (topicId && updates.subtopicId) {
          const topicSubtopics = subtopics[topicId] || []
          const selectedSubtopic = topicSubtopics.find((s: any) => s.id === updates.subtopicId)
          if (updates.subtopicName === undefined && selectedSubtopic?.name) {
            updated.subtopicName = selectedSubtopic.name
          }
        }
      }

      if (updates.systemId === "") {
        updated.systemName = undefined
        updated.topicName = undefined
        updated.subtopicName = undefined
      }
      if (updates.topicId === "") {
        updated.topicName = undefined
        updated.subtopicName = undefined
      }
      if (updates.subtopicId === "") {
        updated.subtopicName = undefined
      }
      
      return { ...prev, [fileName]: updated }
    })
  }

  const handleAddToDbSubmit = async () => {
    if (!addToDbContext) return
    const name = (addToDbName || addToDbContext.parsedName || "").trim()
    if (!name) {
      setAddToDbError("Name is required")
      return
    }
    setAddToDbError(null)
    const { type, fileName } = addToDbContext
    const nameLower = name.toLowerCase()

    // Pre-check: if same name already exists in DB, show "already exists" modal and select it (don't call create)
    if (type === "category") {
      const existingCategory = categories.find((t: any) => String(t?.name ?? "").trim().toLowerCase() === nameLower)
      if (existingCategory) {
        updateQuestionMetadata(fileName, { categoryId: existingCategory.id, categoryName: existingCategory.name })
        setAddToDbContext(null)
        setAlreadyExistsMessage("This Category already exists. We've selected it for you.")
        return
      }
    } else if (type === "product") {
      const existingProduct = products.find((p: any) => String(p?.name ?? "").trim().toLowerCase() === nameLower)
      if (existingProduct) {
        updateQuestionMetadata(fileName, { productId: existingProduct.id, productName: existingProduct.name })
        setAddToDbContext(null)
        setAlreadyExistsMessage("This Product already exists. We've selected it for you.")
        return
      }
    } else if (type === "system") {
      const productId = addToDbProductId || products[0]?.id
      if (productId) {
        const existingSystem = systems.find((c: any) => (c.productId === productId || c.product?.id === productId) && String(c?.name ?? "").trim().toLowerCase() === nameLower)
        if (existingSystem) {
          updateQuestionMetadata(fileName, { systemId: existingSystem.id, topicId: "", systemName: existingSystem.name, topicName: undefined })
          loadTopics(existingSystem.id)
          setAddToDbContext(null)
          setAlreadyExistsMessage("This System already exists. We've selected it for you.")
          return
        }
      }
    } else if (type === "topic") {
      const systemId = questionMetadata[fileName]?.systemId
      if (systemId) {
        let topicList = topics[systemId] ?? []
        if (topicList.length === 0) {
          const list = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true })
          topicList = Array.isArray(list) ? list : (list as any)?.data ?? []
          setTopics((prev) => ({ ...prev, [systemId]: topicList }))
        }
        const existingTopic = topicList.find((t: any) => String(t?.name ?? "").trim().toLowerCase() === nameLower)
        if (existingTopic) {
          updateQuestionMetadata(fileName, { topicId: existingTopic.id, topicName: existingTopic.name })
          setAddToDbContext(null)
          setAlreadyExistsMessage("This Topic already exists. We've selected it for you.")
          return
        }
      }
    } else if (type === "subtopic") {
      const topicId = questionMetadata[fileName]?.topicId
      if (topicId) {
        let subtopicList = subtopics[topicId] ?? []
        if (subtopicList.length === 0) {
          subtopicList = await loadSubtopics(topicId, true, true)
          setSubtopics((prev) => ({ ...prev, [topicId]: subtopicList }))
        }
        const existingSubtopic = subtopicList.find((s: any) => String(s?.name ?? "").trim().toLowerCase() === nameLower)
        if (existingSubtopic) {
          updateQuestionMetadata(fileName, { subtopicId: existingSubtopic.id, subtopicName: existingSubtopic.name })
          setAddToDbContext(null)
          setAlreadyExistsMessage("This Subtopic already exists. We've selected it for you.")
          return
        }
      }
    }

    setAddToDbLoading(true)
    try {
      if (type === "category") {
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        const res: any = await categoriesService.createCategory({ name, slug, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const categoriesList: any = await categoriesService.getCategories({ status: "ACTIVE" })
          const data = Array.isArray(categoriesList) ? categoriesList : (categoriesList as any)?.data || []
          setCategories(data)
          updateQuestionMetadata(fileName, { categoryId: id, categoryName: name })
          setAddToDbContext(null)
        }
      } else if (type === "product") {
        const categoryId = questionMetadata[fileName]?.categoryId || undefined
        const res: any = await productsService.createProduct({ name, isActive: true, categoryId })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list: any = await productsService.getProducts({ status: "ACTIVE" })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setProducts(data)
          updateQuestionMetadata(fileName, { productId: id, productName: name })
          setAddToDbContext(null)
        }
      } else if (type === "system") {
        const productId = addToDbProductId || products[0]?.id
        if (!productId) {
          setAddToDbError("Select a product first")
          setAddToDbLoading(false)
          return
        }
        const res: any = await systemsService.createSystem({ productId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list: any = await systemsService.getSystems({ status: "ACTIVE", listAll: true })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setSystems(data)
          updateQuestionMetadata(fileName, { systemId: id, topicId: "", systemName: name, topicName: undefined })
          loadTopics(id)
          setAddToDbContext(null)
        }
      } else if (type === "topic") {
        const systemId = questionMetadata[fileName]?.systemId
        if (!systemId) {
          setAddToDbError("Select a system first")
          setAddToDbLoading(false)
          return
        }
        const res: any = await topicsService.createTopic({ systemId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          await loadTopics(systemId)
          updateQuestionMetadata(fileName, { topicId: id, topicName: name })
          setAddToDbContext(null)
        }
      } else if (type === "subtopic") {
        const topicId = questionMetadata[fileName]?.topicId
        if (!topicId) {
          setAddToDbError("Select a topic first")
          setAddToDbLoading(false)
          return
        }
        const res: any = await subtopicsService.createSubtopic({ topicId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          let list = await loadSubtopics(topicId, true, true)
          if (!list.some((s: any) => s.id === id)) {
            list = [...list, { id, name, topicId }]
          }
          setSubtopics((prev) => ({ ...prev, [topicId]: list }))
          updateQuestionMetadata(fileName, { subtopicId: id, subtopicName: name })
          setAddToDbContext(null)
        } else {
          setAddToDbError("Subtopic was created but no ID was returned. Please refresh and try again.")
        }
      }
    } catch (e: any) {
      const rawMessage = e?.message || e?.response?.data?.message || String(e?.response?.data) || ""
      const status = e?.response?.status ?? e?.status
      const lower = String(rawMessage).toLowerCase()
      const isDuplicate =
        lower.includes("already exists") ||
        lower.includes("unique constraint") ||
        lower.includes("duplicate") ||
        lower.includes("p2002") ||
        status === 409 ||
        (status === 500 && (lower.includes("unique") || lower.includes("duplicate")))
      const label =
        addToDbContext?.type === "category"
          ? "Category"
          : addToDbContext?.type === "product"
          ? "Product"
          : addToDbContext?.type === "system"
          ? "System"
          : addToDbContext?.type === "topic"
          ? "Topic"
          : "Subtopic"
      if (isDuplicate) {
        const nameVal = (addToDbName || addToDbContext?.parsedName || "").trim()
        const { type, fileName } = addToDbContext
        if (type === "category") {
          const list: any = await categoriesService.getCategories({ status: "ACTIVE" })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setCategories(data)
          const existing = data.find((t: any) => String(t?.name).trim().toLowerCase() === nameVal.toLowerCase())
          if (existing) {
            updateQuestionMetadata(fileName, { categoryId: existing.id, categoryName: existing.name })
            setAddToDbContext(null)
            setAddToDbError(null)
            setAlreadyExistsMessage("This Category already exists. We've selected it for you.")
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
          }
        } else if (type === "product") {
          const list: any = await productsService.getProducts({ status: "ACTIVE" })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setProducts(data)
          const existing = data.find((p: any) => String(p?.name).trim().toLowerCase() === nameVal.toLowerCase())
          if (existing) {
            updateQuestionMetadata(fileName, { productId: existing.id, productName: existing.name })
            setAddToDbContext(null)
            setAddToDbError(null)
            setAlreadyExistsMessage("This Product already exists. We've selected it for you.")
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
          }
        } else if (type === "system") {
          const list: any = await systemsService.getSystems({ status: "ACTIVE", listAll: true })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setSystems(data)
          const existing = data.find((c: any) => String(c?.name).trim().toLowerCase() === nameVal.toLowerCase())
          if (existing) {
            updateQuestionMetadata(fileName, { systemId: existing.id, topicId: "", systemName: existing.name, topicName: undefined })
            loadTopics(existing.id)
            setAddToDbContext(null)
            setAddToDbError(null)
            setAlreadyExistsMessage("This System already exists. We've selected it for you.")
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
          }
        } else if (type === "topic") {
          const systemId = questionMetadata[fileName]?.systemId
          if (systemId) {
            const list = await topicsService.getTopics({ systemId, status: "ACTIVE", listAll: true })
            const data = Array.isArray(list) ? list : (list as any)?.data || []
            setTopics((prev) => ({ ...prev, [systemId]: data }))
            const existing = data.find((t: any) => String(t?.name).trim().toLowerCase() === nameVal.toLowerCase())
            if (existing) {
              updateQuestionMetadata(fileName, { topicId: existing.id, topicName: existing.name })
              setAddToDbContext(null)
              setAddToDbError(null)
              setAlreadyExistsMessage("This Topic already exists. We've selected it for you.")
            } else {
              setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
            }
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
          }
        } else if (type === "subtopic") {
          const topicId = questionMetadata[fileName]?.topicId
          if (topicId) {
            const list = await loadSubtopics(topicId, true, true)
            setSubtopics((prev) => ({ ...prev, [topicId]: list }))
            const existing = list.find((s: any) => String(s?.name).trim().toLowerCase() === nameVal.toLowerCase())
            if (existing) {
              updateQuestionMetadata(fileName, { subtopicId: existing.id, subtopicName: existing.name })
              setAddToDbContext(null)
              setAddToDbError(null)
              setAlreadyExistsMessage("This Subtopic already exists. We've selected it for you.")
            } else {
              setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
            }
          } else {
            setAddToDbError(`${label} with this name already exists. Please select it from the dropdown.`)
          }
        }
      } else {
        setAddToDbError(rawMessage || "Failed to create")
      }
    } finally {
      setAddToDbLoading(false)
    }
  }

  // Delete from DB: open confirmation modal, then perform delete on confirm
  const handleDeleteCategory = (fileName: string) => {
    const id = (questionMetadata[fileName] as any)?.categoryId
    if (!id) return
    const cat = categories.find((t) => t.id === id)
    setDeleteConfirm({ type: "category", fileName, id, name: cat?.name ?? id })
  }
  const handleDeleteProduct = (fileName: string) => {
    const id = questionMetadata[fileName]?.productId
    if (!id) return
    const product = products.find((p: any) => p.id === id)
    setDeleteConfirm({ type: "product", fileName, id, name: product?.name ?? id })
  }
  const handleDeleteSystem = (fileName: string) => {
    const id = questionMetadata[fileName]?.systemId
    if (!id) return
    const system = systems.find((c: any) => c.id === id)
    setDeleteConfirm({ type: "system", fileName, id, name: system?.name ?? id })
  }
  const handleDeleteTopic = (fileName: string) => {
    const metadata = questionMetadata[fileName]
    const id = metadata?.topicId
    const systemId = metadata?.systemId
    if (!id || !systemId) return
    const topicList = topics[systemId] || []
    const topic = topicList.find((t) => t.id === id)
    setDeleteConfirm({ type: "topic", fileName, id, name: topic?.name ?? id, systemId })
  }
  const performDelete = async () => {
    if (!deleteConfirm) return
    setDeleteLoading(true)
    try {
      const { type, fileName, id, systemId } = deleteConfirm
      if (type === "category") {
        await categoriesService.delete(id)
        const list: any = await categoriesService.getCategories({ status: "ACTIVE" })
        const data = Array.isArray(list) ? list : (list as any)?.data || []
        setCategories(data)
        updateQuestionMetadata(fileName, { categoryId: "", categoryName: "" })
      } else if (type === "product") {
        await productsService.delete(id)
        const list: any = await productsService.getProducts({ status: "ACTIVE" })
        const data = Array.isArray(list) ? list : (list as any)?.data || []
        setProducts(data)
        updateQuestionMetadata(fileName, { productId: "", productName: "" })
      } else if (type === "system") {
        await systemsService.delete(id)
        const list: any = await systemsService.getSystems({ status: "ACTIVE", listAll: true })
        const data = Array.isArray(list) ? list : (list as any)?.data || []
        setSystems(data)
        updateQuestionMetadata(fileName, { systemId: "", topicId: "", systemName: "", topicName: undefined })
      } else if (type === "topic") {
        await topicsService.delete(id)
        if (systemId) {
          await loadTopics(systemId)
        }
        updateQuestionMetadata(fileName, { topicId: "", topicName: "" })
      }
      setDeleteConfirm(null)
    } catch (e: any) {
      toast({
        title: "Error",
        description: getApiErrorMessage(e, "Failed to delete"),
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    if (addToDbContext) {
      setAddToDbName(addToDbContext.parsedName || "")
      setAddToDbProductId(products[0]?.id || "")
      setAddToDbError(null)
    }
  }, [addToDbContext, products])

  const metadataValidation = useMemo(
    () =>
      summary?.results
        ? buildBulkMetadataValidationReport(summary.results, questionMetadata)
        : { isComplete: true, issues: [] },
    [summary?.results, questionMetadata]
  )

  const metadataIssuesByFile = useMemo(() => {
    const map = new Map<
      string,
      (typeof metadataValidation.issues)[number]
    >()
    metadataValidation.issues.forEach((issue) => map.set(issue.fileName, issue))
    return map
  }, [metadataValidation.issues])

  // Create questions from parsed data
  const createQuestions = async () => {
    if (!summary) return

    const successfulResults = summary.results.filter((r) => r.status === "success" && r.questionData)
    
    if (successfulResults.length === 0) {
      setErrors(["No successfully parsed questions to create"])
      return
    }

    const validation = buildBulkMetadataValidationReport(
      successfulResults,
      questionMetadata
    )

    if (!validation.isComplete) {
      setErrors(formatBulkMetadataValidationErrors(validation))
      return
    }

    setIsCreating(true)
    setErrors([])

    const createdQuestionIds: string[] = []
    const updatedResults: ProcessingResult[] = []

    try {
      // Import QuestionChoicesService dynamically
      const { QuestionChoicesService } = await import("@/app/services/questions/question-choices.service")
      const choicesService = new QuestionChoicesService()

      for (const result of successfulResults) {
        try {
          const metadata = questionMetadata[result.fileName]
          if (!metadata?.topicId || !metadata.topicId.trim()) {
            continue // Skip if no topic ID
          }
          
          const questionSubtopicId = metadata.subtopicId
          const questionTopicId = metadata.topicId
          const questionSystemId = metadata.systemId
          const questionCategoryId = (metadata as any).categoryId

          // Convert parsed question to the format needed for creation
          // Use edited names (categoryName, systemName) so edits apply everywhere
          const systemToUse = metadata.systemName ?? systems.find((c: any) => c.id === questionSystemId)?.name ?? result.questionData.system ?? ""
          const oldFormatData = {
            stem: result.questionData.stem, // This is a string from parser
            options: result.questionData.options,
            system: systemToUse,
            explanation: result.questionData.explanation, // This is already blocks
            perAnswerExplanations: result.questionData.perAnswerExplanations, // This is already blocks
            tags: result.questionData.tags || [],
            subtopicId: questionSubtopicId,
            topicId: questionTopicId,
            systemId: questionSystemId,
            questionId: result.questionData.questionId, // Pass through parsed questionId if it exists
          }

          // Convert to new format - this will convert string stem to blocks
          const newFormatData = convertOldQuestionToNew(oldFormatData)
          // Ensure we have required fields
          const fullFormatData: QuestionCreatorData = {
            stem: newFormatData.stem || [],
            choices: newFormatData.choices || [],
            perAnswerExplanations: newFormatData.perAnswerExplanations || {},
            mainExplanation: newFormatData.mainExplanation || [],
            metadata: {
              ...newFormatData.metadata,
              system: systemToUse,
              subtopicId: questionSubtopicId,
              topicId: questionTopicId,
              systemId: questionSystemId,
              categoryId: questionCategoryId,
            },
          }
          const convertedBack = convertNewQuestionToOld(fullFormatData)

          // Extract question text from the original parsed stem (it's a string from the parser)
          // Or extract from blocks if stem was converted to blocks
          let questionText = result.questionData.stem || ""
          
          // If stem is empty but we have questionStemBlocks, extract text from first text block
          if (!questionText && Array.isArray(convertedBack.questionStemBlocks) && convertedBack.questionStemBlocks.length > 0) {
            const firstTextBlock = convertedBack.questionStemBlocks.find((block: any) => 
              block.type === "TEXT" || block.type === "text"
            )
            if (firstTextBlock?.data?.markdown) {
              questionText = firstTextBlock.data.markdown
            } else if (firstTextBlock?.data?.html) {
              // Strip HTML tags if only HTML is available
              questionText = firstTextBlock.data.html.replace(/<[^>]*>/g, "").trim()
            }
          }
          
          // Fallback: if still empty, use a default
          if (!questionText.trim()) {
            questionText = "Question from markdown"
            console.warn(`[CreateQuestion] No question text found for ${result.fileName}, using default`)
          }

          const questionPayload: any = {
            subtopicId: questionSubtopicId,
            topicId: questionTopicId,
            question: questionText.trim(),
            difficulty: "medium",
            points: 1,
            isActive: true,
          }

          if (convertedBack.system) questionPayload.system = convertedBack.system
          
          // Handle tags - store questionId in tags if it exists
          const tagsArray: string[] = []
          if (convertedBack.tags && Array.isArray(convertedBack.tags)) {
            // Filter out any existing questionId markers and add regular tags
            for (const tag of convertedBack.tags) {
              if (tag && String(tag).trim() && !String(tag).startsWith("__questionId:")) {
                tagsArray.push(String(tag).trim())
              }
            }
          }
          
          // Store questionId in tags if it exists in metadata (from parsed markdown)
          const parsedQuestionId = convertedBack.metadata?.questionId || result.questionData.questionId
          if (parsedQuestionId && String(parsedQuestionId).trim()) {
            tagsArray.push(`__questionId:${String(parsedQuestionId).trim()}`)
          }
          
          if (tagsArray.length > 0) {
            questionPayload.tags = tagsArray
          }

          // Add question stem blocks if available
          if (Array.isArray(convertedBack.questionStemBlocks) && convertedBack.questionStemBlocks.length > 0) {
            questionPayload.questionStemBlocks = convertedBack.questionStemBlocks.map((block: any, idx: number) => ({
              type: block.type || "TEXT",
              order: typeof block.order === "number" ? block.order : idx,
              data: block.data || {},
            }))
          }

          // Add explanation blocks if available
          if (Array.isArray(convertedBack.explanation) && convertedBack.explanation.length > 0) {
            questionPayload.explanationBlocks = convertedBack.explanation.map((block: any, idx: number) => {
              return {
              type: block.type || "TEXT",
              order: typeof block.order === "number" ? block.order : idx,
              data: block.data || {},
              }
            })
          }

          // Add per-answer explanations if available
          if (convertedBack.perAnswerExplanations && Object.keys(convertedBack.perAnswerExplanations).length > 0) {
            questionPayload.perAnswerExplanations = {}
            for (const [label, blocks] of Object.entries(convertedBack.perAnswerExplanations)) {
              if (Array.isArray(blocks) && blocks.length > 0) {
                questionPayload.perAnswerExplanations[label] = blocks.map((block: any, idx: number) => ({
                  type: block.type || "TEXT",
                  order: typeof block.order === "number" ? block.order : idx,
                  data: block.data || {},
                }))
              }
            }
          }

          // Create the question
          const createdQuestion = await questionsService.createQuestion(questionPayload)
          
          const questionId = typeof createdQuestion === "object" && "id" in createdQuestion 
            ? createdQuestion.id 
            : (createdQuestion as any).id

          if (!questionId) {
            throw new Error("Failed to get question ID after creation")
          }

          // Create choices
          const choices = convertedBack.options || []
          for (const choice of choices) {
            try {
              await choicesService.createQuestionChoice({
                questionId: questionId,
                text: choice.text || "",
                isCorrect: choice.correct || false,
                order: choice.label === "A" ? 0 : choice.label === "B" ? 1 : choice.label === "C" ? 2 : choice.label === "D" ? 3 : 4,
              })
            } catch (choiceError: any) {
              console.error(`Failed to create choice ${choice.label}:`, choiceError)
            }
          }

          createdQuestionIds.push(questionId)
          updatedResults.push({
            ...result,
            questionId: questionId,
          })
        } catch (err: any) {
          console.error(`Failed to create question for ${result.fileName}:`, err)
          updatedResults.push({
            ...result,
            status: "error",
            error: err.message || "Failed to create question",
          })
        }
      }

      // Update summary with created question IDs
      const updatedSummary: BulkUploadSummary = {
        ...summary,
        results: summary.results.map((r) => {
          const updated = updatedResults.find((ur) => ur.fileName === r.fileName)
          return updated || r
        }),
      }

      setSummary(updatedSummary)

      if (createdQuestionIds.length > 0 && onQuestionsCreated) {
        onQuestionsCreated(createdQuestionIds)
      }
    } catch (err: any) {
      console.error("Failed to create questions:", err)
      setErrors([err.message || "Failed to create questions"])
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="border p-6 dark:border-slate-600/35 dark:bg-slate-900/20">
      <div className="min-w-0 space-y-6 overflow-x-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold break-words">Bulk Upload Markdown Questions</h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              Upload multiple .md files or a directory containing .md files and images
            </p>
          </div>
          {onCancel && (
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                onClick={onCancel}
                className="dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Mode Selection */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant={uploadMode === "files" ? "default" : "outline"}
            onClick={() => setUploadMode("files")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Multiple Files
          </Button>
          <Button
            variant={uploadMode === "directory" ? "default" : "outline"}
            onClick={() => setUploadMode("directory")}
            className="flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Directory
          </Button>
        </div>

        {/* File Upload Area - Always visible */}
        {(!summary || isProcessing) && (
          <>
            {uploadMode === "files" ? (
              <div
                className="relative cursor-pointer rounded-lg border border-dashed border-border p-8 transition-colors hover:bg-muted/30 dark:border-slate-600/40 dark:bg-slate-800/45 dark:hover:bg-slate-800/70"
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,image/*"
                  multiple
                  onChange={handleFileSelection}
                  disabled={isProcessing}
                  className="hidden"
                />

                <div className="text-center">
                  <div className="mb-3 text-4xl">📄</div>
                  <p className="mb-1 font-semibold text-foreground">Drop multiple markdown files here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supported: .md files and image files (.jpg, .png, .gif, .webp, .svg)
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="relative cursor-pointer rounded-lg border border-dashed border-border p-8 transition-colors hover:bg-muted/30 dark:border-slate-600/40 dark:bg-slate-800/45 dark:hover:bg-slate-800/70"
                onClick={() => !isProcessing && directoryInputRef.current?.click()}
              >
                <input
                  ref={directoryInputRef}
                  type="file"
                  {...({ webkitdirectory: "" } as any)}
                  multiple
                  onChange={handleDirectoryUpload}
                  disabled={isProcessing}
                  className="hidden"
                />

                <div className="text-center">
                  <div className="mb-3 text-4xl">📁</div>
                  <p className="mb-1 font-semibold text-foreground">Drop a directory here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Directory should contain .md files and an images/ folder with referenced images
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show upload area button when summary exists */}
        {summary && !isProcessing && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 dark:border-slate-600/40 dark:bg-slate-800/35">
            <div>
              <p className="text-sm font-medium text-foreground">Want to upload more files?</p>
              <p className="text-xs text-muted-foreground">Click the button below to add more questions</p>
            </div>
            <Button
              onClick={() => {
                setSummary(null)
                setQuestionMetadata({})
                setExpandedQuestions(new Set())
                setErrors([])
                setWarnings([])
                if (fileInputRef.current) fileInputRef.current.value = ""
                if (directoryInputRef.current) directoryInputRef.current.value = ""
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Upload More Files
            </Button>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-200">Processing files...</span>
            </div>
          </div>
        )}


        {/* Summary Report */}
        {summary && !isProcessing && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card/80 p-4 dark:border-slate-600/40 dark:bg-slate-800/40">
              <h4 className="mb-3 font-semibold text-foreground dark:text-slate-100">Processing Summary</h4>
              <div className="mb-4 grid min-w-0 max-w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="min-w-0 rounded-md border border-border bg-muted/40 px-2 py-3 text-center dark:border-slate-600/35 dark:bg-slate-800/50">
                  <div className="text-2xl font-bold tabular-nums text-foreground dark:text-slate-50">{summary.total}</div>
                  <div className="text-xs text-muted-foreground dark:text-slate-400">Total</div>
                </div>
                <div className="min-w-0 rounded-md border border-green-500/25 bg-green-500/10 px-2 py-3 text-center dark:border-emerald-500/30 dark:bg-emerald-500/[0.1]">
                  <div className="text-2xl font-bold tabular-nums text-green-600 dark:text-emerald-300">{summary.successful}</div>
                  <div className="text-xs text-muted-foreground dark:text-slate-400">Successful</div>
                </div>
                <div className="min-w-0 rounded-md border border-red-500/25 bg-red-500/10 px-2 py-3 text-center dark:border-red-500/30 dark:bg-red-500/[0.1]">
                  <div className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-300">{summary.failed}</div>
                  <div className="text-xs text-muted-foreground dark:text-slate-400">Failed</div>
                </div>
                <div className="min-w-0 rounded-md border border-yellow-500/25 bg-yellow-500/10 px-2 py-3 text-center dark:border-amber-500/30 dark:bg-amber-500/[0.1]">
                  <div className="text-2xl font-bold tabular-nums text-yellow-600 dark:text-amber-300">{summary.skipped}</div>
                  <div className="text-xs text-muted-foreground dark:text-slate-400">Skipped</div>
                </div>
              </div>

              {/* Detailed Results with Question Content */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {summary.results.map((result, idx) => {
                  const isExpanded = expandedQuestions.has(result.fileName)
                  const metadata = questionMetadata[result.fileName] || { productId: "", systemId: "", topicId: "" }
                  const questionTopics = metadata.systemId ? (topics[metadata.systemId] || []) : []
                  const isLoadingTopics = metadata.systemId ? (loadingTopics[metadata.systemId] || false) : false
                  const questionSubtopics = metadata.topicId ? (subtopics[metadata.topicId] || []) : []
                  const isLoadingSubtopics = metadata.topicId ? (loadingSubtopics[metadata.topicId] || false) : false
                  
                  return (
                    <div
                      key={idx}
                      className="border border-border dark:border-slate-600/40 rounded-lg p-3 bg-card dark:bg-slate-800/35"
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-2">
                        {result.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : result.status === "error" ? (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-foreground dark:text-gray-100">{result.fileName}</div>
                            {result.status === "success" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleQuestionExpansion(result.fileName)}
                                className="h-7 px-2 text-xs"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show Content
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {result.questionId && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground dark:text-slate-200">Question ID: {result.questionId}</span>
                              {onQuestionEdit && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onQuestionEdit(result.questionId!)}
                                  className="h-5 px-2 text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {result.error && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">{result.error}</div>
                          )}
                          {result.status === "success" && metadataIssuesByFile.get(result.fileName) && (
                            <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 break-words">
                              Missing:{" "}
                              {metadataIssuesByFile.get(result.fileName)!.missingLabels.join(", ")}
                            </div>
                          )}
                          {result.warnings && result.warnings.length > 0 && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              {result.warnings.join("; ")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Question Content (Expandable) */}
                      {result.status === "success" && result.questionData && isExpanded && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-border dark:border-gray-600">
                            {/* Category, Product, System, Topic, Subtopic: Parsed + DB dropdowns + Add to DB */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Product */}
                            <div className="order-[-1]">
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                Product
                              </label>
                              {result.questionData.product && (
                                <p className="text-[11px] text-muted-foreground mb-1 break-words dark:text-slate-400">
                                  Parsed: {result.questionData.product}
                                </p>
                              )}
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.product ? `Parsed: ${result.questionData.product}` : "Name (editable)"}
                                  value={metadata.productName || result.questionData.product || ""}
                                  onChange={(e) => updateQuestionMetadata(result.fileName, { productName: e.target.value })}
                                />
                              </div>
                              <select
                                value={metadata.productId || ""}
                                onChange={(e) => {
                                  const productId = e.target.value
                                  const selected = products.find((p: any) => p.id === productId)
                                  updateQuestionMetadata(result.fileName, {
                                    productId,
                                    categoryId: productId
                                      ? (selected?.categoryId || metadata.categoryId || "")
                                      : metadata.categoryId || "",
                                    productName: selected?.name || undefined
                                  })
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                disabled={isCreating || loadingProducts}
                              >
                                <option value="">Select Product...</option>
                                {products
                                  .filter((p: any) => {
                                    const selectedCategoryId = metadata.categoryId
                                    if (!selectedCategoryId) return true
                                    return p.categoryId === selectedCategoryId
                                  })
                                  .map((p: any) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <div className="flex gap-1 mt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() => setAddToDbContext({ type: "product", fileName: result.fileName, parsedName: (metadata.productName || result.questionData.product || "New Product").trim() })}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/45 dark:hover:text-red-300"
                                  title="Delete selected product from database"
                                  disabled={!metadata.productId}
                                  onClick={() => handleDeleteProduct(result.fileName)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Category */}
                            <div className="order-[-2]">
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                Category
                              </label>
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.category ? `Parsed: ${result.questionData.category}` : "Name (editable)"}
                                  value={
                                    metadata.categoryId
                                      ? (metadata.categoryName ?? categories.find((t: any) => t.id === metadata.categoryId)?.name ?? "")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { productId: "", systemId: "", topicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, categoryName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={metadata.categoryId || ""}
                                  onChange={(e) => {
                                    const categoryId = e.target.value || undefined
                                    const selectedCat = categoryId ? categories.find((t: any) => t.id === categoryId) : null
                                    updateQuestionMetadata(result.fileName, {
                                      categoryId: categoryId ?? "",
                                      categoryName: selectedCat?.name ?? (categoryId ? metadata.categoryName : undefined),
                                    })
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || loadingCategories}
                                >
                                  <option value="">Select Category...</option>
                                  {categories.map((tag) => (
                                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => {
                                  const cat = categories.find((t: any) => t.id === metadata.categoryId)
                                  if (cat) {
                                    setAddToDbContext({ type: "category", fileName: result.fileName, parsedName: cat.name })
                                  } else {
                                    setAddToDbContext({ type: "category", fileName: result.fileName, parsedName: (metadata.categoryName || result.questionData.category || "New Category").trim() })
                                  }
                                }}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/45 dark:hover:text-red-300" title="Delete selected category from database" disabled={!metadata.categoryId} onClick={() => handleDeleteCategory(result.fileName)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* MCQ Title */}
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                MCQ Title
                              </label>
                              {result.questionData.title && (
                                <p className="text-[11px] text-muted-foreground mb-1 break-words dark:text-slate-400">
                                  Parsed: {result.questionData.title}
                                </p>
                              )}
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.title ? `Parsed: ${result.questionData.title}` : "Name (editable)"}
                                  value={metadata.title || result.questionData.title || ""}
                                  onChange={(e) => updateQuestionMetadata(result.fileName, { title: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* System */}
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                System <span className="text-red-500 dark:text-red-400">*</span>
                              </label>
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.system ? `Parsed: ${result.questionData.system}` : "Name (editable)"}
                                  value={metadata.systemName || result.questionData.system || ""}
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { productId: "", systemId: "", topicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, systemName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={metadata.systemId}
                                  onChange={(e) => {
                                    const systemId = e.target.value
                                    const selectedSystem = systems.find((c: any) => c.id === systemId)
                                    updateQuestionMetadata(result.fileName, {
                                      systemId,
                                      topicId: "",
                                      systemName: selectedSystem?.name ?? (systemId ? "" : undefined),
                                    })
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || loadingSystems}
                                >
                                  <option value="">Select System...</option>
                                  {systems
                                    .filter((c: any) => {
                                      const selectedCategoryId = metadata.categoryId
                                      const selectedProductId = metadata.productId
                                      const systemProductId = c.productId || c.product?.id
                                      const systemProduct = products.find((p: any) => p.id === systemProductId)
                                      const systemCategoryId = systemProduct?.categoryId

                                      if (selectedProductId && systemProductId !== selectedProductId) return false
                                      if (selectedCategoryId && !selectedProductId && systemCategoryId && systemCategoryId !== selectedCategoryId) return false
                                      return true
                                    })
                                    .map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setAddToDbContext({ type: "system", fileName: result.fileName, parsedName: (metadata.systemName || result.questionData.system || "New System").trim() })}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/45 dark:hover:text-red-300" title="Delete selected system from database" disabled={!metadata.systemId} onClick={() => handleDeleteSystem(result.fileName)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Topic */}
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                Topic <span className="text-red-500 dark:text-red-400">*</span>
                              </label>
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.topic ? `Parsed: ${result.questionData.topic}` : "Name (editable)"}
                                  value={metadata.topicName || result.questionData.topic || ""}
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { productId: "", systemId: "", topicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, topicName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={metadata.topicId}
                                  onChange={(e) => {
                                    const topicId = e.target.value
                                    const selectedTopic = questionTopics.find((t: any) => t.id === topicId)
                                    updateQuestionMetadata(result.fileName, {
                                      topicId,
                                      topicName: topicId ? (selectedTopic?.name ?? (metadata as any).topicName ?? "") : undefined,
                                    })
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || isLoadingTopics || !metadata.systemId}
                                >
                                  <option value="">Select Topic...</option>
                                  {questionTopics.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={!metadata.systemId} title={!metadata.systemId ? "Select system first" : "Add topic to database"} onClick={() => setAddToDbContext({ type: "topic", fileName: result.fileName, parsedName: ((metadata as any).topicName || result.questionData.topic || "New Topic").trim() })}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/45 dark:hover:text-red-300" title="Delete selected topic from database" disabled={!metadata.topicId} onClick={() => handleDeleteTopic(result.fileName)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {/* Subtopic */}
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                Subtopic
                              </label>
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.subtopic ? `Parsed: ${result.questionData.subtopic}` : "Name (editable)"}
                                  value={metadata.subtopicName || result.questionData.subtopic || ""}
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { productId: "", systemId: "", topicId: "", subtopicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, subtopicName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={metadata.subtopicId}
                                  onChange={(e) => {
                                    const subtopicId = e.target.value
                                    const selectedSubtopic = questionSubtopics.find((s: any) => s.id === subtopicId)
                                    updateQuestionMetadata(result.fileName, {
                                      subtopicId,
                                      subtopicName: subtopicId ? (selectedSubtopic?.name ?? metadata.subtopicName ?? "") : undefined,
                                    })
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-slate-600/35 bg-background dark:bg-slate-800/55 text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || isLoadingSubtopics || !metadata.topicId}
                                >
                                  <option value="">Select Subtopic...</option>
                                  {questionSubtopics.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={!metadata.topicId} title={!metadata.topicId ? "Select topic first" : "Add subtopic to database"} onClick={() => setAddToDbContext({ type: "subtopic", fileName: result.fileName, parsedName: (metadata.subtopicName || result.questionData.subtopic || "New Subtopic").trim() })}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground dark:text-slate-400">Questions follow Category → Product → System → Topic → Subtopic → MCQ Title mapping.</p>

                          {/* Question Preview */}
                          <div className="space-y-3 rounded-md border border-border bg-background/50 p-3 dark:border-slate-600/30 dark:bg-slate-800/40">
                            {/* New hierarchy preview */}
                            {(result.questionData.category || metadata.categoryName) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Category:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">{metadata.categoryName || result.questionData.category}</span>
                              </div>
                            )}
                            {(result.questionData.product || metadata.productName) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Product:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">{metadata.productName || result.questionData.product}</span>
                              </div>
                            )}
                            {(result.questionData.system || metadata.systemName) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">System:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">{metadata.systemName || result.questionData.system}</span>
                              </div>
                            )}
                            {(result.questionData.topic || metadata.topicName) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Topic:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">{metadata.topicName || result.questionData.topic}</span>
                              </div>
                            )}
                            {(result.questionData.subtopic || metadata.subtopicName) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Subtopic:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">{metadata.subtopicName || result.questionData.subtopic}</span>
                              </div>
                            )}
                            {(result.questionData.title || metadata.title) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">MCQ Title:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">{metadata.title || result.questionData.title}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {result.questionData.tags && result.questionData.tags.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Tags:</span>{" "}
                                <span className="text-muted-foreground dark:text-slate-200">
                                  {result.questionData.tags.join(", ")}
                                </span>
                              </div>
                            )}

                            {/* Question Stem Preview */}
                            <div>
                              <div className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">Question Stem:</div>
                              <div className="p-3 rounded border border-border bg-muted/50 text-sm text-foreground/80 max-h-32 overflow-y-auto dark:border-slate-600/35 dark:bg-slate-800/45 dark:text-slate-200">
                                {result.questionData.stem ? (
                                  <div className="whitespace-pre-wrap">
                                    {result.questionData.stem.length > 200
                                      ? result.questionData.stem.substring(0, 200) + "..."
                                      : result.questionData.stem}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground dark:text-slate-400">No stem content</span>
                                )}
                              </div>
                            </div>

                            {/* Options Preview */}
                            {result.questionData.options && result.questionData.options.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">Options:</div>
                                <div className="space-y-1">
                                  {result.questionData.options.map((opt: any, optIdx: number) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded text-sm ${
                                        opt.correct
                                          ? "bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/40"
                                          : "bg-muted/50 dark:bg-slate-900/70"
                                      }`}
                                    >
                                      <span className="font-medium dark:text-gray-100">
                                        {opt.label}. {opt.correct && "✅ "}
                                      </span>
                                      <span className={opt.correct ? "text-green-600 dark:text-green-400" : "text-foreground/80 dark:text-gray-200"}>
                                        {opt.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Explanation Preview */}
                            {result.questionData.explanation && result.questionData.explanation.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                  Main Explanation ({result.questionData.explanation.length} block
                                  {result.questionData.explanation.length > 1 ? "s" : ""}):
                                </div>
                                <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground dark:bg-slate-900/55 dark:text-slate-400">
                                  Explanation content parsed successfully
                                </div>
                              </div>
                            )}

                            {/* Per-Answer Explanations Preview */}
                            {result.questionData.perAnswerExplanations &&
                              Object.keys(result.questionData.perAnswerExplanations).length > 0 && (
                                <div>
                                  <div className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                    Per-Answer Explanations:
                                  </div>
                                  <div className="text-xs text-muted-foreground dark:text-slate-200">
                                    {Object.keys(result.questionData.perAnswerExplanations).length} explanation
                                    {Object.keys(result.questionData.perAnswerExplanations).length > 1 ? "s" : ""}{" "}
                                    available
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Creating Status */}
        {isCreating && (
          <div className="p-4 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/40">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Creating questions...</span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/30 dark:border-yellow-500/40">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Warnings</div>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-destructive dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-destructive dark:text-red-400 mb-1">Errors</div>
                <ul className="text-xs text-destructive dark:text-red-300 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {summary && !isProcessing && (
          <div className="space-y-3">
            {summary.successful > 0 && (
              <>
                <BulkMetadataValidationPanel report={metadataValidation} />
                <Button
                  onClick={createQuestions}
                  disabled={isCreating || !metadataValidation.isComplete}
                  className="w-full bg-primary hover:bg-primary/90 sm:flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `Create ${summary.successful} Question${summary.successful > 1 ? "s" : ""}`
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add to DB modal */}
      {addToDbContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-600/40 dark:bg-slate-800 dark:text-slate-100">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">
              {addToDbContext.type === "category" && "Add Category to database"}
              {addToDbContext.type === "product" && "Add Product to database"}
              {addToDbContext.type === "system" && "Add System to database"}
              {addToDbContext.type === "topic" && "Add Topic to database"}
              {addToDbContext.type === "subtopic" && "Add Subtopic to database"}
            </h3>
            <div className="space-y-3">
              {addToDbContext.type === "system" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground dark:text-slate-200">Product</label>
                  <select
                    className="w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-600/35 dark:bg-slate-800/55 dark:text-slate-100"
                    value={addToDbProductId}
                    onChange={(e) => setAddToDbProductId(e.target.value)}
                  >
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground dark:text-slate-200">Name</label>
                <input
                  type="text"
                  className="w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-600/35 dark:bg-slate-800/55 dark:text-slate-100"
                  value={addToDbName}
                  onChange={(e) => setAddToDbName(e.target.value)}
                  placeholder={addToDbContext.parsedName}
                />
              </div>
              {addToDbError && <p className="text-xs text-red-600 dark:text-red-400">{addToDbError}</p>}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setAddToDbContext(null); setAddToDbError(null) }} disabled={addToDbLoading}>Cancel</Button>
              <Button size="sm" onClick={handleAddToDbSubmit} disabled={addToDbLoading}>
                {addToDbLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from database?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && (
                <>
                  Do you want to delete &quot;{deleteConfirm.name}&quot;? This will mark it inactive in the database.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                performDelete()
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
      <AlertDialog open={!!alreadyExistsMessage} onOpenChange={(open) => { if (!open) setAlreadyExistsMessage(null) }}>
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

