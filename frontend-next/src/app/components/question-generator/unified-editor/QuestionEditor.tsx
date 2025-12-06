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
import { SectionsService } from "@/app/services/content/sections.service"
import { ChaptersService } from "@/app/services/content/chapters.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { ProductTagsService } from "@/app/services/products/product-tags.service"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import { blocksToHTML, htmlToBlocks } from "./content-utils"
import PerAnswerExplanationEditor from "./PerAnswerExplanationEditor"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { Editor } from "@tiptap/react"
import { RotateCcw, Eye, EyeOff } from "lucide-react"

interface QuestionEditorProps {
  initialData?: {
    stem?: ContentBlock[]
    choices?: Choice[]
    perAnswerExplanations?: Record<string, ContentBlock[]>
    mainExplanation?: ContentBlock[]
    metadata?: {
      subject?: string
      system?: string
      sectionId?: string
      chapterId?: string
      topicId?: string
      productTagId?: string
      productTagIds?: string[]
      tags?: string[]
      questionId?: string
    }
  }
  onSave: (data: {
    stem: ContentBlock[]
    choices: Choice[]
    perAnswerExplanations: Record<string, ContentBlock[]>
    mainExplanation: ContentBlock[]
    metadata: {
      subject?: string
      system?: string
      sectionId?: string
      chapterId?: string
      topicId?: string
      productTagId?: string
      productTagIds?: string[]
      tags?: string[]
      questionId?: string
    }
  }) => void
  onCancel: () => void
}

export default function QuestionEditor({ initialData, onSave, onCancel }: QuestionEditorProps) {
  const [stemBlocks, setStemBlocks] = useState<ContentBlock[]>(initialData?.stem || [])
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
  const [questionId, setQuestionId] = useState<string>("")

  const [activeSection, setActiveSection] = useState<"stem" | "explanation" | string | null>(null)
  const [activePerAnswerLabel, setActivePerAnswerLabel] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewSelectedAnswer, setPreviewSelectedAnswer] = useState<string | null>(null)
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

  // State for metadata names
  const [sectionName, setSectionName] = useState<string>("")
  const [chapterName, setChapterName] = useState<string>("")
  const [topicName, setTopicName] = useState<string>("")

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
  }, [])

  // Load product tags on mount
  useEffect(() => {
    setLoadingTags(true)
    productTagsService
      .getTags({ limit: 100, status: "ACTIVE" })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setProductTags(data)
      })
      .catch(() => setProductTags([]))
      .finally(() => setLoadingTags(false))
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

  // Load chapters when section changes
  useEffect(() => {
    if (metadata.sectionId) {
      setLoadingChapters(true)
      chaptersService
        .getChapters({ sectionId: metadata.sectionId, limit: 100, status: "ACTIVE" })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setChapters(data)
        })
        .catch(() => setChapters([]))
        .finally(() => setLoadingChapters(false))
    } else {
      setChapters([])
    }
  }, [metadata.sectionId])

  // Load topics when chapter changes
  useEffect(() => {
    if (metadata.chapterId) {
      setLoadingTopics(true)
      topicsService
        .getTopics({ chapterId: metadata.chapterId, limit: 100, status: "ACTIVE" })
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

  // Fetch metadata names when IDs change
  useEffect(() => {
    if (metadata.sectionId) {
      sectionsService
        .getSection(metadata.sectionId)
        .then((section) => {
          setSectionName(section?.name || metadata.system || "")
        })
        .catch(() => setSectionName(metadata.system || ""))
    } else {
      setSectionName(metadata.system || "")
    }
  }, [metadata.sectionId, metadata.system])

  useEffect(() => {
    if (metadata.chapterId) {
      chaptersService
        .getChapter(metadata.chapterId)
        .then((chapter) => {
          setChapterName(chapter?.name || metadata.subject || "")
        })
        .catch(() => setChapterName(metadata.subject || ""))
    } else {
      setChapterName(metadata.subject || "")
    }
  }, [metadata.chapterId, metadata.subject])

  useEffect(() => {
    if (metadata.topicId) {
      topicsService
        .getTopic(metadata.topicId)
        .then((topic) => {
          setTopicName(topic?.name || "")
        })
        .catch(() => setTopicName(""))
    } else {
      setTopicName("")
    }
  }, [metadata.topicId])

  // Handle metadata changes
  const handleSectionChange = (sectionId: string) => {
    setMetadata((prev) => ({
      ...prev,
      sectionId: sectionId || undefined,
      chapterId: undefined,
      topicId: undefined,
    }))
  }

  const handleChapterChange = (chapterId: string) => {
    setMetadata((prev) => ({
      ...prev,
      chapterId: chapterId || undefined,
      topicId: undefined,
    }))
  }

  const handleTopicChange = (topicId: string) => {
    setMetadata((prev) => ({
      ...prev,
      topicId: topicId || undefined,
    }))
  }

  const handleTagToggle = (productTagId: string) => {
    setMetadata((prev) => {
      const currentTagIds = prev.productTagIds || []
      const isSelected = currentTagIds.includes(productTagId)
      
      const newTagIds = isSelected
        ? currentTagIds.filter((id) => id !== productTagId)
        : [...currentTagIds, productTagId]
      
      return {
        ...prev,
        productTagIds: newTagIds.length > 0 ? newTagIds : undefined,
        // Keep productTagId for backward compatibility (use first selected tag)
        productTagId: newTagIds.length > 0 ? newTagIds[0] : undefined,
      }
    })
  }
  
  const getSelectedTagNames = () => {
    const selectedIds = metadata.productTagIds || []
    return productTags
      .filter((tag) => selectedIds.includes(tag.id))
      .map((tag) => tag.name)
      .join(", ")
  }

  // Generate question ID based on system, subject, and topic
  const generateQuestionId = useCallback(() => {
    if (!metadata.sectionId || !metadata.chapterId || !metadata.topicId) {
      return "Q-XXXX-XXXX-XXXX"
    }

    // Get abbreviations from names
    const systemAbbr = sectionName
      ? sectionName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
          .substring(0, 4)
      : "SYS"
    
    const subjectAbbr = chapterName
      ? chapterName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
          .substring(0, 4)
      : "SUB"
    
    const topicAbbr = topicName
      ? topicName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
          .substring(0, 4)
      : "TOP"

    // Use last 4 characters of IDs as unique identifiers
    const systemId = metadata.sectionId.slice(-4).toUpperCase()
    const subjectId = metadata.chapterId.slice(-4).toUpperCase()
    const topicId = metadata.topicId.slice(-4).toUpperCase()

    return `Q-${systemAbbr}-${subjectAbbr}-${topicId}`
  }, [metadata.sectionId, metadata.chapterId, metadata.topicId, sectionName, chapterName, topicName])

  // Track if questionId was manually edited (including if it was loaded from saved data)
  const [isQuestionIdManuallyEdited, setIsQuestionIdManuallyEdited] = useState(false)
  
  // Initialize question ID from initial data or generate it
  // This should only run when initialData changes (e.g., when loading a question for editing)
  useEffect(() => {
    if (initialData?.metadata?.questionId) {
      // If there's a stored questionId, use it and mark as manually edited
      // This preserves manually edited questionIds when returning to edit mode
      if (process.env.NODE_ENV === "development") {
        console.log("[QuestionEditor] Loading stored questionId:", initialData.metadata.questionId)
      }
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
    } else if (activeSection === "explanation" && explanationEditorRef.current) {
      return explanationEditorRef.current
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

  // If in preview mode, show student view
  if (isPreviewMode) {
    return (
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="flex-shrink-0 border-b p-4 bg-background dark:bg-gray-900 border-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">Preview - Student Mode</h2>
              {questionId && (
                <span className="text-sm font-mono font-bold text-foreground dark:text-gray-100 bg-card dark:bg-gray-800 px-3 py-1.5 rounded border border-border dark:border-gray-700">
                  {questionId}
                </span>
              )}
            </div>
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              Back to Edit
            </Button>
          </div>
        </div>

        {/* Student View Layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4">
            {/* Left column - Question */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
              <QuestionPanel
                question={{
                  questionStemBlocks: stemBlocks,
                  stem: blocksToHTML(stemBlocks),
                  options: choices.map((choice) => ({
                    label: choice.label,
                    value: choice.value,
                    text: choice.text,
                    correct: choice.correct,
                  })),
                }}
                selectedAnswer={previewSelectedAnswer}
                answered={previewSelectedAnswer !== null}
                onSelectAnswer={(option) => setPreviewSelectedAnswer(option)}
                isPreviewMode={true}
              />
            </div>

            {/* Right column - Explanation */}
            <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
              <ExplanationPanel
                correct={previewSelectedAnswer !== null && choices.find((c) => c.value === previewSelectedAnswer)?.correct === true}
                selectedAnswer={previewSelectedAnswer}
                explanation={mainExplanationBlocks}
                perAnswerExplanations={perAnswerExplanations}
                options={choices.map((choice) => ({
                  label: choice.label,
                  text: choice.text,
                  correct: choice.correct,
                }))}
                subject={chapterName || metadata.subject}
                system={sectionName || metadata.system}
                topic={topicName || (metadata.topicId ? { name: topicName } : undefined)}
                correctAnswerLabel={choices.find((c) => c.correct)?.label || "C"}
              />
            </div>
          </div>
        </div>
      </div>
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
            <Button variant="outline" onClick={() => setIsPreviewMode(true)}>
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
              <div className="flex-shrink-0 mb-4">
                <h3 className="text-xs font-bold text-primary/70 dark:text-blue-400 uppercase tracking-widest">
                  Clinical Case
                </h3>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {/* Question Stem Editor */}
                <div className="flex-shrink-0 mb-4">
                  <div
                    onClick={() => setActiveSection("stem")}
                    className={activeSection === "stem" ? "ring-2 ring-primary rounded-lg" : ""}
                  >
                    <RichTextEditor
                      content={blocksToHTML(stemBlocks)}
                      onChange={(html) => {
                        // Preserve existing block IDs when converting HTML back to blocks
                        setStemBlocks(htmlToBlocks(html, stemBlocks))
                      }}
                      editorRef={(editor) => {
                        stemEditorRef.current = editor
                        if (editor) {
                          // Set up focus handler
                          editor.on("focus", () => {
                            handleEditorFocus("stem")
                          })
                        }
                      }}
                      placeholder="Enter the question stem..."
                      className="min-h-[100px]"
                    />
                  </div>
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
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 dark:border-gray-700 bg-background/50 dark:bg-gray-800/50">
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
                              onClick={() => {
                                setActiveSection(`per-answer-${choice.label}`)
                                setActivePerAnswerLabel(choice.label)
                              }}
                              className={isPerAnswerActive ? "ring-2 ring-primary rounded-lg" : "border border-border/30 dark:border-gray-700 rounded-lg bg-muted/20 dark:bg-gray-800/20"}
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
                                className="min-h-[80px]"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {choices.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground dark:text-gray-400 text-sm">
                        No choices added. Click "Add Choice" to add options.
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
              <Card className="p-6 shadow-md border border-border/40 dark:border-gray-700 bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl h-full flex flex-col">
                <div className="flex-shrink-0 mb-4">
                  <h3 className="text-xs font-bold text-primary/70 dark:text-blue-400 uppercase tracking-widest">
                    Explanation
                  </h3>
                </div>
                
                <div className="flex-1 min-h-0 overflow-y-auto">
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

                    {/* System, Subject, Topic, Tags at the end - Editable */}
                    <div className="border-t border-border/40 dark:border-gray-700 pt-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            System
                          </div>
                          <select
                            value={metadata.sectionId || ""}
                            onChange={(e) => handleSectionChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={loadingSections}
                          >
                            <option value="">Select System...</option>
                            {sections.map((section) => (
                              <option key={section.id} value={section.id}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="relative tags-dropdown-container">
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            Tags
                          </div>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left flex items-center justify-between hover:bg-muted dark:hover:bg-gray-700"
                              disabled={loadingTags}
                            >
                              <span className="truncate">
                                {metadata.productTagIds && metadata.productTagIds.length > 0
                                  ? getSelectedTagNames() || "Select Tags..."
                                  : "Select Tags..."}
                              </span>
                              <span className="ml-2 text-muted-foreground dark:text-gray-400">
                                {showTagsDropdown ? "▲" : "▼"}
                              </span>
                            </button>
                            {showTagsDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-card dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {loadingTags ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground dark:text-gray-400">
                                    Loading tags...
                                  </div>
                                ) : productTags.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground dark:text-gray-400">
                                    No tags available
                                  </div>
                                ) : (
                                  <div className="py-1">
                                    {productTags.map((tag) => {
                                      const isSelected = metadata.productTagIds?.includes(tag.id) || false
                                      return (
                                        <label
                                          key={tag.id}
                                          className="flex items-center px-3 py-2 hover:bg-muted/50 dark:hover:bg-gray-700 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleTagToggle(tag.id)}
                                            className="mr-2 h-4 w-4 rounded border-border dark:border-gray-600 text-primary focus:ring-primary"
                                          />
                                          <span className="text-sm text-foreground dark:text-gray-100">{tag.name}</span>
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {metadata.productTagIds && metadata.productTagIds.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {productTags
                                .filter((tag) => metadata.productTagIds?.includes(tag.id))
                                .map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary"
                                  >
                                    {tag.name}
                                    <button
                                      type="button"
                                      onClick={() => handleTagToggle(tag.id)}
                                      className="ml-1 hover:text-primary/80 dark:hover:text-blue-400 text-foreground dark:text-gray-200"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            Subject
                          </div>
                          <select
                            value={metadata.chapterId || ""}
                            onChange={(e) => handleChapterChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={loadingChapters || !metadata.sectionId}
                          >
                            <option value="">Select Subject...</option>
                            {chapters.map((chapter) => (
                              <option key={chapter.id} value={chapter.id}>
                                {chapter.name}
                              </option>
                            ))}
                          </select>
                          {!metadata.sectionId && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Select System first</p>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground dark:text-gray-300 uppercase tracking-wide mb-1">
                            Topic
                          </div>
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
                          {!metadata.chapterId && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Select Subject first</p>
                          )}
                        </div>
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
      <MetadataModal
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        onSave={(newMetadata) => {
          setMetadata(newMetadata)
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

