import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Section } from "../../types/content";
import {
  SectionQueryParams,
  CreateSectionDto,
  UpdateSectionDto,
} from "./sections.types";

export class SectionsService extends BaseDataService<
  Section,
  SectionQueryParams,
  CreateSectionDto,
  UpdateSectionDto
> {
  protected readonly endpoint = "/content/sections";

  /**
   * Get sections with optional filtering and pagination
   */
  async getSections(
    params?: SectionQueryParams
  ): Promise<PaginatedResponse<Section> | Section[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific section by ID
   */
  async getSection(id: string): Promise<Section> {
    return this.getById(id);
  }

  /**
   * Create a new section
   */
  async createSection(
    sectionData: CreateSectionDto
  ): Promise<CreateResponse | Section> {
    return this.create(sectionData);
  }

  /**
   * Update an existing section
   */
  async updateSection(
    id: string,
    sectionData: UpdateSectionDto
  ): Promise<UpdateResponse | Section> {
    return this.update(id, sectionData);
  }

  /**
   * Deactivate a section (soft delete)
   */
  async deactivateSection(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get section statistics
   */
  async getSectionStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

