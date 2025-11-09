import { BaseApiService } from "../../app/services/base/base-api.service";

export class ChatService extends BaseApiService {
  async getChatRooms(): Promise<any> {
    return this.get("/chat/rooms");
  }

  async createChatRoom(roomData: any): Promise<any> {
    return this.post("/chat/rooms", roomData);
  }

  async sendMessage(messageData: any): Promise<any> {
    return this.post("/chat/messages", messageData);
  }

  async getRoomMessages(roomId: string): Promise<any> {
    return this.get(`/chat/rooms/${roomId}/messages`);
  }
}

export const chatService = new ChatService();
