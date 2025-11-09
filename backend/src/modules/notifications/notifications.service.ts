import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: any) {
    // Validate required fields
    if (!createNotificationDto.userId) {
      throw new Error("User ID is required");
    }
    if (!createNotificationDto.title) {
      throw new Error("Title is required");
    }
    if (!createNotificationDto.message) {
      throw new Error("Message is required");
    }

    // Validate title length
    if (createNotificationDto.title.length > 100) {
      throw new Error("Title must be 100 characters or less");
    }

    // Validate message length
    if (createNotificationDto.message.length > 500) {
      throw new Error("Message must be 500 characters or less");
    }

    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  async findAll() {
    return this.prisma.notification.findMany({
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
