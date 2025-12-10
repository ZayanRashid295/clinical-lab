"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { QuestionsService } from "@/app/services/questions/questions.service"
import AdvancedTableEditor from "./advanced-table-editor"
import RichMarkdownEditor from "./rich-markdown-editor"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

interface RichContentEditorProps {
  item: {
    id: number | string
    type: "text" | "table" | "images" | "image" | "per-answer-explanation"
    data: any
  }
  onUpdate: (data: any) => void
}

// Helper function to convert markdown table to HTML
async function markdownTableToHTML(markdown: string): Promise<string> {
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
    
    // Remove any wrapping HTML/body tags if present
    html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
    html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
    html = html.trim()
    
    // Extract just the table HTML if there's other content
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

// Helper function to detect if markdown contains a table
function detectMarkdownTable(markdown: string): { isTable: boolean; tableMarkdown?: string } {
  if (!markdown || typeof markdown !== "string") {
    return { isTable: false }
  }

  // Normalize the markdown - handle cases where it might be wrapped in HTML tags
  let normalizedMarkdown = markdown.trim()
  
  // If it's wrapped in <p> tags or other HTML, extract the text
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

  // Handle single-line tables (all rows concatenated, e.g., "| col1 | col2 | | col3 | col4 |")
  // Check if markdown contains multiple table row patterns
  const tableRowPattern = /\|\s*[^|]+\s*\|\s*[^|]+\s*\|/g
  const allTableMatches = [...normalizedMarkdown.matchAll(tableRowPattern)]
  
  // If we have 3+ table row patterns and it's mostly on one line, it's likely a concatenated table
  if (allTableMatches.length >= 3 && normalizedMarkdown.split("\n").filter(l => l.trim()).length <= 3) {
    // Try to intelligently split into rows
    // Look for patterns: "| col1 | col2 | | col3 | col4 |" - the " | | " indicates row boundary
    let tableText = normalizedMarkdown.trim()
    
    // Split by " | | " pattern (row boundaries) or by counting expected columns
    // First, detect number of columns from first row
    const firstRowMatch = tableText.match(/^\|\s*[^|]+\s*\|\s*[^|]+\s*\|/)
    if (firstRowMatch) {
      const firstRow = firstRowMatch[0]
      const colCount = (firstRow.match(/\|/g) || []).length - 1
      
      // Now split by counting columns - every time we see colCount columns followed by more content, it's a new row
      const rows: string[] = []
      let currentRow = ""
      let pipeCount = 0
      
      // Simple approach: split by " | | " or reconstruct by counting
      // Better: look for separator pattern "|--------|" or split by " | | "
      const separatorPattern = /\|\s*[-:]+\s*\|/
      const hasSeparator = separatorPattern.test(tableText)
      
      if (hasSeparator) {
        // Has separator - split by it
        const parts = tableText.split(separatorPattern)
        if (parts.length >= 2) {
          // Reconstruct: header + separator + data rows
          const header = parts[0].trim()
          const dataRows = parts.slice(1).join("").trim()
          
          // Ensure proper formatting
          let headerRow = header
          if (!headerRow.startsWith("|")) headerRow = "| " + headerRow
          if (!headerRow.endsWith("|")) headerRow = headerRow + " |"
          
          // Create separator
          const sepCols = (headerRow.match(/\|/g) || []).length - 1
          const separator = "| " + Array(sepCols).fill("---").join(" | ") + " |"
          
          // Split data rows - look for " | | " boundaries
          const dataParts = dataRows.split(/\s*\|\s*\|\s*/).filter(p => p.trim() && p.includes("|"))
          const dataRowsFormatted = dataParts.map(row => {
            row = row.trim()
            if (!row.startsWith("|")) row = "| " + row
            if (!row.endsWith("|")) row = row + " |"
            return row
          })
          
          const tableMarkdown = [headerRow, separator, ...dataRowsFormatted].join("\n")
          
          console.log("[detectMarkdownTable] Detected single-line table with separator:", {
            original: normalizedMarkdown.substring(0, 300),
            tableMarkdownPreview: tableMarkdown.substring(0, 300),
          })
          
          return {
            isTable: true,
            tableMarkdown: tableMarkdown,
          }
        }
      } else {
        // No separator - try splitting by " | | " pattern
        const splitByBoundary = tableText.split(/\s*\|\s*\|\s*/).filter(p => p.trim() && p.includes("|"))
        if (splitByBoundary.length >= 2) {
          const rows = splitByBoundary.map((row, idx) => {
            row = row.trim()
            if (!row.startsWith("|")) row = "| " + row
            if (!row.endsWith("|")) row = row + " |"
            return row
          })
          
          // Add separator after first row
          const colCount = (rows[0].match(/\|/g) || []).length - 1
          const separator = "| " + Array(colCount).fill("---").join(" | ") + " |"
          const tableMarkdown = [rows[0], separator, ...rows.slice(1)].join("\n")
          
          console.log("[detectMarkdownTable] Detected single-line table without separator:", {
            original: normalizedMarkdown.substring(0, 300),
            tableMarkdownPreview: tableMarkdown.substring(0, 300),
          })
          
          return {
            isTable: true,
            tableMarkdown: tableMarkdown,
          }
        }
      }
    }
  }

  const lines = normalizedMarkdown.split("\n")
  const tableLines: string[] = []
  let inTable = false
  let tableStartIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check if line is a table row (starts with | and contains multiple |)
    if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
      if (!inTable) {
        inTable = true
        tableStartIndex = i
      }
      tableLines.push(line)
    } else if (trimmed.match(/^\|[\s\-\|:]+\|$/)) {
      // This is a table separator row (e.g., | --- | --- | or |----------|--------|)
      if (inTable) {
        tableLines.push(line)
      }
    } else if (trimmed.match(/^\|[\s\-:]+\|$/)) {
      // Alternative separator pattern (without pipes in the middle)
      if (inTable) {
        tableLines.push(line)
      }
    } else {
      // Non-table line
      if (inTable) {
        // End of table - stop collecting
        break
      }
    }
  }

  // Check if we found a table
  // Need at least 2 rows (header + separator or header + data row)
  if (tableLines.length >= 2) {
    // More lenient detection - if we have table lines, it's likely a table
    // Check if the content is primarily a table or contains a significant table
    const nonTableLines = lines.filter((line, idx) => {
      const trimmed = line.trim()
      return idx < tableStartIndex || idx >= tableStartIndex + tableLines.length
    }).filter(line => line.trim() !== "").length

    // If table lines are the majority, content starts with a table, or table is significant (3+ rows), treat it as a table
    // BE MORE AGGRESSIVE: If we have 2+ table lines and minimal non-table content, it's a table
    const isPrimaryTable = tableStartIndex === 0 || 
                           (tableLines.length >= 2 && nonTableLines <= 3) || // More lenient: allow up to 3 non-table lines
                           (tableLines.length >= 3) // If we have 3+ table lines, it's likely a real table
    
    if (isPrimaryTable) {
      const tableMarkdown = tableLines.join("\n")
      
      // Debug logging
      console.log("[detectMarkdownTable] Table detected:", {
        tableLinesCount: tableLines.length,
        tableStartIndex,
        nonTableLines,
        isPrimaryTable,
        tableMarkdownPreview: tableMarkdown.substring(0, 300),
        fullMarkdown: normalizedMarkdown.substring(0, 500),
      })
      
      return {
        isTable: true,
        tableMarkdown: tableMarkdown,
      }
    }
  }

  // If no table detected, log for debugging
  if (normalizedMarkdown.includes("|") && normalizedMarkdown.split("|").length >= 4) {
    console.log("[detectMarkdownTable] Markdown contains | but not detected as table:", {
      markdownPreview: normalizedMarkdown.substring(0, 300),
      lineCount: lines.length,
      pipeCount: normalizedMarkdown.split("|").length,
    })
  }

  return { isTable: false }
}

// Component to handle markdown table editing with async HTML conversion
function MarkdownTableEditor({
  tableMarkdown,
  existingHtml,
  originalMarkdown,
  itemData,
  onUpdate,
}: {
  tableMarkdown: string
  existingHtml?: string
  originalMarkdown: string
  itemData: any
  onUpdate: (data: any) => void
}) {
  const [tableHtml, setTableHtml] = useState<string | null>(existingHtml || null)
  const [isConverting, setIsConverting] = useState(!existingHtml)

  useEffect(() => {
    if (!existingHtml && tableMarkdown) {
      // Convert markdown table to HTML so it shows as a visual table
      markdownTableToHTML(tableMarkdown).then((html) => {
        if (html && html.includes("<table")) {
          setTableHtml(html)
          // Immediately save the converted HTML so it's available for preview/student view
          onUpdate({
            ...itemData,
            html: html,
            markdown: tableMarkdown,
            tableHtml: html,
          })
        }
        setIsConverting(false)
      }).catch((error) => {
        console.error("Failed to convert markdown table to HTML:", error)
        setIsConverting(false)
      })
    } else if (existingHtml) {
      setIsConverting(false)
    }
  }, [tableMarkdown, existingHtml]) // Only depend on these to avoid infinite loops

  if (isConverting) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Table Content (from Markdown)</label>
        <div className="border border-border rounded-md p-4 bg-muted/40">
          <p className="text-sm text-muted-foreground">Loading table...</p>
        </div>
      </div>
    )
  }

  const initialHtml = tableHtml || existingHtml || ""
  
  if (!initialHtml) {
    // Fallback: show markdown editor if conversion failed
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Rich Text Content</label>
        <RichMarkdownEditor
          initialContent={itemData?.html || ""}
          onChange={(html) => {
            onUpdate({ ...itemData, html, markdown: originalMarkdown })
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Table Content (from Markdown)</label>
      <AdvancedTableEditor
        initialContent={initialHtml}
        initialFormat="html" // Always show as visual table, not markdown mode
        onChange={({ html, markdown: savedMarkdown }) => {
          // Ensure we have valid HTML
          const finalHtml = html && html.includes("<table") ? html : initialHtml
          
          // Save both HTML and markdown, preserving the table markdown
          // CRITICAL: Save the HTML so preview/student view can render it
          onUpdate({
            ...itemData,
            html: finalHtml, // Save the HTML table for rendering
            markdown: savedMarkdown || tableMarkdown || originalMarkdown, // Preserve markdown
            tableHtml: finalHtml, // Also save as tableHtml for backend compatibility
          })
          
          if (process.env.NODE_ENV === "development") {
            console.log("[MarkdownTableEditor] Saving table:", {
              hasHtml: !!finalHtml,
              htmlLength: finalHtml.length,
              htmlPreview: finalHtml.substring(0, 200),
              hasMarkdown: !!(savedMarkdown || tableMarkdown),
            })
          }
        }}
      />
      <div className="text-xs text-muted-foreground">
        This table was detected from markdown format and is being edited as a table
      </div>
    </div>
  )
}

export default function RichContentEditor({ item, onUpdate }: RichContentEditorProps) {
  if (item.type === "text") {
    // Get all possible content sources - check all possible HTML fields
    const markdown = item.data?.markdown || ""
    const html = item.data?.html || item.data?.tableHtml || ""
    
    // PRIORITY 1: If HTML already contains a converted table, use it directly
    // Check both html and tableHtml fields
    const tableHtml = item.data?.tableHtml || item.data?.html || ""
    
    if (tableHtml && typeof tableHtml === "string" && tableHtml.includes("<table")) {
      if (process.env.NODE_ENV === "development") {
        console.log("[RichContentEditor] HTML table detected in html/tableHtml field, rendering as table editor", {
          hasHtml: !!item.data?.html,
          hasTableHtml: !!item.data?.tableHtml,
          htmlLength: tableHtml.length,
          htmlPreview: tableHtml.substring(0, 200),
        })
      }
      
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Table Content</label>
          <AdvancedTableEditor
            initialContent={tableHtml}
            initialFormat="html"
            onChange={({ html: newHtml, markdown: savedMarkdown }) => {
              onUpdate({
                ...item.data,
                html: newHtml,
                markdown: savedMarkdown || markdown,
                tableHtml: newHtml,
              })
            }}
          />
        </div>
      )
    }
    
    // PRIORITY 2: Check if markdown contains a table
    // Combine all content sources to check for tables
    let contentToCheck = markdown
    
    // If markdown is empty or very short, try extracting from HTML
    if (!contentToCheck || contentToCheck.trim().length < 10) {
      contentToCheck = html
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
    
    // ALWAYS check for tables if content contains pipe characters
    const hasPipeChars = contentToCheck.includes("|")
    
    // Check if content contains a markdown table
    const tableDetection = hasPipeChars ? detectMarkdownTable(contentToCheck) : { isTable: false }
    
    // Debug logging - ALWAYS log to help debug
    console.log("[RichContentEditor] Text block analysis:", {
      hasMarkdown: !!markdown,
      hasHtml: !!html,
      htmlContainsTable: html.includes("<table"),
      contentToCheckLength: contentToCheck.length,
      hasPipeChars,
      tableDetection,
      contentPreview: contentToCheck.substring(0, 300),
      markdownPreview: markdown.substring(0, 300),
      htmlPreview: html.substring(0, 300),
    })

    // If we detect a markdown table, render it as a table editor
    if (tableDetection.isTable && tableDetection.tableMarkdown) {
      // Use a component that handles async conversion
      return (
        <MarkdownTableEditor
          tableMarkdown={tableDetection.tableMarkdown}
          existingHtml={undefined}
          originalMarkdown={contentToCheck}
          itemData={item.data}
          onUpdate={onUpdate}
        />
      )
    }

    // Otherwise, render as regular text editor
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Rich Text Content</label>
        <RichMarkdownEditor
          initialContent={initialContent}
          onChange={(html) => {
            onUpdate({ ...item.data, html, markdown: item.data?.markdown || "" })
          }}
        />
        <div className="text-xs text-muted-foreground">
          Your content will be rendered with formatting in the student view
        </div>
      </div>
    )
  }

  if (item.type === "table") {
    const { initialContent, initialFormat } = getInitialTableContent(item.data)
    
    // If we loaded from cells and generated markdown, preserve it in the data
    const initialData = { ...item.data }
    if (initialFormat === "markdown" && initialContent && !initialData.markdown) {
      initialData.markdown = initialContent
    }

    return (
      <AdvancedTableEditor
        initialContent={initialContent}
        initialFormat={initialFormat}
        onChange={({ html, markdown }) =>
          onUpdate({
            ...initialData,
            html,
            markdown: markdown || initialData.markdown || initialContent, // Preserve markdown
            tableHtml: html, // Also save as tableHtml for backend compatibility
          })
        }
      />
    )
  }

  if (item.type === "images" || item.type === "image") {
    return <ImageUploadEditor item={item} onUpdate={onUpdate} />
  }

  return null
}

function getInitialTableContent(data: any): { initialContent?: string; initialFormat: "html" | "markdown" } {
  // Check for markdown first (if available, it's the most accurate)
  if (data?.markdown && data.markdown.trim() && data.markdown.includes("|")) {
    return { initialContent: data.markdown, initialFormat: "markdown" }
  }

  // Check for html first (frontend format)
  if (data?.html && data.html.trim() && data.html.includes("<table")) {
    return { initialContent: data.html, initialFormat: "html" }
  }

  // Check for tableHtml (backend format)
  if (data?.tableHtml && data.tableHtml.trim() && data.tableHtml.includes("<table")) {
    return { initialContent: data.tableHtml, initialFormat: "html" }
  }

  // If we have rows/cols but no cells, return undefined to let AdvancedTableEditor create default table
  if (data?.rows && data?.cols && (!data?.cells || Object.keys(data.cells || {}).length === 0)) {
    return { initialContent: undefined, initialFormat: "html" }
  }

  // Convert from cells format (legacy or from markdown parsing)
  // This is the key: if we have cells data, convert it to markdown first (more accurate)
  if (data?.cells && Object.keys(data.cells).length > 0) {
    // Try markdown first (preserves structure better)
    const markdown = cellsToMarkdown(data)
    if (markdown && markdown.trim() && markdown.includes("|")) {
      return { initialContent: markdown, initialFormat: "markdown" }
    }
    
    // Fallback to HTML if markdown conversion fails
  const legacyHtml = legacyCellsToHtml(data)
    if (legacyHtml && legacyHtml.trim() && legacyHtml.includes("<table")) {
      return { initialContent: legacyHtml, initialFormat: "html" }
  }
  }
  
  // If all else fails, return undefined to create default table
  return { initialContent: undefined, initialFormat: "html" }
}

// Image Upload Editor Component
function ImageUploadEditor({ item, onUpdate }: RichContentEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const questionsService = new QuestionsService()

  const handleFileUpload = async (file: File, index: number) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    setUploadingIndex(index)
    setUploadError(null)

    try {
      const result = await questionsService.uploadImage(file)
      const newImages = [...(item.data.images || [])]
      newImages[index] = result.url
      onUpdate({ ...item.data, images: newImages })
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload image")
      console.error("Upload error:", error)
    } finally {
      setUploadingIndex(null)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...(item.data.images || [])]
    newImages[index] = ""
    onUpdate({ ...item.data, images: newImages })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Images ({item.data.count || 2})</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ ...item.data, count: Math.max(1, (item.data.count || 2) - 1) })}
            className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
          >
            - Remove
          </button>
          <button
            onClick={() => onUpdate({ ...item.data, count: Math.min(4, (item.data.count || 2) + 1) })}
            className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {uploadError}
        </div>
      )}

      <div
        className="grid gap-3 auto-cols-fr justify-center"
        style={{
          gridTemplateColumns: `repeat(${Math.min(item.data.count || 2, 4)}, minmax(0, 150px))`,
        }}
      >
        {Array.from({ length: item.data.count || 2 }).map((_, idx) => (
          <div key={idx} className="space-y-2 max-w-[150px] mx-auto">
            <label className="block text-xs font-medium text-muted-foreground">Image {idx + 1}</label>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                id={`image-upload-${item.id}-${idx}`}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file, idx)
                  }
                }}
                disabled={uploadingIndex === idx}
              />
              <label
                htmlFor={`image-upload-${item.id}-${idx}`}
                className={`flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded-lg border-2 border-dashed border-border bg-card text-foreground cursor-pointer hover:bg-muted/50 transition-colors text-xs ${
                  uploadingIndex === idx ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploadingIndex === idx ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    <span className="text-xs">Upload</span>
                  </>
                )}
              </label>
            </div>

            {item.data.images?.[idx] && (
              <div className="relative aspect-square rounded-lg border border-border bg-muted overflow-hidden group max-w-[150px]">
                <img
                  src={item.data.images[idx]}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=150&width=150"
                  }}
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-destructive/80 hover:bg-destructive text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="text-xs text-muted-foreground">Or enter URL:</div>
            <input
              type="text"
              value={item.data.images?.[idx] || ""}
              onChange={(e) => {
                const newImages = [...(item.data.images || [])]
                newImages[idx] = e.target.value
                onUpdate({ ...item.data, images: newImages })
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full px-2 py-1 rounded border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to decode HTML entities in cell content
function decodeHtmlEntities(text: string): string {
  if (!text) return text
  // Use a more reliable method that works in Node.js and browser
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  }
  let result = text
  for (const [entity, char] of Object.entries(entityMap)) {
    result = result.replace(new RegExp(entity, "g"), char)
  }
  // Also handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  return result
}

// Helper function to convert markdown syntax in table cells to HTML
function convertMarkdownInCell(text: string): string {
  if (!text) return text
  
  // First decode any HTML entities that might be in the text
  let result = decodeHtmlEntities(text)
  
  // If it already contains HTML tags, assume it's already HTML and return as-is
  if (result.includes("<") && result.match(/<[^>]+>/)) {
    return result
  }
  
  // Convert markdown to HTML (simple conversions)
  // Process bold first: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>")
  
  // Then process italic: *text* or _text_ (simple match, conflicts are rare in table cells)
  result = result.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
  result = result.replace(/_([^_\n]+?)_/g, "<em>$1</em>")
  
  return result
}

// Convert cells to markdown table format
function cellsToMarkdown(data: any): string {
  const rows = Math.max(1, Number.parseInt(data?.rows) || 0)
  const cols = Math.max(1, Number.parseInt(data?.cols) || 0)

  if (rows === 0 || cols === 0) {
    return ""
  }

  const cells: Record<string, string> = data?.cells || {}
  
  if (Object.keys(cells).length === 0) {
    return ""
  }

  const markdownLines: string[] = []
  
  // Process each row
  for (let r = 0; r < rows; r++) {
    const rowCells: string[] = []
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`
      let cellContent = cells[key] || ""
      
      // Decode HTML entities if present
      cellContent = decodeHtmlEntities(cellContent)
      
      // Handle HTML tags - convert to markdown
      if (cellContent.includes("<")) {
        // Convert HTML formatting to markdown
        cellContent = cellContent
          .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
          .replace(/<em>(.*?)<\/em>/gi, "*$1*")
          // Remove remaining HTML tags but preserve text
          .replace(/<[^>]+>/g, "")
      }
      
      // Cell content may already contain markdown formatting (like *text* from original markdown)
      // This is fine - we preserve it as-is
      
      // Escape pipe characters in cell content
      // Simple approach: escape all pipes (markdown will handle escaped pipes correctly)
      cellContent = cellContent.replace(/\|/g, "\\|")
      
      rowCells.push(cellContent.trim() || "")
    }
    
    // Add row if it has any content (don't skip rows - preserve all rows and columns)
    markdownLines.push("| " + rowCells.join(" | ") + " |")
    
    // Add separator after header row (row 0) if we have more rows
    if (r === 0 && rows > 1) {
      const separator = "| " + rowCells.map(() => "---").join(" | ") + " |"
      markdownLines.push(separator)
    }
  }
  
  return markdownLines.join("\n")
}

function legacyCellsToHtml(data: any): string {
  const rows = Math.max(1, Number.parseInt(data?.rows) || 0)
  const cols = Math.max(1, Number.parseInt(data?.cols) || 0)

  if (rows === 0 || cols === 0) {
    return ""
  }

  const cells: Record<string, string> = data?.cells || {}

  if (Object.keys(cells).length === 0) {
    return ""
  }

  // Process cell content: decode entities, convert markdown to HTML
  const processCell = (value: string): string => {
    if (!value || value.trim() === "") return ""
    
    // Decode HTML entities if present
    let processed = decodeHtmlEntities(value)
    
    // Convert markdown syntax to HTML
    processed = convertMarkdownInCell(processed)
    
    // If the result contains HTML tags, return it directly (it's already HTML)
    if (processed.includes("<") && processed.match(/<[^>]+>/)) {
      return processed
    }
    
    // Plain text - escape HTML special characters
    return processed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  // Check if first row is empty (all cells empty)
  const firstRowEmpty = Array.from({ length: cols }, (_, c) => {
    const key = `0-${c}`
    const value = cells[key] || ""
    return value.trim() === ""
  }).every(empty => empty)

  // If first row is empty, skip it and start from row 1
  const startRow = firstRowEmpty ? 1 : 0
  const actualRows = firstRowEmpty ? rows - 1 : rows

  if (actualRows <= 0) {
    return ""
  }

  let html = "<table><thead>"
  // First row is always header (if not empty)
  if (startRow === 0) {
    html += "<tr>"
    for (let c = 0; c < cols; c++) {
      const key = `0-${c}`
      const value = processCell(cells[key] || "")
      html += `<th>${value || "&nbsp;"}</th>`
    }
    html += "</tr>"
  }
  html += "</thead><tbody>"
  
  // Data rows start from row 1 (or row 2 if first row was empty)
  for (let r = startRow + 1; r < rows; r++) {
    html += "<tr>"
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`
      const value = processCell(cells[key] || "")
      html += `<td>${value || "&nbsp;"}</td>`
    }
    html += "</tr>"
  }
  html += "</tbody></table>"
  return html
}































