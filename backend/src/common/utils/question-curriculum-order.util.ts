import type { PrismaService } from "../prisma/prisma.service";

export type CurriculumOrderMaps = {
  systemRank: Map<string, number>;
  topicRank: Map<string, number>;
  subtopicRank: Map<string, number>;
};

type CurriculumQuestion = {
  id: string;
  createdAt: Date;
  systemId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  system?: { id?: string; order: number } | null;
  topic?: {
    id?: string;
    order: number;
    systemId?: string;
    system?: { id?: string; order: number } | null;
  } | null;
  subtopic?: {
    id?: string;
    order: number;
    topicId?: string;
    topic?: {
      id?: string;
      order: number;
      systemId?: string;
      system?: { id?: string; order: number } | null;
    } | null;
  } | null;
};

const MAX_RANK = Number.MAX_SAFE_INTEGER;

/**
 * Build rank maps using the same ordering rules as the create-test UI:
 * primary `order` field, then `createdAt` when orders tie.
 */
export async function buildCurriculumOrderMaps(
  prisma: PrismaService,
): Promise<CurriculumOrderMaps> {
  const systems = await prisma.system.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const systemRank = new Map(systems.map((s, index) => [s.id, index]));

  const topics = await prisma.topic.findMany({
    where: { isActive: true },
    select: { id: true, systemId: true, order: true, createdAt: true },
  });
  topics.sort((a, b) => {
    const systemDiff =
      (systemRank.get(a.systemId) ?? MAX_RANK) -
      (systemRank.get(b.systemId) ?? MAX_RANK);
    if (systemDiff !== 0) return systemDiff;
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const topicRank = new Map<string, number>();
  const topicRankBySystem = new Map<string, number>();
  for (const topic of topics) {
    const next = topicRankBySystem.get(topic.systemId) ?? 0;
    topicRank.set(topic.id, next);
    topicRankBySystem.set(topic.systemId, next + 1);
  }

  const subtopics = await prisma.subtopic.findMany({
    where: { isActive: true },
    select: { id: true, topicId: true, order: true, createdAt: true },
  });
  subtopics.sort((a, b) => {
    const topicDiff =
      (topicRank.get(a.topicId) ?? MAX_RANK) -
      (topicRank.get(b.topicId) ?? MAX_RANK);
    if (topicDiff !== 0) return topicDiff;
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const subtopicRank = new Map<string, number>();
  const subtopicRankByTopic = new Map<string, number>();
  for (const subtopic of subtopics) {
    const next = subtopicRankByTopic.get(subtopic.topicId) ?? 0;
    subtopicRank.set(subtopic.id, next);
    subtopicRankByTopic.set(subtopic.topicId, next + 1);
  }

  return { systemRank, topicRank, subtopicRank };
}

function resolveSystemId(question: CurriculumQuestion): string | null {
  return (
    question.systemId ??
    question.system?.id ??
    question.topic?.systemId ??
    question.topic?.system?.id ??
    question.subtopic?.topic?.systemId ??
    question.subtopic?.topic?.system?.id ??
    null
  );
}

function resolveTopicId(question: CurriculumQuestion): string | null {
  return (
    question.topicId ??
    question.topic?.id ??
    question.subtopic?.topicId ??
    question.subtopic?.topic?.id ??
    null
  );
}

function resolveSubtopicId(question: CurriculumQuestion): string | null {
  return question.subtopicId ?? question.subtopic?.id ?? null;
}

function getSystemSortKey(
  question: CurriculumQuestion,
  maps: CurriculumOrderMaps,
): number {
  const systemId = resolveSystemId(question);
  if (systemId && maps.systemRank.has(systemId)) {
    return maps.systemRank.get(systemId)!;
  }
  if (question.system?.order != null && question.system.order !== 0) {
    return question.system.order;
  }
  return MAX_RANK;
}

function getTopicSortKey(
  question: CurriculumQuestion,
  maps: CurriculumOrderMaps,
): number {
  const topicId = resolveTopicId(question);
  if (topicId && maps.topicRank.has(topicId)) {
    return maps.topicRank.get(topicId)!;
  }
  if (question.topic?.order != null && question.topic.order !== 0) {
    return question.topic.order;
  }
  if (question.subtopic?.topic?.order != null && question.subtopic.topic.order !== 0) {
    return question.subtopic.topic.order;
  }
  return MAX_RANK;
}

function getSubtopicSortKey(
  question: CurriculumQuestion,
  maps: CurriculumOrderMaps,
): number {
  const subtopicId = resolveSubtopicId(question);
  if (subtopicId && maps.subtopicRank.has(subtopicId)) {
    return maps.subtopicRank.get(subtopicId)!;
  }
  if (question.subtopic?.order != null && question.subtopic.order !== 0) {
    return question.subtopic.order;
  }
  return MAX_RANK;
}

/**
 * Sort questions by canonical curriculum order: system → topic → subtopic → createdAt.
 * Uses rank maps so UI order is preserved even when many rows share order = 0.
 */
export function sortQuestionsByCurriculumOrder<T extends CurriculumQuestion>(
  questions: T[],
  maps: CurriculumOrderMaps,
): T[] {
  return [...questions].sort((a, b) => {
    const systemDiff = getSystemSortKey(a, maps) - getSystemSortKey(b, maps);
    if (systemDiff !== 0) return systemDiff;

    const topicDiff = getTopicSortKey(a, maps) - getTopicSortKey(b, maps);
    if (topicDiff !== 0) return topicDiff;

    const subtopicDiff =
      getSubtopicSortKey(a, maps) - getSubtopicSortKey(b, maps);
    if (subtopicDiff !== 0) return subtopicDiff;

    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
