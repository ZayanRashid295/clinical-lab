"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"

interface ContentItem {
  id: number
  type: "text" | "table" | "images"
  data: any
}

interface RichContentRendererProps {
  content: ContentItem[]
}

export default function RichContentRenderer({ content }: RichContentRendererProps) {
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
          return renderImages(item)
        default:
          return null
      }
    })

  return <div className="space-y-6">{renderedContent}</div>
}

function renderMarkdown(item: ContentItem, isDark: boolean = false) {
  const markdown = item.data?.markdown || ""

  // Sanitize configuration - allow safe HTML tags including tables
  // Using defaultSchema with additional allowed tags
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

  return (
    <div key={item.id} className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          // Custom styling for headings
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold text-foreground mt-8 mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold text-foreground mt-6 mb-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold text-foreground mt-3 mb-2" {...props} />
          ),
          // Custom styling for paragraphs
          p: ({ node, ...props }) => (
            <p className="text-foreground/90 leading-relaxed mb-3" {...props} />
          ),
          // Custom styling for lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 mb-4 text-foreground/90 ml-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-foreground/90 ml-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground/90" {...props} />
          ),
          // Custom styling for links
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Custom styling for code blocks
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground"
                  {...props}
                />
              )
            }
            return (
              <code
                className="block bg-muted p-4 rounded-lg overflow-x-auto border border-border my-4 text-sm font-mono text-foreground"
                {...props}
              />
            )
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto border border-border my-4 text-sm font-mono" {...props} />
          ),
          // Custom styling for blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/30 italic text-foreground/80"
              {...props}
            />
          ),
          // Custom styling for tables (from GFM)
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full border-collapse explanation-table"
                style={{
                  border: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr 
              className="hover:bg-muted/30 transition-colors" 
              style={{
                borderBottom: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
              }}
              {...props} 
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="p-3 text-sm font-bold text-foreground text-left"
              style={{
                border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                borderBottom: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                padding: "8px 12px",
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="p-3 text-sm text-foreground/90 bg-card transition-colors"
              style={{
                border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                padding: "8px 12px",
              }}
              {...props}
            />
          ),
          // Custom styling for images
          img: ({ node, ...props }: any) => (
            <img
              className="rounded-lg border border-border my-4 max-w-full h-auto"
              alt={props.alt || "Image"}
              {...props}
            />
          ),
          // Custom styling for horizontal rules
          hr: ({ node, ...props }) => (
            <hr className="border-t border-border my-6" {...props} />
          ),
          // Custom styling for strong/bold
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          // Custom styling for emphasis/italic
          em: ({ node, ...props }) => (
            <em className="italic text-foreground/90" {...props} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

// Helper function to remove empty rows from HTML table
function removeEmptyTableRows(html: string): string {
  // Remove <tr> elements that contain only empty <td> or <th> elements (with any attributes or whitespace)
  // This regex matches rows where all cells are empty (no text content, only whitespace)
  return html.replace(/<tr[^>]*>[\s\n]*(?:<t[dh][^>]*>[\s\n]*<\/t[dh]>[\s\n]*)+<\/tr>/gi, '')
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

  // If HTML or Markdown is available (from AdvancedTableEditor), render it directly
  if (item.data?.html) {
    // Remove empty rows from HTML before rendering
    const cleanedHtml = removeEmptyTableRows(item.data.html)
    
    // Convert HTML to markdown-like format for ReactMarkdown to render with consistent styling
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
            th: ({ node, ...props }) => (
              <th
                className="p-3 text-sm font-bold text-foreground text-left"
                style={{
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  borderBottom: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                  padding: "8px 12px",
                }}
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="p-3 text-sm bg-card text-foreground/90"
                style={{
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  padding: "8px 12px",
                }}
                {...props}
              />
            ),
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
          {cleanedHtml}
        </ReactMarkdown>
      </div>
    )
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
            th: ({ node, ...props }) => (
              <th
                className="p-3 text-sm font-bold text-foreground text-left"
                style={{
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  borderBottom: isDark ? "2px solid #374151" : "2px solid #e5e7eb",
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                  padding: "8px 12px",
                }}
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="p-3 text-sm bg-card text-foreground/90"
                style={{
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                  padding: "8px 12px",
                }}
                {...props}
              />
            ),
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
          {item.data.markdown}
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

function renderImages(item: ContentItem) {
  const { count } = item.data
  const images = item.data?.images || []

  return (
    <div key={item.id} className="my-4">
      <div
        className="grid gap-4 auto-cols-fr"
        style={{
          gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`,
        }}
      >
        {Array.from({ length: count }).map((_, idx) => {
          const imageUrl = images[idx]
          return (
            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={`Explanation image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
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
