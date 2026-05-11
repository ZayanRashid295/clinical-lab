import { ParsedDocxContent, replaceImageUrls, htmlTableToMarkdown } from "./docx-parser-utils";
import { replaceImagePaths } from "./markdown-parser-utils";
import { ParsedQuestion } from "./markdown-parser-utils";
import { convertMarkdownToExplanationBlocks } from "./markdown-parser-utils";
import { parseKeywordBlock, extractSystemFirstSegment } from "./parse-metadata-utils";

/**
 * Structure extracted from DOCX using AI or rule-based parsing
 */
export interface StructuredQuestionData {
  questionId?: string;
  productId?: string;
  subject?: string;
  system?: string;
  topic?: string;
  difficulty?: string;
  tags?: string[];
  stem?: string;
  options?: Array<{ label: string; text: string; correct: boolean }>;
  correctAnswer?: string;
  keywords?: Array<{ keyword: string; explanation: string }>;
  perAnswerExplanations?: Record<string, string>;
  mainExplanation?: string;
}

/**
 * Convert unstructured DOCX content to structured question data
 * Uses rule-based parsing first, with AI fallback if needed
 */
export async function convertDocxToQuestion(
  docxContent: ParsedDocxContent
): Promise<StructuredQuestionData> {
  const { text, html, imageMapping } = docxContent;

  // Replace image URLs in content
  const processedHtml = replaceImageUrls(html, imageMapping);
  const processedText = replaceImageUrls(text, imageMapping);

  // Try rule-based parsing first
  const structured = parseDocxWithRules(processedText, processedHtml);

  // If rule-based parsing fails or is incomplete, use AI
  if (!structured.stem || !structured.options || structured.options.length === 0) {
    console.warn("Rule-based parsing incomplete, attempting AI parsing...");
    // For now, we'll enhance with AI if available
    // This can be implemented later with OpenAI/Gemini API
  }

  return structured;
}

/**
 * Rule-based parser for DOCX content
 * Extracts question components based on common patterns
 */
function parseDocxWithRules(
  text: string,
  html: string
): StructuredQuestionData {
  const data: StructuredQuestionData = {
    tags: [],
    perAnswerExplanations: {},
  };

  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);

  // Extract Question ID
  const questionIdMatch = text.match(/Question\s+Id:\s*(\d+)/i);
  if (questionIdMatch) {
    data.questionId = questionIdMatch[1];
  }

  // Extract Subject and System
  const subjectMatch = text.match(/Subject:\s*([^\n]+)/i);
  if (subjectMatch) {
    const subjectLine = subjectMatch[1];
    // Try to extract subject and system
    if (subjectLine.includes("(") && subjectLine.includes(")")) {
      const parts = subjectLine.split(/[()]/);
      data.subject = parts[0].trim();
      if (parts[1]) {
        data.system = extractSystemFirstSegment(parts[1].trim());
      }
    } else {
      data.subject = subjectLine;
    }
  }

  // Optional: explicit System: line (normalize to first segment only)
  const systemMatch = text.match(/System:\s*([^\n]+)/i);
  if (systemMatch) {
    data.system = extractSystemFirstSegment(systemMatch[1].trim());
  }

  // Extract Topic
  const topicMatch = text.match(/Topic:\s*([^\n]+)/i);
  if (topicMatch) {
    data.topic = topicMatch[1].trim();
  }

  // Extract Difficulty
  const difficultyMatch = text.match(/Difficulty\s+Level:\s*(\w+)/i);
  if (difficultyMatch) {
    data.difficulty = difficultyMatch[1].toLowerCase();
  } else {
    data.difficulty = "medium"; // Default
  }

  // Extract Question Stem
  // Look for patterns like "Q 01:", "Question:", etc.
  const questionPatterns = [
    /Q\s*\d+:\s*([\s\S]+?)(?=Atopic|Papular|Scabies|ANSWER|Keywords|Explanation)/i,
    /Question[^:]*:\s*([\s\S]+?)(?=Atopic|Papular|Scabies|ANSWER|Keywords|Explanation)/i,
  ];

  for (const pattern of questionPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.stem = match[1]
        .trim()
        .replace(/\s+/g, " ")
        .replace(/Question\s+Id:\s*\d+/gi, "")
        .trim();
      break;
    }
  }

  // Extract Options (A, B, C, D, E)
  const options: Array<{ label: string; text: string; correct: boolean }> = [];
  
  // Find options section (usually after question, before ANSWER)
  const answerIndex = text.search(/ANSWER:/i);
  const optionsSection = answerIndex > 0 ? text.substring(0, answerIndex) : text;

  // Try pattern 1: Options with labels (A. Option text)
  const optionPattern1 = /^([A-E])\.\s*(.+)$/i;
  const optionLines = optionsSection.split("\n");
  
  let foundLabeledOptions = false;
  for (const line of optionLines) {
    const match = line.match(optionPattern1);
    if (match) {
      const label = match[1].toUpperCase();
      const optionText = match[2].trim();
      options.push({
        label,
        text: optionText,
        correct: false, // Will be set below
      });
      foundLabeledOptions = true;
    }
  }

  // Try pattern 2: Options without labels (just text lines before ANSWER)
  // Look for lines that appear to be options (not empty, not part of question stem)
  if (!foundLabeledOptions && options.length === 0) {
    // Find the question stem end and ANSWER start
    const questionEndPattern = /(Question\s+Id:\s*\d+\)|\)\s*$)/i;
    const questionEndMatch = optionsSection.match(questionEndPattern);
    const questionEndIndex = questionEndMatch ? questionEndMatch.index! + questionEndMatch[0].length : 0;
    
    // Get lines after question stem
    const afterQuestion = optionsSection.substring(questionEndIndex);
    const potentialOptions = afterQuestion
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^(Keywords|Explanation|Subject|System|Topic)/i));
    
    // Take the last 5 non-empty lines before ANSWER as options
    const optionLabels = ["A", "B", "C", "D", "E"];
    const lastLines = potentialOptions.slice(-5);
    
    for (let i = 0; i < lastLines.length && i < optionLabels.length; i++) {
      const optionText = lastLines[i].trim();
      // Skip if it looks like a section header
      if (!optionText.match(/^(Keywords|Explanation|Subject|System|Topic|Classic)/i)) {
        options.push({
          label: optionLabels[i],
          text: optionText,
          correct: false,
        });
      }
    }
  }

  data.options = options;

  // Extract Correct Answer
  const answerMatch = text.match(/ANSWER:\s*([A-E])/i);
  if (answerMatch && data.options) {
    const correctLabel = answerMatch[1].toUpperCase();
    data.correctAnswer = correctLabel;
    // Mark correct option
    data.options = data.options.map((opt) => ({
      ...opt,
      correct: opt.label === correctLabel,
    }));
  }

  // Extract Keywords Section – same parseKeywordBlock as Markdown for consistency
  const keywordsSectionMatch = text.match(
    /Keywords[^:]*:\s*([\s\S]+?)(?=Explanation|Choice-by-Choice|Subject:|Topic:|$)/i
  );
  if (keywordsSectionMatch) {
    const keywordsText = keywordsSectionMatch[1].trim();
    const keywords = parseKeywordBlock(keywordsText);
    if (keywords.length > 0) data.keywords = keywords;
  }

  // Extract Per-Answer Explanations
  const explanationMatch = text.match(/Explanation\s*([\s\S]+?)(?=Subject:|Topic:|$)/i);
  if (explanationMatch) {
    const explanationText = explanationMatch[1];
    
    // Extract per-answer explanations: (Option A) ..., (Option B) ...
    const perAnswerPattern = /\(Option\s+([A-E])\)\s*([^:]+):\s*([\s\S]+?)(?=\(Option|Subject:|Topic:|$)/gi;
    let match;
    const perAnswerExplanations: Record<string, string> = {};

    while ((match = perAnswerPattern.exec(explanationText)) !== null) {
      const label = match[1].toUpperCase();
      const optionName = match[2].trim();
      const explanation = match[3].trim();
      perAnswerExplanations[label] = `${optionName}: ${explanation}`;
    }

    data.perAnswerExplanations = perAnswerExplanations;

    // Extract main explanation (after per-answer explanations)
    const mainExplanationStart = explanationText.lastIndexOf(")");
    if (mainExplanationStart > 0) {
      const mainExplanationText = explanationText
        .substring(mainExplanationStart + 1)
        .trim();
      
      // Remove "Subject:", "Topic:" etc. from end
      const cleanedExplanation = mainExplanationText
        .replace(/Subject:[\s\S]*$/i, "")
        .replace(/Topic:[\s\S]*$/i, "")
        .replace(/System:[\s\S]*$/i, "")
        .trim();

      if (cleanedExplanation) {
        data.mainExplanation = cleanedExplanation;
      }
    }
  }

  // Extract Tags from Subject/System
  if (data.subject) {
    data.tags = [data.subject];
    if (data.system) {
      data.tags.push(data.system);
    }
  }

  return data;
}

/**
 * Convert structured question data to ParsedQuestion format
 */
export function convertStructuredToParsedQuestion(
  structured: StructuredQuestionData,
  imageMapping: Record<string, string>
): ParsedQuestion {
  // Build keywords section markdown
  let keywordsMarkdown = "";
  if (structured.keywords && structured.keywords.length > 0) {
    keywordsMarkdown = "### Keywords in the Stem to Identify the Correct Option\n\n";
    structured.keywords.forEach((kw) => {
      keywordsMarkdown += `- **"${kw.keyword}"** – ${kw.explanation}\n`;
    });
  }

  // Build main explanation blocks
  const mainExplanationBlocks: any[] = [];

  // Add keywords block if present
  if (keywordsMarkdown) {
    mainExplanationBlocks.push({
      id: Date.now(),
      type: "text",
      order: 0,
      data: {
        markdown: keywordsMarkdown,
      },
    });
  }

  // Add placeholder for per-answer explanations
  if (structured.perAnswerExplanations && Object.keys(structured.perAnswerExplanations).length > 0) {
    mainExplanationBlocks.push({
      id: Date.now() + 1,
      type: "per-answer-explanation",
      order: mainExplanationBlocks.length,
      data: {
        placeholder: true,
        isPerAnswerExplanation: true,
      },
    });
  }

  // Add main explanation content
  if (structured.mainExplanation) {
    // Replace image URLs in explanation (handle both string and HTML)
    let processedExplanation = structured.mainExplanation;
    if (typeof processedExplanation === 'string') {
      processedExplanation = replaceImageUrls(processedExplanation, imageMapping);
      // Convert tables in HTML to markdown if present
      processedExplanation = htmlTableToMarkdown(processedExplanation);
    }
    
    // Convert to blocks
    const explanationBlocks = convertMarkdownToExplanationBlocks(processedExplanation);
    
    // Add blocks with proper ordering
    explanationBlocks.forEach((block, idx) => {
      mainExplanationBlocks.push({
        ...block,
        order: mainExplanationBlocks.length + idx,
      });
    });
  }

  // Convert per-answer explanations to blocks
  const perAnswerExplanations: Record<string, any[]> = {};
  if (structured.perAnswerExplanations) {
    for (const [label, explanation] of Object.entries(structured.perAnswerExplanations)) {
      let processedExplanation = explanation;
      if (typeof processedExplanation === 'string') {
        processedExplanation = replaceImageUrls(processedExplanation, imageMapping);
      }
      perAnswerExplanations[label] = convertMarkdownToExplanationBlocks(processedExplanation);
    }
  }

  return {
    stem: structured.stem || "",
    options: structured.options || [],
    correctAnswer: structured.correctAnswer || "",
    productId: structured.productId || "",
    subject: structured.subject || "General",
    system: structured.system || "General",
    topic: structured.topic,
    mainExplanation: mainExplanationBlocks,
    perAnswerExplanations,
    tags: structured.tags || [],
    questionId: structured.questionId,
  };
}
