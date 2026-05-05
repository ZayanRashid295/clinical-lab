import { BaseApiService } from "../base/base-api.service";
import { StudentDashboardStats } from "./types";

class StudentStatsService extends BaseApiService {
  dashboard(): Promise<StudentDashboardStats> {
    return this.get("/student/stats/dashboard", { _t: Date.now() });
  }
}

export const studentStatsService = new StudentStatsService();
