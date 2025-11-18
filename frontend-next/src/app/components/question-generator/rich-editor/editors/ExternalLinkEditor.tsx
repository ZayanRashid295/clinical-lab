"use client"

import { useState, useEffect } from "react"
import { BlockData } from "../types"

interface ExternalLinkEditorProps {
  data: BlockData
  onChange: (data: BlockData) => void
}

export default function ExternalLinkEditor({ data, onChange }: ExternalLinkEditorProps) {
  const [url, setUrl] = useState(data.url || "")
  const [linkText, setLinkText] = useState(data.linkText || "")
  const [description, setDescription] = useState(data.description || "")
  const [openInNewTab, setOpenInNewTab] = useState(data.openInNewTab !== false)

  useEffect(() => {
    onChange({
      ...data,
      url,
      linkText,
      description,
      openInNewTab,
    })
  }, [url, linkText, description, openInNewTab])

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  const isValid = url ? validateUrl(url) : true

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          URL <span className="text-destructive">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className={`w-full px-3 py-2 rounded-lg border ${
            isValid ? "border-border" : "border-destructive"
          } bg-card text-foreground`}
        />
        {!isValid && url && (
          <p className="text-xs text-destructive mt-1">Please enter a valid URL</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Link Text</label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder="Click here to visit..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the external resource..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="openInNewTab"
          checked={openInNewTab}
          onChange={(e) => setOpenInNewTab(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="openInNewTab" className="text-sm text-foreground">
          Open in new tab
        </label>
      </div>
    </div>
  )
}










