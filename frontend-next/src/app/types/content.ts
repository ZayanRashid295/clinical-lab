// Content Management Types (Sections, Chapters, Topics)

export interface Section {
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
    chapters: number;
  };
}

export interface Chapter {
  id: string;
  sectionId: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  section?: {
    id: string;
    name: string;
    product?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    topics: number;
  };
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chapter?: {
    id: string;
    name: string;
    section?: {
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
export interface SectionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ChapterQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  sectionId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TopicQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  chapterId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Create DTOs
export interface CreateSectionDto {
  productId: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateSectionDto {
  productId?: string;
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateChapterDto {
  sectionId: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateChapterDto {
  sectionId?: string;
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateTopicDto {
  chapterId: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateTopicDto {
  chapterId?: string;
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

// Filter interfaces
export interface SectionFilters extends SectionQueryParams {}
export interface ChapterFilters extends ChapterQueryParams {}
export interface TopicFilters extends TopicQueryParams {}

