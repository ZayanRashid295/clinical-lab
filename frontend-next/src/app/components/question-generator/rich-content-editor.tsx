"use client"

interface RichContentEditorProps {
  item: {
    id: number
    type: "text" | "table" | "images"
    data: any
  }
  onUpdate: (data: any) => void
}

import AdvancedTableEditor from "./advanced-table-editor"

export default function RichContentEditor({ item, onUpdate }: RichContentEditorProps) {
  if (item.type === "text") {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Markdown Content</label>
        <textarea
          value={item.data.markdown}
          onChange={(e) => onUpdate({ ...item.data, markdown: e.target.value })}
          placeholder="Enter markdown content (supports **bold**, *italic*, [links](url), # Headings, - Lists, etc.)"
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm resize-none"
          rows={8}
        />
        <div className="text-xs text-muted-foreground">
          Preview: Your markdown content will be rendered with formatting in the student view
        </div>
      </div>
    )
  }

  if (item.type === "table") {
    const { initialContent, initialFormat } = getInitialTableContent(item.data)

    return (
      <AdvancedTableEditor
        initialContent={initialContent}
        initialFormat={initialFormat}
        onChange={({ html, markdown }) =>
          onUpdate({
            ...item.data,
            html,
            markdown,
          })
        }
      />
    )
  }

  if (item.type === "images") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Images ({item.data.count})</label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ ...item.data, count: Math.max(1, item.data.count - 1) })}
              className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
            >
              - Remove
            </button>
            <button
              onClick={() => onUpdate({ ...item.data, count: Math.min(4, item.data.count + 1) })}
              className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        <div
          className="grid gap-4 auto-cols-fr"
          style={{
            gridTemplateColumns: `repeat(${Math.min(item.data.count, 4)}, 1fr)`,
          }}
        >
          {Array.from({ length: item.data.count }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">Image {idx + 1} URL</label>
              <input
                type="text"
                value={item.data.images?.[idx] || ""}
                onChange={(e) => {
                  const newImages = [...(item.data.images || [])]
                  newImages[idx] = e.target.value
                  onUpdate({ ...item.data, images: newImages })
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full px-2 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs"
              />
              {item.data.images?.[idx] && (
                <div className="aspect-square rounded-lg border border-border bg-muted overflow-hidden">
                  <img
                    src={item.data.images[idx] || "/placeholder.svg"}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=200"
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

function getInitialTableContent(data: any): { initialContent?: string; initialFormat: "html" | "markdown" } {
  if (data?.markdown) {
    return { initialContent: data.markdown, initialFormat: "markdown" }
  }

  if (data?.html) {
    return { initialContent: data.html, initialFormat: "html" }
  }

  const legacyHtml = legacyCellsToHtml(data)
  return { initialContent: legacyHtml, initialFormat: "html" }
}

function legacyCellsToHtml(data: any): string {
  const rows = Math.max(1, Number.parseInt(data?.rows) || 0)
  const cols = Math.max(1, Number.parseInt(data?.cols) || 0)

  if (rows === 0 || cols === 0) {
    return ""
  }

  const cells: Record<string, string> = data?.cells || {}

  const escape = (value: string) =>
    value
      ?.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

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
      const value = escape(cells[key] || "")
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
      const value = escape(cells[key] || "")
      html += `<td>${value || "&nbsp;"}</td>`
    }
    html += "</tr>"
  }
  html += "</tbody></table>"
  return html
}
