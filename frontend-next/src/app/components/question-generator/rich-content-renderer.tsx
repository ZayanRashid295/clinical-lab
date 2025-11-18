"use client"

import { useEffect, useState } from "react"
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
}

export default function RichContentRenderer({ content, perAnswerExplanations = {}, options = [], selectedAnswer = null }: RichContentRendererProps) {
  const [isDark, setIsDark] = useState(false)

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

  const renderedContent = content.map((item) => {
      switch (item.type) {
        case "text":
          return renderMarkdown(item, isDark)
        case "table":
          return renderTable(item, isDark)
        case "images":
        case "image":
          return renderImages(item)
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

  return <div className="space-y-6">{renderedContent}</div>
}

function renderInternalLink(item: ContentItem) {
  const { linkText, targetId, targetType, description } = item.data || {}
  
  if (!linkText || !targetId) {
    return null
  }

  const href = `/${targetType === 'question' ? 'question-generator' : 'content'}/${targetType}/${targetId}`
  
  return (
    <div key={item.id} className="my-4 p-4 border border-primary/30 rounded-lg bg-primary/5">
      <a
        href={href}
        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
      >
        <span>🔗</span>
        <span>{linkText}</span>
        <ExternalLink className="w-4 h-4" />
      </a>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
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
    <div key={item.id} className="my-4 p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
      <a
        href={url}
        target={openInNewTab !== false ? "_blank" : undefined}
        rel={openInNewTab !== false ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
      >
        <span>🌐</span>
        <span>{linkText}</span>
        <ExternalLink className="w-4 h-4" />
      </a>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  )
}

// Helper function to fix list item formatting by removing <p> tags inside <li>
function fixListItemFormatting(html: string): string {
  // Use a more robust approach to handle nested elements
  // This regex pattern matches <p> tags inside <li> and removes them while preserving content
  let result = html
  
  // Match <li> tags that contain <p> tags (with possible whitespace)
  // Pattern: <li>...<p>content</p>...</li>
  result = result.replace(/<li([^>]*)>\s*<p([^>]*)>([\s\S]*?)<\/p>\s*<\/li>/gi, (match, liAttrs, pAttrs, content) => {
    // Preserve any attributes on the <li> tag
    return `<li${liAttrs || ''}>${content.trim()}</li>`
  })
  
  // Also handle cases where there might be text before or after the <p> tag
  result = result.replace(/<li([^>]*)>([^<]*)<p([^>]*)>([\s\S]*?)<\/p>([^<]*)<\/li>/gi, (match, liAttrs, before, pAttrs, content, after) => {
    return `<li${liAttrs || ''}>${(before || '').trim()}${content.trim()}${(after || '').trim()}</li>`
  })
  
  return result
}

// Component to render HTML with sanitization
function HtmlRenderer({ html, itemId }: { html: string; itemId: number }) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>(html)

  useEffect(() => {
    // Sanitize HTML using unified pipeline
    const sanitizeHtml = async () => {
      // First, fix list item formatting
      const fixedHtml = fixListItemFormatting(html)
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
          "span",
          "strong",
          "em",
          "u",
          "s",
          "strike",
          "code",
          "pre",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "a",
          "blockquote",
          "hr",
          "p",
          "div",
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
          span: ["className", "style", "data-color"], // Allow color styles on spans
          strong: ["className", "style"],
          em: ["className", "style"],
          u: ["className", "style"],
          s: ["className", "style"],
          strike: ["className", "style"],
          code: ["className", "style"],
          pre: ["className", "style"],
          p: ["className", "style"],
          div: ["className", "style"],
          h1: ["className", "style"],
          h2: ["className", "style"],
          h3: ["className", "style"],
          h4: ["className", "style"],
          h5: ["className", "style"],
          h6: ["className", "style"],
          ul: ["className", "style"],
          ol: ["className", "style"],
          li: ["className", "style"],
          a: ["href", "target", "rel", "className", "style"],
          blockquote: ["className", "style"],
          hr: ["className", "style"],
          "*": ["className", "style"], // Allow style attribute on all elements
        },
      }

      try {
        const file = await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeSanitize, sanitizeSchema)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(fixedHtml)
        // Fix list items again after sanitization (in case sanitization re-added <p> tags)
        const finalHtml = fixListItemFormatting(String(file))
        setSanitizedHtml(finalHtml)
      } catch (error) {
        console.error("Error sanitizing HTML:", error)
        // Fallback to original HTML with list formatting fixed
        setSanitizedHtml(fixListItemFormatting(html))
      }
    }
    sanitizeHtml()
  }, [html])

  return (
    <div 
      key={itemId}
      className="prose prose-sm dark:prose-invert max-w-none [&_p]:text-foreground/90 [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:whitespace-pre-wrap [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-1 [&_ul]:mb-4 [&_ul]:text-foreground/90 [&_ul]:ml-6 [&_ul]:pl-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:space-y-1 [&_ol]:mb-4 [&_ol]:text-foreground/90 [&_ol]:ml-6 [&_ol]:pl-0 [&_li]:text-foreground/90 [&_li]:ml-0 [&_li]:pl-0 [&_li]:whitespace-pre-wrap [&_span]:whitespace-pre-wrap [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_code]:bg-muted [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
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
    
    // Remove any wrapping HTML/body tags if present (unified might add them)
    html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
    html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
    html = html.trim()
    
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
    
    // Convert bold and italic
    fallback = fallback.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    fallback = fallback.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Convert line breaks
    fallback = fallback.replace(/\n\n/g, '</p><p>')
    fallback = fallback.replace(/\n/g, '<br>')
    
    // Wrap in paragraph if it doesn't start with a heading or paragraph tag
    if (!fallback.trim().match(/^<(h[1-6]|p)/)) {
      fallback = `<p>${fallback}</p>`
    }
    
    return fallback
  }
}

function renderMarkdown(item: ContentItem, isDark: boolean = false) {
  // Skip rendering if this is a placeholder block that shouldn't be rendered as markdown
  if (item.data?.placeholder === true || item.data?.isPerAnswerExplanation === true) {
    return null
  }
  
  // Use HTML, with fallback to markdown conversion if HTML is missing
  const html = item.data?.html
  const markdown = item.data?.markdown || ""

  // Check if HTML is valid and not empty
  if (html && typeof html === "string") {
    const trimmedHtml = html.trim()
    // Only skip if it's truly empty (empty string or just whitespace in tags)
    if (trimmedHtml && trimmedHtml !== "<p></p>" && trimmedHtml !== "<p><br></p>" && trimmedHtml !== "<p> </p>") {
      return <HtmlRenderer html={html} itemId={item.id} />
    }
  }

  // Fallback: If HTML is missing but markdown exists, convert it
  if (markdown && markdown.trim()) {
    return <MarkdownToHtmlRenderer markdown={markdown} itemId={item.id} />
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
function MarkdownToHtmlRenderer({ markdown, itemId }: { markdown: string; itemId: number }) {
  const [html, setHtml] = useState<string>("")

  useEffect(() => {
    markdownToHTML(markdown).then(setHtml)
  }, [markdown])

  if (!html) {
    return <div key={itemId} className="text-muted-foreground text-sm italic">Loading...</div>
  }

  return <HtmlRenderer html={html} itemId={itemId} />
}

// Helper function to remove empty rows from HTML table
function removeEmptyTableRows(html: string): string {
  // Remove <tr> elements that contain only empty <td> or <th> elements (with any attributes or whitespace)
  // This regex matches rows where all cells are empty (no text content, only whitespace)
  return html.replace(/<tr[^>]*>[\s\n]*(?:<t[dh][^>]*>[\s\n]*<\/t[dh]>[\s\n]*)+<\/tr>/gi, '')
}

// Component to render HTML tables with proper sanitization
function TableHtmlRenderer({ html, itemId, isDark }: { html: string; itemId: number; isDark: boolean }) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>(html)

  useEffect(() => {
    const sanitizeTableHtml = async () => {
      // Remove empty rows first
      const cleanedHtml = removeEmptyTableRows(html)
      
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
          "a",
          "p",
          "div",
        ],
        attributes: {
          ...((defaultSchema?.attributes as Record<string, any>) || {}),
          table: ["className", "style"],
          thead: ["className", "style"],
          tbody: ["className", "style"],
          tr: ["className", "style"],
          th: ["className", "style", "colspan", "rowspan"],
          td: ["className", "style", "colspan", "rowspan"],
          span: ["className", "style", "data-color"],
          strong: ["className", "style"],
          em: ["className", "style"],
          u: ["className", "style"],
          s: ["className", "style"],
          strike: ["className", "style"],
          code: ["className", "style"],
          a: ["href", "target", "rel", "className", "style"],
          p: ["className", "style"],
          div: ["className", "style"],
          "*": ["className", "style"],
        },
      }

      try {
        const file = await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeSanitize, sanitizeSchema)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(cleanedHtml)
        setSanitizedHtml(String(file))
      } catch (error) {
        console.error("Error sanitizing table HTML:", error)
        setSanitizedHtml(cleanedHtml)
      }
    }
    sanitizeTableHtml()
  }, [html])

  return (
    <div key={itemId} className="overflow-x-auto my-4">
      <div
        className="[&_table]:min-w-full [&_table]:border-collapse [&_table]:border-2 [&_th]:p-3 [&_th]:text-sm [&_th]:font-bold [&_th]:text-foreground [&_th]:text-left [&_th]:border [&_th]:border-b-2 [&_th]:bg-muted [&_td]:p-3 [&_td]:text-sm [&_td]:bg-card [&_td]:text-foreground/90 [&_td]:border [&_tr]:hover:bg-muted/30 [&_tr]:transition-colors [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
        style={{
          // Apply dark mode styles if needed
        }}
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
  if (item.data?.html) {
    return <TableHtmlRenderer html={item.data.html} itemId={item.id} isDark={isDark} />
  }

  if (item.data?.markdown) {
    // Convert markdown to HTML temporarily to clean empty rows, then render
    // For markdown, we'll rely on the tr component filter instead
    return (
      <div key={item.id} className="overflow-x-auto my-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={{
            table: ({ node, ...props }) => (
              <table
                className="explanation-table min-w-full border-collapse"
                style={{
                  border: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
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
                  className="p-3 text-sm font-bold text-foreground text-left"
                  style={{
                    border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                    borderBottom: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                    backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                    padding: "8px 12px",
                    textAlign: isTitleRow ? "center" : "left",
                    fontSize: isTitleRow ? "1.1em" : undefined,
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
                  className="p-3 text-sm bg-card text-foreground/90 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-800 [&_a:hover]:dark:text-blue-300"
                  style={{
                    border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                    padding: "8px 12px",
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
                  className="hover:bg-muted/30 transition-colors"
                  style={{
                    borderBottom: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  }}
                  {...props}
                >
                  {children}
                </tr>
              )
            },
          }}
        >
          {item.data.html || ""}
        </ReactMarkdown>
      </div>
    )
  }

  // Fallback to legacy format
  let rows = 0
  let cols = 0
  let tableData: string[][] = []

  if (Array.isArray(item.data?.rows)) {
    // Format from markdown parser: rows is an array of arrays
    tableData = item.data.rows
    rows = tableData.length
    cols = tableData.length > 0 ? tableData[0].length : 0
  } else if (typeof item.data?.rows === "number" && typeof item.data?.cols === "number") {
    // Format from rich content editor: rows and cols are numbers with cells object
    rows = item.data.rows || 0
    cols = item.data.cols || 0
  } else {
    // Invalid table data
    console.warn("[v0] Invalid table data structure:", item.data)
    return null
  }

  if (rows === 0 || cols === 0) {
    return null
  }

  return (
    <div key={item.id} className="overflow-x-auto my-4">
      <table 
        className="explanation-table min-w-full border-collapse"
        style={{
          border: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
        }}
      >
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, colIdx) => {
              const cellKey = `0-${colIdx}`
              let cellContent = ""

              if (tableData.length > 0 && Array.isArray(tableData[0])) {
                cellContent = tableData[0][colIdx] || `Header ${colIdx + 1}`
              } else {
                cellContent = item.data.cells?.[cellKey] || `Header ${colIdx + 1}`
              }

              return (
                <th
                  key={`header-${colIdx}`}
                  className="p-3 text-sm font-bold text-foreground text-left"
                  style={{
                    border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                    borderBottom: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                    backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                    padding: "8px 12px",
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
                className="hover:bg-muted/30 transition-colors"
                style={{
                  borderBottom: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                }}
              >
              {Array.from({ length: cols }).map((_, colIdx) => {
                let cellContent = ""

                  if (tableData.length > actualRowIdx && Array.isArray(tableData[actualRowIdx])) {
                    cellContent = tableData[actualRowIdx][colIdx] || `Cell ${actualRowIdx + 1}-${colIdx + 1}`
                } else {
                    const cellKey = `${actualRowIdx}-${colIdx}`
                    cellContent = item.data.cells?.[cellKey] || `Cell ${actualRowIdx + 1}-${colIdx + 1}`
                }

                return (
                  <td
                      key={`${actualRowIdx}-${colIdx}`}
                      className="p-3 text-sm bg-card text-foreground/90 transition-colors"
                      style={{
                        border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                        padding: "8px 12px",
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
      <div key={item.id} className="border border-border/40 rounded-lg p-4 bg-muted/20">
        <p className="text-sm text-muted-foreground italic text-center">
          Per-answer explanations will appear here. Configure them in the Per-Answer Explanations section.
        </p>
      </div>
    )
  }

  return (
    <div key={item.id} className="border-t border-border/40 pt-6 mt-6">
      <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Answer Breakdown</h3>
      <div className="space-y-6">
        {options.map((option) => {
          const isCorrect = option.correct
          const isSelected = selectedAnswer === option.label
          const explanation = perAnswerExplanations[option.label]
          const isContentBlocks = Array.isArray(explanation)
          const hasContent = isContentBlocks 
            ? explanation.length > 0 
            : !!explanation?.trim()

          if (!hasContent) return null

          return (
            <div
              key={option.label}
              className="border-b border-border/40 pb-6 last:border-b-0 last:pb-0"
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-foreground">Option {option.label}:</span>
                  <span className={`text-sm font-semibold ${
                    isCorrect ? "text-green-600" : "text-red-600"
                  }`}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                      You selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/70 mt-1">{option.text}</p>
              </div>

              {/* Explanation Content */}
              <div className="space-y-2">
                {isContentBlocks ? (
                  <div className="text-foreground/90">
                    <RichContentRenderer content={explanation} />
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
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
                          <ul className="list-disc list-inside space-y-1 mb-4 text-foreground/90 ml-4" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside space-y-1 mb-4 text-foreground/90 ml-4" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-foreground/90" {...props} />
                        ),
                      }}
                    >
                      {explanation}
                    </ReactMarkdown>
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

function renderImages(item: ContentItem) {
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
            <div key={idx} className="max-w-[450px] aspect-square rounded-lg overflow-hidden border border-border bg-muted mx-auto">
              {imageUrl ? (
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={`Explanation image ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(imageUrl, '_blank')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                    target.onerror = null // Prevent infinite loop
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-muted/50">
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
