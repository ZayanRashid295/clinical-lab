"use client"

import { createContext, useContext, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import { unified } from "unified"
import rehypeParse from "rehype-parse"
import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { ExternalLink } from "lucide-react"
import { Dialog, DialogContent } from "@/shared/ui/dialog"
import { normalizeStemToParagraphs } from "./stem-blocks-utils"

interface ContentItem {
  id: number | string
  type: "text" | "table" | "images" | "image" | "per-answer-explanation" | "internal-link" | "external-link"
  data: any
}

interface RichContentRendererProps {
  content: ContentItem[]
  perAnswerExplanations?: Record<string, string | any[]>
  options?: Array<{ label: string; text: string; correct: boolean }>
  selectedAnswer?: string | null
  /** When true, use normal paragraph flow (no pre-wrap) so stem content is not forced to one line per sentence */
  stemMode?: boolean
}

const PreviewImageContext = createContext<((url: string) => void) | null>(null)

function PreviewImageLightbox({
  url,
  onClose,
}: {
  url: string | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[min(95vw,1200px)] w-auto max-h-[95vh] overflow-hidden p-2 sm:max-w-[min(95vw,1200px)]"
        showCloseButton
      >
        {url ? (
          <img
            src={url}
            alt="Image preview"
            className="mx-auto max-h-[85vh] max-w-full rounded-md object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default function RichContentRenderer({ content, perAnswerExplanations = {}, options = [], selectedAnswer = null, stemMode = false }: RichContentRendererProps) {
  const [isDark, setIsDark] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

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

  // Sort content by order if order field exists to preserve markdown file structure
  const sortedContent = Array.isArray(content)
    ? [...content].sort((a, b) => {
        const orderA = typeof (a as any).order === "number" ? (a as any).order : 999
        const orderB = typeof (b as any).order === "number" ? (b as any).order : 999
        return orderA - orderB
      })
    : content

  const renderedContent = sortedContent.map((item) => {
      const type = String(item.type ?? "").toLowerCase()
      switch (type) {
        case "text":
          return renderMarkdown(item, isDark, stemMode)
        case "table":
          return renderTable(item, isDark)
        case "images":
        case "image":
          return <RenderImages key={item.id} item={item} />
        case "internal-link":
          return renderInternalLink(item)
        case "external-link":
          return renderExternalLink(item)
        case "per-answer-explanation":
          return renderPerAnswerExplanations(item, perAnswerExplanations, options, selectedAnswer)
        default:
          return null
      }
    })

  return (
    <PreviewImageContext.Provider value={setPreviewImageUrl}>
      <div className="space-y-1">{renderedContent}</div>
      <PreviewImageLightbox url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
    </PreviewImageContext.Provider>
  )
}

function renderInternalLink(item: ContentItem) {
  const { linkText, targetId, targetType, description } = item.data || {}
  
  if (!linkText || !targetId) {
    return null
  }

  const href = `/${targetType === 'question' ? 'question-generator' : 'content'}/${targetType}/${targetId}`
  
  return (
    <div key={item.id} className="my-1 p-1 border border-primary/30 dark:border-primary/40 rounded-lg bg-primary/5 dark:bg-primary/10">
      <a
        href={href}
        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors"
      >
        <span>🔗</span>
        <span>{linkText}</span>
        <ExternalLink className="w-4 h-4" />
      </a>
      {description && (
        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
  )
}

function renderExternalLink(item: ContentItem) {
  const { url, linkText, description, openInNewTab } = item.data || {}
  
  if (!url || !linkText) {
    return null
  }

  return (
    <div key={item.id} className="my-1 p-1 border border-blue-500/30 dark:border-blue-500/40 rounded-lg bg-blue-500/5 dark:bg-blue-500/10">
      <a
        href={url}
        target={openInNewTab !== false ? "_blank" : undefined}
        rel={openInNewTab !== false ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
      >
        <span>🌐</span>
        <span>{linkText}</span>
        <ExternalLink className="w-4 h-4" />
      </a>
      {description && (
        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
  )
}

// Helper function to fix list item formatting by removing <p> tags inside <li>
function fixListItemFormatting(html: string): string {
  // Use a more robust approach to handle nested elements
  // This regex pattern matches <p> tags inside <li> and removes them while preserving content
  let result = html
  
  // First, handle cases with multiple <p> tags in a single <li>
  result = result.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (match, liAttrs, content) => {
    // Remove all <p> tags and their closing tags, preserving content
    let cleaned = content
      .replace(/<p[^>]*>/gi, '') // Remove opening <p> tags
      .replace(/<\/p>/gi, '') // Remove closing </p> tags
      .replace(/\n\s*\n\s*/g, ' ') // Replace multiple newlines with single space
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    
    return `<li${liAttrs || ''}>${cleaned}</li>`
  })
  
  // Also handle cases where there might be text before or after the <p> tag
  result = result.replace(/<li([^>]*)>([^<]*)<p([^>]*)>([\s\S]*?)<\/p>([^<]*)<\/li>/gi, (match, liAttrs, before, pAttrs, content, after) => {
    const cleanedBefore = (before || '').trim().replace(/\s+/g, ' ')
    const cleanedContent = content.replace(/^\s+|\s+$/g, '').replace(/\n\s*/g, ' ').replace(/\s+/g, ' ')
    const cleanedAfter = (after || '').trim().replace(/\s+/g, ' ')
    return `<li${liAttrs || ''}>${cleanedBefore}${cleanedContent}${cleanedAfter}</li>`
  })
  
  // Handle cases where <li> contains only whitespace and a <p> tag (common in markdown conversion)
  result = result.replace(/<li([^>]*)>\s*\n\s*<p([^>]*)>([\s\S]*?)<\/p>\s*\n\s*<\/li>/gi, (match, liAttrs, pAttrs, content) => {
    const cleanedContent = content.replace(/^\s+|\s+$/g, '').replace(/\n\s*/g, ' ').replace(/\s+/g, ' ')
    return `<li${liAttrs || ''}>${cleanedContent}</li>`
  })
  
  // Final pass: remove any remaining block-level elements that might cause line breaks
  // But preserve nested lists (ul, ol) and other important elements
  result = result.replace(/<li([^>]*)>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/li>/gi, (match, liAttrs, content) => {
    const cleanedContent = content.replace(/^\s+|\s+$/g, '').replace(/\n\s*/g, ' ').replace(/\s+/g, ' ')
    return `<li${liAttrs || ''}>${cleanedContent}</li>`
  })
  
  return result
}

// Component to render HTML with sanitization
function HtmlRenderer({ html, itemId, paragraphFlow = "pre-wrap" }: { html: string; itemId: number | string; paragraphFlow?: "normal" | "pre-wrap" }) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>(html)
  const openPreviewImage = useContext(PreviewImageContext)

  const handlePreviewImageClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest("a")) return
    const img = target.closest("img")
    if (!img) return
    const src = img.getAttribute("src")
    if (src && openPreviewImage) {
      event.preventDefault()
      openPreviewImage(src)
    }
  }

  useEffect(() => {
    // Sanitize HTML using unified pipeline
    const sanitizeHtml = async () => {
      // First, merge any split ordered lists caused by images
      let processedHtml = mergeSplitOrderedLists(html)
      // Then, fix list item formatting
      const fixedHtml = fixListItemFormatting(processedHtml)
      
      // Don't remove empty table rows - this might interfere with merged cells
      // The empty rows removal was causing issues with colspan/rowspan
      const cleanedHtml = fixedHtml

      // IMPORTANT: Tables created inside TipTap text blocks rely heavily on inline styles
      // (especially text colors). rehype-sanitize can strip or rewrite these styles,
      // which breaks preview parity with edit mode. Since this HTML is authored via
      // our editor, we treat it as trusted and skip sanitization for table-containing
      // fragments to preserve styling exactly.
      if (cleanedHtml.includes("<table")) {
        setSanitizedHtml(cleanedHtml)
        return
      }
      
      
      // Use a very permissive schema that preserves all table attributes
      // The HTML comes from Tiptap which is trusted, we just need basic XSS protection
      const permissiveSchema: any = {
        tagNames: [
          "table", "thead", "tbody", "tfoot", "tr", "th", "td",
          "p", "div", "span", "strong", "em", "u", "s", "strike", "code", "pre", "mark",
          "ul", "ol", "li", "br", "hr",
          "h1", "h2", "h3", "h4", "h5", "h6",
          "a", "img", "blockquote", "figure", "figcaption",
        ],
        attributes: {
          table: ["className", "style", "border", "cellpadding", "cellspacing"],
          thead: ["className", "style"],
          tbody: ["className", "style"],
          tfoot: ["className", "style"],
          tr: ["className", "style"],
          // Explicitly allow both lowercase and camelCase for colspan/rowspan
          th: ["className", "style", "colspan", "rowspan", "colSpan", "rowSpan", "data-text-align", "data-background-color", "data-border-color", "align", "valign"],
          td: ["className", "style", "colspan", "rowspan", "colSpan", "rowSpan", "data-text-align", "data-background-color", "data-border-color", "align", "valign"],
          p: ["className", "style"],
          div: ["className", "style"],
          span: ["className", "style", "data-color"],
          strong: ["className", "style"],
          em: ["className", "style"],
          u: ["className", "style"],
          s: ["className", "style"],
          strike: ["className", "style"],
          code: ["className", "style"],
          pre: ["className", "style"],
          mark: ["className", "style", "data-color"],
          ul: ["className", "style"],
          ol: ["className", "style", "start"],
          li: ["className", "style"],
          br: ["className", "style"],
          hr: ["className", "style"],
          h1: ["className", "style"],
          h2: ["className", "style"],
          h3: ["className", "style"],
          h4: ["className", "style"],
          h5: ["className", "style"],
          h6: ["className", "style"],
          a: ["href", "target", "rel", "className", "style"],
          img: ["src", "alt", "title", "className", "style", "width", "height"],
          figure: ["className", "style"],
          figcaption: ["className", "style"],
          blockquote: ["className", "style"],
          "*": ["className", "style"],
        },
        strip: [],
      }

      try {
        // Only sanitize for security, don't modify the HTML structure or styles
        const file = await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeSanitize, permissiveSchema)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(cleanedHtml)
        
        // Fix list items again after sanitization (in case sanitization re-added <p> tags)
        // Run multiple times to catch nested cases
        let finalHtml = fixListItemFormatting(String(file))
        finalHtml = fixListItemFormatting(finalHtml) // Run again to catch any remaining cases

        // If sanitization stripped inline text colors (common issue), prefer the trusted TipTap HTML.
        // Highlighter (background-color) already works, but text color must be preserved too.
        const sourceHasInlineColor =
          /style\s*=\s*["'][^"']*color\s*:/i.test(cleanedHtml) || /color\s*:\s*#/i.test(cleanedHtml)
        const sanitizedHasInlineColor =
          /style\s*=\s*["'][^"']*color\s*:/i.test(finalHtml) || /color\s*:\s*#/i.test(finalHtml)
        if (sourceHasInlineColor && !sanitizedHasInlineColor) {
          finalHtml = cleanedHtml
        }
        
        // Debug: Log the HTML after sanitization to check if colspan/rowspan are preserved
        if (process.env.NODE_ENV === "development") {
          const hasColspanAfter = finalHtml.includes('colspan') || finalHtml.includes('colSpan')
          const hasRowspanAfter = finalHtml.includes('rowspan') || finalHtml.includes('rowSpan')
          if ((cleanedHtml.includes('colspan') || cleanedHtml.includes('colSpan')) && !hasColspanAfter) {
            // Colspan was removed during sanitization
          }
          if ((cleanedHtml.includes('rowspan') || cleanedHtml.includes('rowSpan')) && !hasRowspanAfter) {
            console.warn("[HtmlRenderer] rowspan was removed during sanitization!")
          }
        }
        
        setSanitizedHtml(finalHtml)
      } catch (error) {
        console.error("Error sanitizing HTML:", error)
        // If sanitization fails, use original HTML (it's from Tiptap which is trusted)
        // Fallback to original HTML with list formatting fixed
        setSanitizedHtml(fixListItemFormatting(html))
      }
    }
    sanitizeHtml()
  }, [html])

  return (
    <div key={itemId}>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* TextStyle helpers (font family / size) - keep renderer output consistent with the editor */
          .html-content-${itemId} .tiptap-ff-arial { font-family: Arial, sans-serif; }
          .html-content-${itemId} .tiptap-ff-times-new-roman { font-family: "Times New Roman", Times, serif; }
          .html-content-${itemId} .tiptap-ff-courier-new { font-family: "Courier New", Courier, monospace; }
          .html-content-${itemId} .tiptap-ff-georgia { font-family: Georgia, serif; }
          .html-content-${itemId} .tiptap-ff-verdana { font-family: Verdana, Geneva, sans-serif; }
          .html-content-${itemId} .tiptap-ff-helvetica { font-family: Helvetica, Arial, sans-serif; }
          .html-content-${itemId} .tiptap-ff-comic-sans-ms { font-family: "Comic Sans MS", "Comic Sans", cursive; }
          .html-content-${itemId} .tiptap-ff-trebuchet-ms { font-family: "Trebuchet MS", Helvetica, sans-serif; }

          .html-content-${itemId} .tiptap-fs-8 { font-size: 8px; }
          .html-content-${itemId} .tiptap-fs-9 { font-size: 9px; }
          .html-content-${itemId} .tiptap-fs-10 { font-size: 10px; }
          .html-content-${itemId} .tiptap-fs-11 { font-size: 11px; }
          .html-content-${itemId} .tiptap-fs-12 { font-size: 12px; }
          .html-content-${itemId} .tiptap-fs-14 { font-size: 14px; }
          .html-content-${itemId} .tiptap-fs-16 { font-size: 16px; }
          .html-content-${itemId} .tiptap-fs-18 { font-size: 18px; }
          .html-content-${itemId} .tiptap-fs-20 { font-size: 20px; }
          .html-content-${itemId} .tiptap-fs-24 { font-size: 24px; }
          .html-content-${itemId} .tiptap-fs-28 { font-size: 28px; }
          .html-content-${itemId} .tiptap-fs-32 { font-size: 32px; }
          .html-content-${itemId} .tiptap-fs-36 { font-size: 36px; }
          .html-content-${itemId} .tiptap-fs-48 { font-size: 48px; }
          .html-content-${itemId} .tiptap-fs-72 { font-size: 72px; }

          .html-content-${itemId} table,
          .html-content-${itemId} table * {
            box-sizing: border-box !important;
          }
          .html-content-${itemId} table {
            border: 3px solid #6b7280 !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            display: table !important;
            margin: 16px 0 !important;
            background-color: #ffffff !important;
          }
          .dark .html-content-${itemId} table {
            border-color: #9ca3af !important;
            background-color: #1f2937 !important;
          }
          .html-content-${itemId} table tr,
          .html-content-${itemId} table thead tr,
          .html-content-${itemId} table tbody tr {
            border: 2px solid #6b7280 !important;
            border-top: 2px solid #6b7280 !important;
            border-bottom: 2px solid #6b7280 !important;
            display: table-row !important;
          }
          .dark .html-content-${itemId} table tr,
          .dark .html-content-${itemId} table thead tr,
          .dark .html-content-${itemId} table tbody tr {
            border-color: #9ca3af !important;
          }
          .html-content-${itemId} table thead tr {
            border-bottom: 3px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table thead tr {
            border-bottom-color: #9ca3af !important;
          }
          .html-content-${itemId} table tbody tr {
            border-bottom: 2px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table tbody tr {
            border-bottom-color: #9ca3af !important;
          }
          /* Use the same table styles as edit mode (ProseMirror) */
          .html-content-${itemId} table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 3px solid #6b7280 !important;
            margin: 16px 0;
            background-color: #ffffff !important;
            display: table !important;
          }
          .dark .html-content-${itemId} table {
            border-color: #9ca3af !important;
            background-color: #1f2937 !important;
          }
          .html-content-${itemId} table tr {
            border: 2px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table tr {
            border-color: #9ca3af !important;
          }
          .html-content-${itemId} table th,
          .html-content-${itemId} table td {
            border: 2px solid #6b7280 !important;
            border-top: 2px solid #6b7280 !important;
            border-left: 2px solid #6b7280 !important;
            border-right: 2px solid #6b7280 !important;
            border-bottom: 2px solid #6b7280 !important;
            padding: 8px 12px !important;
            vertical-align: top;
            min-width: 100px !important;
            min-height: 40px !important;
            position: relative;
            background-color: #ffffff !important;
            /* Never override text color: users may set per-cell or inline text colors */
            font-family: inherit;
            display: table-cell !important;
          }
          .dark .html-content-${itemId} table th,
          .dark .html-content-${itemId} table td {
            border-color: #9ca3af !important;
            background-color: #1f2937 !important;
            font-family: inherit;
          }
          .html-content-${itemId} table th {
            border-bottom: 3px solid #6b7280 !important;
            background-color: #f3f4f6 !important;
            font-weight: 600;
          }
          .dark .html-content-${itemId} table th {
            border-color: #9ca3af !important;
            border-bottom: 3px solid #9ca3af !important;
            background-color: #374151 !important;
          }
          .html-content-${itemId} table th p,
          .html-content-${itemId} table td p {
            margin: 0;
            min-height: 1.5em;
          }
          /* Handle merged cells - same as edit mode */
          .html-content-${itemId} table th[colspan] + th,
          .html-content-${itemId} table td[colspan] + td,
          .html-content-${itemId} table th[colspan] + td,
          .html-content-${itemId} table td[colspan] + th {
            border-left: none !important;
          }
          .html-content-${itemId} table th[colspan],
          .html-content-${itemId} table td[colspan] {
            border-right: 2px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table th[colspan],
          .dark .html-content-${itemId} table td[colspan] {
            border-right-color: #9ca3af !important;
          }
          .html-content-${itemId} table th[rowspan],
          .html-content-${itemId} table td[rowspan] {
            border-bottom: 2px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table th[rowspan],
          .dark .html-content-${itemId} table td[rowspan] {
            border-bottom-color: #9ca3af !important;
          }
          .html-content-${itemId} table th:first-child,
          .html-content-${itemId} table td:first-child {
            border-left: 2px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table th:first-child,
          .dark .html-content-${itemId} table td:first-child {
            border-left-color: #9ca3af !important;
          }
          .html-content-${itemId} table th:last-child,
          .html-content-${itemId} table td:last-child {
            border-right: 2px solid #6b7280 !important;
          }
          .dark .html-content-${itemId} table th:last-child,
          .dark .html-content-${itemId} table td:last-child {
            border-right-color: #9ca3af !important;
          }
          /* Preserve text colors and highlights from inline styles */
          .html-content-${itemId} span[style*="color"],
          .html-content-${itemId} p[style*="color"],
          .html-content-${itemId} div[style*="color"],
          .html-content-${itemId} td[style*="color"],
          .html-content-${itemId} th[style*="color"],
          .html-content-${itemId} mark[style*="color"] {
            /* Inline styles have higher specificity - colors are preserved */
          }
          .html-content-${itemId} mark:not([style*="background-color"]) {
            /* Default highlight color only if no inline style */
            background-color: #FFFF00;
            padding: 2px 4px;
            border-radius: 2px;
            color: inherit;
          }
          .html-content-${itemId} mark[style*="background-color"] {
            /* Preserve custom highlight colors from inline styles */
            padding: 2px 4px;
            border-radius: 2px;
            color: inherit;
          }
          .html-content-${itemId} span[style*="background-color"] {
            /* Preserve highlight colors on spans */
            padding: 2px 4px;
            border-radius: 2px;
            color: inherit;
          }

          /* ============================================
             LIST STYLING - PREVIEW MODE ONLY
             Complete rewrite for perfect nested list spacing
             Maximum specificity to override all other styles
             ============================================ */
          
          /* RESET ALL LIST STYLES FIRST - Maximum specificity */
          .html-content-${itemId} ul,
          .html-content-${itemId} ol,
          .html-content-${itemId} li,
          .html-content-${itemId} ul ul,
          .html-content-${itemId} ul ol,
          .html-content-${itemId} ol ul,
          .html-content-${itemId} ol ol,
          .html-content-${itemId} li ul,
          .html-content-${itemId} li ol,
          .html-content-${itemId} li li,
          .html-content-${itemId} li li ul,
          .html-content-${itemId} li li ol {
            box-sizing: border-box !important;
          }
          
          /* TOP-LEVEL LISTS - Proper spacing */
          .html-content-${itemId} > ul,
          .html-content-${itemId} > ol {
            list-style-position: outside !important;
            list-style-type: disc !important;
            margin-top: 0.5rem !important;
            margin-bottom: 1rem !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 1.5rem !important;
            padding-right: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .html-content-${itemId} > ol {
            list-style-type: decimal !important;
          }
          
          /* ALL LISTS - Base properties */
          .html-content-${itemId} ul {
            list-style-type: disc !important;
            list-style-position: outside !important;
            margin-left: 0 !important;
            padding-left: 1.5rem !important;
          }
          .html-content-${itemId} ol {
            list-style-type: decimal !important;
            list-style-position: outside !important;
            margin-left: 0 !important;
            padding-left: 1.5rem !important;
          }
          
          /* Ensure start attribute is respected - don't reset counters */
          .html-content-${itemId} ol[start] {
            counter-reset: none !important;
          }
          
          /* NESTED LISTS - ZERO vertical spacing (this is the key fix) */
          .html-content-${itemId} li ul,
          .html-content-${itemId} li ol,
          .html-content-${itemId} ul ul,
          .html-content-${itemId} ul ol,
          .html-content-${itemId} ol ul,
          .html-content-${itemId} ol ol,
          .html-content-${itemId} li li ul,
          .html-content-${itemId} li li ol,
          .html-content-${itemId} li > ul,
          .html-content-${itemId} li > ol {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 1.5rem !important;
          }
          
          /* Deeper nesting - also zero spacing */
          .html-content-${itemId} ul ul ul,
          .html-content-${itemId} ol ol ol,
          .html-content-${itemId} li ul ul,
          .html-content-${itemId} li ol ol,
          .html-content-${itemId} ul ul ul ul,
          .html-content-${itemId} ol ol ol ol,
          .html-content-${itemId} li li ul ul,
          .html-content-${itemId} li li ol ol {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 1.5rem !important;
          }
          
          /* LIST ITEMS - Consistent spacing at all levels */
          .html-content-${itemId} li {
            display: list-item !important;
            list-style-position: outside !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            margin-left: 0 !important;
            padding-left: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            line-height: 1.5 !important;
          }
          
          /* Nested list items - same spacing */
          .html-content-${itemId} li li {
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            margin-left: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 0 !important;
          }
          
          /* Deeper nested list items */
          .html-content-${itemId} li li li {
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            margin-left: 0 !important;
            padding-left: 0 !important;
          }
          
          /* Content inside list items - inline to prevent breaks */
          .html-content-${itemId} li > p,
          .html-content-${itemId} li > div,
          .html-content-${itemId} li p,
          .html-content-${itemId} li div {
            display: inline !important;
            margin: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            line-height: inherit !important;
          }
          
          /* All non-list children - inline */
          .html-content-${itemId} li > *:not(ul):not(ol),
          .html-content-${itemId} li *:not(ul):not(ol):not(li) {
            display: inline !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 0 !important;
          }
          
          /* Nested lists - block level, zero vertical spacing */
          .html-content-${itemId} li > ul,
          .html-content-${itemId} li > ol {
            display: block !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
          }
          
          /* Spacing between text and nested list */
          .html-content-${itemId} li > *:not(ul):not(ol) + ul,
          .html-content-${itemId} li > *:not(ul):not(ol) + ol {
            margin-top: 0.5rem !important;
          }
          
          /* Spacing after nested list */
          .html-content-${itemId} li > ul + *:not(ul):not(ol),
          .html-content-${itemId} li > ol + *:not(ul):not(ol) {
            margin-top: 0.5rem !important;
          }
        `
      }} />
      <div 
        className={`html-content-${itemId} max-w-none text-sm text-foreground/90 dark:text-gray-200
          [&_p]:leading-normal [&_p]:mb-1.5 ${paragraphFlow === "pre-wrap" ? "[&_p]:whitespace-pre-wrap " : ""}[&_p]:text-sm
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-center [&_h1]:text-foreground dark:[&_h1]:text-gray-100 [&_h1]:mt-4 [&_h1]:mb-2 
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-center [&_h2]:text-foreground dark:[&_h2]:text-gray-100 [&_h2]:mt-3 [&_h2]:mb-1.5 
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-center [&_h3]:text-foreground dark:[&_h3]:text-gray-100 [&_h3]:mt-2 [&_h3]:mb-1 
          [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-center [&_h4]:text-foreground dark:[&_h4]:text-gray-100 [&_h4]:mt-2 [&_h4]:mb-1 
          [&_h5]:text-xs [&_h5]:font-bold [&_h5]:text-center [&_h5]:text-foreground dark:[&_h5]:text-gray-100 [&_h5]:mt-1 [&_h5]:mb-0.5 
          [&_h6]:text-xs [&_h6]:font-bold [&_h6]:text-center [&_h6]:text-foreground dark:[&_h6]:text-gray-100 [&_h6]:mt-1 [&_h6]:mb-0.5 
          ${paragraphFlow === "pre-wrap" ? "[&_span]:whitespace-pre-wrap " : ""}[&_span]:text-sm
          [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline 
          [&_code]:bg-muted dark:[&_code]:bg-gray-800 [&_code]:text-foreground dark:[&_code]:text-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:whitespace-pre-wrap 
          [&_pre]:bg-muted dark:[&_pre]:bg-gray-800 [&_pre]:text-foreground dark:[&_pre]:text-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto 
          [&_blockquote]:border-l-4 [&_blockquote]:border-border dark:[&_blockquote]:border-gray-600 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-sm [&_blockquote]:text-foreground/80 dark:[&_blockquote]:text-gray-300 
          [&_strong]:font-semibold 
          [&_em]:italic 
          [&_li]:text-sm
          [&_img]:rounded-lg [&_img]:border [&_img]:border-border dark:[&_img]:border-gray-700 [&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:cursor-pointer`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        onClick={handlePreviewImageClick}
      />
    </div>
  )
}

// Helper function to convert markdown to HTML
// Helper function to merge split ordered lists that are separated by images
// This fixes the issue where markdown parser splits lists when images appear between items
// Images are kept OUTSIDE the list (not as list items) but numbering continues
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
    // This pattern matches when we have a closing </ol>, then image/content, then opening <ol>
    // We'll verify it's a top-level list by checking depth
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
      
      // Calculate the correct start value
      const startValue = itemCount + 1
      
      // Add start attribute to the second <ol> to continue numbering
      // Remove existing start attribute if present, then add new one
      let newOpenTag2 = openTag2.replace(/\s+start\s*=\s*["']?\d+["']?/gi, '')
      
      // Ensure start attribute is properly added with correct syntax
      if (newOpenTag2.endsWith('>')) {
        newOpenTag2 = newOpenTag2.slice(0, -1) + ` start="${startValue}">`
      } else {
        newOpenTag2 = newOpenTag2 + ` start="${startValue}">`
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
    
    // Remove any wrapping HTML/body tags if present (unified might add them)
    html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
    html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
    html = html.trim()
    
    // Fix split ordered lists caused by images between list items
    html = mergeSplitOrderedLists(html)
    
    // Ensure we have valid HTML
    if (!html || html === "") {
      html = `<p>${markdown.replace(/\n/g, '<br>')}</p>`
    }
    
    return html
  } catch (error) {
    console.error("Error converting markdown to HTML:", error)
    // Fallback: convert markdown to HTML manually
    let fallback = markdown
    
    // Convert headings first (before other conversions)
    // Handle headings with optional whitespace: ### Heading or ###Heading
    // H3: ### Heading
    fallback = fallback.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    // H2: ## Heading
    fallback = fallback.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    // H1: # Heading
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
      fallback = `<p>${markdown.replace(/\n/g, '<br>')}</p>`
    }
    
    return fallback
  }
}

function renderMarkdown(item: ContentItem, isDark: boolean = false, stemMode: boolean = false) {
  const paragraphFlow = stemMode ? ("normal" as const) : ("pre-wrap" as const)

  // Skip rendering if this is a placeholder block that shouldn't be rendered as markdown
  if (item.data?.placeholder === true || item.data?.isPerAnswerExplanation === true) {
    return null
  }
  
  // Use HTML, with fallback to markdown conversion if HTML is missing or empty
  const html = item.data?.html
  let markdown = item.data?.markdown || ""
  if (stemMode && markdown) markdown = normalizeStemToParagraphs(markdown)

  // Check if HTML is valid and not empty
  if (html && typeof html === "string") {
    const trimmedHtml = html.trim()
    
    // PRIORITY 1: If HTML contains a table, use it directly (don't convert)
    if (trimmedHtml.includes("<table")) {
      return <HtmlRenderer html={html} itemId={item.id} paragraphFlow={paragraphFlow} />
    }
    
    // Only use HTML if it's truly not empty (not just empty tags or whitespace)
    const isEmptyHtml = !trimmedHtml || 
      trimmedHtml === "<p></p>" || 
      trimmedHtml === "<p><br></p>" || 
      trimmedHtml === "<p> </p>" ||
      trimmedHtml === "<p><br/></p>" ||
      trimmedHtml === "<div></div>" ||
      trimmedHtml === "<div><br></div>"
    
    // Check if HTML contains raw markdown syntax (like **bold**, *italic*, etc.)
    // This happens when markdown was saved as HTML without conversion
    // Extract inner text and check for markdown patterns
    const htmlInnerText = trimmedHtml.replace(/<[^>]+>/g, '').trim()
    // More comprehensive markdown detection: bold, italic, links, lists, tables, etc.
    const markdownPatterns = [
      /\*\*[^*]+\*\*/,           // **bold**
      /\*[^*]+\*/,                // *italic* (not inside **)
      /__[^_]+__/,                // __bold__
      /_[^_]+_/,                   // _italic_
      /\[.+\]\(.+\)/,             // [link](url)
      /^[-*+]\s/m,                 // List items
      /^\d+\.\s/m,                 // Numbered lists
      /^#{1,6}\s/m,                // Headers
      /`[^`]+`/,                   // Inline code
      /```[\s\S]*?```/,           // Code blocks
      /^\|.+\|/m,                  // Markdown tables (lines starting with |)
    ]
    const containsMarkdownSyntax = markdownPatterns.some(pattern => 
      pattern.test(htmlInnerText) || pattern.test(trimmedHtml)
    )
    
    // If HTML is not empty and doesn't contain markdown syntax, use it
    // Also check if HTML contains colors/highlights - if so, always use HtmlRenderer
    const hasFormatting = !isEmptyHtml && (html.includes("<span") || html.includes("<mark") || html.includes("style="))
    
    if (!isEmptyHtml && (!containsMarkdownSyntax || hasFormatting)) {
      return <HtmlRenderer html={html} itemId={item.id} paragraphFlow={paragraphFlow} />
    }
    
    // If HTML contains markdown syntax, extract it and convert
    if (!isEmptyHtml && containsMarkdownSyntax) {
      // Prefer the markdown field if it exists, otherwise extract from HTML
      let markdownToConvert = markdown
      
      if (!markdownToConvert || !markdownToConvert.trim()) {
        // Extract text content from HTML, preserving line breaks and markdown
        // Remove HTML tags but preserve the text content
        markdownToConvert = trimmedHtml
          .replace(/<p[^>]*>/gi, '\n') // Convert <p> to newline
          .replace(/<\/p>/gi, '\n') // Convert </p> to newline
          .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newline
          .replace(/<[^>]+>/g, '') // Remove all other HTML tags
          .replace(/\n\n+/g, '\n\n') // Normalize multiple newlines
          .trim()
      }
      
      if (markdownToConvert && markdownToConvert.trim()) {
        if (stemMode) markdownToConvert = normalizeStemToParagraphs(markdownToConvert)
        return <MarkdownToHtmlRenderer markdown={markdownToConvert} itemId={item.id} paragraphFlow={paragraphFlow} />
      }
    }
  }

  // Fallback: If HTML is missing or empty but markdown exists, convert it
  if (markdown && typeof markdown === "string" && markdown.trim()) {
    return <MarkdownToHtmlRenderer markdown={markdown} itemId={item.id} paragraphFlow={paragraphFlow} />
  }

  // Debug: Log when content is missing
  if (process.env.NODE_ENV === "development") {
    console.warn("No HTML or markdown content for block:", {
      id: item.id,
      type: item.type,
      data: item.data,
    })
  }

  // Return empty div if no HTML content
  return <div key={item.id} className="text-muted-foreground text-sm italic">No content</div>
}

// Component to convert markdown to HTML and render it
function MarkdownToHtmlRenderer({ markdown, itemId, paragraphFlow = "pre-wrap" }: { markdown: string; itemId: number | string; paragraphFlow?: "normal" | "pre-wrap" }) {
  const [html, setHtml] = useState<string>("")

  useEffect(() => {
    markdownToHTML(markdown).then(setHtml)
  }, [markdown])

  if (!html) {
    return <div key={itemId} className="text-muted-foreground text-sm italic">Loading...</div>
  }

  return <HtmlRenderer html={html} itemId={itemId} paragraphFlow={paragraphFlow} />
}

// Helper function to remove empty rows from HTML table
function removeEmptyTableRows(html: string): string {
  // Remove <tr> elements that contain only empty <td> or <th> elements (with any attributes or whitespace)
  // This regex matches rows where all cells are empty (no text content, only whitespace)
  return html.replace(/<tr[^>]*>[\s\n]*(?:<t[dh][^>]*>[\s\n]*<\/t[dh]>[\s\n]*)+<\/tr>/gi, '')
}

// Component to render HTML tables - render exactly as in edit mode
function TableHtmlRenderer({ html, itemId, isDark }: { html: string; itemId: number | string; isDark: boolean }) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>(html)

  useEffect(() => {
    const sanitizeTableHtml = async () => {
      // Don't remove empty rows - this might interfere with merged cells
      // The empty rows removal was causing issues with colspan/rowspan
      const cleanedHtml = html
      
      // Create sanitize schema that explicitly preserves colspan and rowspan
      const sanitizeSchema: any = {
        ...defaultSchema,
        tagNames: [
          ...((defaultSchema?.tagNames as string[]) || []),
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "span",
          "strong",
          "em",
          "u",
          "s",
          "strike",
          "code",
          "mark",
          "a",
          "p",
          "div",
          "br",
          "ul",
          "ol",
          "li",
        ],
        attributes: {
          // Start with default attributes but override for table cells to ensure colspan/rowspan are preserved
          ...((defaultSchema?.attributes as Record<string, any>) || {}),
          table: ["className", "style"],
          thead: ["className", "style"],
          tbody: ["className", "style"],
          tr: ["className", "style"],
          // Explicitly set th and td attributes - don't merge, replace to ensure colspan/rowspan are included
          th: ["className", "style", "colspan", "rowspan", "colSpan", "rowSpan", "data-text-align", "data-background-color", "data-border-color"],
          td: ["className", "style", "colspan", "rowspan", "colSpan", "rowSpan", "data-text-align", "data-background-color", "data-border-color"],
          span: ["className", "style", "data-color"],
          strong: ["className", "style"],
          em: ["className", "style"],
          u: ["className", "style"],
          s: ["className", "style"],
          strike: ["className", "style"],
          code: ["className", "style"],
          mark: ["className", "style", "data-color"],
          a: ["href", "target", "rel", "className", "style"],
          p: ["className", "style"],
          div: ["className", "style"],
          ul: ["className", "style"],
          ol: ["className", "style", "start"],
          li: ["className", "style"],
          "*": ["className", "style"],
        },
        // Allow all text content inside table cells
        strip: [],
      }

      try {
        // Debug: Log the HTML before sanitization to check for colspan/rowspan
        if (process.env.NODE_ENV === "development") {
          const hasColspan = cleanedHtml.includes('colspan') || cleanedHtml.includes('colSpan')
          const hasRowspan = cleanedHtml.includes('rowspan') || cleanedHtml.includes('rowSpan')
          if (hasColspan || hasRowspan) {
            console.log("[TableHtmlRenderer] HTML contains merged cells:", {
              hasColspan,
              hasRowspan,
              sample: cleanedHtml.substring(0, 500)
            })
          }
        }
        
        // Use a very permissive schema that preserves all table attributes
        // The HTML comes from Tiptap which is trusted, we just need basic XSS protection
        const permissiveSchema: any = {
          tagNames: [
            "table", "thead", "tbody", "tfoot", "tr", "th", "td",
            "p", "div", "span", "strong", "em", "u", "s", "strike", "code", "pre", "mark",
            "ul", "ol", "li", "br", "hr",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "img", "blockquote",
          ],
          attributes: {
            table: ["className", "style", "border", "cellpadding", "cellspacing"],
            thead: ["className", "style"],
            tbody: ["className", "style"],
            tfoot: ["className", "style"],
            tr: ["className", "style"],
            // Explicitly allow both lowercase and camelCase for colspan/rowspan
            th: ["className", "style", "colspan", "rowspan", "colSpan", "rowSpan", "data-text-align", "data-background-color", "data-border-color", "align", "valign"],
            td: ["className", "style", "colspan", "rowspan", "colSpan", "rowSpan", "data-text-align", "data-background-color", "data-border-color", "align", "valign"],
            p: ["className", "style"],
            div: ["className", "style"],
            span: ["className", "style", "data-color"],
            strong: ["className", "style"],
            em: ["className", "style"],
            u: ["className", "style"],
            s: ["className", "style"],
            strike: ["className", "style"],
            code: ["className", "style"],
            pre: ["className", "style"],
            mark: ["className", "style", "data-color"],
            ul: ["className", "style"],
            ol: ["className", "style"],
            li: ["className", "style"],
            br: ["className", "style"],
            hr: ["className", "style"],
            h1: ["className", "style"],
            h2: ["className", "style"],
            h3: ["className", "style"],
            h4: ["className", "style"],
            h5: ["className", "style"],
            h6: ["className", "style"],
            a: ["href", "target", "rel", "className", "style"],
            img: ["src", "alt", "title", "className", "style", "width", "height"],
            blockquote: ["className", "style"],
            "*": ["className", "style"],
          },
          strip: [],
        }
        
        // Only sanitize for security, don't modify the HTML structure or styles
        const file = await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeSanitize, permissiveSchema)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(cleanedHtml)
        
        const sanitized = String(file)
        
        // Debug: Log the HTML after sanitization to check if colspan/rowspan are preserved
        if (process.env.NODE_ENV === "development") {
          const hasColspanAfter = sanitized.includes('colspan') || sanitized.includes('colSpan')
          const hasRowspanAfter = sanitized.includes('rowspan') || sanitized.includes('rowSpan')
          if ((cleanedHtml.includes('colspan') || cleanedHtml.includes('colSpan')) && !hasColspanAfter) {
            // Colspan was removed during sanitization
          }
          if ((cleanedHtml.includes('rowspan') || cleanedHtml.includes('rowSpan')) && !hasRowspanAfter) {
            console.warn("[TableHtmlRenderer] rowspan was removed during sanitization!")
          }
        }
        
        setSanitizedHtml(sanitized)
      } catch (error) {
        console.error("Error sanitizing table HTML:", error)
        // If sanitization fails, use original HTML (it's from Tiptap which is trusted)
        setSanitizedHtml(cleanedHtml)
      }
    }
    sanitizeTableHtml()
  }, [html])

  return (
    <div key={itemId} className="overflow-x-auto my-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          /* TextStyle helpers (font family / size) - keep renderer output consistent with the editor */
          .table-view-${itemId} .tiptap-ff-arial { font-family: Arial, sans-serif; }
          .table-view-${itemId} .tiptap-ff-times-new-roman { font-family: "Times New Roman", Times, serif; }
          .table-view-${itemId} .tiptap-ff-courier-new { font-family: "Courier New", Courier, monospace; }
          .table-view-${itemId} .tiptap-ff-georgia { font-family: Georgia, serif; }
          .table-view-${itemId} .tiptap-ff-verdana { font-family: Verdana, Geneva, sans-serif; }
          .table-view-${itemId} .tiptap-ff-helvetica { font-family: Helvetica, Arial, sans-serif; }
          .table-view-${itemId} .tiptap-ff-comic-sans-ms { font-family: "Comic Sans MS", "Comic Sans", cursive; }
          .table-view-${itemId} .tiptap-ff-trebuchet-ms { font-family: "Trebuchet MS", Helvetica, sans-serif; }

          .table-view-${itemId} .tiptap-fs-8 { font-size: 8px; }
          .table-view-${itemId} .tiptap-fs-9 { font-size: 9px; }
          .table-view-${itemId} .tiptap-fs-10 { font-size: 10px; }
          .table-view-${itemId} .tiptap-fs-11 { font-size: 11px; }
          .table-view-${itemId} .tiptap-fs-12 { font-size: 12px; }
          .table-view-${itemId} .tiptap-fs-14 { font-size: 14px; }
          .table-view-${itemId} .tiptap-fs-16 { font-size: 16px; }
          .table-view-${itemId} .tiptap-fs-18 { font-size: 18px; }
          .table-view-${itemId} .tiptap-fs-20 { font-size: 20px; }
          .table-view-${itemId} .tiptap-fs-24 { font-size: 24px; }
          .table-view-${itemId} .tiptap-fs-28 { font-size: 28px; }
          .table-view-${itemId} .tiptap-fs-32 { font-size: 32px; }
          .table-view-${itemId} .tiptap-fs-36 { font-size: 36px; }
          .table-view-${itemId} .tiptap-fs-48 { font-size: 48px; }
          .table-view-${itemId} .tiptap-fs-72 { font-size: 72px; }

          /* Use the same styles as edit mode (ProseMirror) */
          .table-view-${itemId} table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 3px solid #6b7280 !important;
            margin: 16px 0;
            background-color: #ffffff !important;
            display: table !important;
          }
          .dark .table-view-${itemId} table {
            border-color: #9ca3af !important;
            background-color: #1f2937 !important;
          }
          .table-view-${itemId} table tr {
            border: 2px solid #6b7280 !important;
          }
          .dark .table-view-${itemId} table tr {
            border-color: #9ca3af !important;
          }
          .table-view-${itemId} table th,
          .table-view-${itemId} table td {
            border: 2px solid #6b7280 !important;
            border-top: 2px solid #6b7280 !important;
            border-left: 2px solid #6b7280 !important;
            border-right: 2px solid #6b7280 !important;
            border-bottom: 2px solid #6b7280 !important;
            padding: 8px 12px !important;
            vertical-align: top;
            min-width: 100px !important;
            min-height: 40px !important;
            position: relative;
            background-color: #ffffff !important;
            color: inherit !important;
            font-family: inherit !important;
            display: table-cell !important;
          }
          .dark .table-view-${itemId} table th,
          .dark .table-view-${itemId} table td {
            border-color: #9ca3af !important;
            background-color: #1f2937 !important;
            color: inherit !important;
            font-family: inherit !important;
          }
          .table-view-${itemId} table th {
            border-bottom: 3px solid #6b7280 !important;
            background-color: #f3f4f6 !important;
            font-weight: 600;
            color: inherit !important;
          }
          .dark .table-view-${itemId} table th {
            border-color: #9ca3af !important;
            border-bottom: 3px solid #9ca3af !important;
            background-color: #374151 !important;
            color: inherit !important;
          }
          .table-view-${itemId} table th p,
          .table-view-${itemId} table td p {
            margin: 0;
            min-height: 1.5em;
          }
          /* Lists inside table cells — match edit mode (Tailwind resets list-style otherwise) */
          .table-view-${itemId} table th ul,
          .table-view-${itemId} table td ul {
            list-style-type: disc !important;
            list-style-position: outside !important;
            margin: 0.25rem 0 !important;
            padding-left: 1.25rem !important;
          }
          .table-view-${itemId} table th ol,
          .table-view-${itemId} table td ol {
            list-style-type: decimal !important;
            list-style-position: outside !important;
            margin: 0.25rem 0 !important;
            padding-left: 1.25rem !important;
          }
          .table-view-${itemId} table th li,
          .table-view-${itemId} table td li {
            display: list-item !important;
            list-style-position: outside !important;
            margin: 0.2rem 0 !important;
          }
          .table-view-${itemId} table th ul ul,
          .table-view-${itemId} table td ul ul {
            list-style-type: circle !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          .table-view-${itemId} table th ol ol,
          .table-view-${itemId} table td ol ol {
            list-style-type: lower-alpha !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          .table-view-${itemId} table th strong,
          .table-view-${itemId} table td strong {
            font-weight: 600 !important;
          }
          .table-view-${itemId} table th em,
          .table-view-${itemId} table td em {
            font-style: italic !important;
          }
          .table-view-${itemId} table th u,
          .table-view-${itemId} table td u {
            text-decoration: underline !important;
          }
          /* Handle merged cells - same as edit mode */
          .table-view-${itemId} table th[colspan] + th,
          .table-view-${itemId} table td[colspan] + td,
          .table-view-${itemId} table th[colspan] + td,
          .table-view-${itemId} table td[colspan] + th {
            border-left: none !important;
          }
          .table-view-${itemId} table th[colspan],
          .table-view-${itemId} table td[colspan] {
            border-right: 2px solid #6b7280 !important;
          }
          .dark .table-view-${itemId} table th[colspan],
          .dark .table-view-${itemId} table td[colspan] {
            border-right-color: #9ca3af !important;
          }
          .table-view-${itemId} table th[rowspan],
          .table-view-${itemId} table td[rowspan] {
            border-bottom: 2px solid #6b7280 !important;
          }
          .dark .table-view-${itemId} table th[rowspan],
          .dark .table-view-${itemId} table td[rowspan] {
            border-bottom-color: #9ca3af !important;
          }
          /* Preserve text colors and highlights from inline styles */
          .table-view-${itemId} span[style*="color"],
          .table-view-${itemId} p[style*="color"],
          .table-view-${itemId} div[style*="color"],
          .table-view-${itemId} td[style*="color"],
          .table-view-${itemId} th[style*="color"],
          .table-view-${itemId} mark[style*="color"] {
            /* Inline styles have higher specificity - colors are preserved */
          }
          .table-view-${itemId} mark:not([style*="background-color"]) {
            /* Default highlight color only if no inline style */
            background-color: #FFFF00;
            padding: 2px 4px;
            border-radius: 2px;
            color: inherit;
          }
          .table-view-${itemId} mark[style*="background-color"] {
            /* Preserve custom highlight colors from inline styles */
            padding: 2px 4px;
            border-radius: 2px;
            color: inherit;
          }
          .table-view-${itemId} span[style*="background-color"] {
            /* Preserve highlight colors on spans */
            padding: 2px 4px;
            border-radius: 2px;
            color: inherit;
          }
        `
      }} />
      <div
        className={`table-view-${itemId}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  )
}

function renderTable(item: ContentItem, isDark: boolean = false) {
  // Sanitize configuration for tables
  const sanitizeSchema: any = {
    ...defaultSchema,
    tagNames: [
      ...((defaultSchema?.tagNames as string[]) || []),
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "figure",
      "figcaption",
    ],
    attributes: {
      ...((defaultSchema?.attributes as Record<string, any>) || {}),
      table: ["className", "style"],
      thead: ["className", "style"],
      tbody: ["className", "style"],
      tr: ["className", "style"],
      th: ["className", "style", "colspan", "rowspan"],
      td: ["className", "style", "colspan", "rowspan"],
      img: ["src", "alt", "title", "className", "style", "width", "height"],
      "*": ["className", "style"],
    },
  }

  // If HTML is available (from AdvancedTableEditor), render it directly with sanitization
  // Check both html and tableHtml (AdvancedTableEditor stores as tableHtml)
  const tableHtml = item.data?.html || item.data?.tableHtml
  if (tableHtml) {
    return <TableHtmlRenderer html={tableHtml} itemId={item.id} isDark={isDark} />
  }

  if (item.data?.markdown) {
    // Convert markdown to HTML temporarily to clean empty rows, then render
    // For markdown, we'll rely on the tr component filter instead
    return (
      <div key={item.id} className="overflow-x-auto my-4">
        <style dangerouslySetInnerHTML={{
          __html: `
            .markdown-table-${item.id} table,
            .markdown-table-${item.id} table * {
              box-sizing: border-box !important;
            }
            .markdown-table-${item.id} table {
              border: 3px solid #6b7280 !important;
              border-collapse: collapse !important;
              border-spacing: 0 !important;
              width: 100% !important;
              min-width: 100% !important;
              display: table !important;
              margin: 16px 0 !important;
              background-color: #ffffff !important;
            }
            .dark .markdown-table-${item.id} table {
              border-color: #9ca3af !important;
              background-color: #1f2937 !important;
            }
            .markdown-table-${item.id} table tr,
            .markdown-table-${item.id} table thead tr,
            .markdown-table-${item.id} table tbody tr {
              border: 2px solid #6b7280 !important;
              border-top: 2px solid #6b7280 !important;
              border-bottom: 2px solid #6b7280 !important;
              display: table-row !important;
            }
            .dark .markdown-table-${item.id} table tr,
            .dark .markdown-table-${item.id} table thead tr,
            .dark .markdown-table-${item.id} table tbody tr {
              border-color: #9ca3af !important;
            }
            .markdown-table-${item.id} table thead tr {
              border-bottom: 3px solid #6b7280 !important;
            }
            .dark .markdown-table-${item.id} table thead tr {
              border-bottom-color: #9ca3af !important;
            }
            .markdown-table-${item.id} table tbody tr {
              border-bottom: 2px solid #6b7280 !important;
            }
            .dark .markdown-table-${item.id} table tbody tr {
              border-bottom-color: #9ca3af !important;
            }
            .markdown-table-${item.id} table th,
            .markdown-table-${item.id} table td {
              border: 2px solid #6b7280 !important;
              border-top: 2px solid #6b7280 !important;
              border-left: 2px solid #6b7280 !important;
              border-right: 2px solid #6b7280 !important;
              border-bottom: 2px solid #6b7280 !important;
              padding: 8px 12px !important;
              display: table-cell !important;
              vertical-align: top !important;
              background-color: #ffffff !important;
              color: inherit !important;
              font-family: inherit !important;
            }
            .dark .markdown-table-${item.id} table th,
            .dark .markdown-table-${item.id} table td {
              border-color: #9ca3af !important;
              background-color: #1f2937 !important;
              color: inherit !important;
              font-family: inherit !important;
            }
            .markdown-table-${item.id} table th {
              border-bottom: 3px solid #6b7280 !important;
              background-color: #f3f4f6 !important;
              font-weight: 600 !important;
              color: inherit !important;
            }
            .dark .markdown-table-${item.id} table th {
              border-color: #9ca3af !important;
              border-bottom: 3px solid #9ca3af !important;
              background-color: #374151 !important;
              color: inherit !important;
            }
          `
        }} />
        <div className={`markdown-table-${item.id}`}>
          <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={{
            table: ({ node, ...props }) => (
              <table
                className="explanation-table min-w-full border-collapse"
                style={{
                  borderCollapse: "collapse",
                  borderSpacing: "0",
                  display: "table",
                }}
                {...props}
              />
            ),
            th: ({ node, ...props }: any) => {
              // ReactMarkdown with rehypeRaw passes HTML attributes as props
              // Check multiple possible locations for colspan
              const colspan = props.colspan || props.colSpan || 
                (node?.properties?.colspan?.[0] as number) || 
                (typeof node?.properties?.colspan === 'number' ? node.properties.colspan : null) ||
                (typeof props.children === 'object' && props.children?.props?.colspan) ||
                1
              const isTitleRow = colspan > 1 && colspan !== 1
              return (
                <th
                  className="p-3 text-sm font-bold text-foreground dark:text-gray-100 text-left"
                  style={{
                    backgroundColor: isDark ? "#374151" : "#f3f4f6",
                    padding: "8px 12px",
                    textAlign: isTitleRow ? "center" : "left",
                    fontSize: isTitleRow ? "1.1em" : undefined,
                    display: "table-cell",
                    color: "inherit",
                  }}
                  colSpan={colspan}
                  {...props}
                />
              )
            },
            td: ({ node, ...props }: any) => {
              const colspan = props.colspan || props.colSpan || 
                (node?.properties?.colspan?.[0] as number) || 
                (typeof node?.properties?.colspan === 'number' ? node.properties.colspan : null) ||
                (typeof props.children === 'object' && props.children?.props?.colspan) ||
                1
              return (
                <td
                  className="p-3 text-sm bg-card dark:bg-gray-800 text-foreground/90 dark:text-gray-200 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-800 [&_a:hover]:dark:text-blue-300"
                  style={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    padding: "8px 12px",
                    display: "table-cell",
                    color: "inherit",
                  }}
                  colSpan={colspan}
                  {...props}
                />
              )
            },
            tr: ({ node, children, ...props }: any) => {
              // Check if the row is empty (all cells are empty or only whitespace)
              const isEmpty = Array.isArray(children) && children.every((cell: any) => {
                if (!cell || !cell.props) return true
                const cellContent = cell.props.children
                if (typeof cellContent === 'string') {
                  return cellContent.trim() === ''
                }
                if (Array.isArray(cellContent)) {
                  return cellContent.every((c: any) => {
                    if (typeof c === 'string') return c.trim() === ''
                    if (c && c.props && c.props.children) {
                      const text = typeof c.props.children === 'string' 
                        ? c.props.children 
                        : Array.isArray(c.props.children) 
                          ? c.props.children.join('') 
                          : ''
                      return text.trim() === ''
                    }
                    return true
                  })
                }
                return false
              })
              
              // Don't render empty rows
              if (isEmpty) {
                return null
              }
              
              return (
                <tr
                  className="hover:bg-muted/30 dark:hover:bg-gray-700/30 transition-colors"
                  style={{
                    display: "table-row",
                  }}
                  {...props}
                >
                  {children}
                </tr>
              )
            },
            thead: ({ node, ...props }: any) => (
              <thead style={{ display: "table-header-group" }} {...props} />
            ),
            tbody: ({ node, ...props }: any) => (
              <tbody style={{ display: "table-row-group" }} {...props} />
            ),
          }}
        >
          {item.data.html || ""}
        </ReactMarkdown>
        </div>
      </div>
    )
  }

  // Fallback to legacy format
  let rows = 0
  let cols = 0
  let tableData: string[][] = []
  let cells: Record<string, string> = {}

  if (Array.isArray(item.data?.rows)) {
    // Format from markdown parser: rows is an array of arrays
    tableData = item.data.rows
    rows = tableData.length
    cols = tableData.length > 0 ? tableData[0].length : 0
  } else if (typeof item.data?.rows === "number" && typeof item.data?.cols === "number") {
    // Format from rich content editor: rows and cols are numbers with cells object
    rows = item.data.rows || 0
    cols = item.data.cols || 0
    cells = item.data.cells || {}
    
    // Debug: Log table data structure
    if (process.env.NODE_ENV === "development") {
      if (Object.keys(cells).length === 0) {
        console.warn("[TableRenderer] Empty cells object for table:", {
          rows,
          cols,
          data: item.data,
          itemId: item.id,
        })
      } else {
        // Table data structure
      }
    }
  } else {
    // Invalid table data
    console.warn("[TableRenderer] Invalid table data structure:", item.data)
    return null
  }

  if (rows === 0 || cols === 0) {
    return null
  }

  return (
    <div key={item.id} className="overflow-x-auto my-4">
      <table 
        className="explanation-table min-w-full border-collapse border-[3px] border-[#6b7280] dark:border-[#9ca3af] bg-white dark:bg-[#1f2937]"
        style={{
          borderCollapse: "collapse",
          borderSpacing: "0",
          display: "table",
        }}
      >
        <thead>
          <tr style={{ display: "table-row" }}>
            {Array.from({ length: cols }).map((_, colIdx) => {
              const cellKey = `0-${colIdx}`
              let cellContent = ""

              if (tableData.length > 0 && Array.isArray(tableData[0])) {
                cellContent = tableData[0][colIdx] || `Header ${colIdx + 1}`
              } else {
                // Use cells object directly
                cellContent = cells[cellKey] || `Header ${colIdx + 1}`
              }

              return (
                <th
                  key={`header-${colIdx}`}
                  className="p-3 text-sm font-bold text-foreground dark:text-gray-100 text-left border-2 dark:border-[#9ca3af] border-[#6b7280] border-b-[3px]"
                  style={{
                    backgroundColor: isDark ? "#374151" : "#f3f4f6",
                    padding: "8px 12px",
                    display: "table-cell",
                    color: isDark ? "#f9fafb" : "#111827",
                  }}
                >
                  {cellContent}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows - 1 }).map((_, rowIdx) => {
            const actualRowIdx = rowIdx + 1 // Skip header row
            return (
              <tr 
                key={rowIdx} 
                className="hover:bg-muted/30 dark:hover:bg-gray-700/30 transition-colors border-2 dark:border-[#9ca3af] border-[#6b7280]"
                style={{
                  display: "table-row",
                }}
              >
              {Array.from({ length: cols }).map((_, colIdx) => {
                let cellContent = ""

                  if (tableData.length > actualRowIdx && Array.isArray(tableData[actualRowIdx])) {
                    cellContent = tableData[actualRowIdx][colIdx] || `Cell ${actualRowIdx + 1}-${colIdx + 1}`
                } else {
                    const cellKey = `${actualRowIdx}-${colIdx}`
                    // Use cells object directly
                    cellContent = cells[cellKey] || `Cell ${actualRowIdx + 1}-${colIdx + 1}`
                }

                return (
                  <td
                      key={`${actualRowIdx}-${colIdx}`}
                      className="p-3 text-sm bg-white dark:bg-[#1f2937] text-foreground/90 dark:text-gray-200 transition-colors border-2 dark:border-[#9ca3af] border-[#6b7280]"
                      style={{
                        padding: "8px 12px",
                        display: "table-cell",
                        color: isDark ? "#f3f4f6" : "#111827",
                      }}
                    >
                      {cellContent}
                  </td>
                )
              })}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function renderPerAnswerExplanations(
  item: ContentItem,
  perAnswerExplanations: Record<string, string | any[]>,
  options: Array<{ label: string; text: string; correct: boolean }>,
  selectedAnswer: string | null
) {
  const hasPerAnswerExplanations = options.length > 0 && Object.values(perAnswerExplanations).some((e) => {
    if (Array.isArray(e)) {
      return e.length > 0
    }
    return !!e?.trim()
  })

  if (!hasPerAnswerExplanations) {
    return (
      <div key={item.id} className="border border-border/40 dark:border-gray-700 rounded-lg p-1 bg-muted/20 dark:bg-gray-800/30">
        <p className="text-xs text-muted-foreground dark:text-gray-400 italic text-center">
          Per-answer explanations will appear here. Configure them in the Per-Answer Explanations section.
        </p>
      </div>
    )
  }

  // Sort options: correct choice first, then incorrect ones in original order
  const correctOption = options.find(opt => opt.correct)
  const incorrectOptions = options.filter(opt => !opt.correct)
  const sortedOptions = correctOption 
    ? [correctOption, ...incorrectOptions]
    : options

  return (
    <div key={item.id} className="border-t border-border/40 dark:border-gray-700/50 pt-1 mt-1">
      <h3 className="text-sm font-bold text-center text-foreground dark:text-gray-100 mb-1 uppercase tracking-wide">Answer Breakdown</h3>
      <div className="space-y-0.5">
        {sortedOptions.map((option) => {
          const isCorrect = option.correct
          const isSelected = selectedAnswer === option.label
          const explanation = perAnswerExplanations[option.label]
          const isContentBlocks = Array.isArray(explanation)
          const hasContent = isContentBlocks 
            ? explanation.length > 0 && explanation.some((block: any) => {
                // Check if block has actual content
                if (!block || !block.data) return false
                const html = block.data?.html || ""
                const markdown = block.data?.markdown || ""
                const trimmedHtml = html.trim()
                const isEmptyHtml = !trimmedHtml || 
                  trimmedHtml === "<p></p>" || 
                  trimmedHtml === "<p><br></p>" || 
                  trimmedHtml === "<p> </p>" ||
                  trimmedHtml === "<p><br/></p>" ||
                  trimmedHtml === "<div></div>" ||
                  trimmedHtml === "<div><br></div>"
                return !isEmptyHtml || (markdown && markdown.trim())
              })
            : !!explanation?.trim()

          return (
            <div
              key={option.label}
              className="border-b border-border/40 dark:border-gray-700/50 pb-0.5 last:border-b-0 last:pb-0"
            >
              {/* Header */}
              <div className="mb-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm text-foreground dark:text-gray-100">
                    <span className="font-bold">Option {option.label}:</span>{" "}
                    <span className="text-foreground/70 dark:text-gray-300">{option.text}</span>
                    {" "}
                    <span className={`font-semibold ${
                      isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      ({isCorrect ? "Correct" : "Incorrect"})
                    </span>
                  </span>
                  {isSelected && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30">
                      You selected
                    </span>
                  )}
                </div>
              </div>

              {/* Explanation Content */}
              <div className="space-y-0.5">
                {hasContent ? (
                  <>
                    {isContentBlocks ? (
                      // For blocks: prefer HTML rendering whenever any block has usable HTML,
                      // so bullets, lists, fonts and formatting match main explanation content.
                      (() => {
                        const emptyHtmlPatterns = [
                          "", "<p></p>", "<p><br></p>", "<p> </p>", "<p><br/></p>",
                          "<div></div>", "<div><br></div>", "<div><br/></div>",
                        ]
                        const hasUsableHtml = (html: string) =>
                          html && typeof html === "string" && html.trim() &&
                          !emptyHtmlPatterns.includes(html.trim().replace(/\s+/g, " "))

                        const blocksWithHtml = explanation
                          .map((block: any) => block?.data?.html || "")
                          .filter(hasUsableHtml)
                        const hasAnyHtml = blocksWithHtml.length > 0

                        if (hasAnyHtml) {
                          // Combine all block HTML and render with HtmlRenderer so formatting (bullets, lists, fonts) is preserved
                          const combinedHtml = explanation
                            .map((block: any) => block?.data?.html || "")
                            .filter((html: string) => html && html.trim())
                            .join("")

                          if (combinedHtml) {
                            return (
                              <div className="text-foreground/90 per-answer-explanation-content">
                                <style dangerouslySetInnerHTML={{
                                  __html: `
                                    .per-answer-explanation-content ul {
                                      list-style-type: disc !important;
                                      list-style-position: outside !important;
                                      padding-left: 1.5rem !important;
                                      margin: 0.25rem 0 0.5rem 0 !important;
                                    }
                                    .per-answer-explanation-content ol {
                                      list-style-type: decimal !important;
                                      list-style-position: outside !important;
                                      padding-left: 1.5rem !important;
                                      margin: 0.25rem 0 0.5rem 0 !important;
                                    }
                                    .per-answer-explanation-content li {
                                      display: list-item !important;
                                      list-style-position: outside !important;
                                      margin: 0.125rem 0 !important;
                                    }
                                    .per-answer-explanation-content p { margin: 0.25rem 0 !important; }
                                    .per-answer-explanation-content strong { font-weight: 600 !important; }
                                    .per-answer-explanation-content em { font-style: italic !important; }
                                  `
                                }} />
                                <HtmlRenderer html={combinedHtml} itemId={`per-answer-${option.label}`} />
                              </div>
                            )
                          }
                        }

                        // Fallback: normalize block types (TEXT -> text, etc.) and use RichContentRenderer
                        const normalizedBlocks = explanation.map((block: any) => {
                          const t = (block?.type || "text").toString().toLowerCase()
                          return {
                            ...block,
                            type: t === "image" ? "images" : t,
                            id: block?.id ?? `block-${option.label}-${Math.random()}`,
                          }
                        })
                        return (
                          <div className="text-foreground/90 per-answer-explanation-content">
                            <style dangerouslySetInnerHTML={{
                              __html: `
                                .per-answer-explanation-content ul {
                                  list-style-type: disc !important;
                                  list-style-position: outside !important;
                                  padding-left: 1.5rem !important;
                                  margin-left: 0 !important;
                                  margin-top: 0.25rem !important;
                                  margin-bottom: 0.5rem !important;
                                }
                                .per-answer-explanation-content ol {
                                  list-style-type: decimal !important;
                                  list-style-position: outside !important;
                                  padding-left: 1.5rem !important;
                                  margin-left: 0 !important;
                                  margin-top: 0.25rem !important;
                                  margin-bottom: 0.5rem !important;
                                }
                                .per-answer-explanation-content li {
                                  display: list-item !important;
                                  list-style-position: outside !important;
                                  margin-left: 0 !important;
                                  padding-left: 0 !important;
                                  margin-top: 0.125rem !important;
                                  margin-bottom: 0.125rem !important;
                                }
                                .per-answer-explanation-content li > p,
                                .per-answer-explanation-content li > div {
                                  display: inline !important;
                                  margin: 0 !important;
                                  padding: 0 !important;
                                }
                              `
                            }} />
                            <RichContentRenderer content={normalizedBlocks} />
                          </div>
                        )
                      })()
                    ) : (
                      // If explanation is a string with HTML (lists, bullets, formatting), use HtmlRenderer
                      (typeof explanation === "string" && explanation.trim() && (
                        explanation.includes("<") && explanation.includes(">") &&
                        (explanation.includes("<ul") || explanation.includes("<ol") || explanation.includes("<p>") ||
                         explanation.includes("<span") || explanation.includes("<mark") || explanation.includes("style=") ||
                         explanation.includes("<strong") || explanation.includes("<em"))
                      )) ? (
                        <div className="text-foreground/90 per-answer-explanation-content">
                          <style dangerouslySetInnerHTML={{
                            __html: `
                              .per-answer-explanation-content ul {
                                list-style-type: disc !important;
                                list-style-position: outside !important;
                                padding-left: 1.5rem !important;
                                margin: 0.25rem 0 0.5rem 0 !important;
                              }
                              .per-answer-explanation-content ol {
                                list-style-type: decimal !important;
                                list-style-position: outside !important;
                                padding-left: 1.5rem !important;
                                margin: 0.25rem 0 0.5rem 0 !important;
                              }
                              .per-answer-explanation-content li { display: list-item !important; margin: 0.125rem 0 !important; }
                              .per-answer-explanation-content p { margin: 0.25rem 0 !important; }
                              .per-answer-explanation-content strong { font-weight: 600 !important; }
                              .per-answer-explanation-content em { font-style: italic !important; }
                            `
                          }} />
                          <HtmlRenderer html={explanation} itemId={`per-answer-${option.label}`} />
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 [&_h1]:font-bold [&_h1]:text-center [&_h2]:font-bold [&_h2]:text-center [&_h3]:font-bold [&_h3]:text-center [&_h4]:font-bold [&_h4]:text-center [&_h5]:font-bold [&_h5]:text-center [&_h6]:font-bold [&_h6]:text-center" style={{ 
                          // Override prose list styles to ensure bullets/numbers are visible
                          '--tw-prose-bullets': 'disc',
                          '--tw-prose-counters': 'decimal',
                        } as React.CSSProperties}>
                          <style dangerouslySetInnerHTML={{
                            __html: `
                              /* Ensure lists in per-answer explanations show bullets/numbers */
                              .prose ul {
                                list-style-type: disc !important;
                                list-style-position: outside !important;
                                padding-left: 1.5rem !important;
                                margin-left: 0 !important;
                              }
                              .prose ol {
                                list-style-type: decimal !important;
                                list-style-position: outside !important;
                                padding-left: 1.5rem !important;
                                margin-left: 0 !important;
                              }
                              .prose li {
                                display: list-item !important;
                                list-style-position: outside !important;
                                margin-left: 0 !important;
                                padding-left: 0 !important;
                              }
                            `
                          }} />
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="text-foreground/90 leading-relaxed mb-3 whitespace-pre-wrap" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-semibold text-foreground" {...props} />
                              ),
                              em: ({ node, ...props }) => (
                                <em className="italic text-foreground/90" {...props} />
                              ),
                              a: ({ node, ...props }: any) => (
                                <a
                                  className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                >
                                  {props.children}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                </a>
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc list-outside space-y-1 mb-4 text-foreground/90 ml-6 pl-0" style={{ listStyleType: "disc", listStylePosition: "outside", paddingLeft: "1.5rem" }} {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal list-outside space-y-1 mb-4 text-foreground/90 ml-6 pl-0" style={{ listStyleType: "decimal", listStylePosition: "outside", paddingLeft: "1.5rem" }} {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="text-foreground/90" style={{ display: "list-item", listStylePosition: "outside", paddingLeft: "0" }} {...props} />
                              ),
                            }}
                          >
                            {explanation}
                          </ReactMarkdown>
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground italic py-2">
                    No explanation for this choice
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RenderImages({ item }: { item: ContentItem }) {
  const openPreviewImage = useContext(PreviewImageContext)
  const { count } = item.data
  let images: string[] = []
  
  // Handle different image data formats
  if (Array.isArray(item.data?.images)) {
    images = item.data.images.map((img: any) => {
      // If it's an object with url property, extract the URL
      if (typeof img === "object" && img !== null && img.url) {
        return img.url
      }
      // If it's already a string, use it directly
      if (typeof img === "string") {
        return img
      }
      return ""
    }).filter((url: string) => url && url.trim())
  }

  const imageCount = Math.max(count || images.length, images.length)

  return (
    <div key={item.id} className="my-4">
      <div
        className="grid gap-4 auto-cols-fr justify-center"
        style={{
          gridTemplateColumns: `repeat(${Math.min(imageCount, 3)}, minmax(0, 450px))`,
        }}
      >
        {Array.from({ length: imageCount }).map((_, idx) => {
          const imageUrl = images[idx]
          return (
            <div key={idx} className="max-w-[450px] aspect-square rounded-lg overflow-hidden border border-border dark:border-gray-700 bg-muted dark:bg-gray-800 mx-auto">
              {imageUrl ? (
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={`Explanation image ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openPreviewImage?.(imageUrl)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                    target.onerror = null // Prevent infinite loop
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground dark:text-gray-400 text-sm bg-muted/50 dark:bg-gray-800/50">
                  {`Image ${idx + 1}`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
