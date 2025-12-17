"use client"

import { Editor } from "@tiptap/react"
import { Button } from "@/shared/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Table,
  Code,
  Undo,
  Redo,
  MessageSquare,
  FileText,
  Palette,
  Highlighter,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Split,
  Columns,
  Rows,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { useState, useEffect } from "react"

interface UnifiedToolbarProps {
  editor: Editor | null
  activeSection: string | null
  onInsertImage?: () => void
  onInsertLink?: () => void
  onInsertTable?: () => void
  onAddTextBlock?: () => void
  onAddPerAnswerExplanations?: () => void
  canAddPerAnswerExplanations?: boolean
  className?: string
}

const FONT_SIZES = [
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "16", label: "16" },
  { value: "18", label: "18" },
  { value: "20", label: "20" },
  { value: "24", label: "24" },
  { value: "28", label: "28" },
  { value: "32", label: "32" },
  { value: "36", label: "36" },
  { value: "48", label: "48" },
  { value: "72", label: "72" },
]

const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
]

const TEXT_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#800000", "#008000", "#000080", "#808000", "#800080", "#008080", "#C0C0C0", "#808080",
  "#FFA500", "#FFC0CB", "#A52A2A", "#8B4513", "#2F4F4F", "#708090", "#B0C4DE", "#4682B4",
]

const HIGHLIGHT_COLORS = [
  "#FFFF00", "#FF0000", "#00FF00", "#0000FF", "#FF00FF", "#00FFFF", "#FFA500", "#FFC0CB",
  "#C0C0C0", "#808080", "#800000", "#008000", "#000080", "#808000", "#800080", "#008080",
]

export default function UnifiedToolbar({
  editor,
  activeSection,
  onInsertImage,
  onInsertLink,
  onInsertTable,
  onAddTextBlock,
  onAddPerAnswerExplanations,
  canAddPerAnswerExplanations = false,
  className,
}: UnifiedToolbarProps) {
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [highlightColorOpen, setHighlightColorOpen] = useState(false)
  const [isInTable, setIsInTable] = useState(false)
  const [editorUpdateKey, setEditorUpdateKey] = useState(0)

  // Update isInTable state when editor state changes (e.g., when table is clicked)
  useEffect(() => {
    if (!editor) {
      setIsInTable(false)
      return
    }

    const updateTableState = () => {
      try {
        // Check if editor and view are available before accessing
        if (editor && editor.view) {
          const inTable = editor.isActive("table") || editor.isActive("tableCell") || editor.isActive("tableHeader")
          setIsInTable(inTable)
        } else {
          setIsInTable(false)
        }
      } catch (error) {
        setIsInTable(false)
      }
    }

    // Initial check - only if editor view is available
    try {
      if (editor.view) {
        updateTableState()
      } else {
        setIsInTable(false)
      }
    } catch (error) {
      setIsInTable(false)
    }

    // Listen to editor updates (selection changes, focus changes, etc.)
    // Only add listeners if editor is properly initialized
    const handleEditorUpdate = () => {
      updateTableState()
      // Force re-render of Select components when editor updates
      setEditorUpdateKey(prev => prev + 1)
    }
    
    try {
      if (editor.view) {
        editor.on("selectionUpdate", handleEditorUpdate)
        editor.on("focus", handleEditorUpdate)
        editor.on("blur", handleEditorUpdate)
        editor.on("update", handleEditorUpdate)
        editor.on("transaction", handleEditorUpdate)
      }
    } catch (error) {
      // Editor not ready yet, skip listeners
      console.warn("Editor not ready for event listeners:", error)
    }

    // Also listen to DOM click events for immediate response
    const handleClick = () => {
      // Use requestAnimationFrame to ensure the editor state has updated
      requestAnimationFrame(() => {
        // Check again before updating state
        if (editor && editor.view) {
          updateTableState()
        }
      })
    }

    // Safely access editor DOM element
    let editorElement: HTMLElement | null = null
    try {
      if (editor && editor.view && editor.view.dom) {
        editorElement = editor.view.dom
      }
    } catch (error) {
      // Editor view not available yet
      console.warn("Editor view not available for DOM event listeners:", error)
    }

    if (editorElement) {
      editorElement.addEventListener("click", handleClick, true)
      editorElement.addEventListener("mousedown", handleClick, true)
    }

    return () => {
      if (editor) {
        editor.off("selectionUpdate", handleEditorUpdate)
        editor.off("focus", handleEditorUpdate)
        editor.off("blur", handleEditorUpdate)
        editor.off("update", handleEditorUpdate)
        editor.off("transaction", handleEditorUpdate)
      }
      if (editorElement) {
        editorElement.removeEventListener("click", handleClick, true)
        editorElement.removeEventListener("mousedown", handleClick, true)
      }
    }
  }, [editor])

  // Helper function to safely check if editor command is available
  const canExecuteCommand = (command: () => boolean) => {
    if (!editor || !editor.view) return false
    try {
      return command()
    } catch (error) {
      return false
    }
  }

  // Helper function to safely execute editor command
  const executeCommand = (command: () => boolean) => {
    if (!editor || !editor.view) return
    try {
      command()
    } catch (error) {
      console.warn("Editor command failed:", error)
    }
  }

  // Always show toolbar, even if no editor is focused yet
  // The toolbar will be functional once an editor is selected
  if (!editor || !editor.view) {
    return (
      <div className={cn("flex items-center justify-center p-4 border-b bg-muted/30 dark:bg-gray-800/30", className)}>
        <p className="text-sm text-muted-foreground dark:text-gray-300">Click on any section to start editing</p>
      </div>
    )
  }

  const getCurrentFontSize = () => {
    try {
      const attrs = editor.getAttributes("textStyle")
      const fontSize = attrs?.fontSize
      
      if (fontSize) {
        // Handle both string and number types
        const sizeValue = typeof fontSize === "string" 
          ? fontSize.replace("px", "").trim() 
          : String(fontSize).replace("px", "").trim()
        
        // Check if the size exists in FONT_SIZES, if not return default
        const exists = FONT_SIZES.some(size => size.value === sizeValue)
        if (exists) {
          return sizeValue
        }
      }
    } catch (error) {
      // Ignore
    }
    return "12"
  }

  const getCurrentFontFamily = () => {
    try {
      const fontFamily = editor.getAttributes("textStyle").fontFamily
      if (fontFamily) {
        // Remove quotes and check if it exists in FONT_FAMILIES
        const cleanFamily = fontFamily.replace(/['"]+/g, "").trim()
        const exists = FONT_FAMILIES.some(font => font.value === cleanFamily)
        return exists ? cleanFamily : "Arial"
      }
    } catch (error) {
      // Ignore
    }
    return "Arial"
  }

  const getCurrentTextColor = () => {
    try {
      const color = editor.getAttributes("textStyle").color
      return color || "#000000"
    } catch (error) {
      return "#000000"
    }
  }

  const getCurrentHighlightColor = () => {
    try {
      const highlight = editor.getAttributes("highlight")
      return highlight?.color || "#FFFF00"
    } catch (error) {
      return "#FFFF00"
    }
  }

  // Get table cell attributes
  const getCellTextAlign = () => {
    if (isInTable) {
      try {
        return editor.getAttributes("tableCell").textAlign || "left"
      } catch (error) {
        return "left"
      }
    }
    return null
  }

  const getCellBackgroundColor = () => {
    if (isInTable) {
      try {
        return editor.getAttributes("tableCell").backgroundColor || null
      } catch (error) {
        return null
      }
    }
    return null
  }

  const getCellBorderColor = () => {
    if (isInTable) {
      try {
        return editor.getAttributes("tableCell").borderColor || null
      } catch (error) {
        return null
      }
    }
    return null
  }

  const TABLE_COLORS = [
    "", "#f97316", "#facc15", "#34d399", "#38bdf8", "#a855f7", "#ef4444", "#94a3b8"
  ]

  const setFontSize = (size: string) => {
    executeCommand(() => {
      // The extension expects just the number, it will add "px"
      // Make sure we're setting it correctly
      const sizeValue = size.replace("px", "").trim()
      editor.chain().focus().setFontSize(sizeValue).run()
      
      // Force update to ensure the Select shows the new value
      // The editor update event should trigger a re-render
      return true
    })
  }

  const setFontFamily = (family: string) => {
    executeCommand(() => {
      // Set the font family directly
      editor.chain().focus().setFontFamily(family).run()
      return true
    })
  }

  const setTextColor = (color: string) => {
    executeCommand(() => {
      const chain = editor.chain().focus()
      // When inside a table, also set cell attribute so plain cell text (e.g. first column)
      // reliably renders with the chosen color in preview/HTML output.
      if (isInTable) {
        // Apply to both cell and header, whichever is active
        try { chain.setCellAttribute("textColor", color) } catch {}
      }
      return chain.setColor(color).run()
    })
    setTextColorOpen(false)
  }

  const setHighlightColor = (color: string) => {
    executeCommand(() => {
      // Check if highlight is already active
      const isHighlighted = editor.isActive("highlight")
      const currentHighlight = editor.getAttributes("highlight")
      
      // If clicking the same color, remove the highlight
      if (isHighlighted && currentHighlight?.color === color) {
        editor.chain().focus().unsetHighlight().run()
      } else {
        // For multicolor highlights, toggleHighlight with a color will set or change the color
        // If there's already a highlight, we need to unset it first, then apply the new color
        if (isHighlighted) {
          // Unset the current highlight, then apply the new color
          editor.chain().focus().unsetHighlight().toggleHighlight({ color }).run()
        } else {
          // Apply new highlight color
          editor.chain().focus().toggleHighlight({ color }).run()
        }
      }
      return true
    })
    setHighlightColorOpen(false)
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1 p-3 border-b bg-background dark:bg-gray-800 text-foreground dark:text-gray-100 shadow-sm", className)}>
      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().undo().run())}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().undo().run())}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().redo().run())}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().redo().run())}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Text Formatting */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleBold().run())}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().toggleBold().run())}
        className={cn((() => {
          try {
            return editor.isActive("bold")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleItalic().run())}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().toggleItalic().run())}
        className={cn((() => {
          try {
            return editor.isActive("italic")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleUnderline().run())}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().toggleUnderline().run())}
        className={cn((() => {
          try {
            return editor.isActive("underline")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleStrike().run())}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().toggleStrike().run())}
        className={cn((() => {
          try {
            return editor.isActive("strike")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Font Size */}
      <Select 
        key={`font-size-${editorUpdateKey}`}
        value={getCurrentFontSize()} 
        onValueChange={setFontSize}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().setFontSize("12").run())}
      >
        <SelectTrigger className="w-20 h-8 text-xs bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 border-border dark:border-gray-700">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          {FONT_SIZES.map((size) => (
            <SelectItem key={size.value} value={size.value} className="text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700">
              {size.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Family */}
      <Select 
        key={`font-family-${editorUpdateKey}`}
        value={getCurrentFontFamily()} 
        onValueChange={setFontFamily}
        disabled={!canExecuteCommand(() => editor.can().chain().focus().setFontFamily("Arial").run())}
      >
        <SelectTrigger className="w-40 h-8 text-xs bg-card dark:bg-gray-800 text-foreground dark:text-gray-100 border-border dark:border-gray-700">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value} className="text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700">
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Text Color */}
      <Popover open={textColorOpen} onOpenChange={setTextColorOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            title="Text Color"
          >
            <Palette className="h-4 w-4" />
            <div
              className="w-4 h-4 rounded border border-border ml-1"
              style={{ backgroundColor: getCurrentTextColor() }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <div className="grid grid-cols-8 gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 rounded border border-border dark:border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => setTextColor(color)}
                title={color}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight Color */}
      <Popover open={highlightColorOpen} onOpenChange={setHighlightColorOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
            <div
              className="w-4 h-4 rounded border border-border ml-1"
              style={{ backgroundColor: getCurrentHighlightColor() }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <div className="space-y-2">
            {/* Remove highlight option */}
            <button
              type="button"
              className="w-full px-2 py-1.5 text-sm rounded border border-border dark:border-gray-600 hover:bg-muted dark:hover:bg-gray-700 transition-colors text-left text-foreground dark:text-gray-100"
              onClick={() => {
                executeCommand(() => {
                  editor.chain().focus().unsetHighlight().run()
                  return true
                })
                setHighlightColorOpen(false)
              }}
            >
              Remove Highlight
            </button>
            {/* Color grid */}
            <div className="grid grid-cols-8 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-border dark:border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setHighlightColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Headings */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        className={cn((() => {
          try {
            return editor.isActive("heading", { level: 1 })
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        className={cn((() => {
          try {
            return editor.isActive("heading", { level: 2 })
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        className={cn((() => {
          try {
            return editor.isActive("heading", { level: 3 })
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 4 }).run())}
        className={cn((() => {
          try {
            return editor.isActive("heading", { level: 4 })
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Heading 4"
      >
        <Heading4 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Lists */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          executeCommand(() => {
            try {
              const isInListItem = editor.isActive("listItem")
              const isInBulletList = editor.isActive("bulletList")
              const isInOrderedList = editor.isActive("orderedList")
              
              // If we're in a list item
              if (isInListItem) {
                // If already in a bullet list, just indent (create nested bullet list)
                if (isInBulletList && editor.can().sinkListItem("listItem")) {
                  editor.chain().focus().sinkListItem("listItem").run()
                }
                // If in an ordered list, create nested bullet list without converting parent
                else if (isInOrderedList && editor.can().sinkListItem("listItem")) {
                  // Strategy: Sink the list item first to create a nested structure
                  // Then wrap the nested content in a bullet list
                  // This ensures the parent ordered list remains unchanged
                  
                  // Step 1: Sink to create nested list structure
                  editor.chain().focus().sinkListItem("listItem").run()
                  
                  // Step 2: After sinking, we're now in a nested list item
                  // Check if we can toggle bullet list (should only affect nested level)
                  // Use a small delay to ensure the sink operation completes
                  requestAnimationFrame(() => {
                    // Now toggle bullet list - this should only affect the nested list
                    // because after sinking, the selection is in a nested list item
                    if (editor.isActive("listItem")) {
                      editor.chain().focus().toggleBulletList().run()
                    }
                  })
                }
                // If not in any list yet, just toggle
                else {
                  editor.chain().focus().toggleBulletList().run()
                }
              } else {
                // Not in a list item, normal toggle
                editor.chain().focus().toggleBulletList().run()
              }
            } catch (error) {
              // Fallback to normal toggle
              editor.chain().focus().toggleBulletList().run()
            }
          })
        }}
        className={cn((() => {
          try {
            return editor.isActive("bulletList")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Bullet List (In list item: creates nested bullet list without converting parent)"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          executeCommand(() => {
            try {
              const isInListItem = editor.isActive("listItem")
              const isInBulletList = editor.isActive("bulletList")
              const isInOrderedList = editor.isActive("orderedList")
              
              // If we're in a list item
              if (isInListItem) {
                // If already in an ordered list, just indent (create nested ordered list)
                if (isInOrderedList && editor.can().sinkListItem("listItem")) {
                  editor.chain().focus().sinkListItem("listItem").run()
                }
                // If in a bullet list, create nested ordered list without converting parent
                else if (isInBulletList && editor.can().sinkListItem("listItem")) {
                  // Strategy: Sink the list item first to create a nested structure
                  // Then wrap the nested content in an ordered list
                  // This ensures the parent bullet list remains unchanged
                  
                  // Step 1: Sink to create nested list structure
                  editor.chain().focus().sinkListItem("listItem").run()
                  
                  // Step 2: After sinking, we're now in a nested list item
                  // Toggle ordered list - this should only affect the nested level
                  requestAnimationFrame(() => {
                    // Now toggle ordered list - this should only affect the nested list
                    // because after sinking, the selection is in a nested list item
                    if (editor.isActive("listItem")) {
                      editor.chain().focus().toggleOrderedList().run()
                    }
                  })
                }
                // If not in any list yet, just toggle
                else {
                  editor.chain().focus().toggleOrderedList().run()
                }
              } else {
                // Not in a list item, normal toggle
                editor.chain().focus().toggleOrderedList().run()
              }
            } catch (error) {
              // Fallback to normal toggle
              editor.chain().focus().toggleOrderedList().run()
            }
          })
        }}
        className={cn((() => {
          try {
            return editor.isActive("orderedList")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Numbered List (In list item: creates nested numbered list without converting parent)"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      {/* List Indent/Outdent - Show when in a list */}
      {(() => {
        try {
          const isInList = editor.isActive("bulletList") || editor.isActive("orderedList")
          if (!isInList) return null
          
          return (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(() => editor.chain().focus().sinkListItem("listItem").run())}
                title="Indent List Item (Create Nested List) - Keyboard: Tab"
                disabled={!editor.can().sinkListItem("listItem")}
                className="opacity-60 hover:opacity-100"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(() => editor.chain().focus().liftListItem("listItem").run())}
                title="Outdent List Item (Move to Parent List) - Keyboard: Shift+Tab"
                disabled={!editor.can().liftListItem("listItem")}
                className="opacity-60 hover:opacity-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </>
          )
        } catch {
          return null
        }
      })()}

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Alignment - Show cell alignment when in table, otherwise text alignment */}
      {isInTable ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().setCellAttribute("textAlign", "left").run())}
            className={cn(getCellTextAlign() === "left" && "bg-muted dark:bg-gray-700")}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().setCellAttribute("textAlign", "center").run())}
            className={cn(getCellTextAlign() === "center" && "bg-muted dark:bg-gray-700")}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().setCellAttribute("textAlign", "right").run())}
            className={cn(getCellTextAlign() === "right" && "bg-muted dark:bg-gray-700")}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().setTextAlign("left").run())}
            className={cn((() => {
              try {
                return editor.isActive({ textAlign: "left" })
              } catch {
                return false
              }
            })() && "bg-muted dark:bg-gray-700")}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().setTextAlign("center").run())}
            className={cn((() => {
              try {
                return editor.isActive({ textAlign: "center" })
              } catch {
                return false
              }
            })() && "bg-muted dark:bg-gray-700")}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().setTextAlign("right").run())}
            className={cn((() => {
              try {
                return editor.isActive({ textAlign: "right" })
              } catch {
                return false
              }
            })() && "bg-muted dark:bg-gray-700")}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </>
      )}

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Table Controls - Show when in a table */}
      {isInTable && (
        <>
          <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().mergeCells().run())}
            title="Merge Cells"
          >
            <Split className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().splitCell().run())}
            title="Split Cell"
          >
            <Split className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().toggleHeaderRow().run())}
            className={cn((() => {
              try {
                return editor.isActive("tableHeader")
              } catch {
                return false
              }
            })() && "bg-muted dark:bg-gray-700")}
            title="Toggle Header Row"
          >
            <Columns className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().addRowBefore().run())}
            title="Add Row Above"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().addRowAfter().run())}
            title="Add Row Below"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().addColumnBefore().run())}
            title="Add Column Left"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().addColumnAfter().run())}
            title="Add Column Right"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().deleteRow().run())}
            title="Delete Row"
          >
            <Rows className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().deleteColumn().run())}
            title="Delete Column"
          >
            <Columns className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(() => editor.chain().focus().deleteTable().run())}
            title="Delete Table"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />
          {/* Cell Background Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                title="Cell Background Color"
              >
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: getCellBackgroundColor() || "transparent" }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-card dark:bg-gray-800 border-border dark:border-gray-700">
              <div className="grid grid-cols-4 gap-1">
                {TABLE_COLORS.map((color) => (
                  <button
                    key={`bg-${color || "none"}`}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-sm border border-border dark:border-gray-600 hover:ring-2 hover:ring-primary/40 transition",
                      color ? "" : "relative",
                    )}
                    style={{ backgroundColor: color || "transparent" }}
                    onClick={() => {
                      executeCommand(() => editor.chain().focus().setCellAttribute("backgroundColor", color || null).run())
                    }}
                  >
                    {!color && <span className="absolute inset-0 flex items-center justify-center text-xs text-foreground dark:text-gray-100">×</span>}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {/* Cell Border Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                title="Cell Border Color"
              >
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{ borderColor: getCellBorderColor() || "#000000" }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-card dark:bg-gray-800 border-border dark:border-gray-700">
              <div className="grid grid-cols-4 gap-1">
                {TABLE_COLORS.map((color) => (
                  <button
                    key={`border-${color || "none"}`}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-sm border-2 hover:ring-2 hover:ring-primary/40 transition",
                      color ? "" : "relative",
                    )}
                    style={{ borderColor: color || "#000000", backgroundColor: color ? color : "transparent" }}
                    onClick={() => {
                      executeCommand(() => editor.chain().focus().setCellAttribute("borderColor", color || null).run())
                    }}
                  >
                    {!color && <span className="absolute inset-0 flex items-center justify-center text-xs text-foreground dark:text-gray-100">×</span>}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Insert Elements */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onInsertImage}
        title="Insert Image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onInsertLink}
        title="Insert Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onInsertTable}
        title="Insert Table"
      >
        <Table className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => executeCommand(() => editor.chain().focus().toggleCodeBlock().run())}
        className={cn((() => {
          try {
            return editor.isActive("codeBlock")
          } catch {
            return false
          }
        })() && "bg-muted dark:bg-gray-700")}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border dark:bg-gray-700 mx-1" />

      {/* Add Blocks (only for explanation section) */}
      {activeSection === "explanation" || activeSection?.startsWith("explanation-block-") ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddTextBlock}
            className="h-8"
          >
            <FileText className="h-4 w-4 mr-1" />
            Add Text Block
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddPerAnswerExplanations}
            disabled={!canAddPerAnswerExplanations}
            className="h-8"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Add Per-Answer Explanations
          </Button>
        </>
      ) : null}
    </div>
  )
}

