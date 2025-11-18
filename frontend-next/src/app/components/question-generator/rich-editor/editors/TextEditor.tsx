"use client"

import { useState, useEffect } from "react"
import RichMarkdownEditor from "../../rich-markdown-editor"
import { BlockData } from "../types"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

interface TextEditorProps {
  data: BlockData
  onChange: (data: BlockData) => void
}

// Helper function to convert markdown to HTML
async function markdownToHTML(markdown: string): Promise<string> {
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
      console.log('TextEditor: Converted HTML with headings:', html)
    }
    
    // Ensure we have valid HTML
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

export default function TextEditor({ data, onChange }: TextEditorProps) {
  const [html, setHtml] = useState<string>(data.html || "")
  const [markdown, setMarkdown] = useState<string>(data.markdown || "")
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    // If we have HTML, use it directly
    if (data.html) {
      setHtml(data.html)
      setMarkdown(data.markdown || "")
      return
    }

    // If we only have markdown, convert it to HTML
    if (data.markdown && !data.html) {
      setIsConverting(true)
      markdownToHTML(data.markdown)
        .then((convertedHtml) => {
          if (convertedHtml) {
            setHtml(convertedHtml)
            // Update the data with converted HTML
            onChange({ ...data, html: convertedHtml, markdown: data.markdown })
          } else {
            // If conversion fails, use markdown as plain text wrapped in <p>
            const fallbackHtml = `<p>${data.markdown.replace(/\n/g, '<br>')}</p>`
            setHtml(fallbackHtml)
            onChange({ ...data, html: fallbackHtml, markdown: data.markdown })
          }
        })
        .catch((error) => {
          console.error("Failed to convert markdown:", error)
          // Fallback: use markdown as plain text
          const fallbackHtml = `<p>${data.markdown.replace(/\n/g, '<br>')}</p>`
          setHtml(fallbackHtml)
          onChange({ ...data, html: fallbackHtml, markdown: data.markdown })
        })
        .finally(() => {
          setIsConverting(false)
        })
      return
    }

    // If neither exists, reset
    setHtml("")
    setMarkdown("")
  }, [data, onChange])

  const handleHtmlChange = (newHtml: string) => {
    setHtml(newHtml)
    onChange({ ...data, html: newHtml, markdown: markdown || "" })
  }

  if (isConverting) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Rich Text Content</label>
        <div className="border border-border rounded-md p-4 bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">Converting markdown to HTML...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Rich Text Content</label>
      <RichMarkdownEditor
        initialContent={html}
        onChange={handleHtmlChange}
      />
      <div className="text-xs text-muted-foreground">
        Your content will be rendered with formatting in the student view
      </div>
    </div>
  )
}









