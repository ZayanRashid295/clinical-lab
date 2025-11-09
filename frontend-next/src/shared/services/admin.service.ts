import { BaseApiService } from "../../app/services/base/base-api.service";

export class AdminService extends BaseApiService {
  async getSystemStats(): Promise<any> {
    return this.get("/admin/stats");
  }

  async getReports(): Promise<any> {
    return this.get("/admin/reports");
  }
}

export const adminService = new AdminService();
