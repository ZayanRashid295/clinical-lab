/**
 * Shared metadata auto-match: match parsed document values (subject/system/topic)
 * to DB entities (chapter/section/topic) using fuzzy name matching.
 * Used by both bulk-docx-uploader and bulk-markdown-uploader.
 */

export function normalizeName(name: string): string {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function fuzzyMatch(str1: string, str2: string): boolean {
  const n1 = normalizeName(str1);
  const n2 = normalizeName(str2);
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  const words1 = n1.split(/\s+/).filter((w) => w.length > 0);
  const words2 = n2.split(/\s+/).filter((w) => w.length > 0);
  if (words1.length > 0 && words2.length > 0) {
    const shorter = words1.length <= words2.length ? words1 : words2;
    const longer = words1.length > words2.length ? words1 : words2;
    return shorter.every((word) =>
      longer.some((lw) => lw.includes(word) || word.includes(lw))
    );
  }
  return false;
}

export interface AutoMatchInput {
  parsedSubject?: string;
  parsedSystem?: string;
  parsedTopic?: string;
}

export interface AutoMatchResult {
  sectionId: string;
  chapterId: string;
  topicId: string;
  productTagId?: string;
}

export type GetTopicsForChapter = (chapterId: string) => Promise<any[]>;

/**
 * Run auto-match: find sectionId, chapterId, topicId, and productTagId from parsed subject/system/topic.
 * - Match parsedSubject → Product Tag (productTagId)
 * - Match parsedSystem → Chapter (chapterId), section is derived from chapter
 * - Match parsedTopic → Topic (topicId)
 * - getTopicsForChapter(chapterId) is called when a chapter is matched to resolve topicId.
 */
export async function runAutoMatch(
  input: AutoMatchInput,
  chapters: any[],
  options: {
    sections?: any[];
    productTags?: any[];
    getTopicsForChapter: GetTopicsForChapter;
  }
): Promise<Partial<AutoMatchResult>> {
  const { parsedSubject, parsedSystem, parsedTopic } = input;
  const { sections = [], productTags = [], getTopicsForChapter } = options;

  let matchedSectionId = "";
  let matchedChapterId = "";
  let matchedTopicId = "";
  let matchedProductTagId = "";

  // Match Subject → Product Tag
  if (parsedSubject && productTags.length > 0) {
    const normalizedSubject = normalizeName(parsedSubject);
    let matchedProductTag = productTags.find(
      (t: any) => normalizeName(t.name) === normalizedSubject
    );
    if (!matchedProductTag) {
      matchedProductTag = productTags.find((t: any) =>
        fuzzyMatch(t.name, parsedSubject!)
      );
    }
    if (matchedProductTag) {
      matchedProductTagId = matchedProductTag.id;
    }
  }

  // Match System → Chapter (exact name only – no fuzzy; only show DB chapter when it exists)
  if (parsedSystem && chapters.length > 0) {
    const normalizedSystem = normalizeName(parsedSystem);
    const matchedChapter = chapters.find(
      (c: any) => normalizeName(c.name) === normalizedSystem
    );
    if (matchedChapter) {
      matchedChapterId = matchedChapter.id;
      matchedSectionId =
        matchedChapter.sectionId || matchedChapter.section?.id || "";
      const chapterTopics = await getTopicsForChapter(matchedChapterId);
      if (parsedTopic && chapterTopics.length > 0) {
        const normalizedTopic = normalizeName(parsedTopic);
        let matchedTopic = chapterTopics.find(
          (t: any) => normalizeName(t.name) === normalizedTopic
        );
        if (!matchedTopic) {
          matchedTopic = chapterTopics.find((t: any) =>
            fuzzyMatch(t.name, parsedTopic!)
          );
        }
        if (matchedTopic) matchedTopicId = matchedTopic.id;
        else if (chapterTopics.length === 1) matchedTopicId = chapterTopics[0].id;
      } else if (chapterTopics.length === 1) {
        matchedTopicId = chapterTopics[0].id;
      }
    }
  }

  // Fallback: if System didn't match Chapter, try matching System → Section (exact only), then find Chapter within that Section
  if (!matchedChapterId && parsedSystem && sections.length > 0) {
    const normalizedSystem = normalizeName(parsedSystem);
    const matchedSection = sections.find(
      (s: any) => normalizeName(s.name) === normalizedSystem
    );
    if (matchedSection) {
      matchedSectionId = matchedSection.id;
      const sectionChapters = chapters.filter(
        (c: any) =>
          c.sectionId === matchedSection.id || c.section?.id === matchedSection.id
      );
      // If we have multiple chapters in this section, prefer the first one
      // Do NOT use parsedSubject to match chapters - subject maps to ProductTag, not Chapter
      if (sectionChapters.length > 0) {
        let matchedChapter = sectionChapters[0]; // Default to first chapter
        matchedChapterId = matchedChapter.id;
        const chapterTopics = await getTopicsForChapter(matchedChapterId);
        if (parsedTopic && chapterTopics.length > 0) {
          let matchedTopic = chapterTopics.find((t: any) =>
            fuzzyMatch(t.name, parsedTopic!)
          );
          if (matchedTopic) matchedTopicId = matchedTopic.id;
          else if (chapterTopics.length === 1)
            matchedTopicId = chapterTopics[0].id;
        } else if (chapterTopics.length === 1) {
          matchedTopicId = chapterTopics[0].id;
        }
      }
    }
  }

  const result: Partial<AutoMatchResult> = {};
  if (matchedSectionId) result.sectionId = matchedSectionId;
  if (matchedChapterId) result.chapterId = matchedChapterId;
  if (matchedTopicId) result.topicId = matchedTopicId;
  if (matchedProductTagId) result.productTagId = matchedProductTagId;
  return result;
}
