"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import RichContentEditor from "./rich-content-editor"
import RichContentRenderer from "./rich-content-renderer"

interface ExplanationEditorProps {
  value?: any[]
  onChange?: (content: any[]) => void
}

export default function ExplanationEditor({ value = [], onChange }: ExplanationEditorProps) {
  const [activeTab, setActiveTab] = useState<"text" | "table" | "images">("text")
  const [content, setContent] = useState<any[]>(value)
  const [previewMode, setPreviewMode] = useState(false)

  // Update content when value prop changes (e.g., when markdown is parsed)
  useEffect(() => {
    if (Array.isArray(value)) {
      setContent(value)
    }
  }, [value])

  useEffect(() => {
    if (onChange) {
      onChange(content)
    }
  }, [content, onChange])

  const addContent = (type: "text" | "table" | "images") => {
    const newItem = {
      id: Date.now(),
      type,
      data:
        type === "table"
          ? { rows: 3, cols: 3, cells: {} }
          : type === "images"
            ? { count: 2, images: [] }
            : { markdown: "" },
    }
    setContent((prevContent) => [...prevContent, newItem])
  }

  const removeContent = (id: number) => {
    setContent((prevContent) => prevContent.filter((item) => item.id !== id))
  }

  const updateContent = (id: number, data: any) => {
    setContent((prevContent) => prevContent.map((item) => (item.id === id ? { ...item, data } : item)))
  }

  const moveContent = (id: number, direction: "up" | "down") => {
    setContent((prevContent) => {
      const index = prevContent.findIndex((item) => item.id === id)
      if ((direction === "up" && index > 0) || (direction === "down" && index < prevContent.length - 1)) {
        const newContent = [...prevContent]
        const newIndex = direction === "up" ? index - 1 : index + 1
        ;[newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]]
        return newContent
      }
      return prevContent
    })
  }

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Explanation Content</h2>
        <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="text-xs">
          {previewMode ? "Edit Mode" : "Preview Mode"}
        </Button>
      </div>

      {previewMode ? (
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-6 border border-border">
            {content.length > 0 ? (
              <RichContentRenderer key={`preview-${content.length}-${content.map(c => c.id).join('-')}`} content={content} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No content to preview</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Content Type Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
            {[
              { type: "text", label: "Text & Markdown", icon: "" },
              { type: "table", label: "Table", icon: "" },
              { type: "images", label: "Images", icon: "" },
            ].map((tab: any) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.type
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Add Content Button */}
          <div className="mb-6">
            <Button onClick={() => addContent(activeTab)} variant="outline" className="w-full">
              + Add {activeTab === "text" ? "Text Block" : activeTab === "table" ? "Table" : "Image Gallery"}
            </Button>
          </div>

          {/* Markdown Syntax Helper */}
          {activeTab === "text" && (
            <div className="mb-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-2">Markdown Syntax Tips:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80">
                <div>
                  **bold** → <strong>bold</strong>
                </div>
                <div>
                  *italic* → <em>italic</em>
                </div>
                <div># H1, ## H2, ### H3 → Headings</div>
                <div>[link](url) → Links</div>
                <div>`code` → Inline code</div>
                <div>- item → Lists</div>
              </div>
            </div>
          )}

          {/* Content List */}
          <div className="space-y-4">
            {content.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                <p className="mb-2">No content added yet</p>
                <p className="text-sm">
                  Add {activeTab === "text" ? "text" : activeTab === "table" ? "a table" : "images"} to get started
                </p>
              </div>
            ) : (
              content.map((item, idx) => (
                <div key={item.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground capitalize">{item.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveContent(item.id, "up")}
                        disabled={idx === 0}
                        className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveContent(item.id, "down")}
                        disabled={idx === content.length - 1}
                        className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeContent(item.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <RichContentEditor item={item} onUpdate={(data) => updateContent(item.id, data)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  )
}
