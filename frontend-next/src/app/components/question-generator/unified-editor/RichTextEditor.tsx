"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import { Table } from "@tiptap/extension-table"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TextAlign from "@tiptap/extension-text-align"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { FontSize } from "./FontSizeExtension"
import { FontFamily } from "./FontFamilyExtension"
import { useEffect, useRef } from "react"
import { cn } from "@/shared/utils/cn"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  editorRef?: (editor: any) => void
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Click to edit...",
  className,
  editable = true,
  editorRef,
}: RichTextEditorProps) {
  const isUpdatingRef = useRef(false)
  const isTypingRef = useRef(false)
  const onChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-muted p-4 rounded-lg font-mono text-sm",
          },
        },
        horizontalRule: {},
        strike: false,
        underline: false,
        link: false,
      }),
      Strike,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "tableHeader", "tableCell"],
      }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontSize,
      FontFamily,
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true, // Allow cell selection for merging
        HTMLAttributes: {
          class: "border-collapse border border-border my-4",
          style: "border: 2px solid #000000; width: 100%;",
        },
      }),
      TableRow,
      TableCell.extend({
        content: 'paragraph+',
        addAttributes() {
          const parentAttrs = (this as any).parent?.() || {}
          return {
            ...parentAttrs,
            textAlign: {
              default: "left",
              parseHTML: (element: HTMLElement) => element.style.textAlign || element.getAttribute("data-text-align") || "left",
              renderHTML: (attributes: Record<string, any>) => {
                const styles: string[] = [`text-align: ${attributes.textAlign}`]
                return {
                  "data-text-align": attributes.textAlign,
                  style: styles.join("; "),
                }
              },
            },
            textColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.color || element.getAttribute("data-text-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.textColor) {
                  return {}
                }
                return {
                  "data-text-color": attributes.textColor,
                  style: `color: ${attributes.textColor}`,
                }
              },
            },
            backgroundColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.backgroundColor || element.getAttribute("data-background-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.backgroundColor) {
                  return {}
                }
                return {
                  "data-background-color": attributes.backgroundColor,
                  style: `background-color: ${attributes.backgroundColor}`,
                }
              },
            },
            borderColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.borderColor || element.getAttribute("data-border-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.borderColor) {
                  return {}
                }
                return {
                  "data-border-color": attributes.borderColor,
                  style: `border-color: ${attributes.borderColor}`,
                }
              },
            },
          }
        },
        parseHTML() {
          return [{ tag: 'td' }]
        },
        renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
          return ["td", HTMLAttributes, 0]
        },
      }),
      // Use extended TableHeader instead of base one to avoid duplicate extension warning
      TableHeader.extend({
        content: 'paragraph+',
        addAttributes() {
          const parentAttrs = (this as any).parent?.() || {}
          return {
            ...parentAttrs,
            textAlign: {
              default: "left",
              parseHTML: (element: HTMLElement) => element.style.textAlign || element.getAttribute("data-text-align") || "left",
              renderHTML: (attributes: Record<string, any>) => {
                const styles: string[] = [`text-align: ${attributes.textAlign}`]
                return {
                  "data-text-align": attributes.textAlign,
                  style: styles.join("; "),
                }
              },
            },
            textColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.color || element.getAttribute("data-text-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.textColor) {
                  return {}
                }
                return {
                  "data-text-color": attributes.textColor,
                  style: `color: ${attributes.textColor}`,
                }
              },
            },
            backgroundColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.backgroundColor || element.getAttribute("data-background-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.backgroundColor) {
                  return {}
                }
                return {
                  "data-background-color": attributes.backgroundColor,
                  style: `background-color: ${attributes.backgroundColor}`,
                }
              },
            },
            borderColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.borderColor || element.getAttribute("data-border-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.borderColor) {
                  return {}
                }
                return {
                  "data-border-color": attributes.borderColor,
                  style: `border-color: ${attributes.borderColor}`,
                }
              },
            },
          }
        },
        parseHTML() {
          return [{ tag: 'th' }]
        },
        renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
          return ["th", HTMLAttributes, 0]
        },
      }),
    ],
    content: content || "<p></p>",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return
      isTypingRef.current = true
      
      // Debounce onChange to prevent excessive re-renders and cursor loss
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current)
      }
      
      onChangeTimeoutRef.current = setTimeout(() => {
      const html = editor.getHTML()
      onChange(html)
        isTypingRef.current = false
      }, 300) // 300ms debounce
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          className
        ),
      },
    },
  })

  // Expose editor instance via ref
  useEffect(() => {
    if (editor && editorRef) {
      editorRef(editor)
    }
    return () => {
      // Cleanup: remove editor ref when component unmounts
      if (editorRef) {
        editorRef(null)
      }
    }
  }, [editor, editorRef])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current)
      }
    }
  }, [])

  // Helper function to normalize list HTML and remove excessive spacing
  const normalizeListHTML = (html: string): string => {
    if (!html || !html.includes('<li')) return html
    
    let normalized = html
    
    // IMPORTANT: Preserve all classes (especially tiptap-fs-* and tiptap-ff-* for font size/family)
    // Only remove <p> tags inside <li> elements, but preserve all attributes including classes
    // Remove <p> tags inside <li> elements (TipTap doesn't use them, they cause spacing issues)
    // But preserve nested <ul>/<ol> structures inside <li>
    const processListItem = (content: string): string => {
      // First, check if this content contains nested lists - if so, preserve them
      const hasNestedList = /<[uo]l[\s>]/.test(content)
      
      if (hasNestedList) {
        // For items with nested lists, be more careful
        // Remove <p> tags but preserve the nested list structure and font size classes
        // Extract classes from <p> tags before removing them
        const pTagMatches = Array.from(content.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi))
        let preservedClasses: string[] = []
        
        for (const pMatch of pTagMatches) {
          const pAttrs = pMatch[1] || ""
          const classMatch = pAttrs.match(/class\s*=\s*["']([^"']+)["']/i)
          if (classMatch?.[1]) {
            const classes = classMatch[1].split(/\s+/)
            const fontClasses = classes.filter(c => c.startsWith('tiptap-fs-') || c.startsWith('tiptap-ff-'))
            preservedClasses.push(...fontClasses)
          }
        }
        
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
        
        // If we have preserved classes and content doesn't already have them, wrap in span
        if (preservedClasses.length > 0) {
          const uniqueClasses = [...new Set(preservedClasses)].join(' ')
          if (!cleaned.includes(`class="${uniqueClasses}"`) && !cleaned.includes(`class='${uniqueClasses}'`) && !cleaned.includes(uniqueClasses.split(' ')[0])) {
            // Wrap only the non-list content in span, preserving nested lists
            if (cleaned.match(/^[^<]*<[uo]l/)) {
              // Content starts with text before list - wrap the text part
              cleaned = cleaned.replace(/^([^<]*)(<[uo]l[\s\S]*)$/, `<span class="${uniqueClasses}">$1</span>$2`)
            } else if (cleaned.match(/<\/[uo]l>[^<]*$/)) {
              // Content ends with text after list - wrap the text part
              cleaned = cleaned.replace(/^([\s\S]*<\/[uo]l>)([^<]*)$/, `$1<span class="${uniqueClasses}">$2</span>`)
            } else {
              // No lists, wrap everything
              cleaned = `<span class="${uniqueClasses}">${cleaned}</span>`
            }
          }
        }
        
        return cleaned
      } else {
        // For items without nested lists, remove <p> and <div> tags but preserve their classes on content
        // Extract classes from <p> tags before removing them
        const pTagMatches = Array.from(content.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi))
        let preservedClasses: string[] = []
        
        for (const pMatch of pTagMatches) {
          const pAttrs = pMatch[1] || ""
          const classMatch = pAttrs.match(/class\s*=\s*["']([^"']+)["']/i)
          if (classMatch?.[1]) {
            const classes = classMatch[1].split(/\s+/)
            const fontClasses = classes.filter(c => c.startsWith('tiptap-fs-') || c.startsWith('tiptap-ff-'))
            preservedClasses.push(...fontClasses)
          }
        }
        
        let cleaned = content
          .replace(/<p[^>]*>/gi, '')
          .replace(/<\/p>/gi, '')
          .replace(/<div[^>]*>/gi, '')
          .replace(/<\/div>/gi, '')
          .replace(/\n\s*\n\s*/g, ' ')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\s+/g, ' ')
        
        // If we have preserved classes and content doesn't already have them, wrap in span
        if (preservedClasses.length > 0) {
          const uniqueClasses = [...new Set(preservedClasses)].join(' ')
          if (!cleaned.includes(`class="${uniqueClasses}"`) && !cleaned.includes(`class='${uniqueClasses}'`) && !cleaned.includes(uniqueClasses.split(' ')[0])) {
            cleaned = `<span class="${uniqueClasses}">${cleaned}</span>`
          }
        }
        
        return cleaned
      }
    }
    
    // Process list items, handling nested lists carefully
    // IMPORTANT: When removing <p> tags, preserve their classes by wrapping content in <span>
    // Also check for existing <span> tags with font size classes and preserve them
    // Use a recursive approach to handle deeply nested lists
    let changed = true
    let iterations = 0
    while (changed && iterations < 10) {
      const before = normalized
      normalized = normalized.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (match, liAttrs, content) => {
        // Before processing, extract classes from <p> tags that will be removed
        const pTagMatches = Array.from(content.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)) as RegExpMatchArray[]
        let preservedClasses: string[] = []
        
        for (const pMatch of pTagMatches) {
          const pAttrs = (pMatch[1] as string) || ""
          const classMatch = pAttrs.match(/class\s*=\s*["']([^"']+)["']/i)
          if (classMatch?.[1]) {
            // Extract font size and font family classes
            const classes = classMatch[1].split(/\s+/)
            const fontClasses = classes.filter(c => c.startsWith('tiptap-fs-') || c.startsWith('tiptap-ff-'))
            preservedClasses.push(...fontClasses)
          }
        }
        
        // Also check for existing <span> tags with font size classes in the content
        const spanTagMatches = Array.from(content.matchAll(/<span([^>]*)>([\s\S]*?)<\/span>/gi)) as RegExpMatchArray[]
        for (const spanMatch of spanTagMatches) {
          const spanAttrs = (spanMatch[1] as string) || ""
          const classMatch = spanAttrs.match(/class\s*=\s*["']([^"']+)["']/i)
          if (classMatch?.[1]) {
            const classes = classMatch[1].split(/\s+/)
            const fontClasses = classes.filter(c => c.startsWith('tiptap-fs-') || c.startsWith('tiptap-ff-'))
            preservedClasses.push(...fontClasses)
          }
        }
        
        const cleaned = processListItem(content)
        
        // If we have preserved classes and content doesn't already have them, wrap in span
        if (preservedClasses.length > 0) {
          const uniqueClasses = [...new Set(preservedClasses)].join(' ')
          // Check if cleaned content already has these classes (might be in existing spans)
          const hasClasses = cleaned.includes(`class="${uniqueClasses}"`) || 
                            cleaned.includes(`class='${uniqueClasses}'`) ||
                            uniqueClasses.split(' ').some(cls => cleaned.includes(cls))
          
          if (!hasClasses) {
            // Wrap content in span with preserved classes
            return `<li${liAttrs || ''}><span class="${uniqueClasses}">${cleaned}</span></li>`
          }
        }
        
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

  // Update editor content when prop changes
  useEffect(() => {
    // Don't update if user is actively typing
    if (isTypingRef.current) return
    
    if (editor && content !== editor.getHTML()) {
      isUpdatingRef.current = true
      
      // Normalize list HTML to fix spacing issues, but preserve font size classes
      const normalizedContent = normalizeListHTML(content || "<p></p>")
      
      // Set content - TipTap will parse the HTML
      editor.commands.setContent(normalizedContent, { emitUpdate: false })
      
      // CRITICAL FIX: After setContent, FORCE apply font size marks
      // This is especially important when font size is the ONLY mark (no bold/italic)
      // TipTap might not create textStyle mark in this case, so we force it
      
      // Use setTimeout to ensure TipTap has finished parsing
      setTimeout(() => {
        const htmlHasFontSize = normalizedContent.includes('tiptap-fs-')
        if (!htmlHasFontSize) {
          isUpdatingRef.current = false
          return
        }
        
        // Parse HTML to find all font size classes
        // IMPORTANT: Also check within table cells (td, th) for font size classes
        const parser = new DOMParser()
        const doc = parser.parseFromString(normalizedContent, 'text/html')
        const htmlElements = doc.querySelectorAll('[class*="tiptap-fs-"]')
        
        // Also check for font size classes within table cells
        const tableCells = doc.querySelectorAll('td[class*="tiptap-fs-"], th[class*="tiptap-fs-"], td [class*="tiptap-fs-"], th [class*="tiptap-fs-"]')
        
        if (htmlElements.length === 0 && tableCells.length === 0) {
          isUpdatingRef.current = false
          return
        }
        
        const { state } = editor
        const { tr } = state
        let hasChanges = false
        
        // Build a map of text content to font sizes
        const textToFontSize = new Map<string, string>()
        
        // Process regular elements
        for (const htmlEl of Array.from(htmlElements)) {
          const el = htmlEl as HTMLElement
          const className = el.getAttribute("class") || ""
          const match = className.match(/\btiptap-fs-(\d+)\b/)
          
          if (!match?.[1]) continue
          
          const fontSize = match[1]
          const text = el.textContent?.trim() || ""
          
          if (text) {
            // Store the longest text match (most specific)
            const existing = textToFontSize.get(text)
            if (!existing || text.length > existing.length) {
              textToFontSize.set(text, fontSize)
            }
          }
        }
        
        // Process table cells - check both the cell itself and its children
        for (const cellEl of Array.from(tableCells)) {
          const el = cellEl as HTMLElement
          
          // Check if the cell itself has the class
          const cellClassName = el.getAttribute("class") || ""
          let match = cellClassName.match(/\btiptap-fs-(\d+)\b/)
          let fontSize: string | null = null
          
          if (match?.[1]) {
            fontSize = match[1]
          } else {
            // Check children for font size classes
            const childWithFontSize = el.querySelector('[class*="tiptap-fs-"]') as HTMLElement
            if (childWithFontSize) {
              const childClassName = childWithFontSize.getAttribute("class") || ""
              match = childClassName.match(/\btiptap-fs-(\d+)\b/)
              if (match?.[1]) {
                fontSize = match[1]
              }
            }
          }
          
          if (fontSize) {
            const text = el.textContent?.trim() || ""
            if (text) {
              const existing = textToFontSize.get(text)
              if (!existing || text.length > existing.length) {
                textToFontSize.set(text, fontSize)
              }
            }
          }
        }
        
        // Apply marks to ALL text nodes that match (including those in table cells)
        // The descendants method will traverse all nodes including table cells
        // Use the same aggressive approach for both regular text and table cell content
        state.doc.descendants((node, pos) => {
          if (!node.isText || !node.text) return true
          
          const nodeText = node.text.trim()
          if (!nodeText) return true
          
          // Check if this text node matches any of our stored text patterns
          for (const [searchText, fontSize] of textToFontSize.entries()) {
            // Match if texts overlap significantly
            if (nodeText.includes(searchText) || searchText.includes(nodeText) || 
                nodeText.substring(0, Math.min(20, nodeText.length)) === searchText.substring(0, Math.min(20, searchText.length))) {
              
              // Check if mark already exists
              const hasMark = node.marks.some(
                m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
              )
              
              if (!hasMark) {
                // FORCE apply font size mark - this works even when it's the only mark
                // This works for both regular text and table cell content
                // Use nodesBetween to ensure we apply to all text nodes in the range
                state.doc.nodesBetween(pos, pos + node.nodeSize, (textNode, textPos) => {
                  if (textNode.isText) {
                    const textHasMark = textNode.marks.some(
                      m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                    )
                    if (!textHasMark) {
                      tr.addMark(textPos, textPos + textNode.nodeSize, state.schema.marks.textStyle.create({ fontSize }))
                      hasChanges = true
                    }
                  }
                  return true
                })
                break // Found match, move to next node
              }
            }
          }
          
          return true
        })
        
        // Apply transaction if we made changes
        if (hasChanges) {
          editor.view.dispatch(tr)
        }
        
        isUpdatingRef.current = false
      }, 100) // Small delay to ensure TipTap has finished
      
      // SECOND PASS: After DOM is fully rendered, check DOM elements
      // This catches cases where HTML was parsed but marks weren't applied
      // IMPORTANT: This pass specifically handles table cells which might need special treatment
      setTimeout(() => {
        // Editor might be destroyed or not yet mounted at this point
        if (!editor || !(editor as any).view || (editor as any).isDestroyed) {
          return
        }

        const editorDOM = (editor as any).view.dom as HTMLElement
        const elementsWithFontSize = editorDOM.querySelectorAll('[class*="tiptap-fs-"]')
        
        // Also check for font size classes within table cells in the DOM
        const tableCellsWithFontSize = editorDOM.querySelectorAll('td[class*="tiptap-fs-"], th[class*="tiptap-fs-"], td [class*="tiptap-fs-"], th [class*="tiptap-fs-"]')
        
        // Also check the HTML content directly to find font size classes
        // This catches cases where TipTap might not have rendered the classes yet
        const htmlContent = normalizedContent || content || ""
        const hasFontSizeInContent = htmlContent.includes('tiptap-fs-')
        
        if (elementsWithFontSize.length > 0 || tableCellsWithFontSize.length > 0 || hasFontSizeInContent) {
          const { state, view } = editor
          const { tr } = state
          let hasChanges = false
          
          // Process each element with font size class (including table cells)
          const allElementsToProcess = [
            ...Array.from(elementsWithFontSize),
            ...Array.from(tableCellsWithFontSize)
          ]
          
          for (const el of allElementsToProcess) {
            const htmlEl = el as HTMLElement
            
            // Check if this is a table cell (td or th)
            const isTableCell = htmlEl.tagName === 'TD' || htmlEl.tagName === 'TH'
            
            // Get font size - check the element itself first, then children
            let fontSize: string | null = null
            let className = htmlEl.getAttribute("class") || ""
            let match = className.match(/\btiptap-fs-(\d+)\b/)
            
            if (match?.[1]) {
              fontSize = match[1]
            } else {
              // Check children for font size classes (works for both regular elements and table cells)
              const childWithFontSize = htmlEl.querySelector('[class*="tiptap-fs-"]') as HTMLElement
              if (childWithFontSize) {
                className = childWithFontSize.getAttribute("class") || ""
                match = className.match(/\btiptap-fs-(\d+)\b/)
                if (match?.[1]) {
                  fontSize = match[1]
                }
              }
            }
            
            if (!fontSize) continue
            
            const text = htmlEl.textContent || ""
            
            if (!text.trim()) continue
            
            // SPECIAL HANDLING FOR TABLE CELLS: Use TreeWalker to find ALL text nodes
            // This is especially important when font size is the ONLY mark
            // Apply the same aggressive approach as regular text
            if (isTableCell) {
              try {
                // Use TreeWalker to find all text nodes in the table cell
                const walker = document.createTreeWalker(
                  htmlEl,
                  NodeFilter.SHOW_TEXT,
                  null
                )
                
                let textNode: Node | null
                while ((textNode = walker.nextNode())) {
                  if (textNode.textContent && textNode.textContent.trim()) {
                    try {
                      // Get the position of the text node in the document
                      const startPos = view.posAtDOM(textNode, 0)
                      const endPos = view.posAtDOM(textNode, textNode.textContent.length)
                      
                      if (startPos !== null && endPos !== null && endPos > startPos) {
                        // Use nodesBetween to check ALL text nodes in this range
                        // This ensures we apply marks even when font size is the only mark
                        state.doc.nodesBetween(startPos, endPos, (node, pos) => {
                          if (node.isText) {
                            // Check if this text node already has the font size mark
                            const hasMark = node.marks.some(
                              m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                            )
                            
                            if (!hasMark) {
                              // Apply the font size mark to this specific text node
                              // This works even when font size is the ONLY mark
                              tr.addMark(pos, pos + node.nodeSize, state.schema.marks.textStyle.create({ fontSize }))
                              hasChanges = true
                            }
                          }
                          return true
                        })
                      }
                    } catch (e) {
                      // If DOM mapping fails, continue to next text node
                      console.warn("Error getting posAtDOM for table cell text node:", e)
                    }
                  }
                }
                continue // Skip the regular processing for table cells
              } catch (e) {
                // If TreeWalker fails, fall through to regular processing
                console.warn("Error using TreeWalker for table cell:", e)
              }
            }
            
            // Regular processing for non-table-cell elements
            // Find position in document using TipTap's DOM mapping
            try {
              // Find first text node in the element
              let firstTextNode: Node | null = null
              let lastTextNode: Node | null = null
              
              const walker = document.createTreeWalker(
                htmlEl,
                NodeFilter.SHOW_TEXT,
                null
              )
              
              let node = walker.nextNode()
              if (node) {
                firstTextNode = node
                lastTextNode = node
                while ((node = walker.nextNode())) {
                  lastTextNode = node
                }
              }
              
              if (firstTextNode && lastTextNode) {
                // Get positions from text nodes
                const startPos = view.posAtDOM(firstTextNode, 0)
                const endPos = view.posAtDOM(lastTextNode, lastTextNode.textContent?.length || 0)
                
                if (startPos !== null && endPos !== null && endPos > startPos) {
                  // Check ALL text nodes in this range to see if they have the mark
                  let needsMark = false
                  state.doc.nodesBetween(startPos, endPos, (node, pos) => {
                    if (node.isText) {
                      const hasMark = node.marks.some(
                        m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                      )
                      if (!hasMark) {
                        needsMark = true
                      }
                    }
                  })
                  
                  if (needsMark) {
                    // Apply font size mark to the entire range
                    tr.addMark(startPos, endPos, state.schema.marks.textStyle.create({ fontSize }))
                    hasChanges = true
                  }
                }
              } else {
                // No text nodes found, try direct element mapping
                const startPos = view.posAtDOM(htmlEl, 0)
                if (startPos !== null) {
                  // Find the end by getting the next sibling or parent end
                  let endPos = startPos + text.length
                  const $start = state.doc.resolve(startPos)
                  const node = $start.nodeAfter || $start.parent
                  if (node) {
                    endPos = startPos + node.nodeSize
                  }
                  
                  if (endPos > startPos) {
                    // Check if mark exists in this range
                    let needsMark = false
                    state.doc.nodesBetween(startPos, endPos, (node) => {
                      if (node.isText) {
                        const hasMark = node.marks.some(
                          m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                        )
                        if (!hasMark) {
                          needsMark = true
                        }
                      }
                    })
                    
                    if (needsMark) {
                      tr.addMark(startPos, endPos, state.schema.marks.textStyle.create({ fontSize }))
                      hasChanges = true
                    }
                  }
                }
              }
            } catch (e) {
              // If DOM mapping fails, use text search as fallback
              const searchText = text.trim().substring(0, Math.min(50, text.length))
              if (searchText) {
                let found = false
                state.doc.descendants((node, pos) => {
                  if (found) return false
                  if (!node.isText || !node.text) return true
                  if (node.text.includes(searchText)) {
                    // Check if this specific text node has the mark
                    const hasMark = node.marks.some(
                      m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                    )
                    if (!hasMark) {
                      // Apply mark to this text node
                      tr.addMark(pos, pos + node.nodeSize, state.schema.marks.textStyle.create({ fontSize }))
                      hasChanges = true
                      found = true
                    }
                    return false // Stop searching
                  }
                  return true
                })
              }
            }
          }
          
          // Apply transaction if we made changes
          if (hasChanges) {
            editor.view.dispatch(tr)
          }
        }
        
        // THIRD PASS: Aggressively handle table cells from HTML content
        // This ensures table cell font sizes persist even when font size is the only mark
        // Match by text content to find corresponding cells in editor DOM
        if (hasFontSizeInContent) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlContent, 'text/html')
          const tableCellsInHTML = doc.querySelectorAll('td[class*="tiptap-fs-"], th[class*="tiptap-fs-"], td [class*="tiptap-fs-"], th [class*="tiptap-fs-"]')
          
          if (tableCellsInHTML.length > 0) {
            const { state, view } = editor
            const { tr } = state
            let hasChanges = false
            
            // Get all table cells from the editor DOM
            const editorDOM = editor.view.dom
            const editorTableCells = editorDOM.querySelectorAll('td, th')
            
            // Match HTML table cells with editor DOM table cells by text content
            for (const htmlCell of Array.from(tableCellsInHTML)) {
              const htmlCellEl = htmlCell as HTMLElement
              
              // Get font size from HTML cell
              let fontSize: string | null = null
              const cellClassName = htmlCellEl.getAttribute("class") || ""
              let match = cellClassName.match(/\btiptap-fs-(\d+)\b/)
              
              if (match?.[1]) {
                fontSize = match[1]
              } else {
                const childWithFontSize = htmlCellEl.querySelector('[class*="tiptap-fs-"]') as HTMLElement
                if (childWithFontSize) {
                  const childClassName = childWithFontSize.getAttribute("class") || ""
                  match = childClassName.match(/\btiptap-fs-(\d+)\b/)
                  if (match?.[1]) {
                    fontSize = match[1]
                  }
                }
              }
              
              if (!fontSize) continue
              
              const htmlCellText = htmlCellEl.textContent?.trim() || ""
              if (!htmlCellText) continue
              
              // Find matching editor cell by text content
              for (const editorCell of Array.from(editorTableCells)) {
                const editorCellEl = editorCell as HTMLElement
                const editorCellText = editorCellEl.textContent?.trim() || ""
                
                // Match if texts are similar (allowing for whitespace differences)
                if (htmlCellText === editorCellText || 
                    htmlCellText.substring(0, Math.min(30, htmlCellText.length)) === editorCellText.substring(0, Math.min(30, editorCellText.length))) {
                  
                  // Use TreeWalker to find all text nodes in the editor table cell
                  const walker = document.createTreeWalker(
                    editorCellEl,
                    NodeFilter.SHOW_TEXT,
                    null
                  )
                  
                  let textNode: Node | null
                  while ((textNode = walker.nextNode())) {
                    if (textNode.textContent && textNode.textContent.trim()) {
                      try {
                        const startPos = view.posAtDOM(textNode, 0)
                        const endPos = view.posAtDOM(textNode, textNode.textContent.length)
                        
                        if (startPos !== null && endPos !== null && endPos > startPos) {
                          // Use nodesBetween to apply marks to ALL text nodes in this range
                          // This is the same aggressive approach that works for regular text
                          state.doc.nodesBetween(startPos, endPos, (node, pos) => {
                            if (node.isText) {
                              const hasMark = node.marks.some(
                                m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                              )
                              if (!hasMark) {
                                // Apply mark to each text node individually
                                // This works even when font size is the ONLY mark
                                tr.addMark(pos, pos + node.nodeSize, state.schema.marks.textStyle.create({ fontSize }))
                                hasChanges = true
                              }
                            }
                            return true
                          })
                        }
                      } catch (e) {
                        // Continue to next text node
                      }
                    }
                  }
                  
                  break // Found match, move to next HTML cell
                }
              }
            }
            
            if (hasChanges) {
              editor.view.dispatch(tr)
            }
          }
        }
        
        // FOURTH PASS: If HTML has font size classes but DOM doesn't show them,
        // parse the HTML directly and apply marks
        if (hasFontSizeInContent && elementsWithFontSize.length === 0) {
          // Parse HTML to find font size classes and apply them
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlContent, 'text/html')
          const htmlElementsWithFontSize = doc.querySelectorAll('[class*="tiptap-fs-"]')
          
          if (htmlElementsWithFontSize.length > 0) {
            const { state, view } = editor
            const { tr } = state
            let hasChanges = false
            
            // For each element in the parsed HTML, find corresponding text in editor
            for (const htmlEl of Array.from(htmlElementsWithFontSize)) {
              const el = htmlEl as HTMLElement
              const className = el.getAttribute("class") || ""
              const match = className.match(/\btiptap-fs-(\d+)\b/)
              
              if (!match?.[1]) continue
              
              const fontSize = match[1]
              const text = el.textContent || ""
              
              if (!text.trim()) continue
              
              // Search for this text in the editor document
              const searchText = text.trim().substring(0, Math.min(100, text.length))
              if (searchText) {
                state.doc.descendants((node, pos) => {
                  if (!node.isText || !node.text) return true
                  if (node.text.includes(searchText)) {
                    // Check if this text node has the font size mark
                    const hasMark = node.marks.some(
                      m => m.type.name === 'textStyle' && m.attrs.fontSize === fontSize
                    )
                    if (!hasMark) {
                      // Apply font size mark
                      tr.addMark(pos, pos + node.nodeSize, state.schema.marks.textStyle.create({ fontSize }))
                      hasChanges = true
                    }
                    return false // Stop after first match
                  }
                  return true
                })
              }
            }
            
            if (hasChanges) {
              editor.view.dispatch(tr)
            }
          }
        }
        
        isUpdatingRef.current = false
      }, 200) // Give TipTap time to finish parsing
      
      
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 100)
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div className={cn("border rounded-lg border-border dark:border-gray-700 bg-card dark:bg-gray-800", className)}>
        <p className="text-muted-foreground dark:text-gray-400">{placeholder}</p>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Prevent scrollbars and auto-size to content */
          .ProseMirror {
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
          }
          /* TextStyle helpers (font family / size) */
          .ProseMirror .tiptap-ff-arial { font-family: Arial, sans-serif; }
          .ProseMirror .tiptap-ff-times-new-roman { font-family: "Times New Roman", Times, serif; }
          .ProseMirror .tiptap-ff-courier-new { font-family: "Courier New", Courier, monospace; }
          .ProseMirror .tiptap-ff-georgia { font-family: Georgia, serif; }
          .ProseMirror .tiptap-ff-verdana { font-family: Verdana, Geneva, sans-serif; }
          .ProseMirror .tiptap-ff-helvetica { font-family: Helvetica, Arial, sans-serif; }
          .ProseMirror .tiptap-ff-comic-sans-ms { font-family: "Comic Sans MS", "Comic Sans", cursive; }
          .ProseMirror .tiptap-ff-trebuchet-ms { font-family: "Trebuchet MS", Helvetica, sans-serif; }

          .ProseMirror .tiptap-fs-8 { font-size: 8px; }
          .ProseMirror .tiptap-fs-9 { font-size: 9px; }
          .ProseMirror .tiptap-fs-10 { font-size: 10px; }
          .ProseMirror .tiptap-fs-11 { font-size: 11px; }
          .ProseMirror .tiptap-fs-12 { font-size: 12px; }
          .ProseMirror .tiptap-fs-14 { font-size: 14px; }
          .ProseMirror .tiptap-fs-16 { font-size: 16px; }
          .ProseMirror .tiptap-fs-18 { font-size: 18px; }
          .ProseMirror .tiptap-fs-20 { font-size: 20px; }
          .ProseMirror .tiptap-fs-24 { font-size: 24px; }
          .ProseMirror .tiptap-fs-28 { font-size: 28px; }
          .ProseMirror .tiptap-fs-32 { font-size: 32px; }
          .ProseMirror .tiptap-fs-36 { font-size: 36px; }
          .ProseMirror .tiptap-fs-48 { font-size: 48px; }
          .ProseMirror .tiptap-fs-72 { font-size: 72px; }

          /* Paragraph hover */
          .ProseMirror p:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          /* Heading hover */
          .ProseMirror h1:hover,
          .ProseMirror h2:hover,
          .ProseMirror h3:hover,
          .ProseMirror h4:hover,
          .ProseMirror h5:hover,
          .ProseMirror h6:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          /* List styles - ensure bullets and numbers are visible */
          .ProseMirror ul {
            list-style-type: disc !important;
            list-style-position: outside !important;
            padding-left: 1.5rem !important;
            margin: 0.5rem 0 !important;
          }
          .ProseMirror ol {
            list-style-type: decimal !important;
            list-style-position: outside !important;
            padding-left: 1.5rem !important;
            margin: 0.5rem 0 !important;
          }
          .ProseMirror li {
            display: list-item !important;
            margin-top: 0.125rem !important;
            margin-bottom: 0.125rem !important;
            padding-left: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          /* Remove block display from <p> and <div> inside <li> */
          .ProseMirror li > p,
          .ProseMirror li > div {
            display: inline !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: inherit !important;
          }
          /* Nested lists - all levels */
          .ProseMirror ul ul,
          .ProseMirror ol ol,
          .ProseMirror li ul,
          .ProseMirror li ol,
          .ProseMirror ul ol,
          .ProseMirror ol ul {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 1.5rem !important;
          }
          /* Second level nested lists */
          .ProseMirror ul ul,
          .ProseMirror ol ol {
            list-style-type: circle !important;
          }
          .ProseMirror ol ol {
            list-style-type: lower-alpha !important;
          }
          /* Third level nested lists */
          .ProseMirror ul ul ul {
            list-style-type: square !important;
          }
          .ProseMirror ol ol ol {
            list-style-type: lower-roman !important;
          }
          /* Fourth level and beyond */
          .ProseMirror ul ul ul ul,
          .ProseMirror ol ol ol ol,
          .ProseMirror li ul ul,
          .ProseMirror li ol ol {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }

          /* List hover */
          .ProseMirror ul:hover,
          .ProseMirror ol:hover {
            background-color: hsl(var(--muted) / 0.2);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }
          .ProseMirror li:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          /* Link hover */
          .ProseMirror a:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Image hover */
          .ProseMirror img:hover {
            opacity: 0.9;
            transform: scale(1.02);
            transition: opacity 0.2s ease, transform 0.2s ease;
            box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
          }

          /* Code block hover */
          .ProseMirror pre:hover,
          .ProseMirror code:hover {
            background-color: hsl(var(--muted) / 0.5);
            transition: background-color 0.2s ease;
          }

          /* Blockquote hover */
          .ProseMirror blockquote:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-left-color: hsl(var(--primary));
            transition: background-color 0.2s ease, border-left-color 0.2s ease;
          }

          /* Horizontal rule hover */
          .ProseMirror hr:hover {
            border-color: hsl(var(--primary));
            transition: border-color 0.2s ease;
          }

          /* Table styles */
          .ProseMirror table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 2px solid #000000 !important;
            margin: 16px 0;
            background-color: hsl(var(--background));
            transition: box-shadow 0.2s ease;
            display: table !important;
          }
          .ProseMirror table:hover {
            box-shadow: 0 2px 8px hsl(var(--foreground) / 0.1);
          }
          .ProseMirror table tr {
            border: 1px solid #000000 !important;
          }
          .ProseMirror table th,
          .ProseMirror table td {
            border: 1px solid #000000 !important;
            border-top: 1px solid #000000 !important;
            border-left: 1px solid #000000 !important;
            border-right: 1px solid #000000 !important;
            border-bottom: 1px solid #000000 !important;
            padding: 8px 12px !important;
            vertical-align: top;
            min-width: 100px !important;
            min-height: 40px !important;
            position: relative;
            cursor: cell;
            background-color: hsl(var(--background));
            display: table-cell !important;
            transition: background-color 0.2s ease;
          }
          .ProseMirror table th {
            border-bottom: 2px solid #000000 !important;
            background-color: hsl(var(--muted)) !important;
            font-weight: 600;
          }
          .ProseMirror table th p,
          .ProseMirror table td p {
            margin: 0;
            min-height: 1.5em;
          }
          /* Ensure empty cells are visible */
          .ProseMirror table th:empty,
          .ProseMirror table td:empty {
            min-height: 40px;
          }
          .ProseMirror table th:empty::before,
          .ProseMirror table td:empty::before {
            content: '\\u00A0';
            display: inline-block;
            width: 1px;
            color: transparent;
          }
          .ProseMirror table th p:empty::before,
          .ProseMirror table td p:empty::before {
            content: '\\u00A0';
            display: inline-block;
            min-height: 1.5em;
            width: 1px;
            color: transparent;
          }
          .ProseMirror table th:focus,
          .ProseMirror table td:focus {
            outline: 2px solid hsl(var(--primary));
            outline-offset: -2px;
            background-color: hsl(var(--muted) / 0.3) !important;
          }
          .ProseMirror table th:hover,
          .ProseMirror table td:hover {
            background-color: hsl(var(--muted) / 0.5);
          }
          .ProseMirror .column-resize-handle {
            position: absolute;
            right: -2px;
            top: 0;
            bottom: 0;
            width: 4px;
            background: hsl(var(--primary));
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          .ProseMirror .column-resize-handle:hover,
          .ProseMirror .column-resize-handle:active,
          .ProseMirror th:hover .column-resize-handle,
          .ProseMirror td:hover .column-resize-handle {
            opacity: 0.6;
          }

          /* Strong/Bold hover */
          .ProseMirror strong:hover,
          .ProseMirror b:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Emphasis/Italic hover */
          .ProseMirror em:hover,
          .ProseMirror i:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Underline hover */
          .ProseMirror u:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Strikethrough hover */
          .ProseMirror s:hover,
          .ProseMirror del:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Highlight hover */
          .ProseMirror mark:hover {
            background-color: hsl(var(--highlight) / 0.8);
            transition: background-color 0.2s ease;
          }
        `
      }} />
      <div
        className={cn(
          "border rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100",
          !editable && "bg-muted/50 dark:bg-gray-800/50"
        )}
        style={{ overflow: 'visible', height: 'auto', minHeight: 'auto' }}
        onClick={(e) => {
          if (editable) {
            e.stopPropagation()
            editor.commands.focus()
            // Notify parent that this editor is now active
            if (editorRef) {
              editorRef(editor)
            }
          }
        }}
        onFocus={(e) => {
          if (editable && editorRef) {
            editorRef(editor)
          }
        }}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-sm dark:prose-invert max-w-none 
            [&_p]:text-foreground dark:[&_p]:text-gray-100 
            [&_h1]:text-foreground dark:[&_h1]:text-gray-100 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-center [&_h1]:mt-6 [&_h1]:mb-4
            [&_h2]:text-foreground dark:[&_h2]:text-gray-100 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-center [&_h2]:mt-5 [&_h2]:mb-3
            [&_h3]:text-foreground dark:[&_h3]:text-gray-100 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-center [&_h3]:mt-4 [&_h3]:mb-2
            [&_h4]:text-foreground dark:[&_h4]:text-gray-100 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-center [&_h4]:mt-3 [&_h4]:mb-2
            [&_h5]:text-foreground dark:[&_h5]:text-gray-100 [&_h5]:text-base [&_h5]:font-bold [&_h5]:text-center [&_h5]:mt-2 [&_h5]:mb-1
            [&_h6]:text-foreground dark:[&_h6]:text-gray-100 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:text-center [&_h6]:mt-2 [&_h6]:mb-1
            [&_ul]:text-foreground dark:[&_ul]:text-gray-100 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-6 [&_ul]:pl-0
            [&_ol]:text-foreground dark:[&_ol]:text-gray-100 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-6 [&_ol]:pl-0
            [&_li]:text-foreground dark:[&_li]:text-gray-100 [&_li]:ml-0 [&_li]:pl-0"
        />
      </div>
    </>
  )
}

