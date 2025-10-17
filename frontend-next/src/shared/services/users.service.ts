import { BaseApiService } from "../../app/services/base/base-api.service";

export class UsersService extends BaseApiService {
  async getUsers(): Promise<any> {
    return this.get("/users");
  }

  async getUser(id: string): Promise<any> {
    return this.get(`/users/${id}`);
  }

  async updateUser(id: string, userData: any): Promise<any> {
    return this.patch(`/users/${id}`, userData);
  }
}

export const usersService = new UsersService();
