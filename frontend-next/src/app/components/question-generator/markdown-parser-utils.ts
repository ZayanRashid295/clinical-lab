export interface ParsedQuestion {
  stem: string
  options: Array<{ label: string; text: string; correct: boolean }>
  correctAnswer: string
  subject: string
  system: string
  topic?: string
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

  // Track if we've seen per-answer explanations section
  let seenPerAnswerSection = false
  
  // Parse rest of the file
  while (i < lines.length) {
    const line = lines[i].trim()

    // Extract title (# Title) - fallback if YAML not present
    if (line.startsWith("# ") && !questionData.subject) {
      const titleParts = line.slice(2).split(" — ")
      if (titleParts.length >= 2) {
        questionData.subject = titleParts[0].trim()
        questionData.system = titleParts[1].trim()
      }
      i++
      continue
    }

    // Extract topic (## Topic: ...)
    if (line.match(/^##\s+Topic:\s*(.+)/i)) {
      const topicMatch = line.match(/^##\s+Topic:\s*(.+)/i)
      if (topicMatch) {
        questionData.topic = topicMatch[1].trim()
      }
      i++
      continue
    }

    // Handle Clinical Case and Question sections (can be ## or ###)
    if (line.match(/^##+ (Clinical Case|Question|Stem)/)) {
      let caseLines: string[] = []
      if (questionData.stem) {
        // If we already have stem content, split it and add to lines
        caseLines = questionData.stem.split("\n").filter(l => l.trim())
      }
      i++
      // Collect text until we hit options or another section
      while (
        i < lines.length &&
        !lines[i].trim().match(/^\*?\*?[A-E]\.\*?\*?\s+/) &&
        !lines[i].match(/^##+ (Explanation|Choice-by-Choice|Additional|Raw|Example|Question)/) &&
        !lines[i].trim().match(/^### (?:Explanation|Choice)\s+[A-E]/)
      ) {
        const currentLine = lines[i]
        // Skip empty lines and horizontal rules, but keep other content
        const trimmed = currentLine.trim()
        if (trimmed && trimmed !== "---" && !trimmed.match(/^---+$/)) {
          // If it's another section header (including Question), stop
          if (trimmed.match(/^##+\s+(Clinical Case|Question|Stem|Explanation|Choice-by-Choice)/)) {
            break
          }
          // Preserve the original line (with proper spacing) to maintain markdown structure
          // This is important for images, tables, and formatting
          caseLines.push(currentLine)
        } else if (!trimmed) {
          // Preserve empty lines to maintain paragraph separation
          caseLines.push("")
        }
        i++
      }
      // Join with newlines to preserve markdown structure
      questionData.stem = caseLines.join("\n")
      // Don't increment i here since we want to process the line we stopped at
      continue
    }

    // Fallback: if no stem found and we hit options, collect all text before options
    if (!questionData.stem && line.match(/^\*?\*?[A-E]\.\*?\*?\s+/) && i > 0) {
      let stemLines: string[] = []
      for (let j = 0; j < i; j++) {
        const prevLine = lines[j]
        const trimmed = prevLine.trim()
        if (
          trimmed &&
          !trimmed.startsWith("#") &&
          !trimmed.startsWith("---") &&
          !trimmed.includes("title:") &&
          !trimmed.includes("tags:") &&
          !trimmed.includes("difficulty:") &&
          !trimmed.includes("correct_answer:") &&
          trimmed !== ""
        ) {
          // Preserve original line to maintain markdown structure
          stemLines.push(prevLine)
        } else if (!trimmed) {
          // Preserve empty lines
          stemLines.push("")
        }
      }
      questionData.stem = stemLines.join("\n")
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
      let choiceByChoiceIdx = -1 // Track where "## Choice-by-Choice Explanations" appears
      // Match both per-answer explanation formats as stopping points
      const choiceByChoicePattern = /^##+\s+(Choice-by-Choice|Additional|Raw|Example)/
      while (
        j < lines.length &&
        !lines[j].trim().match(/^### Explanation\s+[A-E](?:\s|$)/) &&
        !lines[j].trim().match(/^### Choice\s+[A-E]\s+Explanation/)
      ) {
        const currentLine = lines[j].trim()
        // Check if this is the Choice-by-Choice section header
        if (currentLine.match(choiceByChoicePattern)) {
          choiceByChoiceIdx = j
          break
        }
        explanationText += lines[j] + "\n"
        j++
      }
      // Set i to the last line we processed (j-1), so the outer loop will
      // continue from the next line (which might be a per-answer explanation)
      i = j - 1
      // Convert the main explanation markdown to content blocks
      let explanationBlocks = convertMarkdownToExplanationBlocks(explanationText.trim())
      
      // If we found "## Choice-by-Choice Explanations" in the explanation, insert a placeholder there
      if (choiceByChoiceIdx >= 0) {
        // Find the block that contains the Choice-by-Choice header
        // We need to split the blocks at the point where Choice-by-Choice appears
        const explanationTextBeforeChoice = explanationText.trim()
        const choiceByChoiceLine = lines[choiceByChoiceIdx]
        
        // Find which block contains the Choice-by-Choice line
        let splitPoint = -1
        for (let blockIdx = 0; blockIdx < explanationBlocks.length; blockIdx++) {
          const block = explanationBlocks[blockIdx]
          if (block.type === "text" && block.data?.markdown) {
            if (block.data.markdown.includes(choiceByChoiceLine.trim())) {
              // Split this block at the Choice-by-Choice line
              const markdown = block.data.markdown
              const choiceIndex = markdown.indexOf(choiceByChoiceLine.trim())
              if (choiceIndex >= 0) {
                const beforeChoice = markdown.substring(0, choiceIndex).trim()
                const afterChoice = markdown.substring(choiceIndex + choiceByChoiceLine.trim().length).trim()
                
                // Replace the block with content before Choice-by-Choice
                if (beforeChoice) {
                  explanationBlocks[blockIdx] = {
                    ...block,
                    data: { ...block.data, markdown: beforeChoice },
                  }
                } else {
                  // Remove the block if it's empty
                  explanationBlocks.splice(blockIdx, 1)
                  blockIdx--
                }
                
                // Insert placeholder after this block
                splitPoint = blockIdx + 1
                break
              }
            }
          }
        }
        
        // Insert per-answer explanation placeholder at the split point (or at the end if not found)
        const placeholderBlock = {
          id: Date.now(),
          type: "per-answer-explanation",
          order: splitPoint >= 0 ? splitPoint : explanationBlocks.length,
          data: {
            placeholder: true,
            isPerAnswerExplanation: true,
          },
        }
        
        if (splitPoint >= 0) {
          explanationBlocks.splice(splitPoint, 0, placeholderBlock)
        } else {
          explanationBlocks.push(placeholderBlock)
        }
        
        // Re-number orders
        explanationBlocks.forEach((block, idx) => {
          block.order = idx
        })
      }
      
      questionData.mainExplanation = explanationBlocks
      i++
      continue
    }

    // Handle "## Choice-by-Choice Explanations" section header
    if (line.match(/^##+\s+Choice-by-Choice\s+Explanations/i)) {
      // Mark that we've seen the per-answer explanations section
      seenPerAnswerSection = true
      // Continue to next line to process per-answer explanations
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
          !lines[j].trim().match(/^##+\s+Choice-by-Choice\s+Explanations/i)
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
      }
      i++
      continue
    }

    // After per-answer explanations, collect any remaining content (like "## Management Approach")
    // and add it to the main explanation
    // This should run after we've seen the per-answer section and processed all per-answer explanations
    const hasPerAnswerSection = seenPerAnswerSection
    const hasPerAnswerExplanations = questionData.perAnswerExplanations && Object.keys(questionData.perAnswerExplanations).length > 0
    
    if (hasPerAnswerSection && hasPerAnswerExplanations) {
      // Check if this is additional content that should be added to main explanation
      // (e.g., "## Management Approach", "## Additional Notes", etc.)
      // Must be a section header (## or ###) that's not Explanation, Choice-by-Choice, Clinical Case, Question, Stem, or Topic
      // And not a per-answer explanation header
      const isSectionHeader = line.match(/^##+\s+/)
      const isExcludedSection = line.match(/^##+\s+(Explanation|Choice-by-Choice|Clinical Case|Question|Stem|Topic)/i)
      const isPerAnswerHeader = line.match(/^###\s+(Explanation|Choice)\s+[A-E]/i)
      const isAdditionalSection = isSectionHeader && !isExcludedSection && !isPerAnswerHeader
      
      if (isAdditionalSection) {
        let additionalContent = ""
        let j = i
        // Collect all content until end of file, end marker, or another major section
        while (
          j < lines.length &&
          !lines[j].trim().match(/^##+\s+(Explanation|Choice-by-Choice|Clinical Case|Question|Stem|Topic)/i) &&
          !lines[j].trim().match(/^###\s+(Explanation|Choice)\s+[A-E]/i) &&
          !lines[j].trim().match(/^\*End of test question/i)
        ) {
          additionalContent += lines[j] + "\n"
          j++
        }
        // Append to main explanation
        if (additionalContent.trim()) {
          const existingExplanation = questionData.mainExplanation || []
          const additionalBlocks = convertMarkdownToExplanationBlocks(additionalContent.trim())
          
          // Renumber orders to be sequential across all blocks
          const maxOrder = existingExplanation.length > 0 
            ? Math.max(...existingExplanation.map((b: any) => typeof b.order === "number" ? b.order : 0))
            : -1
          additionalBlocks.forEach((block: any, idx: number) => {
            block.order = maxOrder + 1 + idx
          })
          
          questionData.mainExplanation = [...existingExplanation, ...additionalBlocks]
          
          // Debug: Log when additional content is found
          if (process.env.NODE_ENV === "development") {
            console.log("[MarkdownParser] Inline: Found additional content after per-answer explanations:", {
              section: line.trim(),
              startLine: i,
              endLine: j - 1,
              blockCount: additionalBlocks.length,
              firstBlockType: additionalBlocks[0]?.type,
              maxOrder,
              newOrders: additionalBlocks.map((b: any) => b.order),
            })
          }
        }
        // Skip to the end of the collected content (j-1 because j is the line after)
        i = j - 1
        continue
      }
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

  return {
    stem: questionData.stem || "",
    options: questionData.options || [],
    correctAnswer: questionData.correctAnswer || "",
    subject: questionData.subject || "General",
    system: questionData.system || "General",
    topic: questionData.topic,
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
  let blockOrder = 0 // Track order to preserve markdown file structure

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
          order: blockOrder++,
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
          order: blockOrder++,
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
          order: blockOrder++,
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }

      blocks.push({
        id: blockIdCounter++,
        type: "images",
        order: blockOrder++,
        data: {
          count: 1,
          images: [urlMatch[0]],
        },
      })

      i++
      continue
    }

    // Handle headings (H1: #, H2: ##, H3: ###, etc.)
    if (trimmed.match(/^#{1,6}\s+/)) {
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          order: blockOrder++,
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
          order: blockOrder++,
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
        order: blockOrder++,
        data: { markdown: listItems.join("\n") },
      })
      continue
    }
    // Handle HTML tables (if the line contains <table tag)
    else if (trimmed.match(/<table[\s>]/i)) {
      // HTML table found - create a table block with HTML
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          order: blockOrder++,
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      // Collect the entire HTML table (may span multiple lines)
      let htmlTable = trimmed
      let tableClosed = !!trimmed.match(/<\/table>/i)
      i++
      
      while (i < lines.length && !tableClosed) {
        htmlTable += "\n" + lines[i]
        if (lines[i].trim().match(/<\/table>/i)) {
          tableClosed = true
        }
        i++
      }
      
      // Create a table block with HTML data
      blocks.push({
        id: blockIdCounter++,
        type: "table",
        order: blockOrder++,
        data: { html: htmlTable },
      })
      continue
    }
    // Handle markdown tables
    else if (trimmed.startsWith("|")) {
      if (currentText.trim()) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          order: blockOrder++,
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      const tableLines: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const line = lines[i]
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim())
        // Skip separator rows (rows that are all dashes or empty)
        const isSeparatorRow = cells.length > 0 && (
          cells.every(cell => cell.match(/^-+$/) || cell === "") ||
          cells[0].match(/^-+$/)
        )
        if (cells.length > 0 && !isSeparatorRow) {
          tableLines.push(cells)
        }
        i++
      }
      if (tableLines.length > 0) {
        // Convert markdown table format to editor format
        const numRows = tableLines.length
        const numCols = Math.max(...tableLines.map(row => row.length), 0)
        const cells: Record<string, string> = {}
        
        // Populate cells object - row 0 is header, rows 1+ are data
        tableLines.forEach((row, rowIdx) => {
          row.forEach((cell, colIdx) => {
            const cellKey = `${rowIdx}-${colIdx}`
            // Preserve cell content, including empty cells - trim to remove extra whitespace
            cells[cellKey] = (cell || "").trim()
          })
          // Fill in missing columns with empty strings
          for (let colIdx = row.length; colIdx < numCols; colIdx++) {
            const cellKey = `${rowIdx}-${colIdx}`
            cells[cellKey] = ""
          }
        })
        
        // Debug: Log table parsing
        if (process.env.NODE_ENV === "development") {
          console.log("[TableParser] Parsed table:", {
            rows: numRows,
            cols: numCols,
            cellCount: Object.keys(cells).length,
            sampleCells: Object.entries(cells).slice(0, 6),
          })
        }
        
        blocks.push({
          id: blockIdCounter++,
          type: "table",
          order: blockOrder++,
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
          order: blockOrder++,
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
      order: blockOrder++,
      data: { markdown: currentText.trim() },
    })
  }

  // Ensure blocks are sorted by order (should already be in order, but just in case)
  return blocks.sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : 999
    const orderB = typeof b.order === "number" ? b.order : 999
    return orderA - orderB
  })
}

/**
 * Extract all image references from markdown content
 * Returns an array of image paths found in the markdown
 */
export function extractImageReferences(markdownContent: string): string[] {
  const imageReferences: string[] = []
  
  // Pattern for markdown images: ![alt](path)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match
  
  while ((match = imagePattern.exec(markdownContent)) !== null) {
    const imagePath = match[2]
    if (imagePath && !imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
      // Only include local paths, not URLs
      imageReferences.push(imagePath)
    }
  }
  
  // Also check for plain image URLs in content blocks (already processed)
  // This is handled in convertMarkdownToExplanationBlocks
  
  return Array.from(new Set(imageReferences)) // Remove duplicates
}

/**
 * Replace image paths in markdown content with new URLs
 */
export function replaceImagePaths(
  markdownContent: string,
  pathMapping: Record<string, string>
): string {
  let updatedContent = markdownContent
  
  // Replace image references: ![alt](oldPath) -> ![alt](newUrl)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  
  updatedContent = updatedContent.replace(imagePattern, (match, alt, path) => {
    // If this path has a mapping, replace it
    if (pathMapping[path]) {
      return `![${alt}](${pathMapping[path]})`
    }
    // Otherwise keep the original
    return match
  })
  
  return updatedContent
}

/**
 * Replace image paths in content blocks (used in explanations)
 */
export function replaceImagePathsInBlocks(
  blocks: any[],
  pathMapping: Record<string, string>
): any[] {
  return blocks.map((block) => {
    if (block.type === 'text' && block.data?.markdown) {
      // Replace image paths in markdown text
      return {
        ...block,
        data: {
          ...block.data,
          markdown: replaceImagePaths(block.data.markdown, pathMapping),
        },
      }
    } else if (block.type === 'images' && block.data?.images) {
      // Replace image URLs in image blocks
      return {
        ...block,
        data: {
          ...block.data,
          images: block.data.images.map((imgUrl: string) => {
            // Check if this URL matches any of our mapped paths
            for (const [oldPath, newUrl] of Object.entries(pathMapping)) {
              // Handle both relative paths and full URLs
              if (imgUrl === oldPath || imgUrl.includes(oldPath)) {
                return newUrl
              }
            }
            return imgUrl
          }),
        },
      }
    }
    return block
  })
}
