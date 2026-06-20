import { convertMarkdownToExplanationBlocks } from "../markdown-parser-utils";
import { generateBlockId } from "../rich-editor/types";
import { coerceLabelString } from "../metadata-label-utils";
import { buildTableHtmlFromRows } from "./table-html-utils";
import type { Choice } from "../choice-system/types";
import type { QuestionCreatorData } from "../question-creator/types";
import type { QuestionData } from "./types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isMeaningfulHtml(html?: string): boolean {
  if (!html?.trim()) return false;
  const stripped = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<\/?p>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return stripped.length > 0;
}

function labeledRichTextBlock(
  label: string,
  text: string | undefined,
  html: string | undefined,
  order: number,
): ContentBlock {
  const markdown = `${label} ${text ?? ""}`.trim();
  const bodyHtml = isMeaningfulHtml(html)
    ? html!.replace(/^<p>|<\/p>$/g, "").replace(/^<br\s*\/?>/i, "").trim()
    : text
      ? escapeHtml(text)
      : "";
  const blockHtml = bodyHtml
    ? `<p><strong>${label}</strong> ${bodyHtml}</p>`
    : "";
  return richTextBlock(markdown, blockHtml || undefined, order);
}

function textBlock(markdown: string, order: number, html = ""): ContentBlock {
  return {
    id: generateBlockId(),
    type: "text",
    order,
    data: { html, markdown },
  };
}

function richTextBlock(
  markdown: string,
  html: string | undefined,
  order: number,
): ContentBlock {
  return textBlock(markdown, order, html?.trim() || "");
}

function tableBlock(html: string, order: number): ContentBlock {
  return {
    id: generateBlockId(),
    type: "table",
    order,
    data: { tableHtml: html, html },
  };
}

function imageBlock(url: string, alt: string, order: number): ContentBlock {
  return {
    id: generateBlockId(),
    type: "image",
    order,
    data: {
      images: [{ url, alt, id: generateBlockId() }],
    },
  };
}

function perAnswerPlaceholder(order: number): ContentBlock {
  return {
    id: generateBlockId(),
    type: "per-answer-explanation",
    order,
    data: {
      placeholder: true,
      isPerAnswerExplanation: true,
      allChoices: true,
    },
  };
}

function buildPerAnswerBlocks(exp: {
  title: string;
  body: string;
  bodyHtml?: string;
  clinicalReasoning?: string;
  clinicalReasoningHtml?: string;
  systemInvolved?: string;
  systemInvolvedHtml?: string;
}): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let order = 0;

  if (exp.body || exp.bodyHtml) {
    blocks.push(richTextBlock(exp.body, exp.bodyHtml, order++));
  }
  if (exp.clinicalReasoning || exp.clinicalReasoningHtml) {
    blocks.push(
      labeledRichTextBlock(
        "Clinical reasoning:",
        exp.clinicalReasoning,
        exp.clinicalReasoningHtml,
        order++,
      ),
    );
  }
  if (exp.systemInvolved || exp.systemInvolvedHtml) {
    blocks.push(
      labeledRichTextBlock(
        "System involved:",
        exp.systemInvolved,
        exp.systemInvolvedHtml,
        order++,
      ),
    );
  }

  return blocks.length
    ? blocks
    : (convertMarkdownToExplanationBlocks(buildPerAnswerMarkdown(exp)) as ContentBlock[]);
}

function buildPerAnswerMarkdown(exp: {
  title: string;
  body: string;
  clinicalReasoning?: string;
  systemInvolved?: string;
}): string {
  const parts: string[] = [];
  if (exp.body) parts.push(exp.body);
  if (exp.clinicalReasoning) {
    parts.push(`Clinical reasoning: ${exp.clinicalReasoning}`);
  }
  if (exp.systemInvolved) {
    parts.push(`System involved: ${exp.systemInvolved}`);
  }
  return parts.join("\n\n");
}

function keywordsMarkdownFromData(data: QuestionData): string {
  const heading = "### Keywords in the Stem to Identify the Correct Option\n\n";
  const usesOrderedList = data.keywordsHtml?.some((html) => html.includes("<ol")) ?? false;
  if (usesOrderedList) {
    return heading + data.keywords.map((keyword, index) => `${index + 1}. ${keyword}`).join("\n");
  }
  return heading + data.keywords.map((keyword) => `- ${keyword}`).join("\n");
}

function keywordsHtmlFromData(data: QuestionData): string {
  const heading = "<h3>Keywords in the Stem to Identify the Correct Option</h3>";
  const body =
    data.keywordsHtml?.length
      ? mergeAdjacentListHtml(data.keywordsHtml.join(""))
      : `<ul>${data.keywords.map((keyword) => `<li>${escapeHtml(keyword)}</li>`).join("")}</ul>`;
  return heading + body;
}

function mergeAdjacentListHtml(html: string): string {
  let merged = html;
  let previous = "";
  while (merged !== previous) {
    previous = merged;
    merged = merged.replace(/<\/ol>\s*<ol>/g, "").replace(/<\/ul>\s*<ul>/g, "");
  }
  return merged;
}

function buildMainExplanationBlocks(
  data: QuestionData,
  imageUrls: Record<string, string>,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let order = 0;

  if (data.keywords.length > 0) {
    blocks.push(
      richTextBlock(
        keywordsMarkdownFromData(data),
        keywordsHtmlFromData(data),
        order++,
      ),
    );
  }

  if (data.classicTriad) {
    const triadTitle = data.classicTriadTitle?.trim() || "Classic Triad";
    const triadBodyHtml =
      data.classicTriadHtml?.trim() ||
      `<p>${escapeHtml(data.classicTriad)}</p>`;
    blocks.push(
      richTextBlock(
        `### ${triadTitle}\n\n${data.classicTriad}`,
        `<h3>${escapeHtml(triadTitle)}</h3>${triadBodyHtml}`,
        order++,
      ),
    );
  }

  blocks.push(perAnswerPlaceholder(order++));

  if (data.keyConcept) {
    const keyConceptTitle = data.keyConceptTitle?.trim() || "Key Concept";
    const keyConceptBodyHtml =
      data.keyConceptHtml?.trim() ||
      `<p>${escapeHtml(data.keyConcept)}</p>`;
    blocks.push(
      richTextBlock(
        `### ${keyConceptTitle}\n\n${data.keyConcept}`,
        `<h3>${escapeHtml(keyConceptTitle)}</h3>${keyConceptBodyHtml}`,
        order++,
      ),
    );
  }

  const supplementalTables =
    data.tables?.filter((table) => table.rows?.length) ??
    [data.table1, data.table2].filter(
      (table): table is NonNullable<typeof data.table1> =>
        Boolean(table?.rows?.length),
    );

  for (const table of supplementalTables) {
    blocks.push(
      richTextBlock(
        `### ${table.heading}`,
        table.headingHtml
          ? `<h3>${table.headingHtml.replace(/^<p>|<\/p>$/g, "")}</h3>`
          : `<h3>${escapeHtml(table.heading)}</h3>`,
        order++,
      ),
    );
    blocks.push(
      tableBlock(
        buildTableHtmlFromRows(
          table.columns,
          table.rows.map((row) => ({
            text: row.cells,
            html: row.cellsHtml,
          })),
        ),
        order++,
      ),
    );
  }

  const supplementalDiagrams =
    data.diagrams?.length
      ? data.diagrams
      : data.diagram
        ? [data.diagram]
        : [];

  for (const diagram of supplementalDiagrams) {
    if (diagram.images?.length) {
      for (const img of diagram.images) {
        const url = imageUrls[img.filename];
        if (url) {
          blocks.push(imageBlock(url, diagram.heading || img.filename, order++));
        }
      }
    }

    if (diagram.heading) {
      blocks.push(
        richTextBlock(
          `### ${diagram.heading}`,
          diagram.headingHtml
            ? `<h3>${diagram.headingHtml.replace(/^<p>|<\/p>$/g, "")}</h3>`
            : `<h3>${escapeHtml(diagram.heading)}</h3>`,
          order++,
        ),
      );
    }

    if (diagram.description) {
      blocks.push(
        richTextBlock(
          diagram.description,
          diagram.descriptionHtml ||
            `<p>${escapeHtml(diagram.description)}</p>`,
          order++,
        ),
      );
    }
  }

  return blocks;
}

export function convertQuestionBuilderToCreatorData(
  data: QuestionData,
  imageUrls: Record<string, string> = {},
): Partial<QuestionCreatorData> {
  const letters = ["A", "B", "C", "D", "E"];
  const choices: Choice[] = data.options.map((text, index) => ({
    label: letters[index] ?? String(index + 1),
    text,
    correct: letters[index] === data.correctAnswer,
    value: letters[index] ?? String(index + 1),
  }));

  const perAnswerExplanations: Record<string, ContentBlock[]> = {};
  for (const letter of letters) {
    const exp = data.explanations[letter];
    if (!exp) continue;
    perAnswerExplanations[letter] = buildPerAnswerBlocks(exp);
  }

  const meta = data.metadata;
  const tags: string[] = [];
  if (meta.competencyDomain) tags.push(meta.competencyDomain);
  if (meta.cognitiveLevel) tags.push(meta.cognitiveLevel);
  if (meta.clinicalSkill) tags.push(meta.clinicalSkill);
  if (meta.difficultyLevel) tags.push(meta.difficultyLevel);

  return {
    stem: [
      richTextBlock(
        data.stem,
        data.stemHtml || `<p>${escapeHtml(data.stem)}</p>`,
        0,
      ),
    ],
    choices,
    mainExplanation: buildMainExplanationBlocks(data, imageUrls),
    perAnswerExplanations,
    metadata: {
      subject: coerceLabelString(meta.category),
      parsedCategoryName: coerceLabelString(meta.category),
      system: coerceLabelString(meta.system),
      title: coerceLabelString(meta.mcqTitle),
      parsedProductName: coerceLabelString(meta.product),
      parsedTopicName: coerceLabelString(meta.topic),
      parsedSubtopicName: coerceLabelString(meta.subtopic),
      parsedMcqTitle: coerceLabelString(meta.mcqTitle),
      tags,
      questionId: data.questionId,
    },
  };
}
