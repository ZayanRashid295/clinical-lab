"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/shared/ui/card"
import { parseMarkdown } from "./markdown-parser-utils"

interface MarkdownUploaderProps {
  onQuestionParsed: (questionData: any) => void
}

export default function MarkdownUploader({ onQuestionParsed }: MarkdownUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".md")) {
      setError("Please upload a .md (Markdown) file")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const content = await file.text()

      const parsed = parseMarkdown(content)

      const questionData = {
        stem: parsed.stem,
        subject: parsed.subject,
        system: parsed.system,
        options: parsed.options,
        explanation: parsed.mainExplanation, // Now contains content blocks instead of plain text
        perAnswerExplanations: parsed.perAnswerExplanations, // Now contains content blocks for each option
        tags: parsed.tags,
      }

      console.log("[v0] Parsed question data:", questionData)
      console.log("[v0] Explanation blocks:", parsed.mainExplanation)
      console.log("[v0] Per-answer explanations:", parsed.perAnswerExplanations)

      onQuestionParsed(questionData)
      setSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse markdown file"
      setError(errorMessage)
      console.error("[v0] Markdown parsing error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 shadow-lg border-2 border-dashed border-primary/30">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">Upload Markdown Question</h3>
          <p className="text-sm text-muted-foreground">
            Upload a .md file to automatically parse and populate all question fields
          </p>
        </div>

        {/* File Input Area */}
        <div
          className="relative border-2 border-dashed border-border rounded-lg p-8 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
          />

          <div className="text-center">
            <div className="mb-3 text-4xl">📄</div>
            <p className="font-semibold text-foreground mb-1">Drop your markdown file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2">Supported format: .md (Markdown)</p>
          </div>
        </div>

        {/* Status Messages */}
        {isLoading && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 text-sm">
            Parsing markdown file...
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm">
            ✓ Successfully parsed markdown! Question fields have been populated.
          </div>
        )}

        {/* Example */}
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-foreground hover:text-primary transition-colors">
            View Example Markdown Format
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto">
            <pre className="text-xs text-foreground/80 font-mono whitespace-pre-wrap break-words">
              {`# Pathology - Endocrine

### Clinical Case
A 13-year-old girl is brought to the clinic...

**A.** 5 alpha-reductase
**B.** 17 alpha-hydroxylase
**C.** 11 beta-hydroxylase
**D.** 17,20-lyase
**E.** 3 beta-hydroxysteroid dehydrogenase

**Correct Answer:** B

## Explanation

This patient is genetically male (46,XY)...

| Enzyme | Key Feature |
|--------|------------|
| 17α-hydroxylase | ↑ Mineralocorticoid |

### Explanation A
5 alpha-reductase deficiency causes...

### Explanation B
17 alpha-hydroxylase deficiency causes...

### Explanation C
11 beta-hydroxylase deficiency causes...

### Explanation D
17,20-lyase deficiency causes...

### Explanation E
3 beta-HSD deficiency causes...`}
            </pre>
          </div>
        </details>
      </div>
    </Card>
  )
}
