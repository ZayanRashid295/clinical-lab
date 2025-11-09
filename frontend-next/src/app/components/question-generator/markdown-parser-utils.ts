export interface ParsedQuestion {
  stem: string
  options: Array<{ label: string; text: string; correct: boolean }>
  correctAnswer: string
  subject: string
  system: string
  mainExplanation: any[]
  perAnswerExplanations: Record<string, any[]>
  tags: string[]
}

export function parseMarkdown(content: string): ParsedQuestion {
  const lines = content.split("\n")
  const questionData: Partial<ParsedQuestion> = {
    options: [],
    perAnswerExplanations: {},
    tags: [],
    mainExplanation: [],
  }

  let i = 0

  if (lines[0].trim() === "---") {
    i++
    const yamlLines: string[] = []
    while (i < lines.length && lines[i].trim() !== "---") {
      yamlLines.push(lines[i])
      i++
    }
    if (i < lines.length && lines[i].trim() === "---") {
      i++ // Skip closing ---
    }

    // Parse YAML metadata
    for (const yamlLine of yamlLines) {
      if (yamlLine.includes("title:")) {
        const titleMatch = yamlLine.match(/title:\s*"?([^"]*)"?/)
        if (titleMatch) {
          const fullTitle = titleMatch[1]
          const titleParts = fullTitle.split(" — ")
          if (titleParts.length >= 2) {
            questionData.subject = titleParts[0].trim()
            questionData.system = titleParts[1].split("(")[0].trim()
          }
        }
      }
      if (yamlLine.includes("tags:")) {
        const tagsMatch = yamlLine.match(/tags:\s*\[(.*?)\]/)
        if (tagsMatch) {
          questionData.tags = tagsMatch[1].split(",").map((tag) => tag.trim())
        }
      }
      if (yamlLine.includes("correct_answer:")) {
        const answerMatch = yamlLine.match(/correct_answer:\s*([A-E])/)
        if (answerMatch) {
          questionData.correctAnswer = answerMatch[1]
        }
      }
    }
  }

  // Parse rest of the file
  while (i < lines.length) {
    const line = lines[i].trim()

    // Extract title (# Title) - fallback if YAML not present
    if (line.startsWith("# ") && !questionData.subject) {
      const titleParts = line.slice(2).split(" - ")
      if (titleParts.length >= 2) {
        questionData.subject = titleParts[0].trim()
        questionData.system = titleParts[1].trim()
      }
      i++
      continue
    }

    // Handle Clinical Case and Question sections (can be ## or ###)
    if (line.match(/^##+ (Clinical Case|Question|Stem)/)) {
      let caseText = questionData.stem ? questionData.stem + " " : ""
      i++
      // Collect text until we hit options or another section
      while (
        i < lines.length &&
        !lines[i].trim().match(/^\*?\*?[A-E]\.\*?\*?\s+/) &&
        !lines[i].match(/^##+ (Explanation|Choice-by-Choice|Additional|Raw|Example)/) &&
        !lines[i].trim().match(/^### (?:Explanation|Choice)\s+[A-E]/)
      ) {
        const currentLine = lines[i].trim()
        // Skip empty lines and horizontal rules, but keep other content
        if (currentLine && currentLine !== "---" && !currentLine.match(/^---+$/)) {
          // If it's another section header at same level, stop
          if (currentLine.match(/^##+ (Clinical Case|Question|Stem)/)) {
            break
          }
          caseText += currentLine + " "
        }
        i++
      }
      questionData.stem = caseText.trim()
      // Don't increment i here since we want to process the line we stopped at
      continue
    }

    // Fallback: if no stem found and we hit options, collect all text before options
    if (!questionData.stem && line.match(/^\*?\*?[A-E]\.\*?\*?\s+/) && i > 0) {
      let stemText = ""
      for (let j = 0; j < i; j++) {
        const prevLine = lines[j].trim()
        if (
          prevLine &&
          !prevLine.startsWith("#") &&
          !prevLine.startsWith("---") &&
          !prevLine.includes("title:") &&
          !prevLine.includes("tags:") &&
          !prevLine.includes("difficulty:") &&
          !prevLine.includes("correct_answer:") &&
          prevLine !== ""
        ) {
          stemText += prevLine + " "
        }
      }
      questionData.stem = stemText.trim()
    }

    // Extract options (A., B., C., D., E.)
    if (line.match(/^\*?\*?[A-E]\.\*?\*?\s+/)) {
      const optionMatch = line.match(/^\*?\*?([A-E])\.\*?\*?\s+(.+)/)
      if (optionMatch) {
        const label = optionMatch[1]
        const text = optionMatch[2]
          .replace(/\*\*/g, "")
          .replace(/$$.*?%$$/g, "") // Remove percentages
          .trim()
        questionData.options?.push({
          label,
          text,
          correct: label === questionData.correctAnswer,
        })
      }
      i++
      continue
    }

    // Extract correct answer (various formats)
    if (
      (line.includes("Correct Answer:") || line.includes("✅") || line.includes("**Correct Answer:**")) &&
      !questionData.correctAnswer
    ) {
      const match = line.match(/[A-E]/)
      if (match) {
        questionData.correctAnswer = match[0]
        if (questionData.options && questionData.options.length > 0) {
          questionData.options = questionData.options.map((opt) => ({
            ...opt,
            correct: opt.label === match[0],
          }))
        }
      }
      i++
      continue
    }

    if (line.startsWith("## Explanation") && !line.startsWith("### Explanation") && !line.match(/^## Choice/)) {
      let explanationText = ""
      // Continue until we hit "### Explanation [A-E]" or "### Choice [A-E] Explanation" or end of file
      // Allow all other content including headings, tables, images, etc.
      // Start from the next line after "## Explanation"
      let j = i + 1
      // Match both per-answer explanation formats as stopping points
      const choiceByChoicePattern = /^##+ (Choice-by-Choice|Additional|Raw|Example)/
      while (
        j < lines.length &&
        !lines[j].trim().match(/^### Explanation\s+[A-E](?:\s|$)/) &&
        !lines[j].trim().match(/^### Choice\s+[A-E]\s+Explanation/) &&
        !lines[j].trim().match(choiceByChoicePattern)
      ) {
        explanationText += lines[j] + "\n"
        j++
      }
      // Set i to the last line we processed (j-1), so the outer loop will
      // continue from the next line (which might be a per-answer explanation)
      i = j - 1
      // Convert the main explanation markdown to content blocks
      questionData.mainExplanation = convertMarkdownToExplanationBlocks(explanationText.trim())
      console.log("[v0] Extracted main explanation blocks:", questionData.mainExplanation)
      i++
      continue
    }

    // Match both "### Explanation A" and "### Choice A Explanation" formats
    // Also handle "### Choice A Explanation — description" format (match anything after Explanation)
    const perAnswerMatch1 = line.match(/^### Explanation\s+([A-E])(?:\s|$)/)
    const perAnswerMatch2 = line.match(/^### Choice\s+([A-E])\s+Explanation/)
    const perAnswerMatch = perAnswerMatch1 || perAnswerMatch2
    if (perAnswerMatch) {
      const answerLabel = perAnswerMatch[1]
      if (answerLabel) {
        let explanationText = ""
        // Continue until we hit the next per-answer explanation or end of file
        // Allow all other content including headings, tables, images, etc.
        // Start from the next line after the explanation header
        let j = i + 1
        // Match both formats for stopping condition (more flexible - allows text after "Explanation")
        while (
          j < lines.length &&
          !lines[j].trim().match(/^### Explanation\s+[A-E](?:\s|$)/) &&
          !lines[j].trim().match(/^### Choice\s+[A-E]\s+Explanation/) &&
          !lines[j].trim().match(/^##+ (Choice-by-Choice|Additional|Raw|Example)/)
        ) {
          explanationText += lines[j] + "\n"
          j++
        }
        // Set i to the last line we processed (j-1), so the outer loop will
        // continue from the next line (which might be another per-answer explanation)
        i = j - 1
        if (!questionData.perAnswerExplanations) {
          questionData.perAnswerExplanations = {}
        }
        // Convert each per-answer explanation to content blocks
        questionData.perAnswerExplanations[answerLabel] = convertMarkdownToExplanationBlocks(explanationText.trim())
        console.log(`[v0] Extracted explanation for ${answerLabel}:`, questionData.perAnswerExplanations[answerLabel])
      }
      i++
      continue
    }

    // Extract tags (from tags section)
    if (line.startsWith("Tags:") || line.startsWith("**Tags:**")) {
      const tagsText = line.replace(/\*\*Tags:\*\*|Tags:/, "").trim()
      if (!questionData.tags || questionData.tags.length === 0) {
        questionData.tags = tagsText.split(",").map((t) => t.trim())
      }
      i++
      continue
    }

    i++
  }

  if (!questionData.stem) {
    throw new Error(
      "Invalid markdown format: Missing question stem. Please ensure your markdown includes a question or clinical case before the options (A, B, C, D, E).",
    )
  }

  if (!questionData.options || questionData.options.length === 0) {
    throw new Error(
      "Invalid markdown format: Missing options. Please ensure your markdown includes options formatted as **A.** Option text, **B.** Option text, etc.",
    )
  }

  if (!questionData.correctAnswer) {
    throw new Error(
      'Invalid markdown format: Missing correct answer indicator. Please include "Correct Answer: X" where X is A, B, C, D, or E.',
    )
  }

  console.log("[v0] Full parsed question data:", {
    stem: questionData.stem?.substring(0, 100) + "...",
    options: questionData.options,
    correctAnswer: questionData.correctAnswer,
    subject: questionData.subject,
    system: questionData.system,
    mainExplanationLength: questionData.mainExplanation?.length,
    perAnswerExplanationsKeys: Object.keys(questionData.perAnswerExplanations || {}),
    tags: questionData.tags,
  })

  return {
    stem: questionData.stem || "",
    options: questionData.options || [],
    correctAnswer: questionData.correctAnswer || "",
    subject: questionData.subject || "General",
    system: questionData.system || "General",
    mainExplanation: questionData.mainExplanation || [],
    perAnswerExplanations: questionData.perAnswerExplanations || {},
    tags: questionData.tags || [],
  } as ParsedQuestion
}

export function convertMarkdownToExplanationBlocks(markdownText: string): any[] {
  const blocks: any[] = []
  // Clean up the markdown: remove unnecessary separators and normalize line breaks
  let cleanedMarkdown = markdownText
    .replace(/^---+$/gm, "") // Remove horizontal rules (---)
    .replace(/^--+$/gm, "") // Remove double dashes (--)
    .replace(/\n{3,}/g, "\n\n") // Normalize multiple line breaks to max 2
    .trim()

  const lines = cleanedMarkdown.split("\n")

  let currentText = ""
  let i = 0
  let blockIdCounter = Date.now()

  // Image markdown pattern: ![alt](url) or just image URLs
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  const urlPattern = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/i

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Handle images (markdown format: ![alt](url))
    const imageMatches = Array.from(trimmed.matchAll(imagePattern))
    if (imageMatches.length > 0) {
      // Flush any current text
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }

      // Extract image URLs from matches
      const imageUrls: string[] = []
      for (const match of imageMatches) {
        if (match[2]) {
          imageUrls.push(match[2])
        }
      }

      if (imageUrls.length > 0) {
        blocks.push({
          id: blockIdCounter++,
          type: "images",
          data: {
            count: imageUrls.length,
            images: imageUrls,
          },
        })
      }

      // Check if there's remaining text on the line after the image
      let remainingText = trimmed
      for (const match of imageMatches) {
        remainingText = remainingText.replace(match[0], "")
      }
      remainingText = remainingText.trim()
      if (remainingText) {
        currentText = remainingText
      }

      i++
      continue
    }

    // Handle plain image URLs (if line is just an image URL)
    const urlMatch = trimmed.match(urlPattern)
    if (urlMatch && trimmed === urlMatch[0]) {
      // Flush any current text
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }

      blocks.push({
        id: blockIdCounter++,
        type: "images",
        data: {
          count: 1,
          images: [urlMatch[0]],
        },
      })

      i++
      continue
    }

    // Handle headings
    if (trimmed.startsWith("##")) {
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      // Add heading as part of markdown text block
      currentText = trimmed + "\n"
      i++
      continue
    }
    // Handle bullet lists
    else if (trimmed.startsWith("-")) {
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      // Collect list items and add as markdown
      const listItems: string[] = []
      while (i < lines.length && lines[i].trim().startsWith("-")) {
        listItems.push(lines[i].trim())
        i++
      }
      blocks.push({
        id: blockIdCounter++,
        type: "text",
        data: { markdown: listItems.join("\n") },
      })
      continue
    }
    // Handle HTML tables (if the line contains <table tag)
    else if (trimmed.includes("<table") || trimmed.includes("<tr") || trimmed.includes("<td")) {
      // HTML table found - store as markdown text block so react-markdown can render it
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      // Collect the entire HTML table (may span multiple lines)
      let htmlTable = trimmed
      let tableClosed = trimmed.includes("</table>")
      i++
      
      while (i < lines.length && !tableClosed) {
        htmlTable += "\n" + lines[i]
        if (lines[i].trim().includes("</table>")) {
          tableClosed = true
        }
        i++
      }
      
      blocks.push({
        id: blockIdCounter++,
        type: "text",
        data: { markdown: htmlTable },
      })
      continue
    }
    // Handle markdown tables
    else if (trimmed.startsWith("|")) {
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      const tableLines: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim())
        if (cells.length > 0 && !cells[0].match(/^-+$/)) {
          tableLines.push(cells)
        }
        i++
      }
      if (tableLines.length > 0) {
        // Convert markdown table format to editor format
        const numRows = tableLines.length
        const numCols = tableLines[0]?.length || 0
        const cells: Record<string, string> = {}
        
        // Populate cells object
        tableLines.forEach((row, rowIdx) => {
          row.forEach((cell, colIdx) => {
            const cellKey = `${rowIdx}-${colIdx}`
            cells[cellKey] = cell
          })
        })
        
        blocks.push({
          id: blockIdCounter++,
          type: "table",
          data: {
            rows: numRows,
            cols: numCols,
            cells: cells,
          },
        })
      }
      continue
    } else if (trimmed) {
      // Skip separator lines (---, --, etc.)
      if (trimmed.match(/^[-=]{2,}$/)) {
        i++
        continue
      }
      // Regular text line - add to current text block
      currentText += (currentText ? "\n" : "") + trimmed
    } else {
      // Empty line - flush current text if we have any
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
    }

    i++
  }

  // Flush any remaining text at the end
  if (currentText.trim()) {
    blocks.push({
      id: blockIdCounter++,
      type: "text",
      data: { markdown: currentText.trim() },
    })
  }

  return blocks
}
