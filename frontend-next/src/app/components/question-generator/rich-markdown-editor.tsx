"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import TextAlign from "@tiptap/extension-text-align"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"

import { cn } from "@/shared/utils/cn"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

interface RichMarkdownEditorProps {
  initialContent?: string
  onChange?: (html: string) => void
  className?: string
  showEditorContent?: boolean // If false, only show toolbar
  onAddBlock?: (type: 'text' | 'table' | 'image' | 'internal-link' | 'external-link' | 'per-answer-explanation') => void
  disabled?: boolean
  perAnswerExplanationCount?: number
  isMainExplanation?: boolean
}

export default function RichMarkdownEditor({
  initialContent,
  onChange,
  className,
  showEditorContent = true,
  onAddBlock,
  disabled = false,
  perAnswerExplanationCount = 0,
  isMainExplanation = false,
}: RichMarkdownEditorProps) {
  const [isReady, setIsReady] = useState(false)
  const lastContentRef = useRef<string | undefined>(undefined)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        paragraph: {
          HTMLAttributes: {
            class: 'prose-p',
          },
        },
      }),
      Strike,
      Underline.configure({
        HTMLAttributes: {
          class: 'underline-text',
        },
      }),
      Link.configure({ 
        openOnClick: false, 
        autolink: true,
        HTMLAttributes: {
          class: 'prose-a',
        },
      }),
      Image.configure({ 
        inline: true,
        HTMLAttributes: {
          class: 'prose-img',
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: initialContent || "",
    autofocus: false,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    onCreate: () => {
      setIsReady(true)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Ensure space bar works properly
          if (event.key === ' ') {
            return false // Let TipTap handle it normally
          }
          return false
        },
      },
    },
  })

  // Update content when initialContent changes (for loading existing content)
  useEffect(() => {
    if (!editor || !isReady) return

    const currentHtml = editor.getHTML()
    const normalizedCurrent = currentHtml.trim() || ""
    const normalizedInitial = (initialContent || "").trim()

    // Only update if content actually changed
    if (normalizedCurrent !== normalizedInitial && normalizedInitial !== lastContentRef.current) {
      // Use setContent with emitUpdate: false to prevent infinite loops
      // TipTap will parse the HTML and render it properly
      try {
        // TipTap's setContent accepts HTML string and will parse it
        // It handles <strong>, <em>, <p>, <h1>, <h2>, <h3>, etc. automatically
        // Debug: log if content contains headings
        if (process.env.NODE_ENV === 'development' && normalizedInitial && (normalizedInitial.includes('<h1>') || normalizedInitial.includes('<h2>') || normalizedInitial.includes('<h3>'))) {
          console.log('Setting content with headings in TipTap:', normalizedInitial)
        }
        
        editor.commands.setContent(normalizedInitial || "<p></p>", { emitUpdate: false })
        lastContentRef.current = normalizedInitial
        
        // Verify headings were parsed correctly
        if (process.env.NODE_ENV === 'development') {
          const editorHtml = editor.getHTML()
          if (normalizedInitial.includes('<h1>') || normalizedInitial.includes('<h2>') || normalizedInitial.includes('<h3>')) {
            console.log('TipTap editor HTML after setting:', editorHtml)
            // Check if headings are present in editor
            const hasHeadings = editorHtml.includes('<h1>') || editorHtml.includes('<h2>') || editorHtml.includes('<h3>')
            if (!hasHeadings) {
              console.warn('Warning: Headings were in input but not found in TipTap editor output')
            }
          }
        }
      } catch (error) {
        console.error("Error setting content in TipTap editor:", error, "Content:", normalizedInitial)
        // Fallback: try with just the text content
        try {
          const textContent = normalizedInitial.replace(/<[^>]*>/g, '')
          editor.commands.setContent(`<p>${textContent}</p>`, { emitUpdate: false })
          lastContentRef.current = normalizedInitial
        } catch (fallbackError) {
          console.error("Error in fallback content setting:", fallbackError)
        }
      }
    }
  }, [editor, initialContent, isReady])

  const runEditorCommand = useCallback(
    (run: () => boolean) => {
      if (!editor) return
      editor.commands.focus()
      run()
    },
    [editor],
  )

  const renderToolbar = useCallback(() => {
    if (!editor || !editor.isEditable) return null

    const hasTextStyle = editor.extensionManager.extensions.some((ext: any) => ext.name === 'textStyle')
    const hasColor = editor.extensionManager.extensions.some((ext: any) => ext.name === 'color')

    return (
      <div className="flex flex-wrap items-center gap-2 border border-border bg-muted/40 rounded-md p-2">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <ToolbarButton
              tooltip="Bold"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleBold().run())}
              active={editor.isActive("bold")}
              icon={<span className="font-semibold">B</span>}
            />
            <ToolbarButton
              tooltip="Italic"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleItalic().run())}
              active={editor.isActive("italic")}
              icon={<span className="italic">I</span>}
            />
            <ToolbarButton
              tooltip="Underline"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleUnderline().run())}
              active={editor.isActive("underline")}
              icon={<span style={{ textDecoration: 'underline' }}>U</span>}
            />
            <ToolbarButton
              tooltip="Strikethrough"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleStrike().run())}
              active={editor.isActive("strike")}
              icon={<span className="line-through">S</span>}
            />
            <ToolbarButton
              tooltip="Inline code"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleCode().run())}
              active={editor.isActive("code")}
              icon="{ }"
            />
          </div>

          {hasTextStyle && hasColor && (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <input
                      type="color"
                      onChange={(e) => {
                        try {
                          runEditorCommand(() => editor.chain().focus().setColor(e.target.value).run())
                        } catch (err) {
                          console.warn("Color extension not available:", err)
                        }
                      }}
                      value={(() => {
                        try {
                          const attrs = editor.getAttributes("textStyle")
                          return attrs?.color || "#000000"
                        } catch {
                          return "#000000"
                        }
                      })()}
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                      title="Text Color"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Text Color</TooltipContent>
              </Tooltip>
              <ToolbarButton
                tooltip="Remove color"
                onClick={() => {
                  try {
                    runEditorCommand(() => editor.chain().focus().unsetColor().run())
                  } catch (e) {
                    try {
                      runEditorCommand(() => editor.chain().focus().setColor("#000000").run())
                    } catch (err) {
                      console.warn("Color extension not available:", err)
                    }
                  }
                }}
                icon="×"
              />
            </div>
          )}

          <div className="flex items-center gap-1 border-l border-border pl-2">
            {[1, 2, 3].map((level) => (
              <ToolbarButton
                key={level}
                tooltip={`Heading ${level}`}
                onClick={() => runEditorCommand(() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run())}
                active={editor.isActive("heading", { level: level as 1 | 2 | 3 })}
                icon={`H${level}`}
              />
            ))}
            <ToolbarButton
              tooltip="Paragraph"
              onClick={() => runEditorCommand(() => editor.chain().focus().setParagraph().run())}
              active={editor.isActive("paragraph")}
              icon="¶"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <ToolbarButton
              tooltip="Bulleted list"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleBulletList().run())}
              active={editor.isActive("bulletList")}
              icon="• •"
            />
            <ToolbarButton
              tooltip="Numbered list"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleOrderedList().run())}
              active={editor.isActive("orderedList")}
              icon="1."
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <ToolbarButton
              tooltip="Align left"
              onClick={() => runEditorCommand(() => editor.chain().focus().setTextAlign("left").run())}
              active={editor.isActive({ textAlign: "left" })}
              icon="⟸"
            />
            <ToolbarButton
              tooltip="Align center"
              onClick={() => runEditorCommand(() => editor.chain().focus().setTextAlign("center").run())}
              active={editor.isActive({ textAlign: "center" })}
              icon="⇔"
            />
            <ToolbarButton
              tooltip="Align right"
              onClick={() => runEditorCommand(() => editor.chain().focus().setTextAlign("right").run())}
              active={editor.isActive({ textAlign: "right" })}
              icon="⟹"
            />
          </div>

          {/* Block Addition Buttons - Integrated into toolbar */}
          {onAddBlock && (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Button
                onClick={() => onAddBlock('text')}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="bg-card hover:bg-muted/50 border-border/50 text-foreground h-8 px-2"
              >
                <span className="mr-1">📝</span>
                <span>+ Text</span>
              </Button>
              <Button
                onClick={() => onAddBlock('table')}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="bg-card hover:bg-muted/50 border-border/50 text-foreground h-8 px-2"
              >
                <span className="mr-1">📊</span>
                <span>+ Table</span>
              </Button>
              <Button
                onClick={() => onAddBlock('image')}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="bg-card hover:bg-muted/50 border-border/50 text-foreground h-8 px-2"
              >
                <span className="mr-1">🖼️</span>
                <span>+ Image</span>
              </Button>
              <Button
                onClick={() => onAddBlock('internal-link')}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="bg-card hover:bg-muted/50 border-border/50 text-foreground h-8 px-2"
              >
                <span className="mr-1">🔗</span>
                <span>+ Internal Link</span>
              </Button>
              <Button
                onClick={() => onAddBlock('external-link')}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="bg-card hover:bg-muted/50 border-border/50 text-foreground h-8 px-2"
              >
                <span className="mr-1">🌐</span>
                <span>+ External Link</span>
              </Button>
              {isMainExplanation && perAnswerExplanationCount === 0 && (
                <Button
                  onClick={() => onAddBlock('per-answer-explanation')}
                  disabled={disabled}
                  variant="outline"
                  size="sm"
                  className="bg-card hover:bg-muted/50 border-border/50 text-foreground h-8 px-2"
                >
                  <span className="mr-1">💬</span>
                  <span>+ Per-Answer Explanation</span>
                </Button>
              )}
            </div>
          )}

        </TooltipProvider>
      </div>
    )
  }, [editor, runEditorCommand, onAddBlock, disabled, perAnswerExplanationCount, isMainExplanation])

  if (!editor) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="border border-border rounded-md p-4">
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        {renderToolbar()}
        {showEditorContent && (
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <EditorContent 
            editor={editor} 
            className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus-within:ring-2 focus-within:ring-primary/50" 
          />
        </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .ProseMirror {
          min-height: 200px;
          padding: 16px;
          outline: none;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror p:first-child {
          margin-top: 0;
        }
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror u,
        .ProseMirror .underline-text {
          text-decoration: underline !important;
          font-style: normal !important;
        }
        .ProseMirror em,
        .ProseMirror i {
          font-style: italic !important;
          text-decoration: none !important;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
      `
      }} />
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  tooltip: string
  icon: React.ReactNode
  active?: boolean
}

function ToolbarButton({ onClick, tooltip, icon, active }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="sm"
          onClick={onClick}
          className="h-8 px-2"
          type="button"
        >
          <span className="text-xs font-semibold">{icon}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
