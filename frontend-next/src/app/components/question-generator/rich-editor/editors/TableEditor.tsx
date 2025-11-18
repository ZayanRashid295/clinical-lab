"use client"

import { useState, useEffect } from "react"
import AdvancedTableEditor from "../../advanced-table-editor"
import { BlockData } from "../types"

interface TableEditorProps {
  data: BlockData
  onChange: (data: BlockData) => void
}

// Helper function to convert markdown table format (rows/cols/cells) to HTML
function legacyCellsToHtml(data: any): string {
  const rows = Math.max(1, Number.parseInt(data?.rows) || 0)
  const cols = Math.max(1, Number.parseInt(data?.cols) || 0)

  if (rows === 0 || cols === 0) {
    return ""
  }

  const cells: Record<string, string> = data?.cells || {}

  const escape = (value: string) =>
    value
      ?.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;") || ""

  // Check if first row is empty (all cells empty)
  const firstRowEmpty = Array.from({ length: cols }, (_, c) => {
    const key = `0-${c}`
    const value = cells[key] || ""
    return value.trim() === ""
  }).every(empty => empty)

  // If first row is empty, skip it and start from row 1
  const startRow = firstRowEmpty ? 1 : 0
  const actualRows = firstRowEmpty ? rows - 1 : rows

  if (actualRows <= 0) {
    return ""
  }

  let html = "<table><thead>"
  // First row is always header (if not empty)
  if (startRow === 0) {
    html += "<tr>"
    for (let c = 0; c < cols; c++) {
      const key = `0-${c}`
      const value = escape(cells[key] || "")
      html += `<th>${value || "&nbsp;"}</th>`
    }
    html += "</tr>"
  }
  html += "</thead><tbody>"
  
  // Data rows start from row 1 (or row 2 if first row was empty)
  for (let r = startRow + 1; r < rows; r++) {
    html += "<tr>"
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`
      const value = escape(cells[key] || "")
      html += `<td>${value || "&nbsp;"}</td>`
    }
    html += "</tr>"
  }
  html += "</tbody></table>"
  return html
}

export default function TableEditor({ data, onChange }: TableEditorProps) {
  const [tableHtml, setTableHtml] = useState<string>(data.tableHtml || "")
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    // If we have HTML, use it directly
    if (data.tableHtml) {
      setTableHtml(data.tableHtml)
      return
    }

    // If we have markdown table format (rows/cols/cells), convert to HTML
    if (data.rows && data.cols && data.cells && Object.keys(data.cells).length > 0) {
      setIsConverting(true)
      const convertedHtml = legacyCellsToHtml(data)
      if (convertedHtml) {
        setTableHtml(convertedHtml)
        // Update the data with converted HTML
        onChange({
          ...data,
          tableHtml: convertedHtml,
          rows: data.rows,
          cols: data.cols,
          cells: data.cells,
        })
      }
      setIsConverting(false)
      return
    }

    // If neither exists, reset
    setTableHtml("")
  }, [data, onChange])

  const handleTableChange = ({ html, markdown }: { html: string; markdown: string }) => {
    setTableHtml(html)
    onChange({
      ...data,
      tableHtml: html,
      markdown: markdown || "",
    })
  }

  if (isConverting) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Table Content</label>
        <div className="border border-border rounded-md p-4 bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">Converting table format...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Table Content</label>
      <AdvancedTableEditor
        initialContent={tableHtml}
        initialFormat="html"
        onChange={handleTableChange}
      />
    </div>
  )
}





