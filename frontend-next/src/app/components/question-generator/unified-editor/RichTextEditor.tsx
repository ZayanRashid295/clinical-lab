"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import { Table } from "@tiptap/extension-table"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TextAlign from "@tiptap/extension-text-align"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { FontSize } from "./FontSizeExtension"
import { FontFamily } from "./FontFamilyExtension"
import { useEffect, useRef } from "react"
import { cn } from "@/shared/utils/cn"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  editorRef?: (editor: any) => void
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Click to edit...",
  className,
  editable = true,
  editorRef,
}: RichTextEditorProps) {
  const isUpdatingRef = useRef(false)
  const isTypingRef = useRef(false)
  const onChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-muted p-4 rounded-lg font-mono text-sm",
          },
        },
        horizontalRule: true,
        strike: false,
        underline: false,
        link: false,
      }),
      Strike,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "tableHeader", "tableCell"],
      }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontSize,
      FontFamily,
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true, // Allow cell selection for merging
        HTMLAttributes: {
          class: "border-collapse border border-border my-4",
          style: "border: 2px solid #000000; width: 100%;",
        },
      }),
      TableRow,
      TableCell.extend({
        content: 'paragraph+',
        addAttributes() {
          const parentAttrs = (this as any).parent?.() || {}
          return {
            ...parentAttrs,
            textAlign: {
              default: "left",
              parseHTML: (element: HTMLElement) => element.style.textAlign || element.getAttribute("data-text-align") || "left",
              renderHTML: (attributes: Record<string, any>) => {
                const styles: string[] = [`text-align: ${attributes.textAlign}`]
                return {
                  "data-text-align": attributes.textAlign,
                  style: styles.join("; "),
                }
              },
            },
            backgroundColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.backgroundColor || element.getAttribute("data-background-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.backgroundColor) {
                  return {}
                }
                return {
                  "data-background-color": attributes.backgroundColor,
                  style: `background-color: ${attributes.backgroundColor}`,
                }
              },
            },
            borderColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.borderColor || element.getAttribute("data-border-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.borderColor) {
                  return {}
                }
                return {
                  "data-border-color": attributes.borderColor,
                  style: `border-color: ${attributes.borderColor}`,
                }
              },
            },
          }
        },
        parseHTML() {
          return [{ tag: 'td' }]
        },
        renderHTML({ HTMLAttributes }) {
          return ['td', HTMLAttributes, 0]
        },
      }),
      // Use extended TableHeader instead of base one to avoid duplicate extension warning
      TableHeader.extend({
        content: 'paragraph+',
        addAttributes() {
          const parentAttrs = (this as any).parent?.() || {}
          return {
            ...parentAttrs,
            textAlign: {
              default: "left",
              parseHTML: (element: HTMLElement) => element.style.textAlign || element.getAttribute("data-text-align") || "left",
              renderHTML: (attributes: Record<string, any>) => {
                const styles: string[] = [`text-align: ${attributes.textAlign}`]
                return {
                  "data-text-align": attributes.textAlign,
                  style: styles.join("; "),
                }
              },
            },
            backgroundColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.backgroundColor || element.getAttribute("data-background-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.backgroundColor) {
                  return {}
                }
                return {
                  "data-background-color": attributes.backgroundColor,
                  style: `background-color: ${attributes.backgroundColor}`,
                }
              },
            },
            borderColor: {
              default: null,
              parseHTML: (element: HTMLElement) => element.style.borderColor || element.getAttribute("data-border-color"),
              renderHTML: (attributes: Record<string, any>) => {
                if (!attributes.borderColor) {
                  return {}
                }
                return {
                  "data-border-color": attributes.borderColor,
                  style: `border-color: ${attributes.borderColor}`,
                }
              },
            },
          }
        },
        parseHTML() {
          return [{ tag: 'th' }]
        },
        renderHTML({ HTMLAttributes }) {
          return ['th', HTMLAttributes, 0]
        },
      }),
    ],
    content: content || "<p></p>",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return
      isTypingRef.current = true
      
      // Debounce onChange to prevent excessive re-renders and cursor loss
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current)
      }
      
      onChangeTimeoutRef.current = setTimeout(() => {
      const html = editor.getHTML()
      onChange(html)
        isTypingRef.current = false
      }, 300) // 300ms debounce
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px]",
          className
        ),
      },
    },
  })

  // Expose editor instance via ref
  useEffect(() => {
    if (editor && editorRef) {
      editorRef(editor)
    }
    return () => {
      // Cleanup: remove editor ref when component unmounts
      if (editorRef) {
        editorRef(null)
      }
    }
  }, [editor, editorRef])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current)
      }
    }
  }, [])

  // Update editor content when prop changes
  useEffect(() => {
    // Don't update if user is actively typing
    if (isTypingRef.current) return
    
    if (editor && content !== editor.getHTML()) {
      isUpdatingRef.current = true
      // Set content - TipTap will parse the HTML and preserve all inline styles
      // The false parameter means "don't emit update events" to prevent loops
      editor.commands.setContent(content || "<p></p>", { emitUpdate: false })
      
      // Debug: Log when content with formatting is loaded
      if (process.env.NODE_ENV === "development" && content && (content.includes('style=') || content.includes('font-size') || content.includes('font-family'))) {
        console.log("RichTextEditor: Loading content with formatting:", content.substring(0, 300))
        console.log("RichTextEditor: Editor HTML after setContent:", editor.getHTML().substring(0, 300))
      }
      
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 100)
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div className={cn("min-h-[100px] border rounded-lg border-border dark:border-gray-700 bg-card dark:bg-gray-800", className)}>
        <p className="text-muted-foreground dark:text-gray-400">{placeholder}</p>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Paragraph hover */
          .ProseMirror p:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          /* Heading hover */
          .ProseMirror h1:hover,
          .ProseMirror h2:hover,
          .ProseMirror h3:hover,
          .ProseMirror h4:hover,
          .ProseMirror h5:hover,
          .ProseMirror h6:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          /* List hover */
          .ProseMirror ul:hover,
          .ProseMirror ol:hover {
            background-color: hsl(var(--muted) / 0.2);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }
          .ProseMirror li:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          /* Link hover */
          .ProseMirror a:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Image hover */
          .ProseMirror img:hover {
            opacity: 0.9;
            transform: scale(1.02);
            transition: opacity 0.2s ease, transform 0.2s ease;
            box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
          }

          /* Code block hover */
          .ProseMirror pre:hover,
          .ProseMirror code:hover {
            background-color: hsl(var(--muted) / 0.5);
            transition: background-color 0.2s ease;
          }

          /* Blockquote hover */
          .ProseMirror blockquote:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-left-color: hsl(var(--primary));
            transition: background-color 0.2s ease, border-left-color 0.2s ease;
          }

          /* Horizontal rule hover */
          .ProseMirror hr:hover {
            border-color: hsl(var(--primary));
            transition: border-color 0.2s ease;
          }

          /* Table styles */
          .ProseMirror table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 2px solid #000000 !important;
            margin: 16px 0;
            background-color: hsl(var(--background));
            transition: box-shadow 0.2s ease;
            display: table !important;
          }
          .ProseMirror table:hover {
            box-shadow: 0 2px 8px hsl(var(--foreground) / 0.1);
          }
          .ProseMirror table tr {
            border: 1px solid #000000 !important;
          }
          .ProseMirror table th,
          .ProseMirror table td {
            border: 1px solid #000000 !important;
            border-top: 1px solid #000000 !important;
            border-left: 1px solid #000000 !important;
            border-right: 1px solid #000000 !important;
            border-bottom: 1px solid #000000 !important;
            padding: 8px 12px !important;
            vertical-align: top;
            min-width: 100px !important;
            min-height: 40px !important;
            position: relative;
            cursor: cell;
            background-color: hsl(var(--background));
            display: table-cell !important;
            transition: background-color 0.2s ease;
          }
          .ProseMirror table th {
            border-bottom: 2px solid #000000 !important;
            background-color: hsl(var(--muted)) !important;
            font-weight: 600;
          }
          .ProseMirror table th p,
          .ProseMirror table td p {
            margin: 0;
            min-height: 1.5em;
          }
          /* Ensure empty cells are visible */
          .ProseMirror table th:empty,
          .ProseMirror table td:empty {
            min-height: 40px;
          }
          .ProseMirror table th:empty::before,
          .ProseMirror table td:empty::before {
            content: '\\u00A0';
            display: inline-block;
            width: 1px;
            color: transparent;
          }
          .ProseMirror table th p:empty::before,
          .ProseMirror table td p:empty::before {
            content: '\\u00A0';
            display: inline-block;
            min-height: 1.5em;
            width: 1px;
            color: transparent;
          }
          .ProseMirror table th:focus,
          .ProseMirror table td:focus {
            outline: 2px solid hsl(var(--primary));
            outline-offset: -2px;
            background-color: hsl(var(--muted) / 0.3) !important;
          }
          .ProseMirror table th:hover,
          .ProseMirror table td:hover {
            background-color: hsl(var(--muted) / 0.5);
          }
          .ProseMirror .column-resize-handle {
            position: absolute;
            right: -2px;
            top: 0;
            bottom: 0;
            width: 4px;
            background: hsl(var(--primary));
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          .ProseMirror .column-resize-handle:hover,
          .ProseMirror .column-resize-handle:active,
          .ProseMirror th:hover .column-resize-handle,
          .ProseMirror td:hover .column-resize-handle {
            opacity: 0.6;
          }

          /* Strong/Bold hover */
          .ProseMirror strong:hover,
          .ProseMirror b:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Emphasis/Italic hover */
          .ProseMirror em:hover,
          .ProseMirror i:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Underline hover */
          .ProseMirror u:hover {
            background-color: hsl(var(--primary) / 0.1);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Strikethrough hover */
          .ProseMirror s:hover,
          .ProseMirror del:hover {
            background-color: hsl(var(--muted) / 0.3);
            border-radius: 2px;
            transition: background-color 0.2s ease;
          }

          /* Highlight hover */
          .ProseMirror mark:hover {
            background-color: hsl(var(--highlight) / 0.8);
            transition: background-color 0.2s ease;
          }
        `
      }} />
      <div
        className={cn(
          "border rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 border-border dark:border-gray-700 bg-card dark:bg-gray-800 text-foreground dark:text-gray-100",
          !editable && "bg-muted/50 dark:bg-gray-800/50"
        )}
        onClick={(e) => {
          if (editable) {
            e.stopPropagation()
            editor.commands.focus()
            // Notify parent that this editor is now active
            if (editorRef) {
              editorRef(editor)
            }
          }
        }}
        onFocus={(e) => {
          if (editable && editorRef) {
            editorRef(editor)
          }
        }}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-sm dark:prose-invert max-w-none 
            [&_p]:text-foreground dark:[&_p]:text-gray-100 
            [&_h1]:text-foreground dark:[&_h1]:text-gray-100 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4
            [&_h2]:text-foreground dark:[&_h2]:text-gray-100 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3
            [&_h3]:text-foreground dark:[&_h3]:text-gray-100 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
            [&_h4]:text-foreground dark:[&_h4]:text-gray-100 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:mt-3 [&_h4]:mb-2
            [&_h5]:text-foreground dark:[&_h5]:text-gray-100 [&_h5]:text-base [&_h5]:font-bold [&_h5]:mt-2 [&_h5]:mb-1
            [&_h6]:text-foreground dark:[&_h6]:text-gray-100 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mt-2 [&_h6]:mb-1
            [&_ul]:text-foreground dark:[&_ul]:text-gray-100 
            [&_ol]:text-foreground dark:[&_ol]:text-gray-100 
            [&_li]:text-foreground dark:[&_li]:text-gray-100"
        />
      </div>
    </>
  )
}

