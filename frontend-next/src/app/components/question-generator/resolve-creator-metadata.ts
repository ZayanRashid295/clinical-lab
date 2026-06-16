import { pickByName, runAutoMatch } from "./metadata-auto-match";
import { CategoriesService } from "@/app/services/categories/categories.service";
import { ProductsService } from "@/app/services/products/products.service";
import { SystemsService } from "@/app/services/systems/systems.service";
import { TopicsService } from "@/app/services/content/topics.service";
import { SubtopicsService } from "@/app/services/content/subtopics.service";
import { coerceLabelString } from "./metadata-label-utils";

function unwrapList<T>(response: T[] | { data?: T[] }): T[] {
  return Array.isArray(response) ? response : response?.data || [];
}

export interface ResolvedMetadataIds {
  categoryId?: string;
  productId?: string;
  systemId?: string;
  topicId?: string;
  subtopicId?: string;
}

export async function resolveCreatorMetadataIds(
  metadata: QuestionMetadata,
): Promise<ResolvedMetadataIds> {
  const parsedCategory = coerceLabelString(metadata.subject);
  const parsedProduct = coerceLabelString(metadata.parsedProductName);
  const parsedSystem =
    coerceLabelString(
      typeof metadata.system === "string" ? metadata.system : metadata.system,
    ) || undefined;
  const parsedTopic = coerceLabelString(metadata.parsedTopicName);
  const parsedSubtopic = coerceLabelString(metadata.parsedSubtopicName);

  if (!parsedCategory && !parsedProduct && !parsedSystem && !parsedTopic && !parsedSubtopic) {
    return {};
  }

  const categoriesService = new CategoriesService();
  const productsService = new ProductsService();
  const systemsService = new SystemsService();
  const topicsService = new TopicsService();
  const subtopicsService = new SubtopicsService();

  const [categoriesRes, productsRes, systemsRes] = await Promise.all([
    categoriesService.getCategories({ status: "ACTIVE" }),
    productsService.getProducts({ status: "ACTIVE" }),
    systemsService.getSystems({ status: "ACTIVE", listAll: true }),
  ]);

  const categories = unwrapList(categoriesRes as any);
  const products = unwrapList(productsRes as any);
  const systems = unwrapList(systemsRes as any);

  const getTopicsForSystem = async (systemId: string) => {
    const response = await topicsService.getTopics({
      systemId,
      status: "ACTIVE",
      listAll: true,
    });
    return unwrapList(response as any);
  };

  const getSubtopicsForTopic = async (topicId: string) => {
    const response = await subtopicsService.getSubtopics({
      topicId,
      status: "ACTIVE",
      listAll: true,
    });
    return unwrapList(response as any);
  };

  const match = await runAutoMatch(
    {
      parsedCategory,
      parsedProduct,
      parsedSystem,
      parsedTopic,
      parsedSubtopic,
    },
    systems,
    {
      products,
      categories,
      getTopicsForSystem,
      getSubtopicsForTopic,
    },
  );

  const systemId = match.systemId || metadata.systemId;
  let topicId = match.topicId || metadata.topicId;
  let subtopicId = match.subtopicId || metadata.subtopicId;

  if (systemId && parsedTopic && !topicId) {
    const topics = await getTopicsForSystem(systemId);
    const topic = pickByName(topics, parsedTopic);
    if (topic) topicId = topic.id;
  }

  if (topicId && parsedSubtopic && !subtopicId) {
    const subtopics = await getSubtopicsForTopic(topicId);
    const subtopic = pickByName(subtopics, parsedSubtopic);
    if (subtopic) subtopicId = subtopic.id;
  }

  return {
    categoryId: match.categoryId || metadata.categoryId,
    productId: match.productId || metadata.productId,
    systemId,
    topicId,
    subtopicId,
  };
}

export function mergeResolvedMetadata(
  metadata: QuestionMetadata,
  resolved: ResolvedMetadataIds,
): QuestionMetadata {
  return {
    ...metadata,
    categoryId: resolved.categoryId || metadata.categoryId,
    productId: resolved.productId || metadata.productId,
    systemId: resolved.systemId || metadata.systemId,
    topicId: resolved.topicId || metadata.topicId,
    subtopicId: resolved.subtopicId || metadata.subtopicId,
    productTagId: resolved.categoryId || metadata.productTagId,
    productTagIds: resolved.categoryId
      ? [resolved.categoryId]
      : metadata.productTagIds,
  };
}
