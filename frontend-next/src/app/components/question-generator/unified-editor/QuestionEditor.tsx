"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import RichTextEditor from "./RichTextEditor"
import UnifiedToolbar from "./UnifiedToolbar"
import ImageUploadModal from "./ImageUploadModal"
import LinkModal from "./LinkModal"
import ExplanationBlockEditor from "./ExplanationBlockEditor"
import MetadataModal from "./MetadataModal"
import EditablePreview from "./EditablePreview"
import QuestionPanel from "../question-panel"
import ExplanationPanel from "../explanation-panel"
import UnifiedQuestionPreview from "../unified-question-preview"
import { SectionsService } from "@/app/services/content/sections.service"
import { ChaptersService } from "@/app/services/content/chapters.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { ProductTagsService } from "@/app/services/products/product-tags.service"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import { blocksToHTML, blocksToHTMLAsync, htmlToBlocks } from "./content-utils"
import { normalizeStemBlocksForDisplay } from "../stem-blocks-utils"
import PerAnswerExplanationEditor from "./PerAnswerExplanationEditor"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { Editor } from "@tiptap/react"
import { RotateCcw, Eye, EyeOff, Plus } from "lucide-react"
import { QuestionCreatorData } from "../question-creator/types"

interface QuestionEditorProps {
  initialData?: Partial<QuestionCreatorData>
  onSave: (data: QuestionCreatorData) => void
  onCancel: () => void
  onPreviewModeChange?: (isPreview: boolean) => void
}

export default function QuestionEditor({ initialData, onSave, onCancel, onPreviewModeChange }: QuestionEditorProps) {
  const [stemBlocks, setStemBlocks] = useState<ContentBlock[]>(() =>
    normalizeStemBlocksForDisplay(initialData?.stem || [])
  )
  const [choices, setChoices] = useState<Choice[]>(initialData?.choices || [])
  const [perAnswerExplanations, setPerAnswerExplanations] = useState<Record<string, ContentBlock[]>>(
    initialData?.perAnswerExplanations || {}
  )
  // Initialize main explanation blocks - convert from HTML if needed
  const [mainExplanationBlocks, setMainExplanationBlocks] = useState<ContentBlock[]>(() => {
    if (initialData?.mainExplanation && initialData.mainExplanation.length > 0) {
      return initialData.mainExplanation
    }
    // If no blocks but we have HTML content, convert it
    return []
  })
  const [metadata, setMetadata] = useState(initialData?.metadata || {})
  const [tagsInputValue, setTagsInputValue] = useState<string>(
    Array.isArray(initialData?.metadata?.tags) ? initialData!.metadata!.tags!.join(", ") : ""
  )
  const [subjectEditName, setSubjectEditName] = useState("")
  const [systemEditName, setSystemEditName] = useState("")
  const [topicEditName, setTopicEditName] = useState("")
  const [addMetaContext, setAddMetaContext] = useState<{
    type: "subject" | "chapter" | "topic"
  } | null>(null)
  const [addMetaName, setAddMetaName] = useState("")
  const [addMetaSectionId, setAddMetaSectionId] = useState("")
  const [addMetaError, setAddMetaError] = useState<string | null>(null)
  const [addMetaLoading, setAddMetaLoading] = useState(false)
  const [questionId, setQuestionId] = useState<string>("")

  const [activeSection, setActiveSection] = useState<"stem" | "explanation" | string | null>(null)
  const [activePerAnswerLabel, setActivePerAnswerLabel] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewSelectedAnswer, setPreviewSelectedAnswer] = useState<string | null>(null)

  // Notify parent when preview mode changes
  useEffect(() => {
    onPreviewModeChange?.(isPreviewMode)
  }, [isPreviewMode, onPreviewModeChange])

  // Listen for exit preview mode event from parent header
  useEffect(() => {
    const handleExitPreview = () => {
      setIsPreviewMode(false)
      onPreviewModeChange?.(false)
    }
    window.addEventListener("exitPreviewMode", handleExitPreview)
    return () => {
      window.removeEventListener("exitPreviewMode", handleExitPreview)
    }
  }, [onPreviewModeChange])
  const [imageModalContext, setImageModalContext] = useState<"stem" | "explanation" | "choice" | null>(null)
  const [showPerAnswerExplanations, setShowPerAnswerExplanations] = useState(true)
  const [expandedChoices, setExpandedChoices] = useState<Record<string, boolean>>({})

  const stemEditorRef = useRef<Editor | null>(null)
  const explanationEditorRef = useRef<Editor | null>(null)
  const perAnswerEditorRefs = useRef<Record<string, Editor | null>>({})
  const textBlockEditorRefs = useRef<Record<string, Editor | null>>({})

  const questionsService = new QuestionsService()
  const sectionsService = new SectionsService()
  const chaptersService = new ChaptersService()
  const topicsService = new TopicsService()
  const productTagsService = new ProductTagsService()

  // State for metadata names - initialize from initialData if available
  const [sectionName, setSectionName] = useState<string>("")
  const [chapterName, setChapterName] = useState<string>(initialData?.metadata?.system || "")
  const [topicName, setTopicName] = useState<string>("")
  const [subjectTagName, setSubjectTagName] = useState<string>("")

  // State for editable metadata dropdowns
  const [sections, setSections] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [productTags, setProductTags] = useState<any[]>([])
  const [showTagsDropdown, setShowTagsDropdown] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  
  // Track if metadata names have been fetched
  const [metadataNamesFetched, setMetadataNamesFetched] = useState(false)

  // Sections are not shown in UI; sectionId is derived from chapter or defaulted by backend

  // Load product tags on mount
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
  }, [])

  // Load sections on mount for creating new systems
  useEffect(() => {
    setLoadingSections(true)
    sectionsService
      .getSections({ status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setSections(data)
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize productTagIds from productTagId if present (for backward compatibility)
  useEffect(() => {
    if (initialData?.metadata?.productTagId && !metadata.productTagIds) {
      setMetadata((prev) => ({
        ...prev,
        productTagIds: [initialData.metadata!.productTagId!],
      }))
    }
  }, [initialData?.metadata?.productTagId])

  // Keep editable names in sync with current selections
  useEffect(() => {
    const selectedTagId = metadata.productTagId || (metadata.productTagIds && metadata.productTagIds[0])
    if (selectedTagId) {
      const tag = productTags.find((t) => t.id === selectedTagId)
      setSubjectEditName(tag?.name || "")
    } else {
      setSubjectEditName("")
    }
  }, [metadata.productTagId, metadata.productTagIds, productTags])

  useEffect(() => {
    if (metadata.chapterId) {
      const chapter = chapters.find((c: any) => c.id === metadata.chapterId)
      setSystemEditName(chapter?.name || "")
    } else {
      setSystemEditName("")
    }
  }, [metadata.chapterId, chapters])

  useEffect(() => {
    if (metadata.topicId) {
      const topic = topics.find((t: any) => t.id === metadata.topicId)
      setTopicEditName(topic?.name || "")
    } else {
      setTopicEditName("")
    }
  }, [metadata.topicId, topics])

  // Close tags dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.tags-dropdown-container')) {
        setShowTagsDropdown(false)
      }
    }
    if (showTagsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTagsDropdown])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load topics when chapter changes
  useEffect(() => {
    if (metadata.chapterId) {
      setLoadingTopics(true)
      topicsService
        .getTopics({ chapterId: metadata.chapterId, status: "ACTIVE" })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setTopics(data)
        })
        .catch(() => setTopics([]))
        .finally(() => setLoadingTopics(false))
    } else {
      setTopics([])
    }
  }, [metadata.chapterId])

  // Comprehensive metadata name fetching function
  const fetchMetadataNames = useCallback(async (metadataToUse: any) => {
    if (!metadataToUse) return

    const promises: Promise<any>[] = []

    // Fetch section name
    if (metadataToUse.sectionId) {
      promises.push(
        sectionsService.getSection(metadataToUse.sectionId)
          .then((section) => {
            setSectionName(section?.name || metadataToUse.system || "")
          })
          .catch(() => setSectionName(metadataToUse.system || ""))
      )
    } else if (metadataToUse.system) {
      setSectionName(metadataToUse.system)
    }

    // Fetch chapter name
    if (metadataToUse.chapterId) {
      promises.push(
        chaptersService.getChapter(metadataToUse.chapterId)
          .then((chapter) => {
            setChapterName(chapter?.name || metadataToUse.system || "")
          })
          .catch(() => setChapterName(metadataToUse.system || ""))
      )
    } else if (metadataToUse.subject) {
      setChapterName(metadataToUse.system || "")
    }

    // Fetch topic name
    if (metadataToUse.topicId) {
      promises.push(
        topicsService.getTopic(metadataToUse.topicId)
          .then((topic) => {
            setTopicName(topic?.name || "")
          })
          .catch(() => setTopicName(""))
      )
    }

    // Fetch tag name
    const selectedTagId = metadataToUse.productTagId || (metadataToUse.productTagIds && metadataToUse.productTagIds[0])
    if (selectedTagId) {
      // Use a ref or closure to access current productTags
      // Check if tag is already in productTags array (will be checked after productTags loads)
      // For now, fetch it directly
      promises.push(
        productTagsService.getTag(selectedTagId)
          .then((tag) => {
            if (tag) {
              setProductTags((prev) => {
                const existing = prev.find((t) => t.id === tag.id)
                if (existing) {
                  setSubjectTagName(existing.name || "")
                  return prev
                }
                setSubjectTagName(tag.name || "")
                return [...prev, tag]
              })
            }
          })
          .catch(() => {
            // If fetch fails, check if tag is in already loaded productTags
            const existingTag = productTags.find((t) => t.id === selectedTagId)
            if (existingTag) {
              setSubjectTagName(existingTag.name || "")
            }
          })
      )
    }

    await Promise.all(promises)
    setMetadataNamesFetched(true)
  }, [])

  // Fetch metadata names on mount if initialData exists
  useEffect(() => {
    if (initialData?.metadata && !metadataNamesFetched) {
      fetchMetadataNames(initialData.metadata)
    }
  }, [initialData?.metadata, metadataNamesFetched, fetchMetadataNames])

  // Fetch metadata names when metadata state changes or when entering preview mode
  useEffect(() => {
    const hasMetadata = metadata.chapterId || metadata.topicId || metadata.productTagId || metadata.productTagIds || metadata.subject || metadata.system || metadata.sectionId
    if (hasMetadata) {
      // Always fetch when entering preview mode, or if not fetched yet
      if (isPreviewMode || !metadataNamesFetched) {
        fetchMetadataNames(metadata)
      }
    }
  }, [metadata.chapterId, metadata.topicId, metadata.productTagId, metadata.productTagIds, metadata.subject, metadata.system, metadata.sectionId, metadataNamesFetched, isPreviewMode, fetchMetadataNames, metadata])

  // Handle metadata changes
  const handleChapterChange = (chapterId: string) => {
    const selectedChapter = chapters.find((c: any) => c.id === chapterId)
    const derivedSectionId = selectedChapter?.sectionId || selectedChapter?.section?.id
    setMetadata((prev) => ({
      ...prev,
      chapterId: chapterId || undefined,
      // Auto-map System from selected Chapter (frontend-only)
      sectionId: derivedSectionId || prev.sectionId,
      topicId: undefined,
    }))
  }

  const handleTopicChange = (topicId: string) => {
    setMetadata((prev) => ({
      ...prev,
      topicId: topicId || undefined,
    }))
  }

  const handleTagSelect = (productTagId: string) => {
    setMetadata((prev) => ({
      ...prev,
      // Single-select only
      productTagId: productTagId || undefined,
      productTagIds: productTagId ? [productTagId] : undefined,
    }))
  }
  
  const getSelectedTagName = () => {
    // First check if we have it in state
    if (subjectTagName) return subjectTagName
    
    // Then check productTags array
    const selectedId = metadata.productTagId || (metadata.productTagIds && metadata.productTagIds[0])
    if (!selectedId) return ""
    const selected = productTags.find((t) => t.id === selectedId)
    return selected?.name || ""
  }

  // Add new Subject/System/Topic to DB (same pattern as bulk DOCX uploader)
  const handleAddMetaSubmit = async () => {
    if (!addMetaContext) return
    const name = addMetaName.trim()
    if (!name) {
      setAddMetaError("Name is required")
      return
    }
    setAddMetaError(null)
    setAddMetaLoading(true)
    try {
      if (addMetaContext.type === "subject") {
        const res: any = await productTagsService.createTag({ name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list: any = await productTagsService.getTags({ status: "ACTIVE" })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setProductTags(data)
          setMetadata((prev) => ({
            ...prev,
            productTagId: id,
            productTagIds: [id],
            subject: name,
          }))
          setAddMetaContext(null)
        }
      } else if (addMetaContext.type === "chapter") {
        // Auto-assign to the default \"General Principles\" section when creating a new system
        const generalPrinciplesSection =
          sections.find((s: any) => typeof s.name === "string" && s.name.toLowerCase().includes("general principles")) ||
          sections[0]
        const sectionId = generalPrinciplesSection?.id
        if (!sectionId) {
          setAddMetaError("No default section available to attach this system.")
          setAddMetaLoading(false)
          return
        }
        const res: any = await chaptersService.createChapter({ sectionId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list: any = await chaptersService.getChapters({ status: "ACTIVE", listAll: true })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setChapters(data)
          setMetadata((prev) => ({
            ...prev,
            chapterId: id,
            sectionId,
            system: name,
            topicId: undefined,
          }))
          setAddMetaContext(null)
        }
      } else if (addMetaContext.type === "topic") {
        const chapterId = metadata.chapterId
        if (!chapterId) {
          setAddMetaError("Select a system first")
          setAddMetaLoading(false)
          return
        }
        const res: any = await topicsService.createTopic({ chapterId, name, isActive: true })
        const id = res?.id ?? (res?.data as any)?.id
        if (id) {
          const list = await topicsService.getTopics({ chapterId, status: "ACTIVE", listAll: true })
          const data = Array.isArray(list) ? list : (list as any)?.data || []
          setTopics(data)
          setMetadata((prev) => ({
            ...prev,
            topicId: id,
          }))
          setAddMetaContext(null)
        }
      }
    } catch (e: any) {
      const rawMessage = e?.message || e?.response?.data?.message || ""
      const lower = String(rawMessage).toLowerCase()
      if (lower.includes("already exists") || lower.includes("unique constraint")) {
        const label =
          addMetaContext.type === "subject"
            ? "Subject"
            : addMetaContext.type === "chapter"
            ? "System"
            : "Topic"
        setAddMetaError(`${label} with this name already exists.`)
      } else {
        setAddMetaError(rawMessage || "Failed to create")
      }
    } finally {
      setAddMetaLoading(false)
    }
  }

  // Update existing Subject/System/Topic names in DB
  const handleUpdateSubjectName = async () => {
    const selectedTagId = metadata.productTagId || (metadata.productTagIds && metadata.productTagIds[0])
    const name = subjectEditName.trim()
    if (!selectedTagId || !name) return
    try {
      await productTagsService.updateTag(selectedTagId, { name })
      const list: any = await productTagsService.getTags({ status: "ACTIVE" })
      const data = Array.isArray(list) ? list : (list as any)?.data || []
      setProductTags(data)
    } catch (e: any) {
      alert(e?.message || "Failed to update subject")
    }
  }

  const handleUpdateSystemName = async () => {
    const chapterId = metadata.chapterId
    const name = systemEditName.trim()
    if (!chapterId || !name) return
    try {
      await chaptersService.updateChapter(chapterId, { name })
      const list: any = await chaptersService.getChapters({ status: "ACTIVE", listAll: true })
      const data = Array.isArray(list) ? list : (list as any)?.data || []
      setChapters(data)
    } catch (e: any) {
      alert(e?.message || "Failed to update system")
    }
  }

  const handleUpdateTopicName = async () => {
    const topicId = metadata.topicId
    const name = topicEditName.trim()
    if (!topicId || !name) return
    try {
      const chapterId = metadata.chapterId
      await topicsService.updateTopic(topicId, { name, chapterId: chapterId as string })
      if (chapterId) {
        const list = await topicsService.getTopics({ chapterId, status: "ACTIVE", listAll: true })
        const data = Array.isArray(list) ? list : (list as any)?.data || []
        setTopics(data)
      }
    } catch (e: any) {
      alert(e?.message || "Failed to update topic")
    }
  }


  // Generate question ID based on chapter and topic (system removed from UI)
  const generateQuestionId = useCallback(() => {
    if (!metadata.chapterId || !metadata.topicId) {
      return "Q-XXXX-XXXX-XXXX"
    }

    const subjectAbbr = chapterName
      ? chapterName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
          .substring(0, 4)
      : "SUB"
    
    const topicIdPart = metadata.topicId.slice(-4).toUpperCase()
    return `Q-${subjectAbbr}-${topicIdPart}`
  }, [metadata.chapterId, metadata.topicId, chapterName])

  // Track if questionId was manually edited (including if it was loaded from saved data)
  const [isQuestionIdManuallyEdited, setIsQuestionIdManuallyEdited] = useState(false)
  
  // Initialize question ID from initial data or generate it
  // This should only run when initialData changes (e.g., when loading a question for editing)
  useEffect(() => {
    if (initialData?.metadata?.questionId) {
      // If there's a stored questionId, use it and mark as manually edited
      // This preserves manually edited questionIds when returning to edit mode
      setQuestionId(initialData.metadata.questionId)
      setIsQuestionIdManuallyEdited(true)
    } else {
      // Only generate if there's no stored questionId
      // This handles the case when creating a new question
      const generatedId = generateQuestionId()
      if (process.env.NODE_ENV === "development") {
        console.log("[QuestionEditor] Generating new questionId:", generatedId)
      }
      setQuestionId(generatedId)
      setIsQuestionIdManuallyEdited(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.metadata?.questionId]) // Only depend on initialData.questionId, not generateQuestionId
  
  // Update question ID when metadata changes (only if user hasn't manually edited it)
  // This should NOT run if we have a stored questionId from initialData
  useEffect(() => {
    // Only auto-generate if:
    // 1. User hasn't manually edited it, AND
    // 2. There's no stored questionId from initialData (to preserve saved questionIds)
    if (!isQuestionIdManuallyEdited && !initialData?.metadata?.questionId) {
      setQuestionId(generateQuestionId())
    }
  }, [generateQuestionId, isQuestionIdManuallyEdited, initialData?.metadata?.questionId])

  // Convert markdown blocks to HTML when stemBlocks are first loaded
  // This ensures that markdown content (from bulk upload) is properly rendered in edit mode
  const [hasConvertedStemBlocks, setHasConvertedStemBlocks] = useState(false)
  useEffect(() => {
    const convertStemBlocks = async () => {
      if (stemBlocks.length === 0 || hasConvertedStemBlocks) return
      
      // Check if any blocks have markdown that needs conversion
      const needsConversion = stemBlocks.some(block => {
        if (block.type === "text") {
          const html = block.data?.html || ""
          const markdown = block.data?.markdown || ""
          const isEmptyHtml = !html || 
            html.trim() === "" || 
            html.trim() === "<p></p>" || 
            html.trim() === "<p><br></p>" ||
            html.trim() === "<p> </p>" ||
            html.trim() === "<p><br/></p>" ||
            html.trim() === "<div></div>" ||
            html.trim() === "<div><br></div>"
          
          // Check if HTML contains raw markdown syntax
          const htmlInnerText = html.replace(/<[^>]+>/g, '').trim()
          const markdownPatterns = [
            /\*\*[^*]+\*\*/,
            /\*[^*\n]+\*/,
            /^[-*+]\s/m,
            /^\d+\.\s/m,
            /^#{1,6}\s/m,
          ]
          const containsMarkdownSyntax = !isEmptyHtml && markdownPatterns.some(pattern => 
            pattern.test(htmlInnerText) || pattern.test(html)
          )
          
          return (isEmptyHtml || containsMarkdownSyntax) && markdown && markdown.trim()
        }
        return false
      })
      
      if (!needsConversion) {
        setHasConvertedStemBlocks(true)
        return
      }
      
      // Convert markdown to HTML for all blocks that need it
      const updatedBlocks = await Promise.all(stemBlocks.map(async (block) => {
        if (block.type === "text") {
          const html = block.data?.html || ""
          const markdown = block.data?.markdown || ""
          
          const isEmptyHtml = !html || 
            html.trim() === "" || 
            html.trim() === "<p></p>" || 
            html.trim() === "<p><br></p>" ||
            html.trim() === "<p> </p>" ||
            html.trim() === "<p><br/></p>" ||
            html.trim() === "<div></div>" ||
            html.trim() === "<div><br></div>"
          
          const htmlInnerText = html.replace(/<[^>]+>/g, '').trim()
          const markdownPatterns = [
            /\*\*[^*]+\*\*/,
            /\*[^*\n]+\*/,
            /^[-*+]\s/m,
            /^\d+\.\s/m,
            /^#{1,6}\s/m,
          ]
          const containsMarkdownSyntax = !isEmptyHtml && markdownPatterns.some(pattern => 
            pattern.test(htmlInnerText) || pattern.test(html)
          )
          
          if ((isEmptyHtml || containsMarkdownSyntax) && markdown && markdown.trim()) {
            // Convert markdown to HTML using async conversion for proper rendering
            const convertedHtml = await blocksToHTMLAsync([block])
            return {
              ...block,
              data: {
                ...block.data,
                html: convertedHtml !== "<p></p>" ? convertedHtml : html,
              },
            }
          }
        }
        return block
      }))
      
      // Only update if blocks actually changed
      const hasChanges = updatedBlocks.some((block, index) => {
        const original = stemBlocks[index]
        return block.type === "text" && original.type === "text" && 
               block.data?.html !== original.data?.html
      })
      
      if (hasChanges) {
        setStemBlocks(updatedBlocks)
      }
      setHasConvertedStemBlocks(true)
    }
    
    convertStemBlocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.stem]) // Only run when initialData.stem changes (when question is loaded)

  // Get the active editor based on activeSection
  // This function should NOT call setState to avoid infinite loops
  const getActiveEditor = useCallback((): Editor | null => {
    // Collect all editors including per-answer explanations
    const allEditors = [
      { editor: stemEditorRef.current, section: "stem" },
      { editor: explanationEditorRef.current, section: "explanation" },
      // Include all per-answer explanation editors
      ...Object.entries(perAnswerEditorRefs.current)
        .filter(([_, editor]) => editor !== null)
        .map(([label, editor]) => ({
          editor: editor!,
          section: `per-answer-${label}`,
          label,
        })),
      // Include all text block editors (including table block editors)
      ...Object.entries(textBlockEditorRefs.current)
        .filter(([_, editor]) => editor !== null)
        .map(([blockId, editor]) => ({
          editor: editor!,
          section: `explanation-block-${blockId}`,
        })),
    ] as Array<{
      editor: Editor
      section: string
      label?: string
    }>

    // First, check which editor has focus (without updating state)
    // This is the most reliable way to detect the active editor
    for (const item of allEditors) {
      if (item.editor && item.editor.isFocused) {
        return item.editor
      }
    }

    // Fallback to activeSection-based detection
    if (activeSection === "stem" && stemEditorRef.current) {
      return stemEditorRef.current
    } else if (activeSection === "explanation") {
      // If there's a main explanation editor, use it
      if (explanationEditorRef.current) {
        return explanationEditorRef.current
      }
      // Otherwise, return the first text block editor if available
      const firstTextBlockEditor = Object.values(textBlockEditorRefs.current).find(editor => editor !== null)
      if (firstTextBlockEditor) {
        return firstTextBlockEditor
      }
    } else if (activeSection?.startsWith("per-answer-")) {
      // Try activePerAnswerLabel first
      if (activePerAnswerLabel && perAnswerEditorRefs.current[activePerAnswerLabel]) {
        return perAnswerEditorRefs.current[activePerAnswerLabel]
      }
      // Extract label from section string if activePerAnswerLabel is not set
      const label = activeSection.replace("per-answer-", "")
      if (label && perAnswerEditorRefs.current[label]) {
        return perAnswerEditorRefs.current[label]
      }
    } else if (activeSection?.startsWith("explanation-block-")) {
      const blockId = activeSection.replace("explanation-block-", "")
      const textBlockEditor = textBlockEditorRefs.current[blockId]
      if (textBlockEditor) {
        return textBlockEditor
      }
    }

    // Return the first available editor as last resort
    return allEditors[0]?.editor || stemEditorRef.current || explanationEditorRef.current || null
  }, [activeSection, activePerAnswerLabel])

  // Handler to set active section when editor is focused
  // Use a ref to prevent infinite loops
  const lastFocusedSectionRef = useRef<string | null>(null)
  const handleEditorFocus = useCallback((section: string, label?: string | null) => {
    // Only update if section actually changed
    if (lastFocusedSectionRef.current !== section) {
      lastFocusedSectionRef.current = section
      setActiveSection(section)
      if (label !== undefined) {
        setActivePerAnswerLabel(label)
      }
    }
  }, [])

  const handleInsertImage = useCallback(
    async (file: File) => {
      try {
        const result = await questionsService.uploadImage(file)
        const imageUrl = result.url

        const activeEditor = getActiveEditor()
        if (activeEditor) {
          activeEditor.chain().focus().setImage({ src: imageUrl }).run()
        }
      } catch (error) {
        console.error("Failed to upload image:", error)
        alert("Failed to upload image. Please try again.")
      }
    },
    [getActiveEditor, questionsService]
  )

  const handleInsertLink = useCallback(
    (url: string, text: string) => {
      const activeEditor = getActiveEditor()
      if (activeEditor) {
        if (text) {
          activeEditor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
        } else {
          activeEditor.chain().focus().setLink({ href: url }).run()
        }
      }
    },
    [getActiveEditor]
  )

  const handleInsertTable = useCallback(() => {
    const activeEditor = getActiveEditor()
    if (activeEditor) {
      // Insert table with proper structure
      activeEditor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    }
  }, [getActiveEditor])

  const handleSave = useCallback(() => {
    onSave({
      stem: stemBlocks,
      choices,
      perAnswerExplanations,
      mainExplanation: mainExplanationBlocks,
      metadata: {
        ...metadata,
        questionId,
      },
    })
  }, [stemBlocks, choices, perAnswerExplanations, mainExplanationBlocks, metadata, questionId, onSave])

  const handleChoiceChange = useCallback(
    (index: number, field: keyof Choice, value: any) => {
      const newChoices = [...choices]
      newChoices[index] = { ...newChoices[index], [field]: value }
      setChoices(newChoices)
    },
    [choices]
  )

  const handleAddChoice = useCallback(() => {
    const labels = ["A", "B", "C", "D", "E", "F", "G", "H"]
    const nextLabel = labels[choices.length] || String.fromCharCode(65 + choices.length)
    setChoices([
      ...choices,
      {
        label: nextLabel,
        text: "",
        correct: false,
        value: nextLabel,
      },
    ])
  }, [choices])

  const handleRemoveChoice = useCallback(
    (index: number) => {
      const choice = choices[index]
      if (choice) {
        // Remove per-answer explanation when choice is removed
        const newPerAnswerExplanations = { ...perAnswerExplanations }
        delete newPerAnswerExplanations[choice.label]
        setPerAnswerExplanations(newPerAnswerExplanations)
        delete perAnswerEditorRefs.current[choice.label]
      }
      setChoices(choices.filter((_, i) => i !== index))
    },
    [choices, perAnswerExplanations]
  )

  const handlePerAnswerExplanationChange = useCallback(
    (choiceLabel: string, html: string) => {
      // Preserve existing block IDs when converting HTML back to blocks
      const existingBlocks = perAnswerExplanations[choiceLabel] || []
      const newBlocks = htmlToBlocks(html, existingBlocks)
      setPerAnswerExplanations((prev) => ({
        ...prev,
        [choiceLabel]: newBlocks,
      }))
    },
    [perAnswerExplanations]
  )

  const handleAddTextBlock = useCallback(() => {
    const newBlock: ContentBlock = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "text",
      order: mainExplanationBlocks.length,
      data: {
        html: "<p></p>",
        markdown: "",
      },
    }
    setMainExplanationBlocks([...mainExplanationBlocks, newBlock])
    // Focus the new block
    setTimeout(() => {
      setActiveSection(`explanation-block-${newBlock.id}`)
    }, 100)
  }, [mainExplanationBlocks])

  const handleAddPerAnswerExplanations = useCallback(() => {
    // Check if a per-answer explanations block already exists
    const existingPerAnswerBlock = mainExplanationBlocks.find(
      (block) => block.type === "per-answer-explanation" && block.data?.allChoices === true
    )

    if (existingPerAnswerBlock) {
      return
    }

    // Add a single block that contains all per-answer explanations
    const newBlock: ContentBlock = {
      id: `per-answer-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "per-answer-explanation" as const,
      order: mainExplanationBlocks.length,
      data: {
        placeholder: true,
        isPerAnswerExplanation: true,
        allChoices: true,
      },
    }

    setMainExplanationBlocks([...mainExplanationBlocks, newBlock])
  }, [mainExplanationBlocks, choices])

  const canAddPerAnswerExplanations = 
    choices.length > 0 && 
    !mainExplanationBlocks.some(
      (block) => block.type === "per-answer-explanation" && block.data?.allChoices === true
    )

  // Always get the active editor - will return first available if none focused
  const activeEditor = getActiveEditor()

  // If in preview mode, show unified preview component
  if (isPreviewMode) {
    const questionData: QuestionCreatorData = {
      stem: stemBlocks,
      choices: choices,
      mainExplanation: mainExplanationBlocks,
      perAnswerExplanations: perAnswerExplanations,
      metadata: { ...metadata, questionId: questionId || metadata?.questionId },
    }

    return (
      <UnifiedQuestionPreview
        questionData={questionData}
        questionId={questionId || metadata?.questionId || undefined}
        onEdit={() => {
          setIsPreviewMode(false)
          onPreviewModeChange?.(false)
        }}
        onClose={() => {
          setIsPreviewMode(false)
          onPreviewModeChange?.(false)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Unified Toolbar */}
      <UnifiedToolbar
        editor={activeEditor}
        activeSection={activeSection}
        onInsertImage={() => {
          if (activeSection === "stem" || activeSection === "explanation" || activeSection?.startsWith("explanation-block-")) {
            setImageModalContext(activeSection === "stem" ? "stem" : "explanation")
            setShowImageModal(true)
          } else if (activeSection?.startsWith("per-answer-") && activePerAnswerLabel) {
            setImageModalContext("choice")
            setShowImageModal(true)
          }
        }}
        onInsertLink={() => {
          if (activeSection === "stem" || activeSection === "explanation" || activeSection?.startsWith("explanation-block-")) {
            setImageModalContext(activeSection === "stem" ? "stem" : "explanation")
            setShowLinkModal(true)
          } else if (activeSection?.startsWith("per-answer-") && activePerAnswerLabel) {
            setImageModalContext("choice")
            setShowLinkModal(true)
          }
        }}
        onInsertTable={handleInsertTable}
        onAddTextBlock={handleAddTextBlock}
        onAddPerAnswerExplanations={handleAddPerAnswerExplanations}
        canAddPerAnswerExplanations={canAddPerAnswerExplanations}
      />

      {/* Header with question ID and save/cancel */}
      <div className="flex-shrink-0 border-b p-4 bg-background dark:bg-gray-900 border-border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-muted-foreground dark:text-gray-300">Question ID:</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={questionId}
                  onChange={(e) => {
                    setQuestionId(e.target.value)
                    setIsQuestionIdManuallyEdited(true)
                  }}
                  className="text-sm font-mono font-bold w-48 bg-card dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-gray-100"
                  placeholder="Q-XXXX-XXXX-XXXX"
                />
                {isQuestionIdManuallyEdited && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsQuestionIdManuallyEdited(false)
                      setQuestionId(generateQuestionId())
                    }}
                    className="h-8 w-8 p-0"
                    title="Reset to auto-generated"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => {
              setIsPreviewMode(true)
              onPreviewModeChange?.(true)
            }}>
              Preview
            </Button>
            <Button onClick={handleSave} className="bg-primary dark:bg-blue-600 text-primary-foreground dark:text-white hover:bg-primary/90 dark:hover:bg-blue-700">
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen like student view */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4">
          {/* Left column - Question Stem and Choices */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
            <Card className="p-6 shadow-md border border-border/40 dark:border-gray-700 bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl h-full flex flex-col overflow-hidden">
              {/* Clinical Case panel: click anywhere to activate stem editor */}
              <div
                className="flex-shrink-0 mb-4 cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest("[contenteditable]")) return
                  setActiveSection("stem")
                  stemEditorRef.current?.chain().focus().run()
                }}
              >
                <h3 className="text-xs font-bold text-primary/70 dark:text-blue-400 uppercase tracking-widest">
                  Clinical Case
                </h3>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {/* Question Stem Editor */}
                <div
                  className={`flex-shrink-0 mb-1 rounded-lg ${activeSection === "stem" ? "ring-2 ring-primary" : ""}`}
                  onClickCapture={() => setActiveSection("stem")}
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    setActiveSection("stem")
                    if (!target.closest("[contenteditable]")) {
                      stemEditorRef.current?.chain().focus().run()
                    }
                  }}
                >
                  <RichTextEditor
                      content={blocksToHTML(stemBlocks)}
                      onChange={async (html) => {
                        // Preserve existing block IDs when converting HTML back to blocks
                        const newBlocks = htmlToBlocks(html, stemBlocks)
                        setStemBlocks(newBlocks)
                      }}
                      editorRef={(editor) => {
                        stemEditorRef.current = editor
                        if (editor) {
                          editor.on("focus", () => handleEditorFocus("stem"))
                        }
                      }}
                      placeholder="Enter the question stem..."
                      className=""
                    />
                </div>

                {/* Choices Editor */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-foreground dark:text-gray-100">Answer Options</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPerAnswerExplanations(!showPerAnswerExplanations)}
                        title={showPerAnswerExplanations ? "Hide Per-Answer Explanations" : "Show Per-Answer Explanations"}
                      >
                        {showPerAnswerExplanations ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {showPerAnswerExplanations ? "Hide" : "Show"} Explanations
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddChoice}
                      >
                        Add Choice
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {choices.map((choice, index) => {
                      const perAnswerBlocks = perAnswerExplanations[choice.label] || []
                      const isPerAnswerActive = activeSection === `per-answer-${choice.label}`
                      const isExpanded = expandedChoices[choice.label] ?? showPerAnswerExplanations
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg border border-border/50 dark:border-gray-700 bg-background/50 dark:bg-gray-800/50 cursor-pointer ${isPerAnswerActive ? "ring-2 ring-primary" : ""}`}
                            onClick={(e) => {
                              const target = e.target as HTMLElement
                              setActiveSection(`per-answer-${choice.label}`)
                              setActivePerAnswerLabel(choice.label)
                              if (!target.closest("input") && !target.closest("button") && !target.closest("[contenteditable]") && isExpanded) {
                                const editor = perAnswerEditorRefs.current[choice.label]
                                if (editor) setTimeout(() => editor.chain().focus().run(), 0)
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <Input
                                value={choice.label}
                                onChange={(e) => handleChoiceChange(index, "label", e.target.value)}
                                className="w-10 text-center font-bold bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 border-border dark:border-gray-700"
                              />
                              <input
                                type="checkbox"
                                checked={choice.correct}
                                onChange={(e) => handleChoiceChange(index, "correct", e.target.checked)}
                                className="w-4 h-4"
                                title="Correct answer"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                value={choice.text}
                                onChange={(e) => handleChoiceChange(index, "text", e.target.value)}
                                placeholder="Enter choice text..."
                                className="border-0 bg-transparent focus-visible:ring-1 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExpandedChoices(prev => ({
                                  ...prev,
                                  [choice.label]: !isExpanded
                                }))
                              }}
                              className="h-8 w-8 p-0"
                              title={isExpanded ? "Hide explanation" : "Show explanation"}
                            >
                              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveChoice(index)}
                              className="h-8 w-8 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          
                          {/* Per-Answer Explanation Editor */}
                          {isExpanded && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveSection(`per-answer-${choice.label}`)
                                setActivePerAnswerLabel(choice.label)
                                const target = e.target as HTMLElement
                                if (!target.closest("[contenteditable]")) {
                                  const editor = perAnswerEditorRefs.current[choice.label]
                                  if (editor) setTimeout(() => editor.chain().focus().run(), 0)
                                }
                              }}
                              className="border border-border/30 dark:border-gray-700 rounded-lg bg-muted/20 dark:bg-gray-800/20"
                            >
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground dark:text-gray-300">
                                  Explanation for {choice.label}
                                </Label>
                              </div>
                              <PerAnswerExplanationEditor
                                blocks={perAnswerBlocks}
                                onChange={(html) => {
                                  handlePerAnswerExplanationChange(choice.label, html)
                                }}
                                editorRef={(editor) => {
                                  perAnswerEditorRefs.current[choice.label] = editor
                                  if (editor) {
                                    // Set up focus handler
                                    editor.on("focus", () => {
                                      handleEditorFocus(`per-answer-${choice.label}`, choice.label)
                                    })
                                  }
                                }}
                                placeholder={`Enter explanation for option ${choice.label}...`}
                                className=""
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {choices.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground dark:text-gray-400 text-sm">
                        No choices added. Click &quot;Add Choice&quot; to add options.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column - Explanation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
            <div className="overflow-y-auto flex-1 pr-2">
              <Card 
                className="p-6 shadow-md border border-border/40 dark:border-gray-700 bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl h-full flex flex-col"
                onClick={(e) => {
                  // Only run when clicking empty area (not inside a specific block or metadata), so block clicks keep focus on that block
                  const target = e.target as HTMLElement
                  if (target.closest('[data-explanation-block]')) return
                  if (target.closest('[data-metadata]')) return
                  if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('[contenteditable]')) return
                  setActiveSection("explanation")
                  if (mainExplanationBlocks.length > 0) {
                    const firstBlock = mainExplanationBlocks[0]
                    const firstBlockEditor = textBlockEditorRefs.current[firstBlock.id]
                    if (firstBlockEditor) {
                      setTimeout(() => firstBlockEditor.chain().focus().run(), 50)
                    }
                  }
                }}
              >
                <div className="flex-shrink-0 mb-4">
                  <h3 className="text-xs font-bold text-primary/70 dark:text-blue-400 uppercase tracking-widest">
                    Explanation
                  </h3>
                </div>
                
                <div className="flex-1 min-h-0 overflow-y-auto explanation-container">
                  <div className="space-y-6">
                    <ExplanationBlockEditor
                      blocks={mainExplanationBlocks}
                      onChange={setMainExplanationBlocks}
                      choices={choices}
                      perAnswerExplanations={perAnswerExplanations}
                      onPerAnswerExplanationChange={(choiceLabel, blocks) => {
                        // Use the same handler as left panel to ensure synchronization
                        setPerAnswerExplanations((prev) => ({
                          ...prev,
                          [choiceLabel]: blocks,
                        }))
                      }}
                      activeSection={activeSection}
                      activePerAnswerLabel={activePerAnswerLabel}
                      onSectionChange={(section, perAnswerLabel) => {
                        setActiveSection(section)
                        setActivePerAnswerLabel(perAnswerLabel || null)
                      }}
                      onInsertImage={(choiceLabel) => {
                        setImageModalContext(choiceLabel ? "choice" : "explanation")
                        setActivePerAnswerLabel(choiceLabel || null)
                        setShowImageModal(true)
                      }}
                      onInsertLink={(choiceLabel) => {
                        setImageModalContext(choiceLabel ? "choice" : "explanation")
                        setActivePerAnswerLabel(choiceLabel || null)
                        setShowLinkModal(true)
                      }}
                      onInsertTable={handleInsertTable}
                      editorRefs={{
                        main: explanationEditorRef,
                        perAnswer: perAnswerEditorRefs,
                        textBlocks: textBlockEditorRefs,
                      }}
                    />

                    {/* Metadata (Subject/Chapters/Topic) - clicks here must not switch to explanation block */}
                    <div className="border-t border-border/40 dark:border-gray-700 pt-6 mt-6" data-metadata>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Subject */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            Subject
                          </div>
                          <div className="flex gap-2 mb-1">
                            <select
                              value={
                                metadata.productTagId || (metadata.productTagIds && metadata.productTagIds[0]) || ""
                              }
                              onChange={(e) => handleTagSelect(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              disabled={loadingTags}
                            >
                              <option value="">Select Subject...</option>
                              {productTags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                  {tag.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              onClick={() => {
                                setAddMetaContext({ type: "subject" })
                                setAddMetaName("")
                                setAddMetaSectionId("")
                                setAddMetaError(null)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            type="text"
                            value={subjectEditName}
                            onChange={(e) => setSubjectEditName(e.target.value)}
                            placeholder="Edit selected subject name"
                            className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100"
                          />
                          <div className="flex justify-end mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!metadata.productTagId && !(metadata.productTagIds && metadata.productTagIds[0])}
                              onClick={handleUpdateSubjectName}
                            >
                              Save Subject
                            </Button>
                          </div>
                        </div>
                        {/* Chapters */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            System
                          </div>
                          <div className="flex gap-2 mb-1">
                            <select
                              value={metadata.chapterId || ""}
                              onChange={(e) => handleChapterChange(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              disabled={loadingChapters}
                            >
                              <option value="">Select System...</option>
                              {chapters.map((chapter) => (
                                <option key={chapter.id} value={chapter.id}>
                                  {chapter.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              onClick={() => {
                                setAddMetaContext({ type: "chapter" })
                                setAddMetaName("")
                                setAddMetaSectionId(sections[0]?.id || "")
                                setAddMetaError(null)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            type="text"
                            value={systemEditName}
                            onChange={(e) => setSystemEditName(e.target.value)}
                            placeholder="Edit selected system name"
                            className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100"
                          />
                          <div className="flex justify-end mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!metadata.chapterId}
                              onClick={handleUpdateSystemName}
                            >
                              Save System
                            </Button>
                          </div>
                        </div>
                        {/* Topic */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            Topic
                          </div>
                          <div className="flex gap-2 mb-1">
                            <select
                              value={metadata.topicId || ""}
                              onChange={(e) => handleTopicChange(e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              disabled={loadingTopics || !metadata.chapterId}
                            >
                              <option value="">Select Topic...</option>
                              {topics.map((topic) => (
                                <option key={topic.id} value={topic.id}>
                                  {topic.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              disabled={!metadata.chapterId}
                              title={!metadata.chapterId ? "Select system first" : "Add topic to database"}
                              onClick={() => {
                                if (!metadata.chapterId) return
                                setAddMetaContext({ type: "topic" })
                                setAddMetaName("")
                                setAddMetaError(null)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <input
                            type="text"
                            value={topicEditName}
                            onChange={(e) => setTopicEditName(e.target.value)}
                            placeholder="Edit selected topic name"
                            className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100"
                          />
                          <div className="flex justify-end mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!metadata.topicId}
                              onClick={handleUpdateTopicName}
                            >
                              Save Topic
                            </Button>
                          </div>
                          {!metadata.chapterId && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Select System first</p>
                          )}
                        </div>
                      </div>
                      {/* Tags (editable by admin) */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                          Tags
                        </div>
                        <input
                          type="text"
                          value={tagsInputValue}
                          onChange={(e) => {
                            const v = e.target.value
                            setTagsInputValue(v)
                            const arr = v.split(",").map((t) => t.trim()).filter(Boolean)
                            setMetadata((prev) => ({ ...prev, tags: arr }))
                          }}
                          placeholder="e.g. CAH, Congenital Adrenal Hyperplasia, Enzyme Deficiency (comma-separated)"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 placeholder-muted-foreground dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Free-text labels for this question. Shown in the question list.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Preview Section - Editable like student mode */}
        <div className="flex-shrink-0 border-t p-4 bg-background dark:bg-gray-900 border-border dark:border-gray-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground dark:text-gray-100">Preview (Editable)</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400">This preview syncs bidirectionally with the explanation above</p>
          </div>
          <div className="border rounded-lg p-4 bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm border-border dark:border-gray-700">
            <EditablePreview
              blocks={mainExplanationBlocks}
              perAnswerExplanations={perAnswerExplanations}
              choices={choices}
              onChange={(blocks) => {
                setMainExplanationBlocks(blocks)
              }}
              onPerAnswerChange={(choiceLabel, blocks) => {
                setPerAnswerExplanations((prev) => ({
                  ...prev,
                  [choiceLabel]: blocks,
                }))
              }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {addMetaContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-4 border border-border">
            <h3 className="text-sm font-semibold mb-3">
              {addMetaContext.type === "subject" && "Add Subject"}
              {addMetaContext.type === "chapter" && "Add System"}
              {addMetaContext.type === "topic" && "Add Topic"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded text-sm"
                  value={addMetaName}
                  onChange={(e) => setAddMetaName(e.target.value)}
                  placeholder={
                    addMetaContext.type === "subject"
                      ? "New subject name"
                      : addMetaContext.type === "chapter"
                      ? "New system name"
                      : "New topic name"
                  }
                />
              </div>
              {addMetaError && <p className="text-xs text-red-600">{addMetaError}</p>}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddMetaContext(null)
                  setAddMetaError(null)
                }}
                disabled={addMetaLoading}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddMetaSubmit} disabled={addMetaLoading}>
                {addMetaLoading ? <RotateCcw className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <MetadataModal
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        onSave={(newMetadata) => {
          const chapter = chapters.find((c: any) => c.id === newMetadata.chapterId)
          const derivedSectionId = chapter?.sectionId || chapter?.section?.id
          setMetadata((prev) => ({ ...prev, ...newMetadata, sectionId: derivedSectionId || prev.sectionId }))
        }}
        initialMetadata={metadata}
      />
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false)
          setImageModalContext(null)
        }}
        onUpload={handleInsertImage}
      />
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false)
          setImageModalContext(null)
        }}
        onSubmit={handleInsertLink}
      />
    </div>
  )
}

