import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { CreateSubtopicDto } from "./dto/create-subtopic.dto";
import { UpdateSubtopicDto } from "./dto/update-subtopic.dto";
import { QueryTopicDto } from "./dto/query-topic.dto";
import { QuerySubtopicDto } from "./dto/query-subtopic.dto";

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // ========== TOPICS (was Chapters) ==========
  async findAllTopics(query: QueryTopicDto) {
    try {
      const {
        search, status, systemId, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "order", sortOrder = "asc",
        listAll = false,
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (systemId) where.systemId = systemId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.topic.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const include = {
        system: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        _count: { select: { subtopics: true } },
      };

      if (listAll) {
        const topics = await this.prisma.topic.findMany({ where, include, orderBy });
        return {
          data: topics,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const topics = await this.prisma.topic.findMany({ where, include, skip, take: limit, orderBy });
      return {
        data: topics,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  }

  async getTopics(systemId?: string, isActive?: boolean) {
    const where: any = {};
    if (systemId) where.systemId = systemId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.topic.findMany({
      where,
      include: {
        system: {
          include: { product: { select: { id: true, name: true } } },
        },
        _count: { select: { subtopics: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async getTopicStats() {
    const total = await this.prisma.topic.count();
    const active = await this.prisma.topic.count({ where: { isActive: true } });
    const inactive = await this.prisma.topic.count({ where: { isActive: false } });
    return { total, active, inactive };
  }

  async getTopic(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        system: {
          include: { product: { select: { id: true, name: true } } },
        },
        subtopics: {
          include: { _count: { select: { questions: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { subtopics: true } },
      },
    });
    if (!topic) throw new NotFoundException(`Topic with ID ${id} not found`);
    return topic;
  }

  async getTopicSubtopics(id: string, isActive?: boolean) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException(`Topic with ID ${id} not found`);

    const where: any = { topicId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.subtopic.findMany({
      where,
      include: { _count: { select: { questions: true } } },
      orderBy: { order: "asc" },
    });
  }

  async createTopic(createDto: CreateTopicDto) {
    const { systemId, name, ...rest } = createDto;
    const topicName = (name ?? "").trim().length > 500 ? (name as string).substring(0, 497) + "..." : (name ?? "").trim();

    const existing = await this.prisma.topic.findFirst({
      where: { systemId, name: topicName },
      include: {
        system: { include: { product: { select: { id: true, name: true } } } },
      },
    });
    if (existing) return existing;

    return this.prisma.topic.create({
      data: { ...rest, systemId, name: topicName },
      include: {
        system: { include: { product: { select: { id: true, name: true } } } },
      },
    });
  }

  async updateTopic(id: string, updateDto: UpdateTopicDto) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException(`Topic with ID ${id} not found`);

    return this.prisma.topic.update({
      where: { id }, data: updateDto,
      include: {
        system: { include: { product: { select: { id: true, name: true } } } },
      },
    });
  }

  async removeTopic(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException(`Topic with ID ${id} not found`);
    return this.prisma.topic.update({ where: { id }, data: { isActive: false } });
  }

  async removeTopicPermanent(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException(`Topic with ID ${id} not found`);
    try {
      await this.prisma.topic.delete({ where: { id } });
      return { message: "Topic permanently deleted" };
    } catch (e: any) {
      if (e?.code === "P2003" || e?.code === "P2014") {
        throw new ConflictException(
          "Cannot delete this topic while it is still referenced. Remove dependent records first.",
        );
      }
      throw e;
    }
  }

  // ========== SUBTOPICS (was Topics) ==========
  async findAllSubtopics(query: QuerySubtopicDto) {
    try {
      const {
        search, status, topicId, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "order", sortOrder = "asc",
        listAll = false,
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (topicId) where.topicId = topicId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.subtopic.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const include = {
        topic: {
          include: {
            system: {
              include: { product: { select: { id: true, name: true } } },
            },
          },
        },
        _count: { select: { questions: true } },
      };

      if (listAll) {
        const subtopics = await this.prisma.subtopic.findMany({ where, include, orderBy });
        return {
          data: subtopics,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const subtopics = await this.prisma.subtopic.findMany({ where, include, skip, take: limit, orderBy });
      return {
        data: subtopics,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching subtopics:", error);
      throw error;
    }
  }

  async getSubtopics(topicId?: string, isActive?: boolean) {
    const where: any = {};
    if (topicId) where.topicId = topicId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.subtopic.findMany({
      where,
      include: {
        topic: {
          include: {
            system: { include: { product: { select: { id: true, name: true } } } },
          },
        },
        _count: { select: { questions: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async getSubtopicStats() {
    const total = await this.prisma.subtopic.count();
    const active = await this.prisma.subtopic.count({ where: { isActive: true } });
    const inactive = await this.prisma.subtopic.count({ where: { isActive: false } });
    return { total, active, inactive };
  }

  async getSubtopic(id: string) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id },
      include: {
        topic: {
          include: {
            system: { include: { product: { select: { id: true, name: true } } } },
          },
        },
        questions: {
          include: { choices: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { questions: true } },
      },
    });
    if (!subtopic) throw new NotFoundException(`Subtopic with ID ${id} not found`);
    return subtopic;
  }

  async getSubtopicQuestions(id: string, isActive?: boolean, limit?: number, offset?: number) {
    const subtopic = await this.prisma.subtopic.findUnique({ where: { id } });
    if (!subtopic) throw new NotFoundException(`Subtopic with ID ${id} not found`);

    const where: any = { subtopicId: id };
    if (isActive !== undefined) where.isActive = isActive;

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: { choices: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.question.count({ where }),
    ]);

    return { questions, total, limit, offset };
  }

  async createSubtopic(createDto: CreateSubtopicDto) {
    const { topicId, name, ...rest } = createDto;
    const subtopicName = (name ?? "").trim().length > 500 ? (name as string).substring(0, 497) + "..." : (name ?? "").trim();

    const existing = await this.prisma.subtopic.findFirst({
      where: { topicId, name: subtopicName },
      include: {
        topic: {
          include: {
            system: { include: { product: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (existing) return existing;

    return this.prisma.subtopic.create({
      data: { ...rest, topicId, name: subtopicName },
      include: {
        topic: {
          include: {
            system: { include: { product: { select: { id: true, name: true } } } },
          },
        },
      },
    });
  }

  async updateSubtopic(id: string, updateDto: UpdateSubtopicDto) {
    const subtopic = await this.prisma.subtopic.findUnique({ where: { id } });
    if (!subtopic) throw new NotFoundException(`Subtopic with ID ${id} not found`);

    return this.prisma.subtopic.update({
      where: { id }, data: updateDto,
      include: {
        topic: {
          include: {
            system: { include: { product: { select: { id: true, name: true } } } },
          },
        },
      },
    });
  }

  async removeSubtopic(id: string) {
    const subtopic = await this.prisma.subtopic.findUnique({ where: { id } });
    if (!subtopic) throw new NotFoundException(`Subtopic with ID ${id} not found`);
    return this.prisma.subtopic.update({ where: { id }, data: { isActive: false } });
  }

  async removeSubtopicPermanent(id: string) {
    const subtopic = await this.prisma.subtopic.findUnique({ where: { id } });
    if (!subtopic) throw new NotFoundException(`Subtopic with ID ${id} not found`);
    try {
      await this.prisma.subtopic.delete({ where: { id } });
      return { message: "Subtopic permanently deleted" };
    } catch (e: any) {
      if (e?.code === "P2003" || e?.code === "P2014") {
        throw new ConflictException(
          "Cannot delete this subtopic while it is still referenced. Remove dependent records first.",
        );
      }
      throw e;
    }
  }
}
