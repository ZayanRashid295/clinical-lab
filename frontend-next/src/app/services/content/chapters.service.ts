import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Chapter } from "../../types/content";
import {
  ChapterQueryParams,
  CreateChapterDto,
  UpdateChapterDto,
} from "./chapters.types";

export class ChaptersService extends BaseDataService<
  Chapter,
  ChapterQueryParams,
  CreateChapterDto,
  UpdateChapterDto
> {
  protected readonly endpoint = "/content/chapters";

  /**
   * Get chapters with optional filtering and pagination
   */
  async getChapters(
    params?: ChapterQueryParams
  ): Promise<PaginatedResponse<Chapter> | Chapter[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific chapter by ID
   */
  async getChapter(id: string): Promise<Chapter> {
    return this.getById(id);
  }

  /**
   * Create a new chapter
   */
  async createChapter(
    chapterData: CreateChapterDto
  ): Promise<CreateResponse<Chapter>> {
    return this.create(chapterData);
  }

  /**
   * Update an existing chapter
   */
  async updateChapter(
    id: string,
    chapterData: UpdateChapterDto
  ): Promise<UpdateResponse<Chapter>> {
    return this.update(id, chapterData);
  }

  /**
   * Deactivate a chapter (soft delete)
   */
  async deactivateChapter(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get chapter statistics
   */
  async getChapterStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

