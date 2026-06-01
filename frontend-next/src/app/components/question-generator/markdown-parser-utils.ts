import {
  parseTagsFromString,
  parseTagsFromYamlLine,
  parseKeywordBlock,
  extractSystemFirstSegment,
  parseHierarchyLabelLine,
} from "./parse-metadata-utils"

/** Preserve stem markdown as produced by the converter (no line-merging). */
function normalizeQuestionStemParagraphs(stem: string): string {
  if (!stem || !stem.trim()) return stem
  return stem.replace(/\n{3,}/g, "\n\n").trim()
}

type ExplanationBlock = {
  id: number
  type: string
  order: number
  data: Record<string, unknown>
}

const PER_ANSWER_SLOT = "<!--PER_ANSWER_EXPLANATION_SLOT-->";

/** One markdown pass for ## Explanation; slot marker becomes the per-answer UI placeholder. */
function parseExplanationSection(
  lines: string[],
  startIndex: number,
  convertMd: (text: string) => ExplanationBlock[],
): { blocks: ExplanationBlock[]; lastIndex: number } {
  const body: string[] = []
  let j = startIndex + 1

  while (j < lines.length) {
    const t = lines[j].trim()
    if (t.match(/^##\s+(Question|Clinical Case|Stem)\s*$/i)) break
    if (t.match(/^##\s+Choice-by-Choice\s+Explanations\s*$/i)) {
      body.push(PER_ANSWER_SLOT)
      j++
      continue
    }
    body.push(lines[j])
    j++
  }

  const blocks: ExplanationBlock[] = []
  let blockId = Date.now()
  const parts = body.join("\n").split(PER_ANSWER_SLOT)

  parts.forEach((part, idx) => {
    const text = part.trim()
    if (text) {
      convertMd(text).forEach((b) => {
        b.id = blockId++
        b.order = blocks.length
        blocks.push(b)
      })
    }
    if (idx < parts.length - 1) {
      blocks.push({
        id: blockId++,
        type: "per-answer-explanation",
        order: blocks.length,
        data: { placeholder: true, isPerAnswerExplanation: true },
      })
    }
  })

  return { blocks, lastIndex: j - 1 }
}

export interface ParsedQuestion {
  stem: string
  options: Array<{ label: string; text: string; correct: boolean }>
  correctAnswer: string
  productId: string
  product?: string
  category?: string
  subject?: string
  system: string
  topic?: string
  subtopic?: string
  title?: string
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
          questionData.title = fullTitle.trim()
          // Split by " — " (em dash) to separate Product and System
          const titleParts = fullTitle.split(" — ")
          if (titleParts.length >= 2) {
            // Product ID is the first part (maps to Product)
            questionData.productId = titleParts[0].trim()
            // System: only first segment (e.g. "Female Reproductive System") for strict chapter matching
            questionData.system = extractSystemFirstSegment(titleParts.slice(1).join(" — ").trim())
          } else if (titleParts.length === 1) {
            // If no " — " separator, use entire title as product
            questionData.productId = titleParts[0].trim()
          }
        }
      }
      if (yamlLine.includes("tags:")) {
        const parsed = parseTagsFromYamlLine(yamlLine)
        if (parsed) questionData.tags = parsed
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
  let keywordsFromSection: Array<{ keyword: string; explanation: string }> = []

  // Parse rest of the file
  while (i < lines.length) {
    const line = lines[i].trim()

    // Extract hierarchy metadata lines (plain or **Label:** value).
    const hierarchyLine = parseHierarchyLabelLine(line)
    if (hierarchyLine) {
      const label = hierarchyLine.label.toLowerCase().replace(/\s+/g, "")
      const value = hierarchyLine.value
      if (label === "category") {
        questionData.category = value
        questionData.subject = value
      } else if (label === "product") {
        questionData.product = value
        questionData.productId = value
      } else if (label === "system") {
        questionData.system = extractSystemFirstSegment(value)
      } else if (label === "topic") {
        questionData.topic = value
      } else if (label === "subtopic" || label === "sub-topic") {
        questionData.subtopic = value
      } else if (label === "mcqtitle") {
        questionData.title = value
      }
      i++
      continue
    }

    // Extract title (# Title) - fallback if YAML not present
    if (line.startsWith("# ") && !questionData.productId) {
      const titleText = line.slice(2).trim()
      // Split by " — " (em dash) to separate Product and System
      const titleParts = titleText.split(" — ")
      if (titleParts.length >= 2) {
        // Product ID is the first part (maps to Product)
        questionData.productId = titleParts[0].trim()
        // System: only first segment for strict chapter matching
        questionData.system = extractSystemFirstSegment(titleParts.slice(1).join(" — ").trim())
      } else if (titleParts.length === 1) {
        // If no " — " separator, use entire title as product
        questionData.productId = titleParts[0].trim()
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

    // Extract subtopic (## Subtopic: ...)
    if (line.match(/^##\s+Subtopic:\s*(.+)/i)) {
      const subtopicMatch = line.match(/^##\s+Subtopic:\s*(.+)/i)
      if (subtopicMatch) {
        questionData.subtopic = subtopicMatch[1].trim()
      }
      i++
      continue
    }

    // Extract Keywords section (## Keywords or ### Keywords or ### Keywords in the Stem...)
    // Same parsing logic as DOCX via parseKeywordBlock for consistency
    if (line.match(/^##+\s+Keywords/i) || line.match(/^###\s+Keywords\s+in\s+the\s+Stem/i)) {
      let keywordLines: string[] = []
      const sectionLevel = (line.match(/^(#+)/) || [])[1]?.length ?? 2
      i++
      while (i < lines.length) {
        const next = lines[i]
        const nextTrimmed = next.trim()
        if (!nextTrimmed) {
          keywordLines.push(next)
          i++
          continue
        }
        const nextHeader = nextTrimmed.match(/^(#+)\s/)
        if (nextHeader && nextHeader[1].length <= sectionLevel) break
        keywordLines.push(next)
        i++
      }
      const parsed = parseKeywordBlock(keywordLines.join("\n"))
      if (parsed.length > 0) keywordsFromSection = parsed
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
      // Collect text until we hit options, "## Options and Explanations", or another section (stem = all content before that)
      while (
        i < lines.length &&
        !lines[i].trim().match(/^\*?\*?[A-E]\.\*?\*?\s+/) &&
        !lines[i].match(/^##+\s+Options and Explanations/i) &&
        !lines[i].match(/^##+ (Explanation|Choice-by-Choice|Additional|Raw|Example|Question)/) &&
        !lines[i].trim().match(/^### (?:Explanation|Choice)\s+[A-E]/)
      ) {
        const currentLine = lines[i]
        // Skip empty lines and horizontal rules, but keep other content
        const trimmed = currentLine.trim()
        if (trimmed && trimmed !== "---" && !trimmed.match(/^---+$/)) {
          // Stop at "## Options and Explanations" or other section headers (do not include that line in stem)
          if (trimmed.match(/^##+\s+Options and Explanations/i)) break
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
      questionData.stem = normalizeQuestionStemParagraphs(caseLines.join("\n"))
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
          stemLines.push(prevLine)
        } else if (!trimmed) {
          // Preserve empty lines
          stemLines.push("")
        }
      }
      questionData.stem = normalizeQuestionStemParagraphs(stemLines.join("\n"))
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
      const { blocks, lastIndex } = parseExplanationSection(
        lines,
        i,
        convertMarkdownToExplanationBlocks,
      )
      if (keywordsFromSection.length > 0) {
        const keywordsMarkdown =
          "### Keywords in the Stem to Identify the Correct Option\n\n" +
          keywordsFromSection.map((kw) => `- **"${kw.keyword}"** – ${kw.explanation}`).join("\n") +
          "\n"
        blocks.unshift({
          id: Date.now(),
          type: "text",
          order: 0,
          data: { markdown: keywordsMarkdown },
        })
        blocks.forEach((block, idx) => {
          block.order = idx
        })
        keywordsFromSection = []
      }
      questionData.mainExplanation = blocks
      i = lastIndex
      i++
      continue
    }

    // Extract tags (body line) – same logic as DOCX for consistency
    if (line.startsWith("Tags:") || line.startsWith("**Tags:**")) {
      const tagsText = line.replace(/\*\*Tags:\*\*|Tags:/i, "").trim()
      const parsed = parseTagsFromString(tagsText)
      if (parsed.length > 0) questionData.tags = parsed
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

  // Final cleanup: Remove question ID patterns and "Options and Explanations" from stem
  let finalStem = questionData.stem || ""
  finalStem = finalStem
    .replace(/\n\s*#+\s*Options and Explanations\s*(?=\n|$)/gim, "\n")
    .replace(/\n\s*\*\*Options and Explanations\*\*\s*(?=\n|$)/gim, "\n")
    .replace(/\n\s*Options and Explanations\s*(?=\n|$)/gim, "\n")
    .replace(/^\s*#+\s*Options and Explanations\s*(?=\n|$)/gim, "")
    .replace(/^\s*\*\*Options and Explanations\*\*\s*(?=\n|$)/gim, "")
    .replace(/^\s*Options and Explanations\s*(?=\n|$)/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
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
    productId: questionData.productId || "General",
    product: questionData.product,
    category: questionData.category,
    subject: questionData.subject || questionData.category,
    system: questionData.system || "General",
    topic: questionData.topic,
    subtopic: questionData.subtopic,
    title: questionData.title,
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

const MD_TABLE_ROW_RE = /^\|.+\|$/;
const MD_TABLE_SEP_RE = /^\|[\s\-:|]+\|$/;
const MD_IMAGE_LINE_RE = /!\[[^\]]*\]\([^)]+\)/;
const IMAGE_PLACEHOLDER_RE = /\[IMAGE_PLACEHOLDER:[^\]]+\]/i;

function isMdTableRow(line: string): boolean {
  const t = line.trim();
  return MD_TABLE_ROW_RE.test(t) || MD_TABLE_SEP_RE.test(t);
}

function isStandaloneImageLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const stripped = t.replace(MD_IMAGE_LINE_RE, "").replace(IMAGE_PLACEHOLDER_RE, "").trim();
  return stripped.length === 0 && (MD_IMAGE_LINE_RE.test(t) || IMAGE_PLACEHOLDER_RE.test(t));
}

/**
 * Split markdown into blocks in strict source order.
 * Only splits on HTML tables and standalone image lines; everything else stays in reading order.
 */
export function convertMarkdownToExplanationBlocks(markdownText: string): any[] {
  const cleanedMarkdown = markdownText
    .replace(/^\s*(\*\*)?Correct Answer(\*\*)?\s*:\s*(\*\*)?\s*[A-Ea-e]\s*$/gim, "")
    .replace(/^---+$/gm, "")
    .trim();

  if (!cleanedMarkdown) return [];

  const lines = cleanedMarkdown.split("\n");
  const blocks: any[] = [];
  let textBuf: string[] = [];
  let blockId = Date.now();
  let blockOrder = 0;
  let i = 0;

  const flushText = () => {
    const md = textBuf.join("\n").trim();
    textBuf = [];
    if (!md) return;
    const withBreaks = ensureParagraphBreaksInPlainText(md);
    blocks.push({
      id: blockId++,
      type: "text",
      order: blockOrder++,
      data: { markdown: withBreaks },
    });
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/<table[\s>]/i.test(trimmed)) {
      flushText();
      let htmlTable = line;
      i++;
      while (i < lines.length && !/<\/table>/i.test(htmlTable)) {
        htmlTable += "\n" + lines[i];
        i++;
      }
      blocks.push({
        id: blockId++,
        type: "table",
        order: blockOrder++,
        data: { html: htmlTable },
      });
      continue;
    }

    if (isStandaloneImageLine(line)) {
      flushText();
      blocks.push({
        id: blockId++,
        type: "text",
        order: blockOrder++,
        data: { markdown: line.trim() },
      });
      i++;
      continue;
    }

    if (isMdTableRow(trimmed)) {
      flushText();
      const tableLines: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (isMdTableRow(t)) {
          tableLines.push(lines[i]);
          i++;
          continue;
        }
        if (t === "" && i + 1 < lines.length && isMdTableRow(lines[i + 1].trim())) {
          tableLines.push(lines[i]);
          i++;
          continue;
        }
        break;
      }
      blocks.push({
        id: blockId++,
        type: "text",
        order: blockOrder++,
        data: { markdown: tableLines.join("\n") },
      });
      continue;
    }

    textBuf.push(line);
    i++;
  }

  flushText();
  return blocks;
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
