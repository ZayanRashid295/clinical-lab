"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Link as LinkIcon } from "lucide-react"

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string, text: string) => void
  initialUrl?: string
  initialText?: string
}

export default function LinkModal({
  isOpen,
  onClose,
  onSubmit,
  initialUrl = "",
  initialText = "",
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl)
  const [text, setText] = useState(initialText)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl)
      setText(initialText)
      setError(null)
    }
  }, [isOpen, initialUrl, initialText])

  const handleSubmit = useCallback(() => {
    if (!url.trim()) {
      setError("URL cannot be empty.")
      return
    }
    // Validate URL format
    try {
      new URL(url)
    } catch {
      // If URL doesn't start with http:// or https://, add it
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        setError("URL must start with http:// or https://")
        return
      }
    }
    onSubmit(url, text)
    setUrl("")
    setText("")
    onClose()
  }, [url, text, onSubmit, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background dark:bg-gray-900 border-border dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-gray-100">Insert Link</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-1.5">
            <Label htmlFor="url" className="text-foreground dark:text-gray-100">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-foreground dark:text-gray-100 bg-background dark:bg-gray-800 border-border dark:border-gray-600 placeholder:text-muted-foreground dark:placeholder:text-gray-500"
            />
          </div>
          <div className="grid items-center gap-1.5">
            <Label htmlFor="text" className="text-foreground dark:text-gray-100">Link Text (optional)</Label>
            <Input
              id="text"
              type="text"
              placeholder="Click here"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-foreground dark:text-gray-100 bg-background dark:bg-gray-800 border-border dark:border-gray-600 placeholder:text-muted-foreground dark:placeholder:text-gray-500"
            />
          </div>
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border dark:border-gray-600 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90">
            <LinkIcon className="mr-2 h-4 w-4" />
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}






