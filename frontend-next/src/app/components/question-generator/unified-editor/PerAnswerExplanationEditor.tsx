"use client"

import { useEffect, useState, useRef } from "react"
import { ContentBlock } from "../rich-editor/types"
import RichTextEditor from "./RichTextEditor"
import { blocksToHTMLAsync } from "./content-utils"

interface PerAnswerExplanationEditorProps {
  blocks: ContentBlock[]
  onChange: (html: string) => void
  editorRef?: (editor: any) => void
  placeholder?: string
  className?: string
}

/**
 * Component for editing per-answer explanations using RichTextEditor
 * This integrates with the unified toolbar like other sections
 */
export default function PerAnswerExplanationEditor({
  blocks,
  onChange,
  editorRef,
  placeholder,
  className,
}: PerAnswerExplanationEditorProps) {
  const [htmlContent, setHtmlContent] = useState<string>("<p></p>")
  const [isConverting, setIsConverting] = useState(false)
  const editorInstanceRef = useRef<any>(null)
  const lastEmittedHtmlRef = useRef<string>("")
  const isInternalChangeRef = useRef(false)
  const blocksRef = useRef<ContentBlock[]>(blocks)

  // Convert blocks to HTML when blocks change
  useEffect(() => {
    const convertBlocks = async () => {
      // Capture the internal change flag at the start to avoid race conditions
      const isInternal = isInternalChangeRef.current
      if (isInternal) {
        isInternalChangeRef.current = false
        blocksRef.current = blocks
        return
      }

      // Check if blocks actually changed (by comparing references and content)
      const blocksChanged = blocksRef.current !== blocks && 
        JSON.stringify(blocksRef.current) !== JSON.stringify(blocks)
      
      if (!blocksChanged && editorInstanceRef.current) {
        // Blocks haven't actually changed, skip update
        return
      }

      blocksRef.current = blocks
      setIsConverting(true)
      try {
        const html = await blocksToHTMLAsync(blocks)
        const newHtml = html || "<p></p>"
        
        // Normalize HTML for comparison (remove extra whitespace)
        const normalizeHtml = (h: string) => h.replace(/\s+/g, ' ').trim()
        const normalizedNew = normalizeHtml(newHtml)
        const normalizedLastEmitted = normalizeHtml(lastEmittedHtmlRef.current)
        
        // Only update editor if content is different from what we last emitted
        // This means it's an external change (e.g., from the other panel)
        if (editorInstanceRef.current) {
          const currentHtml = editorInstanceRef.current.getHTML()
          const normalizedCurrent = normalizeHtml(currentHtml)
          
          // If the new HTML matches what we last emitted, this is a re-render from our own change
          // Skip updating the editor to avoid interrupting typing
          if (normalizedNew === normalizedLastEmitted && normalizedLastEmitted !== "") {
            // This is a re-render from our own change, just update state but don't touch editor
            setHtmlContent(newHtml)
            setIsConverting(false)
            return
          }
          
          // If the new HTML is different from current editor content, it's an external change
          if (normalizedCurrent !== normalizedNew) {
            setHtmlContent(newHtml)
            // Only update editor if it's not currently focused (user is not typing)
            // This prevents interrupting the user's typing
            const isFocused = editorInstanceRef.current.isFocused
            if (!isFocused) {
              // Use requestAnimationFrame to ensure we don't interrupt typing
              requestAnimationFrame(() => {
                if (editorInstanceRef.current && !editorInstanceRef.current.isFocused) {
                  const editorHtml = editorInstanceRef.current.getHTML()
                  const normalizedEditor = normalizeHtml(editorHtml)
                  // Double-check the editor hasn't changed since we scheduled this update
                  if (normalizedEditor !== normalizedNew) {
                    editorInstanceRef.current.commands.setContent(newHtml, false)
                  }
                }
              })
            }
            // If editor is focused, we'll update it later when it loses focus
          } else {
            // Content matches, just update state
            setHtmlContent(newHtml)
          }
        } else {
          // Editor not ready yet, just update state
          setHtmlContent(newHtml)
        }
      } catch (error) {
        console.error("Error converting blocks to HTML:", error)
        setHtmlContent("<p></p>")
      } finally {
        setIsConverting(false)
      }
    }

    convertBlocks()
  }, [blocks])

  const handleChange = (html: string) => {
    // Mark this as an internal change to prevent the useEffect from resetting the editor
    isInternalChangeRef.current = true
    lastEmittedHtmlRef.current = html
    setHtmlContent(html)
    onChange(html)
  }

  const handleEditorRef = (editor: any) => {
    editorInstanceRef.current = editor
    if (editorRef) {
      editorRef(editor)
    }
    // Ensure editor is properly set up with focus handlers
    if (editor) {
      editor.on("focus", () => {
        // Notify parent that this editor is now active
        if (editorRef) {
          editorRef(editor)
        }
      })
    }
  }

  if (isConverting) {
    return (
      <div className={className}>
        <div className="min-h-[80px] border rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={className}
      onClick={(e) => {
        // Focus the editor when the container is clicked
        if (editorInstanceRef.current) {
          editorInstanceRef.current.commands.focus()
          if (editorRef) {
            editorRef(editorInstanceRef.current)
          }
        }
      }}
    >
      <RichTextEditor
        content={htmlContent}
        onChange={handleChange}
        editorRef={handleEditorRef}
        placeholder={placeholder || "Enter explanation..."}
        className="min-h-[80px]"
      />
    </div>
  )
}


