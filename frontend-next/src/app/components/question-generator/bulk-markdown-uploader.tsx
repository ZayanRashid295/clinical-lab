"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { parseMarkdown, extractImageReferences, replaceImagePathsInBlocks, replaceImagePaths } from "./markdown-parser-utils"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { SectionsService } from "@/app/services/content/sections.service"
import { ChaptersService } from "@/app/services/content/chapters.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { ProductTagsService } from "@/app/services/products/product-tags.service"
import { ProductsService } from "@/app/services/products/products.service"
import { runAutoMatch } from "./metadata-auto-match"
import { CheckCircle2, XCircle, AlertCircle, Loader2, FileText, FolderOpen, Image as ImageIcon, Edit, ChevronDown, ChevronUp, Plus, X } from "lucide-react"
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [uploadMode, setUploadMode] = useState<"files" | "directory">("files")
  const [summary, setSummary] = useState<BulkUploadSummary | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  // Store metadata for each parsed question (frontend-only mapping; backend schema unchanged)
  const [questionMetadata, setQuestionMetadata] = useState<Record<string, {
    sectionId: string
    chapterId: string
    topicId: string
    productTagId?: string
    subjectName?: string
    systemName?: string
    chapterName?: string
    topicName?: string
  }>>({})
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set()) // Track expanded questions
  const [addToDbContext, setAddToDbContext] = useState<{ type: "subject" | "chapter" | "topic"; fileName: string; parsedName?: string } | null>(null)
  const [addToDbLoading, setAddToDbLoading] = useState(false)
  const [addToDbError, setAddToDbError] = useState<string | null>(null)
  const [addToDbName, setAddToDbName] = useState("")
  const [addToDbSectionId, setAddToDbSectionId] = useState("")
  const [addToDbProductId, setAddToDbProductId] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const questionsService = new QuestionsService()
  
  // Services for dropdowns
  const sectionsService = useMemo(() => new SectionsService(), [])
  const chaptersService = useMemo(() => new ChaptersService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])
  const productTagsService = useMemo(() => new ProductTagsService(), [])
  const productsService = useMemo(() => new ProductsService(), [])
  
  // State for dropdowns (shared across all questions)
  const [sections, setSections] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([]) // all chapters (no longer dependent on section)
  const [topics, setTopics] = useState<Record<string, any[]>>({}) // topics by chapterId
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({})
  const [productTags, setProductTags] = useState<any[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  // Load sections on mount
  useEffect(() => {
    setLoadingSections(true)
    sectionsService
      .getSections({ status: "ACTIVE", listAll: true })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setSections(data)
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false))
  }, [sectionsService])

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

  // Load chapters on mount (no longer dependent on System selection)
  useEffect(() => {
    setLoadingChapters(true)
    chaptersService
      .getChapters({ status: "ACTIVE", listAll: true })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setChapters(data)
      })
      .catch(() => setChapters([]))
      .finally(() => setLoadingChapters(false))
  }, [chaptersService])

  // Load product tags on mount (Subjects)
  useEffect(() => {
    setLoadingTags(true)
    productTagsService
      .getTags({ status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setProductTags(data)
      })
      .catch(() => setProductTags([]))
      .finally(() => setLoadingTags(false))
  }, [productTagsService])
  
  // Load chapters when section is selected for any question
  const loadChapters = async (sectionId: string, skipStateUpdate = false): Promise<any[]> => {
    // Backward compatible helper (autoMatch still calls this). We now keep chapters globally.
    // If sectionId provided, filter; otherwise return all.
    if (!sectionId) return chapters
    return chapters.filter((c: any) => c.sectionId === sectionId || c.section?.id === sectionId)
  }
  
  // Load topics when chapter is selected for any question
  const loadTopics = async (chapterId: string, skipStateUpdate = false): Promise<any[]> => {
    if (!chapterId) return []
    
    // Return cached data if available
    if (topics[chapterId]) {
      return topics[chapterId]
    }
    
    if (!skipStateUpdate) {
      setLoadingTopics((prev) => ({ ...prev, [chapterId]: true }))
    }
    
    try {
      const response = await topicsService.getTopics({ chapterId, status: "ACTIVE", listAll: true })
      const data = Array.isArray(response) ? response : (response as any)?.data || []
      
      if (!skipStateUpdate) {
        setTopics((prev) => ({ ...prev, [chapterId]: data }))
      }
      
      return data
    } catch {
      const emptyData: any[] = []
      if (!skipStateUpdate) {
        setTopics((prev) => ({ ...prev, [chapterId]: emptyData }))
      }
      return emptyData
    } finally {
      if (!skipStateUpdate) {
        setLoadingTopics((prev => ({ ...prev, [chapterId]: false })))
      }
    }
  }

  // Auto-match parsed subject/system/topic to DB entities (shared logic with bulk-docx)
  const getTopicsForChapter = (chapterId: string) =>
    topicsService.getTopics({ chapterId, status: "ACTIVE", listAll: true }).then((r) => (Array.isArray(r) ? r : (r as any)?.data || []))
  const autoMatchMetadata = async (
    fileName: string,
    parsedSystem?: string,
    parsedSubject?: string,
    parsedTopic?: string
  ) => {
    if (!parsedSystem && !parsedSubject) return
    let sectionsToUse = sections
    if (sectionsToUse.length === 0) {
      try {
        const response = await sectionsService.getSections({ status: "ACTIVE", listAll: true })
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        if (data.length > 0) {
          setSections(data)
          sectionsToUse = data
        }
      } catch (_) {}
    }
    const matched = await runAutoMatch(
      { parsedSubject, parsedSystem, parsedTopic },
      chapters,
      { sections: sectionsToUse.length > 0 ? sectionsToUse : [], productTags, getTopicsForChapter }
    )
    if (matched.chapterId || matched.topicId || matched.productTagId) {
      // Find the result to get parsed subject
      const result = summary?.results?.find((r) => r.fileName === fileName)
      const currentMetadata = questionMetadata[fileName]
      updateQuestionMetadata(
        fileName,
        {
          ...(matched.sectionId ? { sectionId: matched.sectionId } : {}),
          chapterId: matched.chapterId || "",
          topicId: matched.topicId || "",
          ...(matched.productTagId ? { productTagId: matched.productTagId } : {}),
          // Preserve parsed subject name - don't override if user has edited it
          subjectName: currentMetadata?.subjectName || parsedSubject || "",
        },
        true
      )
      setExpandedQuestions((prev) => new Set(prev).add(fileName))
    }
    if (matched.chapterId) loadTopics(matched.chapterId)
  }

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
        subject: parsed.subject,
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
        subject: parsed.subject,
        system: parsed.system,
        topic: parsed.topic,
        options: parsed.options,
        explanation: updatedMainExplanation,
        perAnswerExplanations: updatedPerAnswerExplanations,
        tags: parsed.tags,
        questionId: parsed.questionId,
      }
      
      console.log(`[ProcessFile] Final questionData for ${fileName}:`, {
        system: questionData.system,
        subject: questionData.subject,
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
          subject: result.questionData.subject,
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

    // Ensure sections are loaded before auto-matching
    let sectionsLoaded = sections.length > 0
    if (!sectionsLoaded) {
      // Wait for sections to load (with timeout)
      let attempts = 0
      while (!sectionsLoaded && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        sectionsLoaded = sections.length > 0
        attempts++
      }
      
      // If still not loaded, fetch sections directly
      if (!sectionsLoaded) {
        try {
          const response = await sectionsService.getSections({ status: "ACTIVE", listAll: true })
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setSections(data)
          sectionsLoaded = data.length > 0
        } catch (error) {
          console.error("Failed to load sections for auto-matching:", error)
        }
      }
    }

    // Auto-match metadata for all successfully parsed questions
    console.log("[BulkUpload] Starting auto-matching for", results.length, "results")
    console.log("[BulkUpload] Sections available:", sections.length)
    
    for (const result of results) {
      if (result.status === "success" && result.questionData) {
        console.log(`[BulkUpload] Processing ${result.fileName}:`, {
          system: result.questionData.system,
          subject: result.questionData.subject,
          topic: result.questionData.topic,
        })
        await autoMatchMetadata(
          result.fileName,
          result.questionData.system,
          result.questionData.subject,
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
          subject: result.questionData.subject,
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

    // Ensure sections are loaded before auto-matching
    let sectionsLoaded = sections.length > 0
    if (!sectionsLoaded) {
      // Wait for sections to load (with timeout)
      let attempts = 0
      while (!sectionsLoaded && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        sectionsLoaded = sections.length > 0
        attempts++
      }
      
      // If still not loaded, fetch sections directly
      if (!sectionsLoaded) {
        try {
          const response = await sectionsService.getSections({ status: "ACTIVE", listAll: true })
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setSections(data)
          sectionsLoaded = data.length > 0
        } catch (error) {
          console.error("Failed to load sections for auto-matching:", error)
        }
      }
    }

    // Auto-match metadata for all successfully parsed questions
    console.log("[BulkUpload] Starting auto-matching for", results.length, "results")
    console.log("[BulkUpload] Sections available:", sections.length)
    
    for (const result of results) {
      if (result.status === "success" && result.questionData) {
        console.log(`[BulkUpload] Processing ${result.fileName}:`, {
          system: result.questionData.system,
          subject: result.questionData.subject,
          topic: result.questionData.topic,
        })
        await autoMatchMetadata(
          result.fileName,
          result.questionData.system,
          result.questionData.subject,
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
    updates: { sectionId?: string; chapterId?: string; topicId?: string; productTagId?: string; subjectName?: string },
    skipClearing = false // If true, don't clear dependent fields (used for auto-matching)
  ) => {
    setQuestionMetadata((prev) => {
      const current = prev[fileName] || { sectionId: "", chapterId: "", topicId: "" }
      const updated: any = { ...current, ...updates }
      
      // If skipClearing is true (auto-matching), just apply all updates and load data
      if (skipClearing) {
        // Load chapters if section is set
        if (updates.sectionId && updates.sectionId !== current.sectionId) {
          loadChapters(updates.sectionId)
        }
        // Load topics if chapter is set
        if (updates.chapterId && updates.chapterId !== current.chapterId) {
          loadTopics(updates.chapterId)
        }
        return { ...prev, [fileName]: updated }
      }
      
      // Normal behavior: clear dependent fields when parent changes
      // If section changed, clear chapter and topic
      if (updates.sectionId !== undefined && updates.sectionId !== current.sectionId) {
        updated.chapterId = ""
        updated.topicId = ""
        // Load chapters for new section
        if (updates.sectionId) {
          loadChapters(updates.sectionId)
        }
      }
      
      // If chapter changed, clear topic
      if (updates.chapterId !== undefined && updates.chapterId !== current.chapterId) {
        updated.topicId = ""
        // Load topics for new chapter
        if (updates.chapterId) {
          loadTopics(updates.chapterId)
        }
        // Auto-map section from chapter (frontend-only)
        const selectedChapter = chapters.find((c: any) => c.id === updates.chapterId)
        const derivedSectionId = selectedChapter?.sectionId || selectedChapter?.section?.id
        if (derivedSectionId) {
          updated.sectionId = derivedSectionId
        }
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
    setAddToDbLoading(true)
    try {
      const { type, fileName } = addToDbContext
      if (type === "subject") {
        const res: any = await productTagsService.createTag({ name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list: any = await productTagsService.getTags({ status: "ACTIVE" })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setProductTags(data)
          updateQuestionMetadata(fileName, { productTagId: id })
          setAddToDbContext(null)
        }
      } else if (type === "chapter") {
        const sectionId = addToDbSectionId || sections[0]?.id
        if (!sectionId) {
          setAddToDbError("Select a section first")
          setAddToDbLoading(false)
          return
        }
        const res: any = await chaptersService.createChapter({ sectionId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list: any = await chaptersService.getChapters({ status: "ACTIVE", listAll: true })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setChapters(data)
          updateQuestionMetadata(fileName, { chapterId: id, topicId: "" })
          loadTopics(id)
          setAddToDbContext(null)
        }
      } else if (type === "topic") {
        const chapterId = questionMetadata[fileName]?.chapterId
        if (!chapterId) {
          setAddToDbError("Select a chapter first")
          setAddToDbLoading(false)
          return
        }
        const res: any = await topicsService.createTopic({ chapterId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          await loadTopics(chapterId)
          updateQuestionMetadata(fileName, { topicId: id })
          setAddToDbContext(null)
        }
      }
    } catch (e: any) {
      setAddToDbError(e?.message || "Failed to create")
    } finally {
      setAddToDbLoading(false)
    }
  }

  // Delete from DB: remove selected subject/chapter/topic (soft delete) and refresh lists
  const handleDeleteSubject = async (fileName: string) => {
    const id = (questionMetadata[fileName] as any)?.productTagId
    if (!id) return
    const tag = productTags.find((t) => t.id === id)
    if (!window.confirm(`Delete subject "${tag?.name ?? id}" from database? This will deactivate it.`)) return
    try {
      await productTagsService.delete(id)
      const list: any = await productTagsService.getTags({ status: "ACTIVE" })
      const data = Array.isArray(list) ? list : (list as any)?.data || []
      setProductTags(data)
      updateQuestionMetadata(fileName, { productTagId: "" })
    } catch (e: any) {
      alert(e?.message || "Failed to delete subject")
    }
  }
  const handleDeleteChapter = async (fileName: string) => {
    const id = questionMetadata[fileName]?.chapterId
    if (!id) return
    const chapter = chapters.find((c) => c.id === id)
    if (!window.confirm(`Delete chapter "${chapter?.name ?? id}" from database? This will deactivate it.`)) return
    try {
      await chaptersService.delete(id)
      const list: any = await chaptersService.getChapters({ status: "ACTIVE", listAll: true })
      const data = Array.isArray(list) ? list : (list as any)?.data || []
      setChapters(data)
      setTopics((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      updateQuestionMetadata(fileName, { chapterId: "", topicId: "" })
    } catch (e: any) {
      alert(e?.message || "Failed to delete chapter")
    }
  }
  const handleDeleteTopic = async (fileName: string) => {
    const metadata = questionMetadata[fileName]
    const id = metadata?.topicId
    const chapterId = metadata?.chapterId
    if (!id || !chapterId) return
    const topicList = topics[chapterId] || []
    const topic = topicList.find((t) => t.id === id)
    if (!window.confirm(`Delete topic "${topic?.name ?? id}" from database? This will deactivate it.`)) return
    try {
      await topicsService.delete(id)
      await loadTopics(chapterId)
      updateQuestionMetadata(fileName, { topicId: "" })
    } catch (e: any) {
      alert(e?.message || "Failed to delete topic")
    }
  }

  useEffect(() => {
    if (addToDbContext) {
      setAddToDbName(addToDbContext.parsedName || "")
      setAddToDbSectionId(sections[0]?.id || "")
      setAddToDbProductId(products[0]?.id || "")
      setAddToDbError(null)
    }
  }, [addToDbContext, sections, products])

  // Create questions from parsed data
  const createQuestions = async () => {
    if (!summary) return

    const successfulResults = summary.results.filter((r) => r.status === "success" && r.questionData)
    
    if (successfulResults.length === 0) {
      setErrors(["No successfully parsed questions to create"])
      return
    }

    // Check if all questions have topic IDs
    const missingTopics = successfulResults.filter(
      (r) => !questionMetadata[r.fileName]?.topicId || !questionMetadata[r.fileName].topicId.trim()
    )

    if (missingTopics.length > 0) {
      setErrors([
        `Select or add a Topic for each question. Missing for: ${missingTopics.map((r) => r.fileName).join(", ")}`,
      ])
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
          
          const questionTopicId = metadata.topicId
          const questionChapterId = metadata.chapterId
          const questionProductTagId = (metadata as any).productTagId

          // Convert parsed question to the format needed for creation
          // The parsed question has stem as string, but we need to handle it properly
          // Use edited subjectName if available, otherwise use parsed subject
          const subjectToUse = (metadata as any).subjectName || result.questionData.subject || ""
          const oldFormatData = {
            stem: result.questionData.stem, // This is a string from parser
            options: result.questionData.options,
            subject: subjectToUse,
            system: result.questionData.system,
            explanation: result.questionData.explanation, // This is already blocks
            perAnswerExplanations: result.questionData.perAnswerExplanations, // This is already blocks
            tags: result.questionData.tags || [],
            topicId: questionTopicId,
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
              // Preserve parsed subject and system from DOCX/Markdown
              subject: result.questionData.subject || newFormatData.metadata?.subject,
              system: result.questionData.system || newFormatData.metadata?.system,
              topicId: questionTopicId,
              chapterId: questionChapterId,
              productTagId: questionProductTagId,
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
            topicId: questionTopicId,
            question: questionText.trim(),
            difficulty: "medium",
            points: 1,
            isActive: true,
          }
          
          // Add chapterId if available (section is derived from chapter at backend)
          if (questionChapterId) {
            questionPayload.chapterId = questionChapterId
          }

          if (convertedBack.subject) questionPayload.subject = convertedBack.subject
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
          
          if (questionProductTagId) {
            questionPayload.productTagId = questionProductTagId
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

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div 
      className={`p-6 shadow-lg border-2 border-dashed border-primary/30 border border-border dark:border-gray-700 rounded-xl ${isDark ? '!bg-gray-800' : ''}`}
      style={isDark ? { backgroundColor: '#1f2937' } : {}}
    >
      <div className="space-y-4 min-h-0">
        <div>
          <h3 className="text-lg font-bold text-foreground dark:text-gray-100 mb-2">Bulk Upload Markdown Questions</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-300">
            Upload multiple .md files or a directory containing .md files and images
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
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
                className="relative border-2 border-dashed border-border dark:border-gray-600 rounded-lg p-8 hover:bg-muted/30 dark:hover:bg-gray-700/30 transition-colors cursor-pointer dark:bg-gray-800/50"
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
                  <p className="font-semibold text-foreground dark:text-gray-100 mb-1">Drop multiple markdown files here</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">or click to browse</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                    Supported: .md files and image files (.jpg, .png, .gif, .webp, .svg)
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="relative border-2 border-dashed border-border dark:border-gray-600 rounded-lg p-8 hover:bg-muted/30 dark:hover:bg-gray-700/30 transition-colors cursor-pointer dark:bg-gray-800/50"
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
                  <p className="font-semibold text-foreground dark:text-gray-100 mb-1">Drop a directory here</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">or click to browse</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                    Directory should contain .md files and an images/ folder with referenced images
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show upload area button when summary exists */}
        {summary && !isProcessing && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 dark:bg-gray-700/30 border border-border dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-foreground dark:text-gray-100">Want to upload more files?</p>
              <p className="text-xs text-muted-foreground dark:text-gray-300">Click the button below to add more questions</p>
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
          <div className="p-4 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/40">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Processing files...</span>
            </div>
          </div>
        )}


        {/* Summary Report */}
        {summary && !isProcessing && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg dark:bg-gray-800 border border-border dark:border-gray-700" style={{ backgroundColor: isDark ? '#1f2937' : 'var(--card-bg, #ffffff)' }}>
              <h4 className="font-semibold text-foreground dark:text-gray-100 mb-3">Processing Summary</h4>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground dark:text-gray-100">{summary.total}</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-300">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.successful}</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-300">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.failed}</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-300">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.skipped}</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-300">Skipped</div>
                </div>
              </div>

              {/* Detailed Results with Question Content */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {summary.results.map((result, idx) => {
                  const isExpanded = expandedQuestions.has(result.fileName)
                  const metadata = questionMetadata[result.fileName] || { sectionId: "", chapterId: "", topicId: "" }
                  const questionTopics = metadata.chapterId ? (topics[metadata.chapterId] || []) : []
                  const isLoadingTopics = metadata.chapterId ? (loadingTopics[metadata.chapterId] || false) : false
                  
                  return (
                    <div
                      key={idx}
                      className="border border-border dark:border-gray-600 rounded-lg p-3 bg-card dark:bg-gray-700/50"
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
                              <span className="text-xs text-muted-foreground dark:text-gray-300">Question ID: {result.questionId}</span>
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
                          {/* Subject, System, Chapter, Topic: Parsed from document + DB dropdowns + Add to DB */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Subject */}
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                Subject
                              </label>
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-gray-600 bg-background dark:bg-gray-700 text-foreground dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.subject ? `Parsed: ${result.questionData.subject}` : "Name (editable)"}
                                  value={(metadata as any).subjectName ?? result.questionData.subject ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { sectionId: "", chapterId: "", topicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, subjectName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={(metadata as any).productTagId || ""}
                                  onChange={(e) => updateQuestionMetadata(result.fileName, { productTagId: e.target.value })}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-gray-600 bg-background dark:bg-gray-700 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || loadingTags}
                                >
                                  <option value="">Select Subject...</option>
                                  {productTags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setAddToDbContext({ type: "subject", fileName: result.fileName, parsedName: ((metadata as any).subjectName || result.questionData.subject || "New Subject").trim() })}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete selected subject from database" disabled={!(metadata as any).productTagId} onClick={() => handleDeleteSubject(result.fileName)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Chapter */}
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                                Chapter <span className="text-red-500 dark:text-red-400">*</span>
                              </label>
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-gray-600 bg-background dark:bg-gray-700 text-foreground dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.system ? `Parsed: ${result.questionData.system}` : "Name (editable)"}
                                  value={(metadata as any).chapterName ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { sectionId: "", chapterId: "", topicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, chapterName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={metadata.chapterId}
                                  onChange={(e) => updateQuestionMetadata(result.fileName, { chapterId: e.target.value })}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-gray-600 bg-background dark:bg-gray-700 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || loadingChapters}
                                >
                                  <option value="">Select Chapter...</option>
                                  {chapters.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setAddToDbContext({ type: "chapter", fileName: result.fileName, parsedName: ((metadata as any).chapterName || result.questionData.system || "New Chapter").trim() })}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete selected chapter from database" disabled={!metadata.chapterId} onClick={() => handleDeleteChapter(result.fileName)}>
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
                                  className="w-full px-2 py-1.5 rounded-lg border border-border dark:border-gray-600 bg-background dark:bg-gray-700 text-foreground dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder={result.questionData.topic ? `Parsed: ${result.questionData.topic}` : "Name (editable)"}
                                  value={(metadata as any).topicName ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value || undefined
                                    setQuestionMetadata((prev) => {
                                      const cur = prev[result.fileName] || { sectionId: "", chapterId: "", topicId: "" }
                                      return { ...prev, [result.fileName]: { ...cur, topicName: v } }
                                    })
                                  }}
                                />
                              </div>
                              <div className="flex gap-1">
                                <select
                                  value={metadata.topicId}
                                  onChange={(e) => updateQuestionMetadata(result.fileName, { topicId: e.target.value })}
                                  className="flex-1 px-3 py-2 rounded-lg border border-border dark:border-gray-600 bg-background dark:bg-gray-700 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                  disabled={isCreating || isLoadingTopics || !metadata.chapterId}
                                >
                                  <option value="">Select Topic...</option>
                                  {questionTopics.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={!metadata.chapterId} title={!metadata.chapterId ? "Select chapter first" : "Add topic to database"} onClick={() => setAddToDbContext({ type: "topic", fileName: result.fileName, parsedName: ((metadata as any).topicName || result.questionData.topic || "New Topic").trim() })}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete selected topic from database" disabled={!metadata.topicId} onClick={() => handleDeleteTopic(result.fileName)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">Subject from the document is saved as text. Link to taxonomy via Chapter/Topic. Questions are saved under General Principles when no chapter is set.</p>

                          {/* Question Preview */}
                          <div className="space-y-3">
                            {/* Subject */}
                            {result.questionData.subject && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Subject:</span>{" "}
                                <span className="text-muted-foreground dark:text-gray-300">{result.questionData.subject}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {result.questionData.tags && result.questionData.tags.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground dark:text-gray-100">Tags:</span>{" "}
                                <span className="text-muted-foreground dark:text-gray-300">
                                  {result.questionData.tags.join(", ")}
                                </span>
                              </div>
                            )}

                            {/* Question Stem Preview */}
                            <div>
                              <div className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">Question Stem:</div>
                              <div className="p-3 rounded bg-muted/50 dark:bg-gray-700/50 text-sm text-foreground/80 dark:text-gray-200 max-h-32 overflow-y-auto border border-border dark:border-gray-600">
                                {result.questionData.stem ? (
                                  <div className="whitespace-pre-wrap">
                                    {result.questionData.stem.length > 200
                                      ? result.questionData.stem.substring(0, 200) + "..."
                                      : result.questionData.stem}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground dark:text-gray-400">No stem content</span>
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
                                          : "bg-muted/50 dark:bg-gray-700/50"
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
                                <div className="p-2 rounded bg-muted/30 dark:bg-gray-700/30 text-xs text-muted-foreground dark:text-gray-300">
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
                                  <div className="text-xs text-muted-foreground dark:text-gray-300">
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
          <div className="flex gap-2">
            {onCancel && (
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Close
              </Button>
            )}
            {summary.successful > 0 && (
              <Button
                onClick={createQuestions}
                disabled={
                  isCreating ||
                  summary.results.filter(
                    (r) => r.status === "success" && (!questionMetadata[r.fileName]?.topicId || !questionMetadata[r.fileName].topicId.trim())
                  ).length > 0
                }
                className="flex-1 bg-primary hover:bg-primary/90"
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
            )}
          </div>
        )}
      </div>

      {/* Add to DB modal */}
      {addToDbContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-4 border border-border dark:border-gray-600">
            <h3 className="text-sm font-semibold mb-3 text-foreground dark:text-gray-100">
              {addToDbContext.type === "subject" && "Add Subject to database"}
              {addToDbContext.type === "chapter" && "Add Chapter to database"}
              {addToDbContext.type === "topic" && "Add Topic to database"}
            </h3>
            <div className="space-y-3">
              {addToDbContext.type === "chapter" && (
                <div>
                  <label className="text-xs font-medium block mb-1 text-foreground dark:text-gray-100">Section</label>
                  <select className="w-full p-2 border rounded text-sm border-border dark:border-gray-600 bg-background dark:bg-gray-800" value={addToDbSectionId} onChange={(e) => setAddToDbSectionId(e.target.value)}>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium block mb-1 text-foreground dark:text-gray-100">Name</label>
                <input type="text" className="w-full p-2 border rounded text-sm border-border dark:border-gray-600 bg-background dark:bg-gray-800 text-foreground dark:text-gray-100" value={addToDbName} onChange={(e) => setAddToDbName(e.target.value)} placeholder={addToDbContext.parsedName} />
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
    </div>
  )
}

