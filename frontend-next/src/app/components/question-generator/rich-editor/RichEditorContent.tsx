"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import RichEditorToolbar from "./RichEditorToolbar"
import TextEditor from "./editors/TextEditor"
import TableEditor from "./editors/TableEditor"
import ImageEditor from "./editors/ImageEditor"
import InternalLinkEditor from "./editors/InternalLinkEditor"
import ExternalLinkEditor from "./editors/ExternalLinkEditor"
import RichMarkdownEditor from "../rich-markdown-editor"
import { ContentBlock, BlockType, generateBlockId, getDefaultDataForType } from "./types"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

interface RichEditorContentProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  placeholder?: string
  disabled?: boolean
  isMainExplanation?: boolean // Only show per-answer-explanation button in main explanation
}

export default function RichEditorContent({
  blocks,
  onChange,
  placeholder = "No content added yet. Use the buttons above to add content blocks.",
  disabled = false,
  isMainExplanation = false,
}: RichEditorContentProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Count per-answer-explanation placeholders
  const perAnswerExplanationCount = blocks.filter(
    (block) => block.type === 'per-answer-explanation'
  ).length

  const handleAddBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: generateBlockId(),
      type,
      data: getDefaultDataForType(type),
      order: blocks.length,
    }
    
    // If adding per-answer-explanation placeholder, insert at position 1 (index 0)
    if (type === 'per-answer-explanation') {
      const newBlocks = [newBlock, ...blocks]
      // Update order values
      newBlocks.forEach((block, idx) => {
        block.order = idx
      })
      onChange(newBlocks)
    } else {
    onChange([...blocks, newBlock])
      // Auto-select the new block if it's editable (text or table)
      if (type === 'text' || type === 'table') {
        setSelectedBlockId(newBlock.id)
      }
    }
  }

  const handleRemoveBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id))
    if (selectedBlockId === id) {
      setSelectedBlockId(null)
    }
  }

  const handleUpdateBlock = (id: string, data: any) => {
    onChange(
      blocks.map((block) => (block.id === id ? { ...block, data } : block))
    )
  }

  const handleReorder = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id)
    if (index === -1) return

    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    const newBlocks = [...blocks]
    ;[newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]
    
    // Update order values
    newBlocks.forEach((block, idx) => {
      block.order = idx
    })
    
    onChange(newBlocks)
  }

  const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null

  // Convert markdown to HTML helper
  const markdownToHTML = async (markdown: string): Promise<string> => {
    try {
      if (!markdown || !markdown.trim()) {
        return "<p></p>"
      }
      
      const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(markdown)
      
      let html = String(file)
      
      // unified might wrap content in <html><body> tags - extract body content if present
      const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is)
      if (bodyMatch) {
        html = bodyMatch[1]
      }
      
      // Remove any wrapping <html> tags
      html = html.replace(/<\/?html[^>]*>/gi, '')
      html = html.trim()
      
      // Debug: log the converted HTML to see if headings are present
      if (process.env.NODE_ENV === 'development' && (html.includes('<h1>') || html.includes('<h2>') || html.includes('<h3>'))) {
        console.log('Converted HTML with headings:', html)
      }
      
      // Ensure we have valid HTML - if conversion returns empty or just whitespace, wrap in paragraph
      if (!html || html.trim() === "") {
        html = `<p>${markdown.replace(/\n/g, '<br>')}</p>`
      }
      
      // Don't wrap if HTML already contains headings or other block elements
      // TipTap can handle multiple block elements (headings, paragraphs, etc.)
      const hasBlockElements = /<(h[1-6]|p|div|ul|ol|li|blockquote|pre)/i.test(html)
      if (!hasBlockElements && !html.trim().startsWith('<')) {
        html = `<p>${html}</p>`
      }
      
      // Clean up empty paragraphs and br tags that might interfere with heading rendering
      // Remove empty paragraphs: <p></p>, <p><br></p>, <p> </p>
      html = html.replace(/<p>\s*<\/p>/gi, '')
      html = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
      html = html.replace(/<p>\s+<\/p>/gi, '')
      
      return html
    } catch (error) {
      console.error("Error converting markdown to HTML:", error)
      // Fallback: convert markdown to HTML manually
      let fallback = markdown
        // Convert headings first (before other formatting)
        // Handle headings with optional whitespace: ### Heading or ###Heading
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        // Convert bold and italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Convert line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
      
      // If no headings were found, wrap in paragraph
      if (!fallback.includes('<h1>') && !fallback.includes('<h2>') && !fallback.includes('<h3>')) {
        if (!fallback.startsWith('<p>')) {
          fallback = `<p>${fallback}</p>`
        }
      } else {
        // If headings exist, wrap non-heading content in paragraphs
        // Split by headings and wrap text blocks in paragraphs
        const parts = fallback.split(/(<h[1-3]>.*?<\/h[1-3]>)/g)
        fallback = parts.map(part => {
          if (part.match(/^<h[1-3]>/)) {
            return part // Keep headings as-is
          } else if (part.trim()) {
            // Wrap non-heading content in paragraphs
            const trimmed = part.trim()
            // Skip if it's just whitespace or empty
            if (!trimmed || trimmed === '<br>' || trimmed === '<br/>') {
              return ''
            }
            if (trimmed && !trimmed.startsWith('<p>')) {
              return `<p>${trimmed}</p>`
            }
            return trimmed
          }
          return ''
        }).filter(p => p.trim()).join('')
      }
      
      // Clean up empty paragraphs
      fallback = fallback.replace(/<p>\s*<\/p>/gi, '')
      fallback = fallback.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
      fallback = fallback.replace(/<p>\s+<\/p>/gi, '')
      
      return fallback
    }
  }

  // State for converted HTML from markdown
  const [convertedHtml, setConvertedHtml] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)

  // Convert markdown to HTML when block is selected and has markdown but no HTML
  useEffect(() => {
    if (selectedBlock?.type === 'text' && selectedBlock.data) {
      const hasHtml = selectedBlock.data.html && selectedBlock.data.html.trim()
      const hasMarkdown = selectedBlock.data.markdown && selectedBlock.data.markdown.trim()
      
      if (hasHtml) {
        setConvertedHtml(selectedBlock.data.html)
        setIsConverting(false)
      } else if (hasMarkdown && !hasHtml) {
        setIsConverting(true)
        markdownToHTML(selectedBlock.data.markdown)
          .then((html) => {
            setConvertedHtml(html)
            // Update the block with converted HTML
            onChange(
              blocks.map((block) => 
                block.id === selectedBlock.id 
                  ? { ...block, data: { ...selectedBlock.data, html, markdown: selectedBlock.data.markdown } }
                  : block
              )
            )
          })
          .catch((error) => {
            console.error("Failed to convert markdown:", error)
            const fallbackHtml = `<p>${selectedBlock.data.markdown.replace(/\n/g, '<br>')}</p>`
            setConvertedHtml(fallbackHtml)
          })
          .finally(() => {
            setIsConverting(false)
          })
      } else {
        setConvertedHtml("")
        setIsConverting(false)
      }
    } else {
      setConvertedHtml("")
      setIsConverting(false)
    }
  }, [selectedBlock?.id, selectedBlock?.data?.html, selectedBlock?.data?.markdown, blocks, onChange])

  const renderBlockEditor = () => {
    // If no block selected, don't show editor
    if (!selectedBlock) {
      return null
    }
    
    // Per-answer-explanation placeholder is not editable
    if (selectedBlock.type === 'per-answer-explanation') {
      return null
    }

    const commonProps = {
      data: selectedBlock.data,
      onChange: (data: any) => handleUpdateBlock(selectedBlock.id, data),
    }

    switch (selectedBlock.type) {
      case "text":
        return <TextEditor {...commonProps} />
      case "table":
        return <TableEditor {...commonProps} />
      case "image":
        return <ImageEditor {...commonProps} blockId={selectedBlock.id} />
      case "internal-link":
        return <InternalLinkEditor {...commonProps} />
      case "external-link":
        return <ExternalLinkEditor {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Header - Always visible */}
      <div className="p-3 border border-border rounded-lg bg-card">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">
            {selectedBlock && selectedBlock.type !== 'per-answer-explanation'
              ? `Editing: ${selectedBlock.type.replace("-", " ").charAt(0).toUpperCase() + selectedBlock.type.replace("-", " ").slice(1)}`
              : "Rich Text Content"}
          </span>
          {selectedBlock && (
            <button
              onClick={() => setSelectedBlockId(null)}
              className="ml-auto px-2 py-0.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Formatting Toolbar - Always visible (from RichMarkdownEditor) */}
      <div className="border border-border rounded-lg bg-card p-2">
        {!selectedBlock || selectedBlock.type === 'text' ? (
          isConverting ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Converting markdown to HTML...</p>
            </div>
          ) : (
            <RichMarkdownEditor
              key={selectedBlock?.id || 'default'} // Force re-render when block changes
              initialContent={
                selectedBlock?.type === 'text' 
                  ? (convertedHtml || selectedBlock.data?.html || "") 
                  : ""
              }
              onChange={(html) => {
                if (selectedBlock?.type === 'text') {
                  handleUpdateBlock(selectedBlock.id, { 
                    ...selectedBlock.data, 
                    html,
                    markdown: selectedBlock.data?.markdown || "" 
                  })
                  setConvertedHtml(html)
                } else if (!selectedBlock && html && html.trim()) {
                  // Create a new text block when content is added and no block is selected
                  const newBlock: ContentBlock = {
                    id: generateBlockId(),
                    type: 'text',
                    data: { html, markdown: "" },
                    order: blocks.length,
                  }
                  onChange([...blocks, newBlock])
                  setSelectedBlockId(newBlock.id)
                }
              }}
              showEditorContent={!!selectedBlock && selectedBlock.type === 'text'}
            />
          )
        ) : (
          // For non-text blocks, show the block-specific editor
          <div className="p-3">
            {renderBlockEditor() || <div className="text-xs text-muted-foreground">No editor available for this block type</div>}
          </div>
        )}
      </div>

      {/* Block Addition Toolbar - Always visible */}
      <RichEditorToolbar 
        onAddBlock={handleAddBlock} 
        disabled={disabled}
        perAnswerExplanationCount={perAnswerExplanationCount}
        isMainExplanation={isMainExplanation}
      />

      {blocks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
          <p className="mb-2">{placeholder}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const isSelected = selectedBlockId === block.id
            const isEditable = block.type === 'text' || block.type === 'table' || block.type === 'image' || block.type === 'internal-link' || block.type === 'external-link'
            
            return (
            <Card
              key={block.id}
                className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/30'
                }`}
                onClick={() => {
                  if (isEditable && block.type !== 'per-answer-explanation') {
                    setSelectedBlockId(block.id)
                  }
                }}
            >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground capitalize">
                      {block.type === 'per-answer-explanation' 
                        ? 'Per-Answer Explanation Placeholder' 
                        : block.type.replace("-", " ")}
                    </span>
                    {block.type === 'per-answer-explanation' && (
                      <span className="text-xs text-muted-foreground italic">
                        (Placeholder - not editable)
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-xs text-primary font-semibold">
                        (Currently editing)
                  </span>
                    )}
                </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleReorder(block.id, "up")}
                    disabled={index === 0 || disabled}
                    className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleReorder(block.id, "down")}
                    disabled={index === blocks.length - 1 || disabled}
                    className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    ↓
                  </button>
                    {isEditable && block.type !== 'per-answer-explanation' && (
                  <button
                        onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                  >
                        {isSelected ? "Editing" : "Edit"}
                  </button>
                    )}
                  <button
                    onClick={() => handleRemoveBlock(block.id)}
                    disabled={disabled}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded disabled:opacity-50"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>

                {block.type === 'per-answer-explanation' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                      <p className="text-sm text-muted-foreground text-center italic">
                        This placeholder defines where per-answer explanations will appear in the main explanation.
                        Configure per-answer explanations in the &quot;Answer Choices &amp; Explanations&quot; section above.
                      </p>
                    </div>
                </div>
              )}
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}






