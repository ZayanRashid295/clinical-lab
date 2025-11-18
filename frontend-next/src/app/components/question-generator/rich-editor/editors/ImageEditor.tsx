"use client"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { BlockData } from "../types"

interface ImageEditorProps {
  data: BlockData
  onChange: (data: BlockData) => void
  blockId: string
}

export default function ImageEditor({ data, onChange, blockId }: ImageEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const questionsService = new QuestionsService()

  const images = data.images || []
  const count = data.count || 2

  const handleFileUpload = async (file: File, index: number) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    setUploadingIndex(index)
    setUploadError(null)

    try {
      const result = await questionsService.uploadImage(file)
      const newImages = [...images]
      newImages[index] = { url: result.url, alt: `Image ${index + 1}`, id: `img-${Date.now()}` }
      onChange({ ...data, images: newImages })
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload image")
    } finally {
      setUploadingIndex(null)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages[index] = { url: "", alt: "", id: "" }
    onChange({ ...data, images: newImages })
  }

  const updateImageAlt = (index: number, alt: string) => {
    const newImages = [...images]
    if (newImages[index]) {
      newImages[index] = { ...newImages[index], alt }
    } else {
      newImages[index] = { url: "", alt, id: "" }
    }
    onChange({ ...data, images: newImages })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Images ({count})</label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...data, count: Math.max(1, count - 1) })}
            className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
          >
            - Remove
          </button>
          <button
            onClick={() => onChange({ ...data, count: Math.min(4, count + 1) })}
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
          gridTemplateColumns: `repeat(${Math.min(count, 4)}, minmax(0, 150px))`,
        }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="space-y-2 max-w-[150px] mx-auto">
            <label className="block text-xs font-medium text-muted-foreground">Image {idx + 1}</label>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                id={`image-upload-${blockId}-${idx}`}
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
                htmlFor={`image-upload-${blockId}-${idx}`}
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

            {images[idx]?.url && (
              <div className="relative aspect-square rounded-lg border border-border bg-muted overflow-hidden group max-w-[150px]">
                <img
                  src={images[idx].url}
                  alt={images[idx].alt || `Image ${idx + 1}`}
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

            {images[idx]?.url && (
              <input
                type="text"
                placeholder="Alt text (optional)"
                value={images[idx].alt || ""}
                onChange={(e) => updateImageAlt(idx, e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-border bg-card text-foreground"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}










