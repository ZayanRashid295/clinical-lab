"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Table } from "@tiptap/extension-table"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import BaseTableCell from "@tiptap/extension-table-cell"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import remarkStringify from "remark-stringify"
import rehypeStringify from "rehype-stringify"
import rehypeParse from "rehype-parse"
import rehypeRemark from "rehype-remark"

import { cn } from "@/shared/utils/cn"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

const CustomTableCell = BaseTableCell.extend({
  content: 'paragraph+',
  addAttributes() {
    return {
      ...this.parent?.(),
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
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Ensure Tab and Enter work correctly in cells
      Tab: () => {
        // Let default Tab behavior work (move to next cell)
        return false
      },
      'Shift-Tab': () => {
        // Let default Shift-Tab behavior work (move to previous cell)
        return false
      },
    }
  },
})

type TableEditorMode = "visual" | "markdown"

interface AdvancedTableEditorProps {
  initialContent?: string
  initialFormat?: "html" | "markdown"
  onChange?: (payload: { html: string; markdown: string }) => void
  className?: string
}

export default function AdvancedTableEditor({
  initialContent,
  initialFormat = "html",
  onChange,
  className,
}: AdvancedTableEditorProps) {
  const [mode, setMode] = useState<TableEditorMode>("visual")
  const [markdownDraft, setMarkdownDraft] = useState("")
  const [importMarkdownText, setImportMarkdownText] = useState("")
  const [importHtmlText, setImportHtmlText] = useState("")
  const [initialized, setInitialized] = useState(false)
  const initialContentRef = useRef<string | undefined>(undefined)

  const colorPalette = useMemo(
    () => ["", "#f97316", "#facc15", "#34d399", "#38bdf8", "#a855f7", "#ef4444", "#94a3b8"],
    [],
  )

  const editor = useEditor({
    extensions: [
      Underline.configure({
        HTMLAttributes: {
          class: 'underline-text',
        },
      }).extend({
        inclusive: false,
      }),
      StarterKit.configure({ 
        bulletList: { keepMarks: true }, 
        orderedList: { keepMarks: true },
      }),
      Strike,
      Link.configure({ openOnClick: false, autolink: true })
        .extend({
          inclusive: false,
        }),
      Image.configure({ inline: true }),
      Table.configure({ 
        resizable: true, 
        lastColumnResizable: true,
        allowTableNodeSelection: false,
      }),
      TableRow,
      TableHeader,
      CustomTableCell,
      TextAlign.configure({ types: ["heading", "paragraph", "tableHeader", "tableCell"] }),
    ],
    content: "<p>Click inside the table to start editing.</p>",
    autofocus: false,
    onUpdate: async ({ editor }) => {
      if (mode === "visual") {
        let html = editor.getHTML()
        // Remove empty rows from HTML before saving
        html = html.replace(/<tr[^>]*>[\s\n]*(?:<t[dh][^>]*>[\s\n]*<\/t[dh]>[\s\n]*)+<\/tr>/gi, '')
        const markdown = await htmlToMarkdown(html)
        onChange?.({ html, markdown })
      }
    },
    immediatelyRender: false,
  })

  const loadInitialContent = useCallback(async () => {
    if (!editor) return

    if (!initialContent && !initialized) {
      editor.commands.setContent(
        `<table>
          <thead>
            <tr>
              <th><p></p></th>
              <th><p></p></th>
              <th><p></p></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><p></p></td>
              <td><p></p></td>
              <td><p></p></td>
            </tr>
          </tbody>
        </table>`,
        true,
      )
      setInitialized(true)
      return
    }

    let desiredHtml = initialContent || ""
    if (initialContent && initialFormat === "markdown") {
      desiredHtml = await markdownToHTML(initialContent)
    }

    // Remove empty rows from HTML before loading
    if (desiredHtml) {
      desiredHtml = desiredHtml.replace(/<tr[^>]*>[\s\n]*(?:<t[dh][^>]*>[\s\n]*<\/t[dh]>[\s\n]*)+<\/tr>/gi, '')
    }

    // Avoid resetting if content matches editor state
    if (initialized) {
      const current = editor.getHTML().trim()
      if (desiredHtml.trim() && current === desiredHtml.trim()) {
        return
      }
    }

    editor.commands.setContent(desiredHtml || "", true)
    initialContentRef.current = initialContent
    setInitialized(true)
  }, [editor, initialContent, initialFormat, initialized])

  useEffect(() => {
    loadInitialContent()
  }, [loadInitialContent])

  const handleModeToggle = useCallback(
    async (nextMode: TableEditorMode) => {
      if (!editor || nextMode === mode) return

      if (nextMode === "markdown") {
        const html = editor.getHTML()
        const markdown = await htmlToMarkdown(html)
        setMarkdownDraft(markdown)
      } else {
        const html = await markdownToHTML(markdownDraft)
        editor.commands.setContent(html, false)
      }

      setMode(nextMode)
    },
    [editor, markdownDraft, mode],
  )

  const applyMarkdownDraft = useCallback(async () => {
    if (!editor) return
    const html = await markdownToHTML(markdownDraft)
    editor.commands.setContent(html, false)
    setMode("visual")
    setInitialized(true)
  }, [editor, markdownDraft])

  const runEditorCommand = useCallback(
    (run: () => boolean) => {
      if (!editor) return
      run()
    },
    [editor],
  )

  const importMarkdown = useCallback(async () => {
    if (!editor || !importMarkdownText.trim()) return
    const html = await markdownToHTML(importMarkdownText)
    editor.commands.setContent(html, false)
    setImportMarkdownText("")
    setMode("visual")
  }, [editor, importMarkdownText])

  const importHtml = useCallback(() => {
    if (!editor || !importHtmlText.trim()) return
    editor.commands.setContent(importHtmlText, false)
    setImportHtmlText("")
    setMode("visual")
  }, [editor, importHtmlText])

  const renderToolbar = useCallback(() => {
    if (!editor) return null

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

          <div className="flex items-center gap-1 border-l border-border pl-2">
            {[1, 2, 3].map((level) => (
              <ToolbarButton
                key={level}
                tooltip={`Heading ${level}`}
                onClick={() => runEditorCommand(() => editor.chain().focus().toggleHeading({ level }).run())}
                active={editor.isActive("heading", { level })}
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
              onClick={() => runEditorCommand(() => editor.chain().focus().setCellAttribute("textAlign", "left").run())}
              active={editor.isActive("tableCell", { textAlign: "left" })}
              icon="⟸"
            />
            <ToolbarButton
              tooltip="Align center"
              onClick={() => runEditorCommand(() => editor.chain().focus().setCellAttribute("textAlign", "center").run())}
              active={editor.isActive("tableCell", { textAlign: "center" })}
              icon="⇔"
            />
            <ToolbarButton
              tooltip="Align right"
              onClick={() => runEditorCommand(() => editor.chain().focus().setCellAttribute("textAlign", "right").run())}
              active={editor.isActive("tableCell", { textAlign: "right" })}
              icon="⟹"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <ToolbarButton
              tooltip="Merge cells"
              onClick={() => runEditorCommand(() => editor.chain().focus().mergeCells().run())}
              icon="Merge"
            />
            <ToolbarButton
              tooltip="Split cell"
              onClick={() => runEditorCommand(() => editor.chain().focus().splitCell().run())}
              icon="Split"
            />
            <ToolbarButton
              tooltip="Toggle header row"
              onClick={() => runEditorCommand(() => editor.chain().focus().toggleHeaderRow().run())}
              icon="Header"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <ToolbarButton
              tooltip="Add row above"
              onClick={() => runEditorCommand(() => editor.chain().focus().addRowBefore().run())}
              icon="Row↑"
            />
            <ToolbarButton
              tooltip="Add row below"
              onClick={() => runEditorCommand(() => editor.chain().focus().addRowAfter().run())}
              icon="Row↓"
            />
            <ToolbarButton
              tooltip="Add column left"
              onClick={() => runEditorCommand(() => editor.chain().focus().addColumnBefore().run())}
              icon="Col←"
            />
            <ToolbarButton
              tooltip="Add column right"
              onClick={() => runEditorCommand(() => editor.chain().focus().addColumnAfter().run())}
              icon="Col→"
            />
            <ToolbarButton
              tooltip="Delete row"
              onClick={() => runEditorCommand(() => editor.chain().focus().deleteRow().run())}
              icon="Del Row"
            />
            <ToolbarButton
              tooltip="Delete column"
              onClick={() => runEditorCommand(() => editor.chain().focus().deleteColumn().run())}
              icon="Del Col"
            />
            <ToolbarButton
              tooltip="Delete table"
              onClick={() => runEditorCommand(() => editor.chain().focus().deleteTable().run())}
              icon="Del Tbl"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            {colorPalette.map((color) => (
              <button
                key={`bg-${color || "none"}`}
                type="button"
                className={cn(
                  "w-6 h-6 rounded-sm border border-border hover:ring-2 hover:ring-primary/40 transition",
                  color ? "" : "relative",
                )}
                style={{ backgroundColor: color || "transparent" }}
                onClick={() =>
                  runEditorCommand(() =>
                    editor.chain().focus().setCellAttribute("backgroundColor", color || null).run(),
                  )
                }
              >
                {!color && <span className="absolute inset-0 flex items-center justify-center text-xs">×</span>}
              </button>
            ))}
            {colorPalette.map((color) => (
              <button
                key={`border-${color || "none"}`}
                type="button"
                className={cn(
                  "w-6 h-6 rounded-sm border border-border hover:ring-2 hover:ring-primary/40 transition",
                  color ? "" : "relative",
                )}
                style={{ borderColor: color || "#e5e7eb", backgroundColor: color ? color : "transparent" }}
                onClick={() =>
                  runEditorCommand(() =>
                    editor.chain().focus().setCellAttribute("borderColor", color || null).run(),
                  )
                }
              >
                {!color && <span className="absolute inset-0 flex items-center justify-center text-xs">×</span>}
              </button>
            ))}
          </div>
        </TooltipProvider>
      </div>
    )
  }, [editor, runEditorCommand, colorPalette])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === "visual" ? "default" : "outline"}
          onClick={() => handleModeToggle("visual")}
        >
          Visual Mode
        </Button>
        <Button
          size="sm"
          variant={mode === "markdown" ? "default" : "outline"}
          onClick={() => handleModeToggle("markdown")}
        >
          Markdown Mode
        </Button>
        {mode === "markdown" && (
          <Button size="sm" variant="secondary" onClick={applyMarkdownDraft}>
            Apply Markdown
          </Button>
        )}
      </div>

      {mode === "visual" ? (
        <div className="space-y-3">
          {renderToolbar()}
          <div className="border border-border rounded-md overflow-hidden">
            <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none" />
          </div>
          <TableImportPanel
            markdownValue={importMarkdownText}
            onMarkdownChange={setImportMarkdownText}
            onMarkdownImport={importMarkdown}
            htmlValue={importHtmlText}
            onHtmlChange={setImportHtmlText}
            onHtmlImport={importHtml}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={markdownDraft}
            onChange={(event) => setMarkdownDraft(event.target.value)}
            className="min-h-[320px] font-mono"
            placeholder="Edit Markdown table content here..."
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Markdown supports GitHub Flavored syntax. Use the toolbar in Visual mode for advanced formatting or merged
              cells.
            </p>
            <Button size="sm" onClick={applyMarkdownDraft}>
              Apply and Switch to Visual
            </Button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .ProseMirror {
          min-height: 320px;
          padding: 16px;
          outline: none;
        }
        .ProseMirror table {
          table-layout: fixed;
          width: 100%;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          border: 2px solid #e5e7eb !important;
          margin: 16px 0;
          background-color: #ffffff;
        }
        .dark .ProseMirror table {
          border: 2px solid #374151 !important;
          background-color: #1f2937;
        }
        .ProseMirror table th,
        .ProseMirror table td {
          border: 1px solid #e5e7eb !important;
          border-top: 1px solid #e5e7eb !important;
          border-left: 1px solid #e5e7eb !important;
          border-right: 1px solid #e5e7eb !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 8px 12px !important;
          vertical-align: top;
          min-width: 50px;
          min-height: 40px !important;
          position: relative;
          cursor: cell;
          background-color: #ffffff;
        }
        .dark .ProseMirror table th,
        .dark .ProseMirror table td {
          border: 1px solid #374151 !important;
          border-top: 1px solid #374151 !important;
          border-left: 1px solid #374151 !important;
          border-right: 1px solid #374151 !important;
          border-bottom: 1px solid #374151 !important;
          background-color: #1f2937;
        }
        /* For merged cells with colspan, remove the left border of the cell immediately after */
        /* This removes the internal border between merged columns */
        .ProseMirror table th[colspan] + th,
        .ProseMirror table td[colspan] + td,
        .ProseMirror table th[colspan] + td,
        .ProseMirror table td[colspan] + th,
        .ProseMirror table th[colspan="2"] + th,
        .ProseMirror table td[colspan="2"] + td,
        .ProseMirror table th[colspan="2"] + td,
        .ProseMirror table td[colspan="2"] + th,
        .ProseMirror table th[colspan="3"] + th,
        .ProseMirror table td[colspan="3"] + td,
        .ProseMirror table th[colspan="3"] + td,
        .ProseMirror table td[colspan="3"] + th,
        .ProseMirror table th[colspan="4"] + th,
        .ProseMirror table td[colspan="4"] + td,
        .ProseMirror table th[colspan="4"] + td,
        .ProseMirror table td[colspan="4"] + th,
        .ProseMirror table th[data-merged="true"][colspan] + th,
        .ProseMirror table td[data-merged="true"][colspan] + td,
        .ProseMirror table th[data-merged="true"][colspan] + td,
        .ProseMirror table td[data-merged="true"][colspan] + th {
          border-left: none !important;
        }
        /* For rowspan, cells below are removed by Tiptap, so no special CSS needed */
        /* The rowspan cell will naturally span multiple rows without internal borders */
        .ProseMirror table th.selectedCell,
        .ProseMirror table td.selectedCell {
          background-color: rgba(59, 130, 246, 0.2) !important;
          border-color: #3b82f6 !important;
        }
        .dark .ProseMirror table th.selectedCell,
        .dark .ProseMirror table td.selectedCell {
          background-color: rgba(59, 130, 246, 0.3) !important;
          border-color: #60a5fa !important;
        }
        .ProseMirror table th[data-selected],
        .ProseMirror table td[data-selected] {
          background-color: rgba(59, 130, 246, 0.2) !important;
          border-color: #3b82f6 !important;
        }
        .dark .ProseMirror table th[data-selected],
        .dark .ProseMirror table td[data-selected] {
          background-color: rgba(59, 130, 246, 0.3) !important;
          border-color: #60a5fa !important;
        }
        .ProseMirror table th {
          border-bottom: 2px solid #e5e7eb !important;
          background-color: #f3f4f6 !important;
          font-weight: 600;
        }
        .dark .ProseMirror table th {
          border-bottom: 2px solid #374151 !important;
          background-color: #1f2937 !important;
        }
        .ProseMirror table tr {
          border-bottom: 1px solid #e5e7eb !important;
        }
        .dark .ProseMirror table tr {
          border-bottom: 1px solid #374151 !important;
        }
        .ProseMirror table tr:last-child {
          border-bottom: none !important;
        }
        .ProseMirror table tbody tr:hover {
          background-color: rgba(243, 244, 246, 0.5) !important;
        }
        .dark .ProseMirror table tbody tr:hover {
          background-color: rgba(31, 41, 55, 0.5) !important;
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
        .tableWrapper {
          overflow-x: auto;
        }
        .ProseMirror table {
          user-select: none;
        }
        .ProseMirror table th,
        .ProseMirror table td {
          user-select: text;
        }
        .ProseMirror table th p,
        .ProseMirror table td p {
          margin: 0;
          min-height: 1.5em;
        }
        .ProseMirror table th:empty::before,
        .ProseMirror table td:empty::before {
          content: ' ';
          display: inline-block;
          width: 1px;
        }
        .ProseMirror table th:focus,
        .ProseMirror table td:focus {
          outline: 2px solid hsl(var(--primary));
          outline-offset: -2px;
        }
        .ProseMirror table th::selection,
        .ProseMirror table td::selection {
          background-color: rgba(59, 130, 246, 0.3);
        }
        .ProseMirror .selectedCell {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        .dark .ProseMirror .selectedCell {
          background-color: rgba(59, 130, 246, 0.3) !important;
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
      `
      }} />
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  tooltip: string
  icon: ReactNode
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

interface TableImportPanelProps {
  markdownValue: string
  onMarkdownChange: (value: string) => void
  onMarkdownImport: () => void
  htmlValue: string
  onHtmlChange: (value: string) => void
  onHtmlImport: () => void
}

function TableImportPanel({
  markdownValue,
  onMarkdownChange,
  onMarkdownImport,
  htmlValue,
  onHtmlChange,
  onHtmlImport,
}: TableImportPanelProps) {
  return (
    <Tabs defaultValue="markdown" className="w-full">
      <TabsList>
        <TabsTrigger value="markdown">Import Markdown</TabsTrigger>
        <TabsTrigger value="html">Import HTML</TabsTrigger>
      </TabsList>
      <TabsContent value="markdown" className="mt-3 space-y-2">
        <Textarea
          value={markdownValue}
          onChange={(event) => onMarkdownChange(event.target.value)}
          placeholder="Paste Markdown table (supports GFM)"
          className="min-h-[120px] font-mono"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={onMarkdownImport} disabled={!markdownValue.trim()}>
            Import Markdown
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="html" className="mt-3 space-y-2">
        <Textarea
          value={htmlValue}
          onChange={(event) => onHtmlChange(event.target.value)}
          placeholder="Paste HTML table markup"
          className="min-h-[120px] font-mono"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={onHtmlImport} disabled={!htmlValue.trim()}>
            Import HTML
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

async function markdownToHTML(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return String(file)
}

async function htmlToMarkdown(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify)
    .process(html)

  return String(file)
}

