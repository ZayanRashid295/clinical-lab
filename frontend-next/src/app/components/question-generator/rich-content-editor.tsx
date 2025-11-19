"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { QuestionsService } from "@/app/services/questions/questions.service"
import AdvancedTableEditor from "./advanced-table-editor"
import RichMarkdownEditor from "./rich-markdown-editor"

interface RichContentEditorProps {
  item: {
    id: number | string
    type: "text" | "table" | "images" | "image" | "per-answer-explanation"
    data: any
  }
  onUpdate: (data: any) => void
}

export default function RichContentEditor({ item, onUpdate }: RichContentEditorProps) {
  if (item.type === "text") {
    // Use HTML if available, otherwise empty string
    const initialContent = item.data?.html || ""

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

    return (
      <AdvancedTableEditor
        initialContent={initialContent}
        initialFormat={initialFormat}
        onChange={({ html }) =>
          onUpdate({
            ...item.data,
            html,
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

function getInitialTableContent(data: any): { initialContent?: string; initialFormat: "html" } {
  if (data?.html) {
    return { initialContent: data.html, initialFormat: "html" }
  }

  // If we have rows/cols but no content, return undefined to let AdvancedTableEditor create default table
  if (data?.rows && data?.cols && (!data?.cells || Object.keys(data.cells || {}).length === 0)) {
    return { initialContent: undefined, initialFormat: "html" }
  }

  const legacyHtml = legacyCellsToHtml(data)
  // If legacy conversion returns empty, return undefined to create default table
  if (!legacyHtml || legacyHtml.trim() === "") {
    return { initialContent: undefined, initialFormat: "html" }
  }
  
  return { initialContent: legacyHtml, initialFormat: "html" }
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

















