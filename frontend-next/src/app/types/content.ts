// Content Management Types (Systems → Topics → Subtopics)
// Renamed from: Chapter → Topic, Topic → Subtopic
// New: System model between Product and Topic

export interface System {
  id: string;
  productId: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
  };
  _count?: {
    topics: number;
  };
}

export interface Topic {
  id: string;
  systemId: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  system?: {
    id: string;
    name: string;
    product?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    subtopics: number;
  };
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: string;
    name: string;
    system?: {
      id: string;
      name: string;
      product?: {
        id: string;
        name: string;
      };
    };
  };
  _count?: {
    questions: number;
  };
}

// Query Parameters
export interface SystemQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  listAll?: boolean;
}

export interface TopicQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  systemId?: string;
  dateFrom?: string;
  dateTo?: string;
  listAll?: boolean;
}

export interface SubtopicQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  topicId?: string;
  dateFrom?: string;
  dateTo?: string;
  listAll?: boolean;
}

// Create DTOs
export interface CreateSystemDto {
  productId: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateSystemDto {
  productId?: string;
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateTopicDto {
  systemId: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateTopicDto {
  systemId?: string;
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateSubtopicDto {
  topicId: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateSubtopicDto {
  topicId?: string;
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

// Filter interfaces
export interface SystemFilters extends SystemQueryParams {}
export interface TopicFilters extends TopicQueryParams {}
export interface SubtopicFilters extends SubtopicQueryParams {}

// Legacy re-exports for backward compatibility during migration
export type Chapter = Topic;
export type ChapterQueryParams = TopicQueryParams;
export type CreateChapterDto = CreateTopicDto;
export type UpdateChapterDto = UpdateTopicDto;
export type ChapterFilters = TopicFilters;
