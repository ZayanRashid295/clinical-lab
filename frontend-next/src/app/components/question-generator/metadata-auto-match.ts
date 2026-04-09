/**
 * Shared metadata auto-match: match parsed document values (category/system/topic)
 * to DB entities (system/topic/subtopic) using fuzzy name matching.
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
  parsedCategory?: string;
  parsedSystem?: string;
  parsedTopic?: string;
  parsedSubtopic?: string;
}

export interface AutoMatchResult {
  productId: string;
  systemId: string;
  topicId: string;
  subtopicId: string;
  categoryId?: string;
}

export type GetTopicsForSystem = (systemId: string) => Promise<any[]>;
export type GetSubtopicsForTopic = (topicId: string) => Promise<any[]>;

/**
 * Run auto-match: find productId, systemId, topicId, and subtopicId from parsed category/system/topic.
 * - Match parsedCategory → Category (categoryId)
 * - Match parsedSystem → System (systemId), product is derived from system
 * - Match parsedTopic → Topic (topicId)
 * - Match parsedSubtopic → Subtopic (subtopicId)
 * - getTopicsForSystem(systemId) is called when a system is matched to resolve topicId.
 * - getSubtopicsForTopic(topicId) is called when a topic is matched to resolve subtopicId.
 */
export async function runAutoMatch(
  input: AutoMatchInput,
  systems: any[],
  options: {
    products?: any[];
    categories?: any[];
    getTopicsForSystem: GetTopicsForSystem;
    getSubtopicsForTopic: GetSubtopicsForTopic;
  }
): Promise<Partial<AutoMatchResult>> {
  const { parsedCategory, parsedSystem, parsedTopic, parsedSubtopic } = input;
  const { products = [], categories = [], getTopicsForSystem, getSubtopicsForTopic } = options;

  let matchedProductId = "";
  let matchedSystemId = "";
  let matchedTopicId = "";
  let matchedSubtopicId = "";
  let matchedCategoryId = "";

  // Match Category → Category
  if (parsedCategory && categories.length > 0) {
    const normalizedCategory = normalizeName(parsedCategory);
    let matchedCategory = categories.find(
      (t: any) => normalizeName(t.name) === normalizedCategory
    );
    if (!matchedCategory) {
      matchedCategory = categories.find((t: any) =>
        fuzzyMatch(t.name, parsedCategory!)
      );
    }
    if (matchedCategory) {
      matchedCategoryId = matchedCategory.id;
    }
  }

  // Match System → System (exact name only – no fuzzy)
  if (parsedSystem && systems.length > 0) {
    const normalizedSystem = normalizeName(parsedSystem);
    const matchedSystem = systems.find(
      (s: any) => normalizeName(s.name) === normalizedSystem
    );
    if (matchedSystem) {
      matchedSystemId = matchedSystem.id;
      matchedProductId =
        matchedSystem.productId || matchedSystem.product?.id || "";
        
      const systemTopics = await getTopicsForSystem(matchedSystemId);
      if (parsedTopic && systemTopics.length > 0) {
        const normalizedTopic = normalizeName(parsedTopic);
        let matchedTopic = systemTopics.find(
          (t: any) => normalizeName(t.name) === normalizedTopic
        );
        if (!matchedTopic) {
          matchedTopic = systemTopics.find((t: any) =>
            fuzzyMatch(t.name, parsedTopic!)
          );
        }
        if (matchedTopic) matchedTopicId = matchedTopic.id;
        else if (systemTopics.length === 1) matchedTopicId = systemTopics[0].id;
      } else if (systemTopics.length === 1) {
        matchedTopicId = systemTopics[0].id;
      }

      // If Topic was matched, resolve Subtopic
      if (matchedTopicId) {
        const topicSubtopics = await getSubtopicsForTopic(matchedTopicId);
        if (parsedSubtopic && topicSubtopics.length > 0) {
          const normalizedSubtopic = normalizeName(parsedSubtopic);
          let matchedSubtopic = topicSubtopics.find(
            (t: any) => normalizeName(t.name) === normalizedSubtopic
          );
          if (!matchedSubtopic) {
            matchedSubtopic = topicSubtopics.find((t: any) =>
              fuzzyMatch(t.name, parsedSubtopic!)
            );
          }
          if (matchedSubtopic) matchedSubtopicId = matchedSubtopic.id;
          else if (topicSubtopics.length === 1) matchedSubtopicId = topicSubtopics[0].id;
        } else if (topicSubtopics.length === 1) {
          matchedSubtopicId = topicSubtopics[0].id;
        }
      }
    }
  }

  // Fallback: if System didn't match System directly, try matching System → Product (exact only), then find System within that Product
  if (!matchedSystemId && parsedSystem && products.length > 0) {
    const normalizedSystem = normalizeName(parsedSystem);
    const matchedProduct = products.find(
      (p: any) => normalizeName(p.name) === normalizedSystem
    );
    if (matchedProduct) {
      matchedProductId = matchedProduct.id;
      const productSystems = systems.filter(
        (s: any) =>
          s.productId === matchedProduct.id || s.product?.id === matchedProduct.id
      );
      if (productSystems.length > 0) {
        let matchedSystem = productSystems[0]; // Default to first system
        matchedSystemId = matchedSystem.id;
        const systemTopics = await getTopicsForSystem(matchedSystemId);
        if (parsedTopic && systemTopics.length > 0) {
          let matchedTopic = systemTopics.find((t: any) =>
            fuzzyMatch(t.name, parsedTopic!)
          );
          if (matchedTopic) matchedTopicId = matchedTopic.id;
          else if (systemTopics.length === 1)
            matchedTopicId = systemTopics[0].id;
        } else if (systemTopics.length === 1) {
          matchedTopicId = systemTopics[0].id;
        }

        // Apply same subtopic resolution logically
        if (matchedTopicId) {
          const topicSubtopics = await getSubtopicsForTopic(matchedTopicId);
          if (parsedSubtopic && topicSubtopics.length > 0) {
            let matchedSubtopic = topicSubtopics.find((t: any) =>
              fuzzyMatch(t.name, parsedSubtopic!)
            );
            if (matchedSubtopic) matchedSubtopicId = matchedSubtopic.id;
            else if (topicSubtopics.length === 1) matchedSubtopicId = topicSubtopics[0].id;
          } else if (topicSubtopics.length === 1) {
            matchedSubtopicId = topicSubtopics[0].id;
          }
        }
      }
    }
  }

  const result: Partial<AutoMatchResult> = {};
  if (matchedProductId) result.productId = matchedProductId;
  if (matchedSystemId) result.systemId = matchedSystemId;
  if (matchedTopicId) result.topicId = matchedTopicId;
  if (matchedSubtopicId) result.subtopicId = matchedSubtopicId;
  if (matchedCategoryId) result.categoryId = matchedCategoryId;
  return result;
}
