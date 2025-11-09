import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createRoom(createRoomDto: any) {
    // Validate required fields
    if (!createRoomDto.name) {
      throw new Error("Room name is required");
    }

    // Validate room name length
    if (createRoomDto.name.length > 50) {
      throw new Error("Room name must be 50 characters or less");
    }

    return this.prisma.chatRoom.create({
      data: createRoomDto,
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async sendMessage(createMessageDto: any) {
    // Validate required fields
    if (!createMessageDto.senderId) {
      throw new Error("Sender ID is required");
    }
    if (!createMessageDto.chatRoomId) {
      throw new Error("Chat room ID is required");
    }
    if (!createMessageDto.content) {
      throw new Error("Message content is required");
    }

    // Validate message content length
    if (createMessageDto.content.length > 1000) {
      throw new Error("Message content must be 1000 characters or less");
    }

    return this.prisma.chatMessage.create({
      data: createMessageDto,
      include: {
        sender: true,
        reactions: true,
      },
    });
  }

  async getRoomMessages(roomId: string) {
    return this.prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: true,
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getRoomsByUser(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}
