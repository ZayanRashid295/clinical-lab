"use client"

import { useEffect, useState, useRef } from "react"
import { ContentBlock } from "../rich-editor/types"
import RichTextEditor from "./RichTextEditor"
import { blocksToHTMLAsync } from "./content-utils"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

interface PerAnswerExplanationEditorProps {
  blocks: ContentBlock[]
  onChange: (html: string) => void
  onBlocksChange?: (blocks: ContentBlock[]) => void
  editorRef?: (editor: any) => void
  placeholder?: string
  className?: string
}

/**
 * Component for editing per-answer explanations using RichTextEditor
 * This integrates with the unified toolbar like other sections
 */
export default function PerAnswerExplanationEditor({
  blocks,
  onChange,
  onBlocksChange,
  editorRef,
  placeholder,
  className,
}: PerAnswerExplanationEditorProps) {
  const [htmlContent, setHtmlContent] = useState<string>("<p></p>")
  const [isConverting, setIsConverting] = useState(false)
  const editorInstanceRef = useRef<any>(null)
  const lastEmittedHtmlRef = useRef<string>("")
  const isInternalChangeRef = useRef(false)
  const blocksRef = useRef<ContentBlock[]>(blocks)
  const hasConvertedRef = useRef(false)

  // Convert blocks to HTML when blocks change
  useEffect(() => {
    const convertBlocks = async () => {
      // Capture the internal change flag at the start to avoid race conditions
      const isInternal = isInternalChangeRef.current
      if (isInternal) {
        isInternalChangeRef.current = false
        blocksRef.current = blocks
        return
      }

      // Check if blocks actually changed (by comparing references and content)
      const blocksChanged = blocksRef.current !== blocks && 
        JSON.stringify(blocksRef.current) !== JSON.stringify(blocks)
      
      if (!blocksChanged && editorInstanceRef.current) {
        // Blocks haven't actually changed, skip update
        return
      }

      blocksRef.current = blocks
      
      // Helper function to normalize list HTML and remove excessive spacing
      const normalizeListHTML = (html: string): string => {
        if (!html || !html.includes('<li')) return html
        
        let normalized = html
        
        // Remove <p> tags inside <li> elements (TipTap doesn't use them, they cause spacing issues)
        // But preserve nested <ul>/<ol> structures inside <li>
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
      const mergeSplitOrderedLists = (html: string): string => {
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

      // Helper function to convert markdown to HTML
      const convertMarkdownToHTML = async (markdown: string): Promise<string> => {
        try {
          if (!markdown || !markdown.trim()) {
            return "<p></p>"
          }
          
          // If markdown already looks like HTML, normalize it and return
          if (markdown.trim().startsWith("<")) {
            return normalizeListHTML(markdown.trim())
          }
          
          // Use unified to convert markdown to HTML
          const file = await unified()
            .use(remarkParse)
            .use(remarkGfm) // This handles lists, tables, etc.
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
            // Convert headings
            fallback = fallback.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
            fallback = fallback.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
            fallback = fallback.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
            fallback = fallback.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
            fallback = fallback.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
            fallback = fallback.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
            // Convert lists - handle text before lists properly
            // First, split by double newlines to get paragraphs/sections
            const sections = fallback.split(/\n\n+/)
            const processedSections: string[] = []
            
            for (const section of sections) {
              const lines = section.split('\n')
              const processedLines: string[] = []
              let inList = false
              let currentParagraph: string[] = []
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim()
                // Check if line starts with list marker (-, *, +)
                const listMatch = line.match(/^([-*+])\s+(.+)$/)
                
                if (listMatch) {
                  // If we have accumulated paragraph text, output it first
                  if (currentParagraph.length > 0) {
                    processedLines.push(`<p>${currentParagraph.join(' ')}</p>`)
                    currentParagraph = []
                  }
                  
                  if (!inList) {
                    processedLines.push('<ul>')
                    inList = true
                  }
                  processedLines.push(`<li>${listMatch[2]}</li>`)
                } else {
                  if (inList) {
                    processedLines.push('</ul>')
                    inList = false
                  }
                  if (line) {
                    currentParagraph.push(line)
                  }
                }
              }
              
              // Close list if still open
              if (inList) {
                processedLines.push('</ul>')
              }
              
              // Output any remaining paragraph text
              if (currentParagraph.length > 0) {
                processedLines.push(`<p>${currentParagraph.join(' ')}</p>`)
              }
              
              if (processedLines.length > 0) {
                processedSections.push(processedLines.join('\n'))
              }
            }
            
            fallback = processedSections.join('\n')
            
            // Convert bold and italic (after lists, but process inside list items too)
            // First convert **bold** (double asterisks) - must be done before single *
            fallback = fallback.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
            // Then convert *italic* (single asterisks, but not inside **)
            // Match *text* where text doesn't contain asterisks or newlines
            fallback = fallback.replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/g, '$1<em>$2</em>$3')
            
            // The list structure is already in place, no need to split again
            // Just ensure we have valid HTML
            if (!fallback || fallback.trim() === "") {
              return `<p>${markdown.replace(/\n/g, '<br>')}</p>`
            }
            
            return fallback
        }
      }

      // Check if any blocks have markdown but no HTML - need to convert and save
      const needsConversion = blocks.some((block) => {
        if (block.type !== "text") return false
        const html = block.data?.html || ""
        const trimmedHtml = html.trim()
        const hasHtml = trimmedHtml && 
          trimmedHtml !== "<p></p>" &&
          trimmedHtml !== "<p><br></p>" &&
          trimmedHtml !== "<p> </p>" &&
          trimmedHtml !== "<p><br/></p>" &&
          trimmedHtml !== "<div></div>" &&
          trimmedHtml !== "<div><br></div>" &&
          trimmedHtml.startsWith("<")
        const hasMarkdown = block.data?.markdown && block.data.markdown.trim()
        return !hasHtml && hasMarkdown
      })

      // If we need to convert markdown to HTML, do it and save back to blocks
      if (needsConversion && !hasConvertedRef.current && onBlocksChange) {
        hasConvertedRef.current = true
        setIsConverting(true)
        try {
          
          // Convert each block's markdown to HTML and update blocks
          const updatedBlocks = await Promise.all(blocks.map(async (block) => {
            if (block.type === "text") {
              const html = block.data?.html || ""
              const trimmedHtml = html.trim()
              const hasHtml = trimmedHtml && 
                trimmedHtml !== "<p></p>" &&
                trimmedHtml !== "<p><br></p>" &&
                trimmedHtml !== "<p> </p>" &&
                trimmedHtml !== "<p><br/></p>" &&
                trimmedHtml !== "<div></div>" &&
                trimmedHtml !== "<div><br></div>" &&
                trimmedHtml.startsWith("<")
              const hasMarkdown = !!(block.data?.markdown && block.data.markdown.trim())
              
              // If block has markdown but no HTML, convert it
              if (!hasHtml && hasMarkdown) {
                const convertedHtml = await convertMarkdownToHTML(block.data!.markdown!)
                // HTML is already normalized in convertMarkdownToHTML
                
                return {
                  ...block,
                  data: {
                    ...block.data,
                    html: convertedHtml, // Save converted HTML
                    markdown: block.data.markdown, // Preserve markdown
                  },
                }
              }
            }
            return block
          }))
          
          // Update blocks with converted HTML
          onBlocksChange(updatedBlocks)
          
          // Now get the HTML for display
          const html = await blocksToHTMLAsync(updatedBlocks)
          const newHtml = normalizeListHTML(html || "<p></p>")
          setHtmlContent(newHtml)
          setIsConverting(false)
          
          // Reset conversion flag after a delay to allow re-conversion if needed
          setTimeout(() => {
            hasConvertedRef.current = false
          }, 1000)
          
          return
        } catch (error) {
          console.error("Error converting markdown to HTML in per-answer explanation:", error)
          hasConvertedRef.current = false
          setIsConverting(false)
        }
      }

      setIsConverting(true)
      try {
        const html = await blocksToHTMLAsync(blocks)
        const newHtml = normalizeListHTML(html || "<p></p>")
        
        // Normalize HTML for comparison (remove extra whitespace)
        const normalizeHtml = (h: string) => h.replace(/\s+/g, ' ').trim()
        const normalizedNew = normalizeHtml(newHtml)
        const normalizedLastEmitted = normalizeHtml(lastEmittedHtmlRef.current)
        
        // Only update editor if content is different from what we last emitted
        // This means it's an external change (e.g., from the other panel)
        if (editorInstanceRef.current) {
          const currentHtml = editorInstanceRef.current.getHTML()
          const normalizedCurrent = normalizeHtml(currentHtml)
          
          // If the new HTML matches what we last emitted, this is a re-render from our own change
          // Skip updating the editor to avoid interrupting typing
          if (normalizedNew === normalizedLastEmitted && normalizedLastEmitted !== "") {
            // This is a re-render from our own change, just update state but don't touch editor
            setHtmlContent(newHtml)
            setIsConverting(false)
            return
          }
          
          // If the new HTML is different from current editor content, it's an external change
          if (normalizedCurrent !== normalizedNew) {
            setHtmlContent(newHtml)
            // Only update editor if it's not currently focused (user is not typing)
            // This prevents interrupting the user's typing
            const isFocused = editorInstanceRef.current.isFocused
            if (!isFocused) {
              // Use requestAnimationFrame to ensure we don't interrupt typing
              requestAnimationFrame(() => {
                if (editorInstanceRef.current && !editorInstanceRef.current.isFocused) {
                  const editorHtml = editorInstanceRef.current.getHTML()
                  const normalizedEditor = normalizeHtml(editorHtml)
                  // Double-check the editor hasn't changed since we scheduled this update
                  if (normalizedEditor !== normalizedNew) {
                    editorInstanceRef.current.commands.setContent(newHtml, { emitUpdate: false })
                  }
                }
              })
            }
            // If editor is focused, we'll update it later when it loses focus
          } else {
            // Content matches, just update state
            setHtmlContent(newHtml)
          }
        } else {
          // Editor not ready yet, just update state
          setHtmlContent(newHtml)
        }
      } catch (error) {
        console.error("Error converting blocks to HTML:", error)
        setHtmlContent("<p></p>")
      } finally {
        setIsConverting(false)
      }
    }

    convertBlocks()
  }, [blocks])

  const handleChange = (html: string) => {
    // Mark this as an internal change to prevent the useEffect from resetting the editor
    isInternalChangeRef.current = true
    lastEmittedHtmlRef.current = html
    setHtmlContent(html)
    onChange(html)
  }

  const handleEditorRef = (editor: any) => {
    editorInstanceRef.current = editor
    if (editorRef) {
      editorRef(editor)
    }
    // Ensure editor is properly set up with focus handlers
    if (editor) {
      editor.on("focus", () => {
        // Notify parent that this editor is now active
        if (editorRef) {
          editorRef(editor)
        }
      })
    }
  }

  if (isConverting) {
    return (
      <div className={className}>
        <div className="min-h-[80px] border rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={className}
      onClick={(e) => {
        // Focus the editor when the container is clicked
        if (editorInstanceRef.current) {
          editorInstanceRef.current.commands.focus()
          if (editorRef) {
            editorRef(editorInstanceRef.current)
          }
        }
      }}
    >
      <RichTextEditor
        content={htmlContent}
        onChange={handleChange}
        editorRef={handleEditorRef}
        placeholder={placeholder || "Enter explanation..."}
        className="min-h-[80px]"
      />
    </div>
  )
}


