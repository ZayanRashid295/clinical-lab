import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionChoiceDto } from "./dto/create-question-choice.dto";
import { UpdateQuestionChoiceDto } from "./dto/update-question-choice.dto";
import { QueryQuestionDto } from "./dto/query-question.dto";
import { QueryQuestionChoiceDto } from "./dto/query-question-choice.dto";

interface QuestionFilters {
  topicId?: string;
  tagId?: string;
  difficulty?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

interface RandomQuestionFilters {
  topicId?: string;
  tagId?: string;
  difficulty?: string;
  count?: number;
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryQuestionDto) {
    try {
      const {
        search,
        status,
        difficulty,
        topicId,
        productTagId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { question: { contains: search, mode: "insensitive" } },
          { explanation: { contains: search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Difficulty filter
      if (difficulty) {
        where.difficulty = difficulty;
      }

      // Topic ID filter
      if (topicId) {
        where.topicId = topicId;
      }

      // Product tag ID filter
      if (productTagId) {
        where.productTagId = productTagId;
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
      const total = await this.prisma.question.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get questions with pagination and sorting
      const questions = await this.prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: {
              order: "asc",
            },
          },
          productTag: true,
          topic: {
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
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: questions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  }

  async findAllLegacy(filters: QuestionFilters) {
    const where: any = {};

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    if (filters.tagId) {
      where.productTagId = filters.tagId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: {
              order: "asc",
            },
          },
          productTag: true,
          topic: {
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      questions,
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  async getRandomQuestions(filters: RandomQuestionFilters) {
    const where: any = { isActive: true };

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    if (filters.tagId) {
      where.productTagId = filters.tagId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    const count = filters.count || 10;

    // Get total count first
    const totalCount = await this.prisma.question.count({ where });

    if (totalCount === 0) {
      return [];
    }

    // Get random questions
    const questions = await this.prisma.question.findMany({
      where,
      include: {
        choices: {
          orderBy: {
            order: "asc",
          },
        },
        productTag: true,
        topic: {
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
        },
      },
      take: Math.min(count, totalCount),
      orderBy: {
        id: "asc", // This will be randomized by the database
      },
    });

    // Shuffle the results
    return questions.sort(() => Math.random() - 0.5);
  }

  async getQuestionsByTopic(
    topicId: string,
    isActive?: boolean,
    limit?: number,
    offset?: number
  ) {
    // First check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    const where: any = { topicId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: {
              order: "asc",
            },
          },
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

  async getQuestionsByTag(
    tagId: string,
    isActive?: boolean,
    limit?: number,
    offset?: number
  ) {
    // First check if tag exists
    const tag = await this.prisma.productTag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }

    const where: any = { productTagId: tagId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: {
              order: "asc",
            },
          },
          productTag: true,
          topic: {
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
          },
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

  async getStats() {
    const total = await this.prisma.question.count();
    const active = await this.prisma.question.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.question.count({
      where: { isActive: false },
    });

    const byDifficulty = await this.prisma.question.groupBy({
      by: ["difficulty"],
      _count: true,
    });

    return {
      total,
      active,
      inactive,
      byDifficulty: byDifficulty.reduce(
        (acc, item) => {
          acc[item.difficulty] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        choices: {
          orderBy: {
            order: "asc",
          },
        },
        productTag: true,
        topic: {
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
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async create(createQuestionDto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: createQuestionDto,
      include: {
        choices: true,
        productTag: true,
        topic: {
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
        },
      },
    });
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return this.prisma.question.update({
      where: { id },
      data: updateQuestionDto,
      include: {
        choices: true,
        productTag: true,
        topic: {
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
        },
      },
    });
  }

  async remove(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return this.prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========== QUESTION CHOICES ==========
  async findAllQuestionChoices(query: QueryQuestionChoiceDto) {
    try {
      const {
        questionId,
        isCorrect,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "order",
        sortOrder = "asc",
      } = query;

      // Build where clause
      const where: any = {};

      // Question ID filter
      if (questionId) {
        where.questionId = questionId;
      }

      // Correctness filter
      if (isCorrect !== undefined) {
        where.isCorrect = isCorrect;
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
      const total = await this.prisma.questionChoice.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get question choices with pagination and sorting
      const questionChoices = await this.prisma.questionChoice.findMany({
        where,
        include: {
          question: {
            select: {
              id: true,
              question: true,
              topic: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: questionChoices,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching question choices:", error);
      throw error;
    }
  }

  async getQuestionChoiceStats() {
    const total = await this.prisma.questionChoice.count();
    const correct = await this.prisma.questionChoice.count({
      where: { isCorrect: true },
    });
    const incorrect = await this.prisma.questionChoice.count({
      where: { isCorrect: false },
    });

    return {
      total,
      correct,
      incorrect,
    };
  }

  async findOneQuestionChoice(id: string) {
    const questionChoice = await this.prisma.questionChoice.findUnique({
      where: { id },
      include: {
        question: {
          include: {
            topic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!questionChoice) {
      throw new NotFoundException(
        `Question choice with ID ${id} not found`
      );
    }

    return questionChoice;
  }

  async addChoice(
    questionId: string,
    createChoiceDto: CreateQuestionChoiceDto
  ) {
    // First check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return this.prisma.questionChoice.create({
      data: {
        ...createChoiceDto,
        questionId,
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
          },
        },
      },
    });
  }

  async createQuestionChoice(createChoiceDto: CreateQuestionChoiceDto & {
    questionId: string;
  }) {
    // First check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id: createChoiceDto.questionId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with ID ${createChoiceDto.questionId} not found`
      );
    }

    return this.prisma.questionChoice.create({
      data: {
        questionId: createChoiceDto.questionId,
        text: createChoiceDto.text,
        isCorrect: createChoiceDto.isCorrect || false,
        order: createChoiceDto.order || 0,
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            topic: {
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

  async updateChoice(
    choiceId: string,
    updateChoiceDto: UpdateQuestionChoiceDto
  ) {
    const choice = await this.prisma.questionChoice.findUnique({
      where: { id: choiceId },
    });

    if (!choice) {
      throw new NotFoundException(`Choice with ID ${choiceId} not found`);
    }

    return this.prisma.questionChoice.update({
      where: { id: choiceId },
      data: updateChoiceDto,
      include: {
        question: {
          select: {
            id: true,
            question: true,
          },
        },
      },
    });
  }

  async updateQuestionChoice(
    id: string,
    updateChoiceDto: UpdateQuestionChoiceDto
  ) {
    return this.updateChoice(id, updateChoiceDto);
  }

  async removeChoice(choiceId: string) {
    const choice = await this.prisma.questionChoice.findUnique({
      where: { id: choiceId },
    });

    if (!choice) {
      throw new NotFoundException(`Choice with ID ${choiceId} not found`);
    }

    return this.prisma.questionChoice.delete({
      where: { id: choiceId },
    });
  }

  async removeQuestionChoice(id: string) {
    return this.removeChoice(id);
  }
}
