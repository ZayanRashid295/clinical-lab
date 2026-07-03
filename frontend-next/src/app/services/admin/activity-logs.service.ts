import { BaseApiService } from "../base/base-api.service";
import { PaginatedResponse } from "../base/api-types";
import {
  ActivityLog,
  ActivityLogFilterOptions,
  ActivityLogFullDetails,
  ActivityLogQueryParams,
  ActivityLogStats,
} from "../../types/activity-log";

export class ActivityLogsService extends BaseApiService {
  protected readonly endpoint = "/activity-log";

  async getLogs(
    params?: ActivityLogQueryParams,
  ): Promise<PaginatedResponse<ActivityLog>> {
    return this.get(this.endpoint, params as Record<string, unknown>);
  }

  async getLog(id: string): Promise<ActivityLog> {
    return this.get(`${this.endpoint}/${id}`);
  }

  async getLogDetails(id: string): Promise<ActivityLogFullDetails> {
    return this.get(`${this.endpoint}/${id}/details`);
  }

  async getStats(): Promise<ActivityLogStats> {
    return this.get(`${this.endpoint}/stats`);
  }

  async getFilterOptions(): Promise<ActivityLogFilterOptions> {
    return this.get(`${this.endpoint}/filters`);
  }

  async exportCsv(params?: ActivityLogQueryParams): Promise<Blob> {
    const url = new URL(`${this.baseURL}${this.endpoint}/export`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`Export failed (${response.status})`);
    }
    return response.blob();
  }
}
