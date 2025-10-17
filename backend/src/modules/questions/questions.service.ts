import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionChoiceDto } from "./dto/create-question-choice.dto";
import { UpdateQuestionChoiceDto } from "./dto/update-question-choice.dto";

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

  async findAll(filters: QuestionFilters) {
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
    });
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
}
