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
import { CheckCircle2, XCircle, AlertCircle, Loader2, FileText, FolderOpen, Image as ImageIcon, Edit, ChevronDown, ChevronUp } from "lucide-react"
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
  // Store sectionId, chapterId, and topicId for each question
  const [questionMetadata, setQuestionMetadata] = useState<Record<string, { sectionId: string; chapterId: string; topicId: string }>>({})
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set()) // Track expanded questions
  const fileInputRef = useRef<HTMLInputElement>(null)
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const questionsService = new QuestionsService()
  
  // Services for dropdowns
  const sectionsService = useMemo(() => new SectionsService(), [])
  const chaptersService = useMemo(() => new ChaptersService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])
  
  // State for dropdowns (shared across all questions)
  const [sections, setSections] = useState<any[]>([])
  const [chapters, setChapters] = useState<Record<string, any[]>>({}) // chapters by sectionId
  const [topics, setTopics] = useState<Record<string, any[]>>({}) // topics by chapterId
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState<Record<string, boolean>>({})
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({})
  
  // Load sections on mount
  useEffect(() => {
    setLoadingSections(true)
    sectionsService
      .getSections({ limit: 100, status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setSections(data)
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false))
  }, [sectionsService])
  
  // Load chapters when section is selected for any question
  const loadChapters = async (sectionId: string, skipStateUpdate = false): Promise<any[]> => {
    if (!sectionId) return []
    
    // Return cached data if available
    if (chapters[sectionId]) {
      return chapters[sectionId]
    }
    
    if (!skipStateUpdate) {
      setLoadingChapters((prev) => ({ ...prev, [sectionId]: true }))
    }
    
    try {
      const response = await chaptersService.getChapters({ sectionId, limit: 100, status: "ACTIVE" })
      const data = Array.isArray(response) ? response : (response as any)?.data || []
      
      if (!skipStateUpdate) {
        setChapters((prev) => ({ ...prev, [sectionId]: data }))
      }
      
      return data
    } catch {
      const emptyData: any[] = []
      if (!skipStateUpdate) {
        setChapters((prev) => ({ ...prev, [sectionId]: emptyData }))
      }
      return emptyData
    } finally {
      if (!skipStateUpdate) {
        setLoadingChapters((prev => ({ ...prev, [sectionId]: false })))
      }
    }
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
      const response = await topicsService.getTopics({ chapterId, limit: 100, status: "ACTIVE" })
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

  // Auto-match parsed system/subject/topic to database entities
  const autoMatchMetadata = async (
    fileName: string,
    parsedSystem?: string,
    parsedSubject?: string,
    parsedTopic?: string
  ) => {
    console.log(`[AutoMatch] Called for ${fileName} with:`, { parsedSystem, parsedSubject, parsedTopic })
    
    if (!parsedSystem && !parsedSubject) {
      console.log(`[AutoMatch] Exiting early: no system or subject provided`)
      return
    }

    let matchedSectionId = ""
    let matchedChapterId = ""
    let matchedTopicId = ""

    // Helper function to normalize names for comparison (case-insensitive, trim whitespace)
    const normalizeName = (name: string): string => {
      if (!name) return ""
      return name.toLowerCase().trim().replace(/\s+/g, " ")
    }

    // Helper function for fuzzy matching (handles partial matches)
    const fuzzyMatch = (str1: string, str2: string): boolean => {
      const n1 = normalizeName(str1)
      const n2 = normalizeName(str2)
      // Exact match
      if (n1 === n2) return true
      // Contains match (one contains the other)
      if (n1.includes(n2) || n2.includes(n1)) return true
      // Word-by-word match (all words from shorter string exist in longer)
      const words1 = n1.split(/\s+/).filter(w => w.length > 0)
      const words2 = n2.split(/\s+/).filter(w => w.length > 0)
      if (words1.length > 0 && words2.length > 0) {
        const shorter = words1.length <= words2.length ? words1 : words2
        const longer = words1.length > words2.length ? words1 : words2
        return shorter.every(word => longer.some(lw => lw.includes(word) || word.includes(lw)))
      }
      return false
    }

    // Get current sections - fetch directly if not available in state
    let currentSections = sections.length > 0 ? sections : []
    if (currentSections.length === 0) {
      try {
        const response = await sectionsService.getSections({ limit: 100, status: "ACTIVE" })
        currentSections = Array.isArray(response) ? response : (response as any)?.data || []
        // Update state for future use
        if (currentSections.length > 0) {
          setSections(currentSections)
        }
      } catch (error) {
        console.error("[AutoMatch] Failed to fetch sections:", error)
      }
    }
    
    if (parsedSystem && currentSections.length > 0) {
      const normalizedSystem = normalizeName(parsedSystem)
      console.log(`[AutoMatch] Matching system: "${parsedSystem}" (normalized: "${normalizedSystem}")`)
      console.log(`[AutoMatch] Available sections:`, currentSections.map(s => s.name))
      
      // First try exact match
      let matchedSection = currentSections.find(
        (section) => normalizeName(section.name) === normalizedSystem
      )
      
      // If no exact match, try fuzzy matching
      if (!matchedSection) {
        matchedSection = currentSections.find(
          (section) => fuzzyMatch(section.name, parsedSystem)
        )
      }
      
      if (matchedSection) {
        console.log(`[AutoMatch] ✓ Matched system: "${matchedSection.name}" (ID: ${matchedSection.id})`)
      } else {
        console.log(`[AutoMatch] ✗ No match found for system: "${parsedSystem}"`)
      }

      if (matchedSection) {
        matchedSectionId = matchedSection.id
        // Load chapters for this section (skip state update to get data immediately)
        const sectionChapters = await loadChapters(matchedSectionId, true)
        // Also update state for UI
        await loadChapters(matchedSectionId, false)

        // Try to match Subject (Chapter) within the matched section
        if (parsedSubject && sectionChapters.length > 0) {
          const normalizedSubject = normalizeName(parsedSubject)
          console.log(`[AutoMatch] Matching subject: "${parsedSubject}" (normalized: "${normalizedSubject}")`)
          console.log(`[AutoMatch] Available chapters:`, sectionChapters.map(c => c.name))
          
          // First try exact match
          let matchedChapter = sectionChapters.find(
            (chapter) => normalizeName(chapter.name) === normalizedSubject
          )
          
          // If no exact match, try fuzzy matching
          if (!matchedChapter) {
            matchedChapter = sectionChapters.find(
              (chapter) => fuzzyMatch(chapter.name, parsedSubject)
            )
          }
          
          if (matchedChapter) {
            console.log(`[AutoMatch] ✓ Matched subject: "${matchedChapter.name}" (ID: ${matchedChapter.id})`)
          } else {
            console.log(`[AutoMatch] ✗ No match found for subject: "${parsedSubject}"`)
          }

          if (matchedChapter) {
            matchedChapterId = matchedChapter.id
            // Load topics for this chapter (skip state update to get data immediately)
            const chapterTopics = await loadTopics(matchedChapterId, true)
            // Also update state for UI
            await loadTopics(matchedChapterId, false)

            // Try to match topic if parsed topic exists
            if (parsedTopic && chapterTopics.length > 0) {
              const normalizedTopic = normalizeName(parsedTopic)
              // First try exact match
              let matchedTopic = chapterTopics.find(
                (topic) => normalizeName(topic.name) === normalizedTopic
              )
              
              // If no exact match, try fuzzy matching
              if (!matchedTopic) {
                matchedTopic = chapterTopics.find(
                  (topic) => fuzzyMatch(topic.name, parsedTopic)
                )
              }

              if (matchedTopic) {
                matchedTopicId = matchedTopic.id
              } else if (chapterTopics.length === 1) {
                // If there's only one topic and no match, auto-select it
                matchedTopicId = chapterTopics[0].id
              }
            } else if (chapterTopics.length === 1) {
              // If there's only one topic, auto-select it
              matchedTopicId = chapterTopics[0].id
            }
          }
        }
      }
    }

    // Update metadata if we found matches
    // Use skipClearing=true to set all three at once without clearing dependent fields
    if (matchedSectionId || matchedChapterId || matchedTopicId) {
      console.log(`[AutoMatch] Updating metadata for ${fileName}:`, {
        sectionId: matchedSectionId,
        chapterId: matchedChapterId,
        topicId: matchedTopicId,
      })
      
      updateQuestionMetadata(
        fileName,
        {
          sectionId: matchedSectionId,
          chapterId: matchedChapterId,
          topicId: matchedTopicId,
        },
        true // skipClearing - we're setting all at once during auto-matching
      )
      
      // Auto-expand the question so user can see the auto-selected values
      setExpandedQuestions((prev) => {
        const newSet = new Set(prev)
        newSet.add(fileName)
        return newSet
      })
    } else {
      console.log(`[AutoMatch] No matches found for ${fileName}`, {
        parsedSystem,
        parsedSubject,
        parsedTopic,
      })
    }
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
          const response = await sectionsService.getSections({ limit: 100, status: "ACTIVE" })
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
          const response = await sectionsService.getSections({ limit: 100, status: "ACTIVE" })
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
    updates: { sectionId?: string; chapterId?: string; topicId?: string },
    skipClearing = false // If true, don't clear dependent fields (used for auto-matching)
  ) => {
    setQuestionMetadata((prev) => {
      const current = prev[fileName] || { sectionId: "", chapterId: "", topicId: "" }
      const updated = { ...current, ...updates }
      
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
      }
      
      return { ...prev, [fileName]: updated }
    })
  }

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
        `Please select Topic for all questions. Missing for: ${missingTopics.map((r) => r.fileName).join(", ")}`,
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
          const questionSectionId = metadata.sectionId
          const questionChapterId = metadata.chapterId

          // Convert parsed question to the format needed for creation
          // The parsed question has stem as string, but we need to handle it properly
          const oldFormatData = {
            stem: result.questionData.stem, // This is a string from parser
            options: result.questionData.options,
            subject: result.questionData.subject,
            system: result.questionData.system,
            explanation: result.questionData.explanation, // This is already blocks
            perAnswerExplanations: result.questionData.perAnswerExplanations, // This is already blocks
            tags: result.questionData.tags || [],
            topicId: questionTopicId,
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
              topicId: questionTopicId,
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
          
          // Add sectionId and chapterId if available
          if (questionSectionId) {
            questionPayload.sectionId = questionSectionId
          }
          if (questionChapterId) {
            questionPayload.chapterId = questionChapterId
          }

          if (convertedBack.subject) questionPayload.subject = convertedBack.subject
          if (convertedBack.system) questionPayload.system = convertedBack.system
          if (convertedBack.tags && convertedBack.tags.length > 0) {
            questionPayload.tags = convertedBack.tags
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
              // Debug: Log table blocks to verify cells are preserved
              if (block.type === "TABLE" && block.data?.cells) {
                console.log("[BulkUpload] Saving table block with cells:", {
                  rows: block.data.rows,
                  cols: block.data.cols,
                  cellCount: Object.keys(block.data.cells || {}).length,
                  sampleCells: Object.entries(block.data.cells || {}).slice(0, 3),
                })
              }
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
    <Card className="p-6 shadow-lg border-2 border-dashed border-primary/30">
      <div className="space-y-4 min-h-0">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">Bulk Upload Markdown Questions</h3>
          <p className="text-sm text-muted-foreground">
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
                className="relative border-2 border-dashed border-border rounded-lg p-8 hover:bg-muted/30 transition-colors cursor-pointer"
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
                  <p className="font-semibold text-foreground mb-1">Drop multiple markdown files here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: .md files and image files (.jpg, .png, .gif, .webp, .svg)
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="relative border-2 border-dashed border-border rounded-lg p-8 hover:bg-muted/30 transition-colors cursor-pointer"
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
                  <p className="font-semibold text-foreground mb-1">Drop a directory here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Directory should contain .md files and an images/ folder with referenced images
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show upload area button when summary exists */}
        {summary && !isProcessing && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
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
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Processing files...</span>
            </div>
          </div>
        )}


        {/* Summary Report */}
        {summary && !isProcessing && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <h4 className="font-semibold text-foreground mb-3">Processing Summary</h4>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{summary.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
              </div>

              {/* Detailed Results with Question Content */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {summary.results.map((result, idx) => {
                  const isExpanded = expandedQuestions.has(result.fileName)
                  const metadata = questionMetadata[result.fileName] || { sectionId: "", chapterId: "", topicId: "" }
                  const questionChapters = metadata.sectionId ? (chapters[metadata.sectionId] || []) : []
                  const questionTopics = metadata.chapterId ? (topics[metadata.chapterId] || []) : []
                  const isLoadingChapters = metadata.sectionId ? (loadingChapters[metadata.sectionId] || false) : false
                  const isLoadingTopics = metadata.chapterId ? (loadingTopics[metadata.chapterId] || false) : false
                  
                  return (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-3 bg-card"
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-2">
                        {result.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : result.status === "error" ? (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-foreground">{result.fileName}</div>
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
                              <span className="text-xs text-muted-foreground">Question ID: {result.questionId}</span>
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
                            <div className="text-xs text-red-600 mt-1">{result.error}</div>
                          )}
                          {result.warnings && result.warnings.length > 0 && (
                            <div className="text-xs text-yellow-600 mt-1">
                              {result.warnings.join("; ")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Question Content (Expandable) */}
                      {result.status === "success" && result.questionData && isExpanded && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-border">
                          {/* System, Subject, Topic Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* System (Section) */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                System (Section) <span className="text-red-500">*</span>
                                {result.questionData.system && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (Parsed: {result.questionData.system})
                                  </span>
                                )}
                              </label>
                              <select
                                value={metadata.sectionId}
                                onChange={(e) => {
                                  updateQuestionMetadata(result.fileName, { sectionId: e.target.value })
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                disabled={isCreating || loadingSections}
                              >
                                <option value="">Select System...</option>
                                {sections.map((section) => (
                                  <option key={section.id} value={section.id}>
                                    {section.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Subject (Chapter) */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Subject (Chapter) <span className="text-red-500">*</span>
                                {result.questionData.subject && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (Parsed: {result.questionData.subject})
                                  </span>
                                )}
                              </label>
                              <select
                                value={metadata.chapterId}
                                onChange={(e) => {
                                  updateQuestionMetadata(result.fileName, { chapterId: e.target.value })
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                disabled={isCreating || isLoadingChapters || !metadata.sectionId}
                              >
                                <option value="">Select Subject...</option>
                                {questionChapters.map((chapter) => (
                                  <option key={chapter.id} value={chapter.id}>
                                    {chapter.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Topic */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Topic <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={metadata.topicId}
                                onChange={(e) => {
                                  updateQuestionMetadata(result.fileName, { topicId: e.target.value })
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                disabled={isCreating || isLoadingTopics || !metadata.chapterId}
                              >
                                <option value="">Select Topic...</option>
                                {questionTopics.map((topic) => (
                                  <option key={topic.id} value={topic.id}>
                                    {topic.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Question Preview */}
                          <div className="space-y-3">
                            {/* Subject & System */}
                            {(result.questionData.subject || result.questionData.system) && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground">Subject:</span>{" "}
                                <span className="text-muted-foreground">{result.questionData.subject || "N/A"}</span>
                                {" | "}
                                <span className="font-medium text-foreground">System:</span>{" "}
                                <span className="text-muted-foreground">{result.questionData.system || "N/A"}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {result.questionData.tags && result.questionData.tags.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-foreground">Tags:</span>{" "}
                                <span className="text-muted-foreground">
                                  {result.questionData.tags.join(", ")}
                                </span>
                              </div>
                            )}

                            {/* Question Stem Preview */}
                            <div>
                              <div className="text-sm font-medium text-foreground mb-2">Question Stem:</div>
                              <div className="p-3 rounded bg-muted/50 text-sm text-foreground/80 max-h-32 overflow-y-auto">
                                {result.questionData.stem ? (
                                  <div className="whitespace-pre-wrap">
                                    {result.questionData.stem.length > 200
                                      ? result.questionData.stem.substring(0, 200) + "..."
                                      : result.questionData.stem}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No stem content</span>
                                )}
                              </div>
                            </div>

                            {/* Options Preview */}
                            {result.questionData.options && result.questionData.options.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-foreground mb-2">Options:</div>
                                <div className="space-y-1">
                                  {result.questionData.options.map((opt: any, optIdx: number) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded text-sm ${
                                        opt.correct
                                          ? "bg-green-500/10 border border-green-500/30"
                                          : "bg-muted/50"
                                      }`}
                                    >
                                      <span className="font-medium">
                                        {opt.label}. {opt.correct && "✅ "}
                                      </span>
                                      <span className={opt.correct ? "text-green-600" : "text-foreground/80"}>
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
                                <div className="text-sm font-medium text-foreground mb-2">
                                  Main Explanation ({result.questionData.explanation.length} block
                                  {result.questionData.explanation.length > 1 ? "s" : ""}):
                                </div>
                                <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                                  Explanation content parsed successfully
                                </div>
                              </div>
                            )}

                            {/* Per-Answer Explanations Preview */}
                            {result.questionData.perAnswerExplanations &&
                              Object.keys(result.questionData.perAnswerExplanations).length > 0 && (
                                <div>
                                  <div className="text-sm font-medium text-foreground mb-2">
                                    Per-Answer Explanations:
                                  </div>
                                  <div className="text-xs text-muted-foreground">
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
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Creating questions...</span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-600 mb-1">Warnings</div>
                <ul className="text-xs text-yellow-700 dark:text-yellow-500 space-y-1 max-h-32 overflow-y-auto">
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
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-destructive mb-1">Errors</div>
                <ul className="text-xs text-destructive space-y-1">
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
    </Card>
  )
}

