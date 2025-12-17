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
      <DialogContent className="sm:max-w-[425px] bg-background dark:bg-gray-900 border-border dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-gray-100">Upload Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture" className="text-foreground dark:text-gray-100">Image File</Label>
            <Input 
              id="picture" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="text-foreground dark:text-gray-100 bg-background dark:bg-gray-800 border-border dark:border-gray-600 file:text-foreground dark:file:text-gray-100"
            />
          </div>
          {previewUrl && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 text-foreground dark:text-gray-100">Preview:</h4>
              <img src={previewUrl} alt="Image Preview" className="max-w-full h-auto rounded-md border border-border dark:border-gray-600" />
            </div>
          )}
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading} className="border-border dark:border-gray-600 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-800">
            Cancel
          </Button>
          <Button onClick={handleUploadClick} disabled={!selectedFile || uploading} className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90">
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






