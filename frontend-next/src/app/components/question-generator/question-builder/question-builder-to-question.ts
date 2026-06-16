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
    const markdown = `Clinical reasoning: ${exp.clinicalReasoning ?? ""}`.trim();
    const html = exp.clinicalReasoningHtml
      ? `<p><strong>Clinical reasoning:</strong> ${exp.clinicalReasoningHtml.replace(/^<p>|<\/p>$/g, "")}</p>`
      : "";
    blocks.push(richTextBlock(markdown, html || undefined, order++));
  }
  if (exp.systemInvolved || exp.systemInvolvedHtml) {
    const markdown = `System involved: ${exp.systemInvolved ?? ""}`.trim();
    const html = exp.systemInvolvedHtml
      ? `<p><strong>System involved:</strong> ${exp.systemInvolvedHtml.replace(/^<p>|<\/p>$/g, "")}</p>`
      : "";
    blocks.push(richTextBlock(markdown, html || undefined, order++));
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

function buildMainExplanationBlocks(
  data: QuestionData,
  imageUrls: Record<string, string>,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let order = 0;

  if (data.keywords.length > 0) {
    const keywordsMarkdown =
      "### Keywords in the Stem to Identify the Correct Option\n\n" +
      data.keywords.map((keyword) => `- ${keyword}`).join("\n");
    const keywordsHtml =
      "<h3>Keywords in the Stem to Identify the Correct Option</h3>" +
      (data.keywordsHtml?.length
        ? data.keywordsHtml.join("")
        : `<ul>${data.keywords.map((keyword) => `<li>${escapeHtml(keyword)}</li>`).join("")}</ul>`);
    blocks.push(richTextBlock(keywordsMarkdown, keywordsHtml, order++));
  }

  if (data.classicTriad) {
    blocks.push(
      richTextBlock(
        `### Classic Triad\n\n${data.classicTriad}`,
        data.classicTriadHtml ||
          `<h3>Classic Triad</h3><p>${escapeHtml(data.classicTriad)}</p>`,
        order++,
      ),
    );
  }

  blocks.push(perAnswerPlaceholder(order++));

  if (data.keyConcept) {
    blocks.push(
      richTextBlock(
        `### Key Concept\n\n${data.keyConcept}`,
        data.keyConceptHtml || `<h3>Key Concept</h3><p>${escapeHtml(data.keyConcept)}</p>`,
        order++,
      ),
    );
  }

  if (data.featureTable?.length) {
    const heading = data.featureTableName || "Feature Table";
    blocks.push(textBlock(`### ${heading}`, order++));
    blocks.push(
      tableBlock(
        buildTableHtmlFromRows(
          ["Feature", "Description", "Clinical Importance"],
          data.featureTable.map((row) => ({
            text: [row.feature, row.description, row.clinicalImportance],
            html: [row.featureHtml, row.descriptionHtml, row.clinicalImportanceHtml],
          })),
        ),
        order++,
      ),
    );
  }

  if (data.differentialDiagnosisTable?.length) {
    const heading = data.differentialDiagnosisTableName || "Differential Diagnosis";
    blocks.push(textBlock(`### ${heading}`, order++));
    blocks.push(
      tableBlock(
        buildTableHtmlFromRows(
          ["Condition", "Distinguishing Features", "Key Differences"],
          data.differentialDiagnosisTable.map((row) => ({
            text: [row.condition, row.distinguishingFeatures, row.keyDifferences],
            html: [
              row.conditionHtml,
              row.distinguishingFeaturesHtml,
              row.keyDifferencesHtml,
            ],
          })),
        ),
        order++,
      ),
    );
  }

  if (data.diagram?.images?.length) {
    for (const img of data.diagram.images) {
      const url = imageUrls[img.filename];
      if (url) {
        blocks.push(
          imageBlock(url, data.diagram?.name || img.filename, order++),
        );
      }
    }
  }

  if (data.diagram?.name) {
    blocks.push(textBlock(`### ${data.diagram.name}`, order++));
  }

  if (data.diagram?.caption) {
    blocks.push(
      richTextBlock(
        data.diagram.caption,
        data.diagram.captionHtml || `<p>${escapeHtml(data.diagram.caption)}</p>`,
        order++,
      ),
    );
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
