"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Link from "@tiptap/extension-link"
import Highlight from "@tiptap/extension-highlight"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Color from "@tiptap/extension-color"
import TextStyle from "@tiptap/extension-text-style"
import { Button } from "@/shared/ui/button"

interface TiptapEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
}

export default function TiptapEditor({ value, onChange, placeholder, readOnly = false }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
      }),
      Highlight,
      Subscript,
      Superscript,
      Color,
      TextStyle,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: !readOnly,
  })

  if (!editor) return null

  const isLightMode = typeof window !== "undefined" && !document.documentElement.classList.contains("dark")

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card dark:bg-card">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-3 border-b border-border bg-muted/50 dark:bg-muted/30">
          <div className="flex gap-1 items-center">
            <Button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 h-8 w-8 transition-colors ${
                editor.isActive("bold")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Bold"
            >
              B
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 h-8 w-8 italic transition-colors ${
                editor.isActive("italic")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Italic"
            >
              I
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 h-8 w-8 underline transition-colors ${
                editor.isActive("underline")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Underline"
            >
              U
            </Button>
          </div>

          <div className="flex gap-1 items-center">
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 h-8 px-3 text-sm transition-colors ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Heading 1"
            >
              H1
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 h-8 px-3 text-sm transition-colors ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Heading 2"
            >
              H2
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 h-8 px-3 text-sm transition-colors ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Heading 3"
            >
              H3
            </Button>
          </div>

          <div className="flex gap-1 items-center">
            <Button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 h-8 px-3 text-sm transition-colors ${
                editor.isActive("bulletList")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Bullet List"
            >
              •
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 h-8 px-3 text-sm transition-colors ${
                editor.isActive("orderedList")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Ordered List"
            >
              1.
            </Button>
          </div>

          <div className="flex gap-1 items-center">
            <Button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="p-2 h-8 px-3 text-sm bg-muted hover:bg-muted/80 text-foreground transition-colors"
              title="Insert Table"
            >
              Table
            </Button>
          </div>

          <div className="flex gap-1 items-center ml-auto">
            <Button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-2 h-8 px-3 text-sm transition-colors ${
                editor.isActive("highlight") ? "bg-yellow-500 text-white" : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
              title="Highlight"
            >
              Hl
            </Button>
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes("textStyle").color || "#000000"}
              className="w-8 h-8 rounded cursor-pointer border border-border"
              title="Text Color"
            />
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-4 text-foreground bg-card dark:bg-card/50"
      />
    </div>
  )
}
