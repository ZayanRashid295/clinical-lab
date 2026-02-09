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
  questionId?: string
}

export function parseMarkdown(content: string): ParsedQuestion {
  const lines = content.split("\n")
  const questionData: Partial<ParsedQuestion> = {
    options: [],
    perAnswerExplanations: {},
    tags: [],
    mainExplanation: [],
    questionId: undefined,
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
          // Split by " — " (em dash) to separate Subject and System
          const titleParts = fullTitle.split(" — ")
          if (titleParts.length >= 2) {
            // Subject is the first part (maps to Product Tag)
            questionData.subject = titleParts[0].trim()
            // System is everything after " — " (maps to Chapter)
            questionData.system = titleParts.slice(1).join(" — ").trim()
          } else if (titleParts.length === 1) {
            // If no " — " separator, use entire title as subject
            questionData.subject = titleParts[0].trim()
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
      if (yamlLine.includes("question_id:")) {
        const questionIdMatch = yamlLine.match(/question_id:\s*(.+)/)
        if (questionIdMatch) {
          questionData.questionId = questionIdMatch[1].trim()
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
      const titleText = line.slice(2).trim()
      // Split by " — " (em dash) to separate Subject and System
      const titleParts = titleText.split(" — ")
      if (titleParts.length >= 2) {
        // Subject is the first part (maps to Product Tag)
        questionData.subject = titleParts[0].trim()
        // System is everything after " — " (maps to Chapter)
        questionData.system = titleParts.slice(1).join(" — ").trim()
      } else if (titleParts.length === 1) {
        // If no " — " separator, use entire title as subject
        questionData.subject = titleParts[0].trim()
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

    // Extract question ID lines and ensure they do NOT end up in the visible stem
    // Supported formats (case-insensitive):
    // - "Question (ID: 714025):"
    // - "**Question (ID: 714025):**"
    // - "Question ID: 714025"
    // - "Question Id: 714025"
    const questionIdMatchParen = line.match(/(?:\*\*)?Question\s*\(ID:\s*([^)]+)\)(?:\*\*)?:?/i)
    const questionIdMatchLabel = line.match(/^\s*(?:\*\*)?Question\s+I[dn]:\s*([A-Za-z0-9\-_.]+)/i)
    const questionIdMatch = questionIdMatchParen || questionIdMatchLabel
    if (questionIdMatch && questionIdMatch[1]) {
      questionData.questionId = questionIdMatch[1].trim()
      // Do NOT include this line in the stem; skip it entirely
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
          
          // Check if this line contains a question ID pattern
          const questionIdMatch = trimmed.match(/(?:\*\*)?Question\s*\(ID:\s*([^)]+)\)(?:\*\*)?:?/i)
          if (questionIdMatch && questionIdMatch[1] && !questionData.questionId) {
            // Extract question ID if not already found
            questionData.questionId = questionIdMatch[1].trim()
            // Remove the question ID from the line if it's the only content
            const lineWithoutId = trimmed.replace(/(?:\*\*)?Question\s*\(ID:\s*[^)]+\)(?:\*\*)?:?\s*/i, "").trim()
            if (lineWithoutId) {
              // If there's remaining content after removing the ID, keep it
              caseLines.push(lineWithoutId)
            }
            // Otherwise skip this line entirely (don't add it to caseLines)
          } else {
          // Preserve the original line (with proper spacing) to maintain markdown structure
          // This is important for images, tables, and formatting
          caseLines.push(currentLine)
          }
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
        
        // Check if this line contains a question ID pattern
        const questionIdMatch = trimmed.match(/(?:\*\*)?Question\s*\(ID:\s*([^)]+)\)(?:\*\*)?:?/i)
        if (questionIdMatch && questionIdMatch[1] && !questionData.questionId) {
          // Extract question ID if not already found
          questionData.questionId = questionIdMatch[1].trim()
          // Remove the question ID from the line if it's the only content
          const lineWithoutId = trimmed.replace(/(?:\*\*)?Question\s*\(ID:\s*[^)]+\)(?:\*\*)?:?\s*/i, "").trim()
          if (lineWithoutId) {
            // If there's remaining content after removing the ID, keep it
            stemLines.push(lineWithoutId)
          }
          // Otherwise skip this line entirely
          continue
        }
        
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

    // Extract options (A., B., C., D., E.) and inline per-answer explanations
    if (line.match(/^\*?\*?[A-E]\.\*?\*?\s+/)) {
      const optionMatch = line.match(/^\*?\*?([A-E])\.\*?\*?\s+(.+)/)
      if (optionMatch) {
        const label = optionMatch[1]
        let text = optionMatch[2]
          .replace(/\*\*/g, "")
          .replace(/$$.*?%$$/g, "") // Remove percentages
          .trim()
        
        // Check if option text contains indicators of correct answer
        const hasCheckmark = text.includes("✅")
        const isMarkedCorrect = text.match(/\(correct\)/i)
        
        questionData.options?.push({
          label,
          text: text.replace(/✅/g, "").replace(/\(correct\)/gi, "").trim(),
          correct: label === questionData.correctAnswer || hasCheckmark || !!isMarkedCorrect,
        })
        
        // If this option is marked as correct and we don't have a correct answer yet, set it
        if ((hasCheckmark || isMarkedCorrect) && !questionData.correctAnswer) {
          questionData.correctAnswer = label
        }
        
        // Check for inline per-answer explanation right after this option
        // Look for "### Choice [A-E] Explanation" on the next non-empty line
        let j = i + 1
        // Skip empty lines
        while (j < lines.length && !lines[j].trim()) {
          j++
        }
        
        // Check if the next non-empty line is a per-answer explanation for this choice
        if (j < lines.length) {
          const nextLine = lines[j].trim()
          const perAnswerMatch1 = nextLine.match(/^###\s+Choice\s+([A-E])\s+Explanation/)
          const perAnswerMatch2 = nextLine.match(/^###\s+Explanation\s+([A-E])(?:\s|$)/)
          const perAnswerMatch = perAnswerMatch1 || perAnswerMatch2
          
          if (perAnswerMatch && perAnswerMatch[1] === label) {
            // Found inline per-answer explanation for this choice
            let explanationText = ""
            // Start from the line after the explanation header
            let k = j + 1
            // Collect content until we hit the next option, next per-answer explanation, or a major section
            while (
              k < lines.length &&
              !lines[k].trim().match(/^\*?\*?[A-E]\.\*?\*?\s+/) && // Next option
              !lines[k].trim().match(/^###\s+(Explanation|Choice)\s+[A-E]/) && // Next per-answer explanation
              !lines[k].trim().match(/^##+\s+(Explanation|Choice-by-Choice|Clinical Case|Question|Stem|Topic)/i) && // Major section
              !lines[k].trim().match(/^Correct Answer:/i) && // Correct answer line
              !lines[k].trim().match(/^\*End of test question/i) // End marker
            ) {
              explanationText += lines[k] + "\n"
              k++
            }
            
            if (explanationText.trim()) {
              if (!questionData.perAnswerExplanations) {
                questionData.perAnswerExplanations = {}
              }
              // Convert explanation to content blocks
              questionData.perAnswerExplanations[label] = convertMarkdownToExplanationBlocks(explanationText.trim())
              
              // Skip the lines we just processed
              i = k - 1
            } else {
              i = j
            }
          } else {
            i++
          }
        } else {
          i++
        }
      } else {
        i++
      }
      continue
    }

    // Extract correct answer (various formats)
    if (!questionData.correctAnswer) {
      // Pattern 1: "Correct Answer: C" or "**Correct Answer:** C"
      if (line.includes("Correct Answer:") || line.includes("**Correct Answer:**")) {
        const match = line.match(/[A-E]/i)
        if (match) {
          questionData.correctAnswer = match[0].toUpperCase()
          if (questionData.options && questionData.options.length > 0) {
            questionData.options = questionData.options.map((opt) => ({
              ...opt,
              correct: opt.label === questionData.correctAnswer,
            }))
          }
          i++
          continue
        }
      }
      
      // Pattern 2: "ANSWER: C" or "Answer: C"
      if (line.match(/^(?:ANSWER|Answer):\s*([A-E])/i)) {
        const match = line.match(/^(?:ANSWER|Answer):\s*([A-E])/i)
        if (match) {
          questionData.correctAnswer = match[1].toUpperCase()
          if (questionData.options && questionData.options.length > 0) {
            questionData.options = questionData.options.map((opt) => ({
              ...opt,
              correct: opt.label === questionData.correctAnswer,
            }))
          }
          i++
          continue
        }
      }
      
      // Pattern 3: "The correct answer is C" or "Correct option is C"
      if (line.match(/(?:correct|right)\s+(?:answer|option|choice)\s+is\s+([A-E])/i)) {
        const match = line.match(/(?:correct|right)\s+(?:answer|option|choice)\s+is\s+([A-E])/i)
        if (match) {
          questionData.correctAnswer = match[1].toUpperCase()
          if (questionData.options && questionData.options.length > 0) {
            questionData.options = questionData.options.map((opt) => ({
              ...opt,
              correct: opt.label === questionData.correctAnswer,
            }))
          }
          i++
          continue
        }
      }
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
    // This is now only a placeholder marker in the main explanation
    // Per-answer explanations are now inline with choices, so we just skip this line
    if (line.match(/^##+\s+Choice-by-Choice\s+Explanations/i)) {
      // Mark that we've seen the per-answer explanations section (for placeholder insertion)
      seenPerAnswerSection = true
      // Skip this line - it's just a placeholder marker
      i++
      continue
    }

    // Skip per-answer explanations in the old location (after "## Choice-by-Choice Explanations")
    // They should now be inline with choices, so we ignore them here
    // Only process if they haven't been processed inline with choices
    const perAnswerMatch1 = line.match(/^### Explanation\s+([A-E])(?:\s|$)/)
    const perAnswerMatch2 = line.match(/^### Choice\s+([A-E])\s+Explanation/)
    const perAnswerMatch = perAnswerMatch1 || perAnswerMatch2
    if (perAnswerMatch) {
      const answerLabel = perAnswerMatch[1]
      // Only process if this explanation hasn't already been captured inline with the choice
      // If it's already in perAnswerExplanations, skip it (it was processed inline)
      if (answerLabel && !questionData.perAnswerExplanations?.[answerLabel]) {
        let explanationText = ""
        // Continue until we hit the next per-answer explanation, a new major section (##), or end of file
        // Allow all other content including headings, tables, images, etc.
        // Start from the next line after the explanation header
        let j = i + 1
        // Match both formats for stopping condition (more flexible - allows text after "Explanation")
        // Stop at: next per-answer explanation, new major section (##), or end of file
        while (j < lines.length) {
          const currentLine = lines[j].trim()
          
          // Stop at next per-answer explanation
          if (currentLine.match(/^### Explanation\s+[A-E](?:\s|$)/) ||
              currentLine.match(/^### Choice\s+[A-E]\s+Explanation/)) {
            break
          }
          
          // Stop at "## Choice-by-Choice Explanations" header
          if (currentLine.match(/^##+\s+Choice-by-Choice\s+Explanations/i)) {
            break
          }
          
          // Stop at any new major section (##) - this includes "## Management Approach" and similar
          // Only stop at ## (not ###), as ### can be part of the explanation content
          if (currentLine.match(/^##\s+/) && !currentLine.match(/^###\s+/)) {
            // Always stop at "## Explanation" - that's the main explanation section, not part of per-answer explanation
            if (currentLine.match(/^##\s+Explanation/i)) {
              break
            }
            // Stop at other major sections, but don't stop at excluded sections that might appear within per-answer explanations
            if (!currentLine.match(/^##\s+(Choice-by-Choice|Clinical Case|Question|Stem|Topic)/i)) {
              break
            }
          }
          
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
      } else {
        // Skip this line if explanation was already processed inline
        i++
      }
      continue
    }

    // After per-answer explanations, collect any remaining content (like "## Management Approach", "**Key Concept**", tables, images, "**Notes**")
    // and add it to the main explanation
    // This should run after we've seen the per-answer section and processed all per-answer explanations
    const hasPerAnswerSection = seenPerAnswerSection
    const hasPerAnswerExplanations = questionData.perAnswerExplanations && Object.keys(questionData.perAnswerExplanations).length > 0
    
    // Check if we're past the per-answer explanations and should collect remaining content
    // This includes: section headers, bold text like "**Key Concept**", tables, images, notes, etc.
    if (hasPerAnswerSection && hasPerAnswerExplanations) {
      // Check if this is additional content that should be added to main explanation
      // This can be:
      // 1. A section header (## or ###) that's not Explanation, Choice-by-Choice, Clinical Case, Question, Stem, or Topic
      // 2. Content after per-answer explanations (like "**Key Concept**", tables, images, "**Notes**")
      // 3. Per-answer explanation blocks like "(Option A) ..." that haven't been processed yet
      
      // Note: line is already trimmed in the main loop (line 76: const line = lines[i].trim())
      // First, check if this is a per-answer explanation block in the old format "(Option X) ..."
      const isPerAnswerBlock = line.match(/^\(Option\s+([A-E])\)/i)
      if (isPerAnswerBlock) {
        // Skip these - they're duplicates of inline per-answer explanations
        i++
        continue
      }
      
      // Check if this is a section header
      const isSectionHeader = line.match(/^##+\s+/)
      const isExcludedSection = line.match(/^##+\s+(Explanation|Choice-by-Choice|Clinical Case|Question|Stem|Topic)/i)
      const isPerAnswerHeader = line.match(/^###\s+(Explanation|Choice)\s+[A-E]/i)
      const isAdditionalSection = isSectionHeader && !isExcludedSection && !isPerAnswerHeader
      
      // Check if this is content that should be collected (not already processed)
      // This includes: bold text, tables, images, regular text, section headers, etc.
      // We want to collect ANY content after per-answer explanations (except excluded sections and per-answer blocks)
      // Note: line is already trimmed, so we can use it directly
      const isCollectableContent = line && 
        !isExcludedSection && 
        !isPerAnswerHeader &&
        !line.match(/^\(Option\s+[A-E]\)/i) && // Not a per-answer block
        !line.match(/^\*End of test question/i) && // Not end marker
        !line.match(/^Correct Answer:/i) // Not correct answer line (already processed)
      
      // Collect content if:
      // 1. It's a section header (## or ###) that's additional content, OR
      // 2. It's any collectable content and we haven't collected additional content yet
      // We need to collect everything after per-answer explanations until end of file or new major section
      const shouldCollect = (isAdditionalSection || isCollectableContent) && !questionData._additionalContentCollected
      
      if (shouldCollect) {
        let additionalContent = ""
        let j = i
        let startedCollecting = false
        
        // Collect all content until end of file, end marker, or another major section
        while (
          j < lines.length &&
          !lines[j].trim().match(/^##+\s+(Explanation|Choice-by-Choice|Clinical Case|Question|Stem|Topic)/i) &&
          !lines[j].trim().match(/^###\s+(Explanation|Choice)\s+[A-E]/i) &&
          !lines[j].trim().match(/^\*End of test question/i)
        ) {
          const currentLine = lines[j].trim()
          // Skip per-answer blocks in old format
          if (!currentLine.match(/^\(Option\s+[A-E]\)/i)) {
            additionalContent += lines[j] + "\n"
            startedCollecting = true
          }
          j++
        }
        
        // Insert additional content AFTER the per-answer-explanation placeholder
        if (additionalContent.trim() && startedCollecting) {
          const existingExplanation = questionData.mainExplanation || []
          const additionalBlocks = convertMarkdownToExplanationBlocks(additionalContent.trim())
          
          console.log("[MarkdownParser] Collecting additional content after per-answer explanations:", {
            startLine: i,
            endLine: j - 1,
            contentLength: additionalContent.length,
            blockCount: additionalBlocks.length,
            firstFewLines: additionalContent.split("\n").slice(0, 5).join(" | "),
          })
          
          // Find the placeholder block index
          const placeholderIndex = existingExplanation.findIndex(
            (block: any) => block.type === "per-answer-explanation" && block.data?.placeholder === true
          )
          
          if (placeholderIndex >= 0) {
            // Insert additional blocks right after the placeholder
            const insertIndex = placeholderIndex + 1
            
            // Calculate order for new blocks (should be after placeholder)
            const placeholderOrder = existingExplanation[placeholderIndex].order || 0
            additionalBlocks.forEach((block: any, idx: number) => {
              block.order = placeholderOrder + 1 + idx
            })
            
            // Insert blocks after placeholder
            existingExplanation.splice(insertIndex, 0, ...additionalBlocks)
            
            // Renumber all blocks after the inserted blocks to maintain sequential order
            const startRenumberFrom = insertIndex + additionalBlocks.length
            for (let k = startRenumberFrom; k < existingExplanation.length; k++) {
              existingExplanation[k].order = placeholderOrder + additionalBlocks.length + (k - startRenumberFrom) + 1
            }
            
            questionData.mainExplanation = existingExplanation
            questionData._additionalContentCollected = true // Mark that we've collected additional content
            
            console.log("[MarkdownParser] Successfully inserted additional content:", {
              placeholderIndex,
              insertIndex,
              totalBlocks: existingExplanation.length,
              insertedBlocks: additionalBlocks.length,
            })
          } else {
            // Fallback: if no placeholder found, append to end
            const maxOrder = existingExplanation.length > 0 
              ? Math.max(...existingExplanation.map((b: any) => typeof b.order === "number" ? b.order : 0))
              : -1
            additionalBlocks.forEach((block: any, idx: number) => {
              block.order = maxOrder + 1 + idx
            })
            
            questionData.mainExplanation = [...existingExplanation, ...additionalBlocks]
            questionData._additionalContentCollected = true
            
            // Debug: Log when additional content is found (fallback case)
            if (process.env.NODE_ENV === "development") {
              console.log("[MarkdownParser] Found additional content but no placeholder found (fallback):", {
                section: line.trim(),
                startLine: i,
                endLine: j - 1,
                blockCount: additionalBlocks.length,
                firstBlockType: additionalBlocks[0]?.type,
              })
            }
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

  // Try to infer correct answer if not explicitly set
  if (!questionData.correctAnswer) {
    // Method 1: Check if any option is marked as correct
    const correctOption = questionData.options.find((opt) => opt.correct)
    if (correctOption) {
      questionData.correctAnswer = correctOption.label
      console.log(`[parseMarkdown] Inferred correct answer from option flag: ${questionData.correctAnswer}`)
    } else {
      // Method 2: Check for visual markers in option text
      for (const opt of questionData.options) {
        if (opt.text && (opt.text.includes("✅") || opt.text.match(/\(correct\)/i))) {
          questionData.correctAnswer = opt.label
          console.log(`[parseMarkdown] Inferred correct answer from option marker: ${questionData.correctAnswer}`)
          break
        }
      }
    }
    
    // Method 3: Analyze per-answer explanations to infer correct answer
    if (!questionData.correctAnswer && questionData.perAnswerExplanations) {
      const explanationScores: Record<string, number> = {}
      
      // Score each option based on explanation characteristics
      for (const [label, blocks] of Object.entries(questionData.perAnswerExplanations)) {
        if (!Array.isArray(blocks)) continue
        
        let score = 0
        const explanationText = blocks
          .map((block: any) => {
            if (block.type === 'text' && block.data?.markdown) return block.data.markdown
            if (block.type === 'text' && block.data?.content) return block.data.content
            return ''
          })
          .join(' ')
          .toLowerCase()
        
        // Positive indicators (correct answer)
        if (explanationText.includes('correct') || explanationText.includes('right answer')) score += 10
        if (explanationText.includes('gold standard') || explanationText.includes('definitive')) score += 8
        if (explanationText.includes('is the answer') || explanationText.includes('is correct')) score += 7
        if (explanationText.includes('most likely') || explanationText.includes('best answer')) score += 5
        if (explanationText.length > 200) score += 3 // Longer explanations often indicate correct answer
        
        // Negative indicators (incorrect answer)
        if (explanationText.includes('incorrect') || explanationText.includes('wrong')) score -= 5
        if (explanationText.includes('is not') || explanationText.includes('does not')) score -= 3
        if (explanationText.includes('cannot') || explanationText.includes('unlikely')) score -= 2
        
        explanationScores[label] = score
      }
      
      // Find option with highest score
      const sortedScores = Object.entries(explanationScores).sort((a, b) => b[1] - a[1])
      if (sortedScores.length > 0 && sortedScores[0][1] > 0) {
        questionData.correctAnswer = sortedScores[0][0]
        console.log(`[parseMarkdown] Inferred correct answer from explanation analysis: ${questionData.correctAnswer} (score: ${sortedScores[0][1]})`)
      }
    }
    
    // Method 4: Check main explanation for answer hints
    if (!questionData.correctAnswer && questionData.mainExplanation && questionData.mainExplanation.length > 0) {
      const mainText = questionData.mainExplanation
        .map((block: any) => {
          if (block.type === 'text' && block.data?.markdown) return block.data.markdown
          if (block.type === 'text' && block.data?.content) return block.data.content
          return ''
        })
        .join(' ')
        .toLowerCase()
      
      // Look for patterns like "Option C is correct" or "Answer is C"
      const answerPatterns = [
        /(?:option|answer|correct)\s+([a-e])/gi,
        /([a-e])\s+(?:is|are)\s+(?:correct|the answer|right)/gi,
      ]
      
      for (const pattern of answerPatterns) {
        const match = mainText.match(pattern)
        if (match) {
          const letter = match[0].match(/[a-e]/i)?.[0]?.toUpperCase()
          if (letter && ['A', 'B', 'C', 'D', 'E'].includes(letter)) {
            questionData.correctAnswer = letter
            console.log(`[parseMarkdown] Inferred correct answer from main explanation: ${questionData.correctAnswer}`)
            break
          }
        }
      }
    }
    
    // Method 5: Last resort - use first option (better than failing)
    if (!questionData.correctAnswer && questionData.options && questionData.options.length > 0) {
      questionData.correctAnswer = questionData.options[0].label
      console.warn(`[parseMarkdown] ⚠️ Could not determine correct answer, defaulting to first option: ${questionData.correctAnswer}`)
    }
  }

  // Final validation - should not reach here if all methods above worked
  if (!questionData.correctAnswer) {
    throw new Error(
      'Invalid markdown format: Missing correct answer indicator. Please include "Correct Answer: X" where X is A, B, C, D, or E, or set correct_answer in the frontmatter.',
    )
  }
  
  // Ensure the correct option is marked
  if (questionData.options && questionData.correctAnswer) {
    questionData.options = questionData.options.map((opt) => ({
      ...opt,
      correct: opt.label === questionData.correctAnswer,
    }))
  }

  // Final cleanup: Remove any remaining question ID patterns from stem text
  // and extract question ID if it wasn't found earlier
  let finalStem = questionData.stem || ""
  if (finalStem && !questionData.questionId) {
    // Try to extract question ID from stem text if not already found
    const questionIdMatch = finalStem.match(/(?:\*\*)?Question\s*\(ID:\s*([^)]+)\)(?:\*\*)?:?\s*/i)
    if (questionIdMatch && questionIdMatch[1]) {
      questionData.questionId = questionIdMatch[1].trim()
      // Remove the question ID pattern from stem
      finalStem = finalStem.replace(/(?:\*\*)?Question\s*\(ID:\s*[^)]+\)(?:\*\*)?:?\s*/gi, "").trim()
    }
  } else if (finalStem && questionData.questionId) {
    // Remove question ID pattern from stem if it exists (cleanup)
    finalStem = finalStem.replace(/(?:\*\*)?Question\s*\(ID:\s*[^)]+\)(?:\*\*)?:?\s*/gi, "").trim()
  }

  return {
    stem: finalStem,
    options: questionData.options || [],
    correctAnswer: questionData.correctAnswer || "",
    subject: questionData.subject || "General",
    system: questionData.system || "General",
    topic: questionData.topic,
    mainExplanation: questionData.mainExplanation || [],
    perAnswerExplanations: questionData.perAnswerExplanations || {},
    tags: questionData.tags || [],
    questionId: questionData.questionId,
  } as ParsedQuestion
}

/**
 * Ensure long run-on paragraphs get paragraph breaks so rendering shows structure.
 * Used for per-choice explanation content that may be one long paragraph from LLM.
 */
function ensureParagraphBreaksInPlainText(markdown: string): string {
  if (!markdown || markdown.length < 120) return markdown
  if (markdown.includes("\n\n")) return markdown
  if (/^[-*+]\s/m.test(markdown) || /^\d+\.\s/m.test(markdown)) return markdown
  return markdown.replace(/([a-z])\.\s+([A-Z])/g, "$1.\n\n$2")
}

export function convertMarkdownToExplanationBlocks(markdownText: string): any[] {
  const blocks: any[] = []
  // Clean up the markdown: remove unnecessary separators and normalize line breaks
  // Strip "Correct Answer: X" lines so they never appear in explanation blocks
  let cleanedMarkdown = markdownText
    .replace(/^\s*(\*\*)?Correct Answer(\*\*)?\s*:\s*(\*\*)?\s*[A-Ea-e]\s*$/gim, "") // Standalone "Correct Answer: X" line so it never appears in explanation blocks
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

  // Helper function to check if a line is a list item (ordered or unordered, including nested)
  const isListItem = (line: string): boolean => {
    const trimmed = line.trim()
    // Check for unordered list markers: -, *, +
    if (/^[-*+]\s/.test(trimmed)) return true
    // Check for ordered list markers: 1., 2., etc. (with optional indentation)
    if (/^\d+\.\s/.test(trimmed)) return true
    // Check for nested list items (indented with spaces or tabs)
    const indentMatch = line.match(/^(\s*)/)
    if (indentMatch) {
      const indent = indentMatch[1]
      // If line has indentation and matches list pattern, it's a nested list item
      if (indent.length > 0) {
        const afterIndent = trimmed
        if (/^[-*+]\s/.test(afterIndent) || /^\d+\.\s/.test(afterIndent)) return true
      }
    }
    return false
  }

  // Helper function to check if we're still in the same list context
  // (handles empty lines between list items and images within lists)
  const isInListContext = (lines: string[], currentIndex: number): boolean => {
    // Look ahead to find the next non-empty line
    for (let j = currentIndex; j < lines.length; j++) {
      const nextLine = lines[j].trim()
      if (nextLine === "") continue // Skip empty lines
      
      // If next non-empty line is a list item, we're still in list context
      if (isListItem(lines[j])) return true
      
      // If next non-empty line is an image, we're still in list context
      // (images can be part of lists)
      const imageMatches = Array.from(nextLine.matchAll(imagePattern))
      const urlMatch = nextLine.match(urlPattern)
      if (imageMatches.length > 0 || (urlMatch && nextLine === urlMatch[0])) {
        // It's an image - check if there's a list item after it
        // Continue looking for a list item after the image
        for (let k = j + 1; k < lines.length; k++) {
          const afterImageLine = lines[k].trim()
          if (afterImageLine === "") continue
          if (isListItem(lines[k])) return true
          // If we hit something that's not a list item or image, we're not in list context
          break
        }
        return true // Image is part of list context
      }
      
      // Not a list item and not an image, we're not in list context
      return false
    }
    return false
  }

  // Helper function to check if text contains list items
  const textContainsListItems = (text: string): boolean => {
    if (!text) return false
    const textLines = text.split("\n")
    return textLines.some(line => isListItem(line))
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check if current line is an image
    const imageMatches = Array.from(trimmed.matchAll(imagePattern))
    const urlMatch = trimmed.match(urlPattern)
    const isImageLine = imageMatches.length > 0 || (urlMatch && trimmed === urlMatch[0])

    // Handle images (markdown format: ![alt](url))
    // If we're in a list context (currentText contains list items), include image in the list block
    // Also check if next line is a list item - if so, we're in the middle of a list
    if (isImageLine) {
      // Check if we're currently collecting a list
      if (textContainsListItems(currentText)) {
        // We're in a list - add image to current list block
        currentText += "\n" + line
      i++
      continue
      } else {
        // Check if the next non-empty line is a list item - if so, we're in the middle of a list
        // This handles the case where list items 1-2 were already flushed, but item 3 is coming
        const nextIsListItem = isInListContext(lines, i + 1)
        if (nextIsListItem) {
          // Next line is a list item - this image is part of a list
          // Check if previous block ended with a list item (we need to check the last block)
          // For now, add it to currentText and the next list item will handle continuation
          if (currentText) {
            currentText += "\n" + line
          } else {
            currentText = line
          }
          i++
          continue
        } else {
          // Not in a list - add to current text block
          if (currentText) {
            currentText += "\n" + line
          } else {
            currentText = line
          }
          i++
          continue
        }
      }
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
    
    // Handle lists (ordered and unordered) - keep them together in a single block
    // This includes images within the list to preserve numbering
    if (isListItem(line)) {
      // Check if we're already collecting a list in currentText
      if (textContainsListItems(currentText)) {
        // We're continuing an existing list - add this item to currentText and continue collecting
        currentText += "\n" + line
        i++
        
        // Continue collecting more list items, images, etc.
        let continueCollecting = true
        while (i < lines.length && continueCollecting) {
          const nextLine = lines[i]
          const nextTrimmed = nextLine.trim()
          
          if (nextTrimmed === "") {
            // Empty line - check if we're still in list context
            if (isInListContext(lines, i + 1)) {
              currentText += "\n"
              i++
              continue
            } else {
              continueCollecting = false
              break
            }
          } else if (isListItem(nextLine)) {
            // It's a list item, add it
            currentText += "\n" + nextLine
            i++
          } else {
            // Check if it's an image line
            const imageMatches = Array.from(nextTrimmed.matchAll(imagePattern))
            const urlMatch = nextTrimmed.match(urlPattern)
            
            if (imageMatches.length > 0 || (urlMatch && nextTrimmed === urlMatch[0])) {
              // It's an image - include it in the list block
              currentText += "\n" + nextLine
              i++
              continue
            } else {
              // Not a list item and not an image, end the list
              continueCollecting = false
              break
            }
          }
        }
        continue
      }
      
      // Starting a new list - flush any non-list text before starting
      if (currentText.trim() && !textContainsListItems(currentText)) {
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          order: blockOrder++,
          data: { markdown: currentText.trim() },
        })
        currentText = ""
      }
      
      // Collect all list items, including empty lines and images between them
      // Start with the current line (which is a list item)
      const listItems: string[] = [line]
      i++ // Move past the first list item - we've already processed it
      let inList = true
      
      while (i < lines.length && inList) {
        const currentLine = lines[i]
        const currentTrimmed = currentLine.trim()
        
        if (currentTrimmed === "") {
          // Empty line - check if we're still in list context
          if (isInListContext(lines, i + 1)) {
            // Next non-empty line is still a list item or image, keep the empty line
            listItems.push("")
            i++
            continue
          } else {
            // Next non-empty line is not a list item or image, end the list
            inList = false
            break
          }
        } else if (isListItem(currentLine)) {
          // It's a list item, add it
          listItems.push(currentLine)
          i++
        } else {
          // Check if it's an image line - if so, include it in the list block
          const imageMatches = Array.from(currentTrimmed.matchAll(imagePattern))
          const urlMatch = currentTrimmed.match(urlPattern)
          
          if (imageMatches.length > 0 || (urlMatch && currentTrimmed === urlMatch[0])) {
            // It's an image - include it in the list block to preserve numbering
            listItems.push(currentLine)
            i++
            // Continue collecting - next line might be another list item
            continue
          } else {
            // Not a list item and not an image
            // Check if we should still continue (e.g., if next line is a list item after some non-list content)
            // For now, end the list - we can't include non-list, non-image content
            inList = false
            break
          }
        }
      }
      
      // Add the complete list (including images) as a single text block
      if (listItems.length > 0) {
        // Remove trailing empty lines
        while (listItems.length > 0 && listItems[listItems.length - 1] === "") {
          listItems.pop()
      }
      blocks.push({
        id: blockIdCounter++,
        type: "text",
        order: blockOrder++,
        data: { markdown: listItems.join("\n") },
      })
      }
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
    // Handle markdown tables - keep them as part of text blocks instead of separate table blocks
    else if (trimmed.startsWith("|") || trimmed.match(/^\|[\s\-\|:]+\|$/)) {
      // Collect all table lines and add them to current text block
      // This includes table rows (| col1 | col2 |) and separator rows (| --- | --- |)
      const tableLines: string[] = []
      let inTable = true
      
      while (i < lines.length && inTable) {
        const currentLine = lines[i]
        const currentTrimmed = currentLine.trim()
        
        // Check if it's a table row (starts and ends with |)
        if (currentTrimmed.startsWith("|") && currentTrimmed.endsWith("|")) {
          tableLines.push(currentLine)
          i++
        } 
        // Check if it's a separator row (| --- | --- | or |--------|-------------|)
        else if (currentTrimmed.match(/^\|[\s\-\|:]+\|$/)) {
          tableLines.push(currentLine)
        i++
      }
        // Empty line might be part of table (some markdown allows blank lines in tables)
        else if (currentTrimmed === "" && tableLines.length > 0) {
          // If we have table lines and encounter empty line, check next line
          // If next line is also a table line, include the empty line
          if (i + 1 < lines.length) {
            const nextTrimmed = lines[i + 1].trim()
            if (nextTrimmed.startsWith("|") || nextTrimmed.match(/^\|[\s\-\|:]+\|$/)) {
              tableLines.push(currentLine)
              i++
            } else {
              inTable = false
            }
          } else {
            inTable = false
          }
        } else {
          // Not a table line, stop collecting
          inTable = false
        }
      }
      
      // Add table lines to current text block (with newlines)
      if (tableLines.length > 0) {
        currentText += (currentText ? "\n" : "") + tableLines.join("\n")
      }
      // Don't increment i here since the while loop already did
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
      // Empty line - check if we should flush or continue
      // If current text ends with a list item and next non-empty line is also a list item,
      // keep the empty line and continue (don't flush)
      if (currentText.trim()) {
        const currentTextLines = currentText.trim().split("\n")
        const lastLine = currentTextLines[currentTextLines.length - 1]
        
        // Check if the last line in current text is a list item
        const lastLineIsListItem = isListItem(lastLine)
        
        // Check if next non-empty line is a list item
        const nextIsListItem = isInListContext(lines, i + 1)
        
        if (lastLineIsListItem && nextIsListItem) {
          // We're in the middle of a list, keep the empty line and continue
          currentText += "\n"
          i++
          continue
        } else {
          // Not in a list context, flush the current text
        blocks.push({
          id: blockIdCounter++,
          type: "text",
          order: blockOrder++,
          data: { markdown: currentText.trim() },
        })
        currentText = ""
        }
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

  // For text blocks that are long run-on paragraphs (no lists, no double newlines),
  // insert paragraph breaks so per-choice explanations render with structure.
  const normalizedBlocks = blocks.map((block) => {
    if (block.type === "text" && block.data?.markdown) {
      const md = ensureParagraphBreaksInPlainText(block.data.markdown)
      if (md !== block.data.markdown) {
        return { ...block, data: { ...block.data, markdown: md } }
      }
    }
    return block
  })

  // Ensure blocks are sorted by order (should already be in order, but just in case)
  return normalizedBlocks.sort((a, b) => {
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
