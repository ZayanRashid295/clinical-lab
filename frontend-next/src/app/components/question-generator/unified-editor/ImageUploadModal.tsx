"use client"

import { useState, useCallback } from "react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Loader2, Upload, X } from "lucide-react"

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

export default function ImageUploadModal({ isOpen, onClose, onUpload }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    } else {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }, [])

  const handleUploadClick = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an image file.")
      return
    }
    setUploading(true)
    setError(null)
    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      setPreviewUrl(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to upload image.")
    } finally {
      setUploading(false)
    }
  }, [selectedFile, onUpload, onClose, previewUrl])

  const handleClose = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setUploading(false)
    setError(null)
    onClose()
  }, [onClose, previewUrl])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Image File</Label>
            <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {previewUrl && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <img src={previewUrl} alt="Image Preview" className="max-w-full h-auto rounded-md border" />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUploadClick} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}






