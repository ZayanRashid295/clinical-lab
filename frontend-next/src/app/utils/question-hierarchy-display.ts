/**
 * Maps API question relations to dashboard columns.
 * Schema: Category → Product → System → Topic → Subtopic → Question
 *
 * Columns: Subject (product/exam) · System · Category (discipline) · Topic (+ subtopic)
 */
export type QuestionHierarchySlice = {
  id?: string;
  category?: { id?: string; name?: string | null } | null;
  product?: {
    id?: string;
    name?: string | null;
    category?: { id?: string; name?: string | null } | null;
  } | null;
  system?: {
    id?: string;
    name?: string | null;
    product?: {
      id?: string;
      name?: string | null;
      category?: { id?: string; name?: string | null } | null;
    } | null;
  } | null;
  topic?: {
    id?: string;
    name?: string | null;
    system?: { id?: string; name?: string | null } | null;
  } | null;
  subtopic?: { id?: string; name?: string | null } | null;
};

const EM = "—";

function nonEmpty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export function getQuestionHierarchyColumns(
  q: QuestionHierarchySlice | null | undefined
): {
  subject: string;
  system: string;
  category: string;
  topic: string;
} {
  if (!q) {
    return { subject: EM, system: EM, category: EM, topic: EM };
  }

  const productName = nonEmpty(q.product?.name) ?? nonEmpty(q.system?.product?.name);
  const systemName =
    nonEmpty(q.system?.name) ?? nonEmpty(q.topic?.system?.name);
  const categoryName =
    nonEmpty(q.category?.name) ??
    nonEmpty(q.product?.category?.name) ??
    nonEmpty(q.system?.product?.category?.name);

  const topicParts = [nonEmpty(q.topic?.name), nonEmpty(q.subtopic?.name)].filter(
    Boolean
  ) as string[];
  const topicLabel = topicParts.length ? topicParts.join(" · ") : null;

  return {
    subject: productName ?? EM,
    system: systemName ?? EM,
    category: categoryName ?? EM,
    topic: topicLabel ?? EM,
  };
}
