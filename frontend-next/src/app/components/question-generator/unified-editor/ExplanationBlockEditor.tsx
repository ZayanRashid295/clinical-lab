"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import RichTextEditor from "./RichTextEditor"
import PerAnswerExplanationEditor from "./PerAnswerExplanationEditor"
import AdvancedTableEditor from "../advanced-table-editor"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"
import { ChevronUp, ChevronDown, X, MessageSquare } from "lucide-react"
import { blocksToHTML, htmlToBlocks } from "./content-utils"
import { Editor } from "@tiptap/react"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { memo, useMemo } from "react"

// Helper to convert markdown table to HTML (moved outside to prevent recreation)
async function convertMarkdownTableToHTML(markdown: string): Promise<string> {
  try {
    if (!markdown || !markdown.trim()) {
      return ""
    }
    
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
    
    let html = String(file)
    html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
    html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
    html = html.trim()
    
    if (html.includes("<table")) {
      const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
      if (tableMatch) {
        return tableMatch[0]
      }
    }
    
    return html
  } catch (error) {
    console.error("Error converting markdown table to HTML:", error)
    return ""
  }
}

// Stable component for table editing - memoized to prevent unnecessary re-renders
const TableBlockEditor = memo(({
  blockId,
  blockHtml,
  detectedTable,
  onTableChange,
  editorRef,
}: {
  blockId: string
  blockHtml: string
  detectedTable: { isTable: boolean; tableMarkdown?: string }
  onTableChange: (payload: { html: string; markdown: string }) => void
  editorRef: (editor: Editor | null) => void
}) => {
  const [tableHtml, setTableHtml] = useState<string>(() => {
    // Initialize with existing HTML if available
    if (blockHtml && blockHtml.includes("<table")) {
      return blockHtml
    }
    return ""
  })
  const [isConverting, setIsConverting] = useState(false)
  const hasConvertedRef = useRef(false)
  
  // Use stable initial content - only update if blockHtml actually changed significantly
  // MUST be called before any early returns to follow rules of hooks
  const stableInitialContent = useMemo(() => {
    // Prefer local state (tableHtml) which is only updated when we convert or user edits
    // Only fall back to blockHtml if tableHtml is empty
    if (tableHtml && tableHtml.includes("<table")) {
      return tableHtml
    }
    if (blockHtml && blockHtml.includes("<table")) {
      return blockHtml
    }
    return ""
  }, [tableHtml, blockHtml]) // Include blockHtml in deps for initial load
  
  // Stable onChange handler - memoized to prevent re-renders
  // MUST be called before any early returns to follow rules of hooks
  const handleChange = useCallback((payload: { html: string; markdown: string }) => {
    setTableHtml(payload.html) // Update local state
    onTableChange(payload)
  }, [onTableChange])
  
  useEffect(() => {
    // Only convert once
    if (hasConvertedRef.current) return
    
    // If we have HTML table already, use it
    if (blockHtml && blockHtml.includes("<table")) {
      setTableHtml(blockHtml)
      hasConvertedRef.current = true
      return
    }
    
    // If we detected a markdown table, convert it (only once)
    if (detectedTable.isTable && detectedTable.tableMarkdown && !hasConvertedRef.current) {
      hasConvertedRef.current = true
      setIsConverting(true)
      convertMarkdownTableToHTML(detectedTable.tableMarkdown).then((html) => {
        if (html && html.includes("<table")) {
          setTableHtml(html)
          // Save the converted HTML immediately
          onTableChange({
            html: html,
            markdown: detectedTable.tableMarkdown || "",
          })
        }
        setIsConverting(false)
      }).catch((error) => {
        console.error("Failed to convert markdown table:", error)
        setIsConverting(false)
      })
    }
  }, [blockHtml, detectedTable, onTableChange]) // Include dependencies
  
  // Early returns AFTER all hooks
  if (isConverting) {
    return (
      <div className="border border-border rounded-md p-4 bg-muted/40 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Converting markdown table...</p>
      </div>
    )
  }
  
  if (!stableInitialContent || !stableInitialContent.includes("<table")) {
    return (
      <div className="border border-border rounded-md p-4 bg-muted/40 min-h-[200px]">
        <p className="text-sm text-muted-foreground">No table content</p>
      </div>
    )
  }
  
  return (
    <AdvancedTableEditor
      key={blockId} // Use blockId as key to prevent re-creation
      initialContent={stableInitialContent}
      initialFormat="html"
      onChange={handleChange}
      className="min-h-[200px]"
      showToolbar={false}
      editorRef={editorRef}
    />
  )
})

TableBlockEditor.displayName = "TableBlockEditor"

// Helper function to normalize list HTML and remove excessive spacing
function normalizeListHTML(html: string): string {
  if (!html || !html.includes('<li')) return html
  
  let normalized = html
  
  // Remove <p> tags inside <li> elements (TipTap doesn't use them, they cause spacing issues)
  // But preserve nested <ul>/<ol> structures inside <li>
  // Use a more sophisticated approach that handles nested lists correctly
  const processListItem = (content: string): string => {
    // First, check if this content contains nested lists - if so, preserve them
    const hasNestedList = /<[uo]l[\s>]/.test(content)
    
    if (hasNestedList) {
      // For items with nested lists, be more careful
      // Remove <p> tags but preserve the nested list structure
      let cleaned = content
        // Remove <p> tags that wrap everything (but not nested lists)
        .replace(/^<p[^>]*>([\s\S]*?)<\/p>$/gi, '$1')
        // Remove <p> tags that are direct children (but preserve nested lists)
        .replace(/<p[^>]*>([^<]*(?:<[uo]l[\s\S]*?<\/[uo]l>)?[^<]*)<\/p>/gi, '$1')
        // Remove standalone <p> tags (not containing lists)
        .replace(/<p[^>]*>([^<]*)<\/p>/gi, '$1')
        // Remove <div> tags
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, '')
          // Normalize whitespace but preserve list structure
          .replace(/\n\s*\n\s*/g, ' ')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\s+(?=<)/g, '') // Remove spaces before tags
          .replace(/>\s+/g, '> ') // Normalize spaces after tags
      return cleaned
    } else {
      // For items without nested lists, remove all <p> and <div> tags
      let cleaned = content
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, '')
        .replace(/\n\s*\n\s*/g, ' ')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s+/g, ' ')
      return cleaned
    }
  }
  
  // Process list items, handling nested lists carefully
  // Use a recursive approach to handle deeply nested lists
  let changed = true
  let iterations = 0
  while (changed && iterations < 10) {
    const before = normalized
    normalized = normalized.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (match, liAttrs, content) => {
      const cleaned = processListItem(content)
      return `<li${liAttrs || ''}>${cleaned}</li>`
    })
    changed = normalized !== before
    iterations++
  }
  
  // Remove excessive whitespace between list items
  normalized = normalized.replace(/(<\/li>)\s+(<li)/gi, '$1$2')
  
  // Remove empty paragraphs before/after lists
  normalized = normalized.replace(/<p[^>]*>\s*<\/p>\s*(<[uo]l)/gi, '$1')
  normalized = normalized.replace(/(<\/[uo]l>)\s*<p[^>]*>\s*<\/p>/gi, '$1')
  
  return normalized
}

// Helper function to merge split ordered lists that are separated by images
// Images are kept OUTSIDE the list (not as list items) but numbering continues using start attribute
function mergeSplitOrderedLists(html: string): string {
  let result = html
  let changed = true
  let iterations = 0
  const maxIterations = 10 // Prevent infinite loops
  
  // Keep processing until no more changes (to handle multiple splits)
  while (changed && iterations < maxIterations) {
    iterations++
    changed = false
    const beforeResult = result
    
    // Pattern to match: </ol> followed by content (images, etc.), then <ol>
    const pattern = /(<ol[^>]*>)([\s\S]*?)(<\/ol>)\s*((?:<img[^>]*>|<p[^>]*>[\s\S]*?<\/p>|<div[^>]*>[\s\S]*?<\/div>|<figure[^>]*>[\s\S]*?<\/figure>)\s*)(<ol[^>]*>)/gi
    
      result = result.replace(pattern, (match, openTag1, listContent1, closeTag1, imageContent, openTag2) => {
        // Count only top-level list items (not nested ones)
        // We need to track depth for both <ol>/</ol> and <ul>/</ul> tags
        let itemCount = 0
        let depth = 0
        let i = 0
        
        while (i < listContent1.length) {
          const remaining = listContent1.substring(i)
          
          // Check for opening list tags (<ol> or <ul>)
          if (remaining.match(/^<(ol|ul)[^>]*>/i)) {
            depth++
            const listMatch = remaining.match(/^<(ol|ul)[^>]*>/i)!
            i += listMatch[0].length
            continue
          }
          // Check for closing list tags (</ol> or </ul>)
          else if (remaining.match(/^<\/(ol|ul)>/i)) {
            depth--
            const closeMatch = remaining.match(/^<\/(ol|ul)>/i)!
            i += closeMatch[0].length
            continue
          }
          // Count <li> tags only when at depth 0 (top-level)
          else if (remaining.match(/^<li[^>]*>/i) && depth === 0) {
            itemCount++
            const liMatch = remaining.match(/^<li[^>]*>/i)!
            i += liMatch[0].length
            continue
          }
          
          i++
        }
        
        // If depth tracking resulted in 0 items, something went wrong
        // This shouldn't happen, but as a safety check, verify the list has content
        if (itemCount === 0 && listContent1.trim().length > 0) {
          // Last resort: count all <li> tags (this might include nested, but better than 0)
          const listItemMatches = listContent1.match(/<li[^>]*>/gi)
          itemCount = listItemMatches ? listItemMatches.length : 0
        }
      
      // Clean up image content - remove wrapping <p> or <div> tags
      let cleanImageContent = imageContent.trim()
      cleanImageContent = cleanImageContent.replace(/<p[^>]*>(<img[^>]*>)<\/p>/gi, '$1')
      cleanImageContent = cleanImageContent.replace(/<div[^>]*>(<img[^>]*>)<\/div>/gi, '$1')
      
      // Add start attribute to the second <ol> to continue numbering
      let newOpenTag2 = openTag2.replace(/\s+start\s*=\s*["']?\d+["']?/gi, '')
      
      // Ensure start attribute is properly added
      if (newOpenTag2.endsWith('>')) {
        newOpenTag2 = newOpenTag2.slice(0, -1) + ` start="${itemCount + 1}">`
      } else {
        newOpenTag2 = newOpenTag2 + ` start="${itemCount + 1}">`
      }
      
      changed = true
      
      // Return: first list + image content (outside list) + second list with start attribute
      return `${openTag1}${listContent1}${closeTag1}\n${cleanImageContent}\n${newOpenTag2}`
    })
    
    if (result === beforeResult) {
      changed = false
    }
  }
  
  return result
}

// Helper to convert markdown to HTML for text blocks
async function convertMarkdownToHTML(markdown: string): Promise<string> {
  try {
    if (!markdown || !markdown.trim()) {
      return "<p></p>"
    }
    
    // If markdown already looks like HTML, normalize it and return
    if (markdown.trim().startsWith("<")) {
      return normalizeListHTML(markdown.trim())
    }
    
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
    
    let html = String(file)
    html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
    html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
    html = html.trim()
    
    // Fix split ordered lists caused by images between list items
    html = mergeSplitOrderedLists(html)
    
    // Ensure we have valid HTML
    if (!html || html === "") {
      html = `<p>${markdown.replace(/\n/g, '<br>')}</p>`
    }
    
    // Normalize list HTML to remove excessive spacing from markdown conversion
    html = normalizeListHTML(html)
    
    return html
  } catch (error) {
    console.error("Error converting markdown to HTML:", error)
    // Fallback: convert markdown to HTML manually
    let fallback = markdown
    
    // Convert headings first (before other conversions)
    // Process from most specific (H6) to least specific (H1) to avoid conflicts
    // H6: ###### Heading (6 hashes)
    fallback = fallback.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    // H5: ##### Heading (5 hashes)
    fallback = fallback.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    // H4: #### Heading (4 hashes)
    fallback = fallback.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    // H3: ### Heading (3 hashes)
    fallback = fallback.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    // H2: ## Heading (2 hashes)
    fallback = fallback.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    // H1: # Heading (1 hash - must be last to avoid matching others)
    fallback = fallback.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    
    // Convert bold and italic
    fallback = fallback.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    fallback = fallback.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert line breaks - preserve paragraph structure
    // Split by double newlines to create paragraphs
    const paragraphs = fallback.split(/\n\n+/)
    const htmlParagraphs = paragraphs.map(p => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      // If it's already a heading, return as-is
      if (trimmed.match(/^<h[1-6]>/)) {
        return trimmed
      }
      // Otherwise, wrap in paragraph and convert single newlines to <br>
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`
    }).filter(p => p).join('')
    
    return htmlParagraphs || '<p></p>'
  }
}

// Component to handle markdown-to-HTML conversion for text blocks
const TextBlockEditor = memo(({
  blockId,
  blockHtml,
  blockMarkdown,
  onChange,
  editorRef,
  placeholder,
  className,
}: {
  blockId: string
  blockHtml: string
  blockMarkdown: string
  onChange: (html: string) => void
  editorRef: (editor: Editor | null) => void
  placeholder?: string
  className?: string
}) => {
  const [isConverting, setIsConverting] = useState(false)
  const [convertedHtml, setConvertedHtml] = useState<string>("")
  const hasConvertedRef = useRef<string>("") // Track which markdown we've converted
  
  // Determine if we need to convert markdown
  const needsConversion = useMemo(() => {
    // Check if blockHtml is actually HTML (starts with <) or just empty/placeholder
    const hasValidHtml = blockHtml && 
      blockHtml.trim() && 
      blockHtml !== "<p></p>" && 
      blockHtml !== "<p><br></p>" &&
      blockHtml.trim().startsWith("<") // Must be actual HTML, not markdown
    
    // If we have valid HTML, no conversion needed
    if (hasValidHtml) {
      return false
    }
    
    // If we have markdown but no valid HTML, we need to convert
    if (blockMarkdown && blockMarkdown.trim()) {
      return true
    }
    return false
  }, [blockHtml, blockMarkdown])
  
  // Convert markdown to HTML when needed
  useEffect(() => {
    // Reset conversion flag if markdown changed
    if (hasConvertedRef.current !== blockMarkdown) {
      hasConvertedRef.current = ""
    }
    
    if (!needsConversion || !blockMarkdown || !blockMarkdown.trim()) {
      return
    }
    
    // Skip if we've already converted this exact markdown
    if (hasConvertedRef.current === blockMarkdown) {
      return
    }
    
    // Convert markdown to HTML
    hasConvertedRef.current = blockMarkdown
    setIsConverting(true)
    
    if (process.env.NODE_ENV === "development") {
      console.log("[TextBlockEditor] Converting markdown to HTML:", {
        blockId,
        markdownLength: blockMarkdown.length,
        markdownPreview: blockMarkdown.substring(0, 100),
      })
    }
    
    convertMarkdownToHTML(blockMarkdown).then((html) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[TextBlockEditor] Conversion successful:", {
          blockId,
          htmlLength: html.length,
          htmlPreview: html.substring(0, 200),
        })
      }
      setConvertedHtml(html)
      // Save the converted HTML immediately
      onChange(html)
      setIsConverting(false)
    }).catch((error) => {
      console.error("[TextBlockEditor] Failed to convert markdown to HTML:", error)
      setIsConverting(false)
      hasConvertedRef.current = "" // Allow retry
    })
  }, [needsConversion, blockMarkdown, blockId, onChange])
  
  // Use converted HTML if available, otherwise use blockHtml
  const contentToRender = useMemo(() => {
    // If we have converted HTML, use it (already normalized)
    if (convertedHtml && convertedHtml.trim() && convertedHtml !== "<p></p>") {
      return convertedHtml
    }
    
    // Only use blockHtml if it's actual HTML (starts with <)
    // Normalize it to remove excessive spacing from markdown conversion
    if (blockHtml && blockHtml.trim() && blockHtml !== "<p></p>" && blockHtml.trim().startsWith("<")) {
      return normalizeListHTML(blockHtml)
    }
    
    // If we're converting, show empty until conversion completes
    if (isConverting) {
      return "<p></p>"
    }
    
    return "<p></p>"
  }, [convertedHtml, blockHtml, isConverting])
  
  // Show loading state while converting
  if (isConverting) {
    return (
      <div className="border border-border rounded-md p-4 bg-muted/40 min-h-[100px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Converting markdown...</p>
      </div>
    )
  }
  
  return (
    <RichTextEditor
      content={contentToRender}
      onChange={onChange}
      editorRef={editorRef}
      placeholder={placeholder}
      className={className}
    />
  )
})

TextBlockEditor.displayName = "TextBlockEditor"

interface ExplanationBlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  choices: Choice[]
  perAnswerExplanations: Record<string, ContentBlock[]>
  onPerAnswerExplanationChange: (choiceLabel: string, blocks: ContentBlock[]) => void
  activeSection: string | null
  activePerAnswerLabel: string | null
  onSectionChange: (section: string | null, perAnswerLabel?: string | null) => void
  onInsertImage?: (choiceLabel?: string) => void
  onInsertLink?: (choiceLabel?: string) => void
  onInsertTable?: () => void
  editorRefs: {
    main: React.MutableRefObject<Editor | null>
    perAnswer: React.MutableRefObject<Record<string, Editor | null>>
    textBlocks: React.MutableRefObject<Record<string, Editor | null>>
  }
}

export default function ExplanationBlockEditor({
  blocks,
  onChange,
  choices,
  perAnswerExplanations,
  onPerAnswerExplanationChange,
  activeSection,
  activePerAnswerLabel,
  onSectionChange,
  onInsertImage,
  onInsertLink,
  onInsertTable,
  editorRefs,
}: ExplanationBlockEditorProps) {
  const textBlockEditorRefs = editorRefs.textBlocks
  
  // Track which blocks have been converted to prevent re-conversion
  const convertedBlocksRef = useRef<Set<string>>(new Set())
  const lastBlocksRef = useRef<string>("")
  
  // Convert markdown blocks to HTML when blocks change (but only if blocks actually changed)
  useEffect(() => {
    // Create a signature of the blocks to detect actual changes
    const blocksSignature = JSON.stringify(blocks.map(b => ({
      id: b.id,
      hasMarkdown: !!(b.data?.markdown && b.data.markdown.trim()),
      hasHtml: !!(b.data?.html && b.data.html.trim() && b.data.html !== "<p></p>")
    })))
    
    // Skip if blocks haven't actually changed
    if (lastBlocksRef.current === blocksSignature) return
    lastBlocksRef.current = blocksSignature
    
    const convertBlocks = async () => {
      const blocksToConvert = blocks.filter((block) => {
        if (block.type !== "text") return false
        const hasMarkdown = !!(block.data?.markdown && block.data.markdown.trim())
        const hasHtml = !!(block.data?.html && 
          block.data.html.trim() && 
          block.data.html !== "<p></p>" && 
          block.data.html !== "<p><br></p>" &&
          block.data.html.trim().startsWith("<"))
        const blockKey = `${block.id}-${block.data?.markdown?.substring(0, 50)}`
        const alreadyConverted = convertedBlocksRef.current.has(blockKey)
        
        // Convert if we have markdown but no valid HTML, and haven't converted this block yet
        return hasMarkdown && !hasHtml && !alreadyConverted
      })
      
      if (blocksToConvert.length === 0) return
      
      // Convert all blocks that need conversion
      const convertedBlocks = await Promise.all(
        blocksToConvert.map(async (block) => {
          const blockKey = `${block.id}-${block.data?.markdown?.substring(0, 50)}`
          convertedBlocksRef.current.add(blockKey)
          
          const html = await convertMarkdownToHTML(block.data!.markdown!)
          
          return {
            ...block,
            data: {
              ...block.data,
              html: html,
              markdown: block.data!.markdown, // Preserve markdown
            },
          }
        })
      )
      
      // Update blocks if any were converted
      if (convertedBlocks.length > 0) {
        const updatedBlocks = blocks.map((block) => {
          const converted = convertedBlocks.find((cb) => cb.id === block.id)
          return converted || block
        })
        // Use a timeout to avoid infinite loops
        setTimeout(() => {
          onChange(updatedBlocks)
        }, 0)
      }
    }
    
    convertBlocks()
  }, [blocks]) // Only depend on blocks, not onChange
  
  // Helper function to detect markdown tables (copied from rich-content-editor.tsx)
  const detectMarkdownTable = useCallback((markdown: string): { isTable: boolean; tableMarkdown?: string } => {
    if (!markdown || typeof markdown !== "string") {
      return { isTable: false }
    }

    let normalizedMarkdown = markdown.trim()
    
    if (normalizedMarkdown.includes("<")) {
      normalizedMarkdown = normalizedMarkdown
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim()
    }

    // Check for table row patterns
    const tableRowPattern = /\|\s*[^|]+\s*\|\s*[^|]+\s*\|/g
    const allTableMatches = normalizedMarkdown.match(tableRowPattern) || []
    
    // Single-line table detection
    if (allTableMatches.length >= 3 && normalizedMarkdown.split("\n").filter(l => l.trim()).length <= 3) {
      let tableText = normalizedMarkdown.trim()
      const separatorPattern = /\|\s*[-:]+\s*\|/
      const hasSeparator = separatorPattern.test(tableText)
      
      if (hasSeparator) {
        const parts = tableText.split(separatorPattern)
        if (parts.length >= 2) {
          const header = parts[0].trim()
          const dataRows = parts.slice(1).join("").trim()
          
          let headerRow = header
          if (!headerRow.startsWith("|")) headerRow = "| " + headerRow
          if (!headerRow.endsWith("|")) headerRow = headerRow + " |"
          
          const sepCols = (headerRow.match(/\|/g) || []).length - 1
          const separator = "| " + Array(sepCols).fill("---").join(" | ") + " |"
          
          const dataParts = dataRows.split(/\s*\|\s*\|\s*/).filter(p => p.trim() && p.includes("|"))
          const dataRowsFormatted = dataParts.map(row => {
            row = row.trim()
            if (!row.startsWith("|")) row = "| " + row
            if (!row.endsWith("|")) row = row + " |"
            return row
          })
          
          const tableMarkdown = [headerRow, separator, ...dataRowsFormatted].join("\n")
          
          console.log("[ExplanationBlockEditor] Detected single-line table:", {
            original: normalizedMarkdown.substring(0, 300),
            tableMarkdownPreview: tableMarkdown.substring(0, 300),
          })
          
          return { isTable: true, tableMarkdown }
        }
      } else {
        const splitByBoundary = tableText.split(/\s*\|\s*\|\s*/).filter(p => p.trim() && p.includes("|"))
        if (splitByBoundary.length >= 2) {
          const rows = splitByBoundary.map((row, idx) => {
            row = row.trim()
            if (!row.startsWith("|")) row = "| " + row
            if (!row.endsWith("|")) row = row + " |"
            return row
          })
          
          const colCount = (rows[0].match(/\|/g) || []).length - 1
          const separator = "| " + Array(colCount).fill("---").join(" | ") + " |"
          const tableMarkdown = [rows[0], separator, ...rows.slice(1)].join("\n")
          
          console.log("[ExplanationBlockEditor] Detected single-line table without separator:", {
            original: normalizedMarkdown.substring(0, 300),
            tableMarkdownPreview: tableMarkdown.substring(0, 300),
          })
          
          return { isTable: true, tableMarkdown }
        }
      }
    }

    // Multi-line table detection
    const lines = normalizedMarkdown.split("\n")
    const tableLines: string[] = []
    let inTable = false
    let tableStartIndex = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
        if (!inTable) {
          inTable = true
          tableStartIndex = i
        }
        tableLines.push(line)
      } else if (trimmed.match(/^\|[\s\-\|:]+\|$/)) {
        if (inTable) {
          tableLines.push(line)
        }
      } else if (trimmed.match(/^\|[\s\-:]+\|$/)) {
        if (inTable) {
          tableLines.push(line)
        }
      } else {
        if (inTable) {
          break
        }
      }
    }

    if (tableLines.length >= 2) {
      const nonTableLines = lines.filter((line, idx) => {
        const trimmed = line.trim()
        return idx < tableStartIndex || idx >= tableStartIndex + tableLines.length
      }).filter(line => line.trim() !== "").length

      const isPrimaryTable = tableStartIndex === 0 || 
                             (tableLines.length >= 2 && nonTableLines <= 3) ||
                             (tableLines.length >= 3)
      
      if (isPrimaryTable) {
        const tableMarkdown = tableLines.join("\n")
        
        console.log("[ExplanationBlockEditor] Detected multi-line table:", {
          tableLinesCount: tableLines.length,
          tableMarkdownPreview: tableMarkdown.substring(0, 300),
        })
        
        return { isTable: true, tableMarkdown }
      }
    }

    return { isTable: false }
  }, [])
  
  // Helper to convert markdown table to HTML
  const markdownTableToHTML = useCallback(async (markdown: string): Promise<string> => {
    try {
      if (!markdown || !markdown.trim()) {
        return ""
      }
      
      const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(markdown)
      
      let html = String(file)
      html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
      html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
      html = html.trim()
      
      if (html.includes("<table")) {
        const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
        if (tableMatch) {
          return tableMatch[0]
        }
      }
      
      return html
    } catch (error) {
      console.error("Error converting markdown table to HTML:", error)
      return ""
    }
  }, [])
  
  const handleBlockChange = useCallback(
    (index: number, html: string) => {
      const newBlocks = [...blocks]
      // Update the HTML content of the text block
      if (newBlocks[index].type === "text") {
        // Preserve all HTML formatting (bold, italic, font-size, font-family, colors, etc.)
        // TipTap generates HTML with inline styles that must be preserved
        // CRITICAL: Always save HTML so preview/view mode can render it
        newBlocks[index] = {
          ...newBlocks[index],
          data: {
            ...newBlocks[index].data,
            html: html, // Always save HTML - this is what preview/view mode uses
            // Keep existing markdown for backward compatibility, but HTML takes priority
            markdown: newBlocks[index].data.markdown || "",
          },
        }
        
        // Debug: Log when content is updated
        if (process.env.NODE_ENV === "development") {
          console.log("[handleBlockChange] Updating text block:", {
            blockId: newBlocks[index].id,
            htmlLength: html.length,
            hasMarkdown: !!newBlocks[index].data.markdown,
            htmlPreview: html.substring(0, 200),
          })
        }
        
        onChange(newBlocks)
      }
    },
    [blocks, onChange]
  )

  const handleTableBlockChange = useCallback(
    (index: number, payload: { html: string; markdown: string }) => {
      const newBlocks = [...blocks]
      if (newBlocks[index].type === "table") {
        newBlocks[index] = {
          ...newBlocks[index],
          data: {
            ...newBlocks[index].data,
            html: payload.html,
            tableHtml: payload.html, // Also store as tableHtml for compatibility
            markdown: payload.markdown,
          },
        }
        onChange(newBlocks)
      }
    },
    [blocks, onChange]
  )

  const handleMoveBlock = useCallback(
    (index: number, direction: "up" | "down") => {
      const newBlocks = [...blocks]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex >= 0 && targetIndex < newBlocks.length) {
        // Swap blocks by moving the block to the target position
        const [movedBlock] = newBlocks.splice(index, 1)
        newBlocks.splice(targetIndex, 0, movedBlock)
        // Update order values to match new positions
        newBlocks.forEach((block, idx) => {
          block.order = idx
        })
        onChange(newBlocks)
      }
    },
    [blocks, onChange]
  )

  const handleRemoveBlock = useCallback(
    (index: number) => {
      const newBlocks = blocks.filter((_, i) => i !== index)
      onChange(newBlocks)
    },
    [blocks, onChange]
  )

  const handleInsertPerAnswerPlaceholder = useCallback(() => {
    // Check if a per-answer explanations block already exists
    const existingPerAnswerBlock = blocks.find(
      (block) => block.type === "per-answer-explanation" && block.data?.allChoices === true
    )

    if (existingPerAnswerBlock) {
      // Block already exists, don't add another
      return
    }

    // Add a single block that contains all per-answer explanations
    const newBlock: ContentBlock = {
      id: `per-answer-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "per-answer-explanation" as const,
      order: blocks.length,
      data: {
        placeholder: true,
        isPerAnswerExplanation: true,
        allChoices: true, // Mark this as containing all choices
      },
    }

    onChange([...blocks, newBlock])
  }, [blocks, choices, onChange])

  const handlePerAnswerBlockChange = useCallback(
    (choiceLabel: string, html: string) => {
      // Preserve existing block IDs when converting HTML back to blocks
      const existingBlocks = perAnswerExplanations[choiceLabel] || []
      const newBlocks = htmlToBlocks(html, existingBlocks)
      // Ensure HTML is saved in each block's data
      const blocksWithHtml = newBlocks.map((block) => {
        if (block.type === "text") {
          return {
            ...block,
            data: {
              ...block.data,
              html: html, // Save the HTML content
              // Preserve markdown if it exists, otherwise extract from HTML
              markdown: block.data?.markdown || "",
            },
          }
        }
        return block
      })
      onPerAnswerExplanationChange(choiceLabel, blocksWithHtml)
    },
    [onPerAnswerExplanationChange, perAnswerExplanations]
  )

  return (
    <div 
      className="space-y-4"
      onClick={(e) => {
        // If clicking on the container (not on a block or interactive element), activate explanation section
        const target = e.target as HTMLElement
        if (target === e.currentTarget || (!target.closest('[contenteditable]') && !target.closest('button') && !target.closest('input'))) {
          onSectionChange("explanation")
        }
      }}
    >
      {blocks.map((block, index) => {
        const isPerAnswerPlaceholder = block.type === "per-answer-explanation"
        const isAllChoicesBlock = isPerAnswerPlaceholder && block.data?.allChoices === true
        const isActive = isAllChoicesBlock
          ? activeSection === "per-answer-all"
          : activeSection === `explanation-block-${block.id}`

        if (isAllChoicesBlock) {
          return (
            <Card
              key={block.id}
              className={`border-2 bg-card dark:bg-gray-800 ${
                isActive ? "border-primary ring-2 ring-primary dark:border-blue-500 dark:ring-blue-500" : "border-dashed border-border/50 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary dark:text-blue-400" />
                  <Label className="text-sm font-semibold text-foreground dark:text-gray-100">
                    Per-Answer Explanations
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveBlock(index, "up")
                    }}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveBlock(index, "down")
                    }}
                    disabled={index === blocks.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveBlock(index)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {choices.map((choice) => {
                  const perAnswerBlocks = perAnswerExplanations[choice.label] || []
                  const isPerAnswerActive = activeSection === `per-answer-${choice.label}` && activePerAnswerLabel === choice.label
                  
                  return (
                    <div
                      key={choice.label}
                      onClick={() => {
                        onSectionChange(`per-answer-${choice.label}`, choice.label)
                      }}
                      className={`rounded-lg border ${
                        isPerAnswerActive ? "border-primary ring-2 ring-primary dark:border-blue-500 dark:ring-blue-500" : "border-border/30 dark:border-gray-700 bg-muted/10 dark:bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground dark:text-gray-100">Option {choice.label}:</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          choice.correct ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
                        }`}>
                          {choice.correct ? "Correct" : "Incorrect"}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-gray-300">{choice.text}</span>
                      </div>
                      <PerAnswerExplanationEditor
                        blocks={perAnswerBlocks}
                        onChange={(html) => handlePerAnswerBlockChange(choice.label, html)}
                        onBlocksChange={(updatedBlocks) => {
                          onPerAnswerExplanationChange(choice.label, updatedBlocks)
                        }}
                        editorRef={(editor) => {
                          editorRefs.perAnswer.current[choice.label] = editor
                          if (editor) {
                            // Set up focus handler
                            editor.on("focus", () => {
                              onSectionChange(`per-answer-${choice.label}`, choice.label)
                            })
                          }
                        }}
                        placeholder={`Enter explanation for option ${choice.label}...`}
                        className="min-h-[80px]"
                      />
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        }

        // Regular text block or table block
        // Only use actual HTML, not markdown (markdown should be converted separately)
        const blockHtml = block.data?.html || block.data?.tableHtml || (block.type === "table" ? "" : "<p></p>")
        const blockMarkdown = block.data?.markdown || ""
        const blockActiveSection = `explanation-block-${block.id}`
        const isTextBlockActive = activeSection === blockActiveSection
        
        // Check if this is a table block OR if text block contains a markdown table
        const isTableBlock = block.type === "table"
        const hasTableInHtml = blockHtml && typeof blockHtml === "string" && blockHtml.includes("<table")
        
        // Check if text block contains markdown table
        let detectedTable: { isTable: boolean; tableMarkdown?: string } = { isTable: false }
        let shouldRenderAsTable = isTableBlock || hasTableInHtml
        
        if (!shouldRenderAsTable && block.type === "text") {
          // Extract markdown from HTML if needed
          let contentToCheck = blockMarkdown
          if (!contentToCheck || contentToCheck.trim().length < 10) {
            contentToCheck = blockHtml
              .replace(/<p[^>]*>/gi, '\n')
              .replace(/<\/p>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<div[^>]*>/gi, '\n')
              .replace(/<\/div>/gi, '\n')
              .replace(/&nbsp;/gi, ' ')
              .replace(/<[^>]+>/g, '')
              .replace(/\n\n+/g, '\n')
              .trim()
          }
          
          detectedTable = detectMarkdownTable(contentToCheck)
          shouldRenderAsTable = detectedTable.isTable
          
          console.log("[ExplanationBlockEditor] Text block analysis:", {
            blockId: block.id,
            blockType: block.type,
            hasMarkdown: !!blockMarkdown,
            hasHtml: !!blockHtml,
            htmlContainsTable: hasTableInHtml,
            contentToCheckLength: contentToCheck.length,
            detectedTable,
            shouldRenderAsTable,
            contentPreview: contentToCheck.substring(0, 300),
          })
        }
        
        return (
          <Card
            key={block.id}
            className={`border bg-card dark:bg-gray-800 ${
              isTextBlockActive ? "border-primary ring-2 ring-primary dark:border-blue-500 dark:ring-blue-500" : "border-border/30 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground dark:text-gray-300">
                {block.type === "table" ? "Table Block" : block.type === "text" ? "Text Block" : "Content Block"}
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveBlock(index, "up")}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveBlock(index, "down")}
                  disabled={index === blocks.length - 1}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBlock(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div
              onClick={() => {
                onSectionChange(blockActiveSection)
              }}
            >
              {shouldRenderAsTable ? (
                <TableBlockEditor
                  key={`table-${block.id}`}
                  blockId={block.id}
                  blockHtml={blockHtml}
                  detectedTable={detectedTable}
                  onTableChange={(payload) => {
                    if (block.type === "table") {
                      handleTableBlockChange(index, payload)
                    } else {
                      // Keep as text block, just update the HTML/markdown with table content
                      const newBlocks = [...blocks]
                      newBlocks[index] = {
                        ...newBlocks[index],
                        type: "text", // Keep as text block
                        data: {
                          ...newBlocks[index].data,
                          html: payload.html, // Update HTML with table
                          markdown: payload.markdown || detectedTable.tableMarkdown || blockMarkdown,
                          tableHtml: payload.html, // Also store as tableHtml for compatibility
                        },
                      }
                      onChange(newBlocks)
                    }
                  }}
                  editorRef={(editor) => {
                    textBlockEditorRefs.current[block.id] = editor
                    if (editor) {
                      editor.on("focus", () => {
                        onSectionChange(blockActiveSection)
                      })
                    }
                  }}
                />
              ) : (
              <TextBlockEditor
                blockId={block.id}
                blockHtml={blockHtml}
                blockMarkdown={blockMarkdown}
                onChange={(html) => handleBlockChange(index, html)}
                editorRef={(editor) => {
                  textBlockEditorRefs.current[block.id] = editor
                  if (editor) {
                    // Set up focus handler
                    editor.on("focus", () => {
                      onSectionChange(blockActiveSection)
                    })
                  }
                }}
                placeholder="Enter explanation text..."
                className="min-h-[100px]"
              />
              )}
            </div>
          </Card>
        )
      })}

      {blocks.length === 0 && (
        <div 
          className="text-center py-8 text-muted-foreground dark:text-gray-400 text-sm border border-dashed rounded-lg border-border dark:border-gray-700 bg-card dark:bg-gray-800 cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => {
            onSectionChange("explanation")
          }}
        >
          No explanation content. Use the toolbar above to add text blocks or per-answer explanations.
        </div>
      )}
    </div>
  )
}

