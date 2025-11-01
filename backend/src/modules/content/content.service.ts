import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { QuerySectionDto } from "./dto/query-section.dto";
import { QueryChapterDto } from "./dto/query-chapter.dto";
import { QueryTopicDto } from "./dto/query-topic.dto";

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // ========== SECTIONS ==========
  async findAllSections(query: QuerySectionDto) {
    try {
      const {
        search,
        status,
        productId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "order",
        sortOrder = "asc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Product ID filter
      if (productId) {
        where.productId = productId;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await this.prisma.section.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get sections with pagination and sorting
      const sections = await this.prisma.section.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              chapters: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: sections,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching sections:", error);
      throw error;
    }
  }

  async getSections(productId?: string, isActive?: boolean) {
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.section.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async getSectionStats() {
    const total = await this.prisma.section.count();
    const active = await this.prisma.section.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.section.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  async getSection(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        chapters: {
          include: {
            _count: {
              select: {
                topics: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  async getSectionChapters(id: string, isActive?: boolean) {
    // First check if section exists
    const section = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    const where: any = { sectionId: id };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.chapter.findMany({
      where,
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async createSection(createSectionDto: CreateSectionDto) {
    return this.prisma.section.create({
      data: createSectionDto,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateSection(id: string, updateSectionDto: UpdateSectionDto) {
    const section = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return this.prisma.section.update({
      where: { id },
      data: updateSectionDto,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async removeSection(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return this.prisma.section.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========== CHAPTERS ==========
  async findAllChapters(query: QueryChapterDto) {
    try {
      const {
        search,
        status,
        sectionId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "order",
        sortOrder = "asc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Section ID filter
      if (sectionId) {
        where.sectionId = sectionId;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await this.prisma.chapter.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get chapters with pagination and sorting
      const chapters = await this.prisma.chapter.findMany({
        where,
        include: {
          section: {
            select: {
              id: true,
              name: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              topics: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: chapters,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching chapters:", error);
      throw error;
    }
  }

  async getChapters(sectionId?: string, isActive?: boolean) {
    const where: any = {};

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.chapter.findMany({
      where,
      include: {
        section: {
          select: {
            id: true,
            name: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async getChapterStats() {
    const total = await this.prisma.chapter.count();
    const active = await this.prisma.chapter.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.chapter.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  async getChapter(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        topics: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return chapter;
  }

  async getChapterTopics(id: string, isActive?: boolean) {
    // First check if chapter exists
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    const where: any = { chapterId: id };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.topic.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async createChapter(createChapterDto: CreateChapterDto) {
    return this.prisma.chapter.create({
      data: createChapterDto,
      include: {
        section: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async updateChapter(id: string, updateChapterDto: UpdateChapterDto) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return this.prisma.chapter.update({
      where: { id },
      data: updateChapterDto,
      include: {
        section: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async removeChapter(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return this.prisma.chapter.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========== TOPICS ==========
  async findAllTopics(query: QueryTopicDto) {
    try {
      const {
        search,
        status,
        chapterId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "order",
        sortOrder = "asc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Chapter ID filter
      if (chapterId) {
        where.chapterId = chapterId;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await this.prisma.topic.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get topics with pagination and sorting
      const topics = await this.prisma.topic.findMany({
        where,
        include: {
          chapter: {
            include: {
              section: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: topics,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  }

  async getTopics(chapterId?: string, isActive?: boolean) {
    const where: any = {};

    if (chapterId) {
      where.chapterId = chapterId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.topic.findMany({
      where,
      include: {
        chapter: {
          include: {
            section: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async getTopicStats() {
    const total = await this.prisma.topic.count();
    const active = await this.prisma.topic.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.topic.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  async getTopic(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            section: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        questions: {
          include: {
            choices: true,
            productTag: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return topic;
  }

  async getTopicQuestions(
    id: string,
    isActive?: boolean,
    limit?: number,
    offset?: number
  ) {
    // First check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    const where: any = { topicId: id };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          choices: true,
          productTag: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      questions,
      total,
      limit,
      offset,
    };
  }

  async createTopic(createTopicDto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: createTopicDto,
      include: {
        chapter: {
          include: {
            section: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateTopic(id: string, updateTopicDto: UpdateTopicDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
      include: {
        chapter: {
          include: {
            section: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async removeTopic(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return this.prisma.topic.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
