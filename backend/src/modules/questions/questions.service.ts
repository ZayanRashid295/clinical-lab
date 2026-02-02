import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import * as fs from "fs";
import * as path from "path";
import { Express } from "express";
import * as sharp from "sharp";
import OpenAI from "openai";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionChoiceDto } from "./dto/create-question-choice.dto";
import { UpdateQuestionChoiceDto } from "./dto/update-question-choice.dto";
import { QueryQuestionDto } from "./dto/query-question.dto";
import { QueryQuestionChoiceDto } from "./dto/query-question-choice.dto";
import { ConvertDocxDto } from "./dto/convert-docx.dto";

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
  private openai: OpenAI | null = null;
  // Fixed demo question IDs for non-subscribed users (always the same questions)
  // These will be populated on first access
  private demoQuestionIds: string[] | null = null;
  private readonly demoQuestionCount: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService
  ) {
    // Initialize OpenAI client if API key is available
    const openaiApiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    }
    // Get demo question count from environment variable, default to 10
    this.demoQuestionCount = this.configService.get<number>("DEMO_QUESTION_COUNT") || 10;
  }

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
        sortOrder = "asc",
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
          questionStemBlocks: {
            orderBy: { order: "asc" },
          },
          explanationBlocks: {
            orderBy: { order: "asc" },
          },
          perAnswerExplanations: {
            include: {
              blocks: { orderBy: { order: "asc" } },
            },
          },
          productTag: true,
          chapter: true,
          section: true,
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
          createdAt: "asc",
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
          createdAt: "asc",
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
          createdAt: "asc",
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
        questionStemBlocks: {
          orderBy: { order: "asc" },
        },
        explanationBlocks: {
          orderBy: { order: "asc" },
        },
        perAnswerExplanations: {
          include: {
            blocks: { orderBy: { order: "asc" } },
          },
        },
        productTag: true,
        chapter: true,
        section: true,
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
    try {
    // Extract rich explanation parts not directly mappable to Question fields
    const {
      explanationBlocks,
      perAnswerExplanations,
      questionStemBlocks,
      tags,
      chapterId,
      sectionId,
      ...questionCore
    } = createQuestionDto as any;

    let resolvedSectionId = sectionId;
    // If chapterId is provided, fetch chapter (name and sectionId)
    if (chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { name: true, sectionId: true },
      });
      if (chapter) {
        if (!questionCore.subject) questionCore.subject = chapter.name;
        // Derive section from chapter when sectionId not provided
        if (!resolvedSectionId && chapter.sectionId) resolvedSectionId = chapter.sectionId;
      }
    }

    // If sectionId is provided (or derived from chapter), fetch section name for system
    if (resolvedSectionId && !questionCore.system) {
      const section = await this.prisma.section.findUnique({
        where: { id: resolvedSectionId },
        select: { name: true },
      });
      if (section) {
        questionCore.system = section.name;
      }
    }

    // Prepare tags as JSON if provided
    const tagsJson = Array.isArray(tags) ? (tags as string[]) : undefined;

    // Build nested create for explanation blocks
    const explanationBlocksCreate =
      Array.isArray(explanationBlocks) && explanationBlocks.length > 0
        ? {
              create: explanationBlocks.map((b: any, idx: number) => {
                // Ensure data is a valid JSON object
                let blockData = b.data;
                if (typeof blockData !== "object" || blockData === null) {
                  blockData = {};
                }
                
                // Ensure type is valid
                const validTypes = ["TEXT", "TABLE", "IMAGES"];
                const blockType = validTypes.includes(b.type?.toUpperCase()) 
                  ? b.type.toUpperCase() 
                  : "TEXT";

                return {
                  type: blockType,
              order: typeof b.order === "number" ? b.order : idx,
                  data: blockData,
                };
              }),
          }
        : undefined;

    // Build nested create for per-answer explanations
    const perAnswerCreate =
      perAnswerExplanations && typeof perAnswerExplanations === "object"
        ? {
            create: Object.entries(perAnswerExplanations).map(
                ([label, blocks]: [string, any[]]) => {
                  if (!Array.isArray(blocks)) {
                    return {
                      choiceLabel: String(label),
                      blocks: { create: [] },
                    };
                  }

                  return {
                choiceLabel: String(label),
                blocks: {
                      create: blocks.map((b: any, idx: number) => {
                        // Ensure data is a valid JSON object
                        let blockData = b.data;
                        if (typeof blockData !== "object" || blockData === null) {
                          blockData = {};
                        }
                        
                        // Ensure type is valid
                        const validTypes = ["TEXT", "TABLE", "IMAGES"];
                        const blockType = validTypes.includes(b.type?.toUpperCase()) 
                          ? b.type.toUpperCase() 
                          : "TEXT";

                        return {
                          type: blockType,
                        order: typeof b.order === "number" ? b.order : idx,
                          data: blockData,
                        };
                      }),
                },
                  };
                }
            ),
          }
        : undefined;

    // Build nested create for question stem blocks
    const questionStemBlocksCreate =
      Array.isArray(questionStemBlocks) && questionStemBlocks.length > 0
        ? {
            create: questionStemBlocks.map((b: any, idx: number) => {
              // Ensure data is a valid JSON object
              let blockData = b.data;
              if (typeof blockData !== "object" || blockData === null) {
                blockData = {};
              }
              
              // Ensure type is valid
              const validTypes = ["TEXT", "IMAGES", "TABLE"];
              const blockType = validTypes.includes(b.type?.toUpperCase()) 
                ? b.type.toUpperCase() 
                : "TEXT";

              return {
                type: blockType,
                order: typeof b.order === "number" ? b.order : idx,
                data: blockData,
              };
            }),
          }
        : undefined;

      return await this.prisma.question.create({
      data: {
        ...questionCore,
        // Add chapterId and sectionId if provided
        ...(chapterId ? { chapterId } : {}),
        ...(resolvedSectionId ? { sectionId: resolvedSectionId } : {}),
        // Persist tags as Json if present
        ...(tagsJson ? { tags: tagsJson as unknown as any } : {}),
        // Nested relations
        ...(questionStemBlocksCreate
          ? { questionStemBlocks: questionStemBlocksCreate }
          : {}),
        ...(explanationBlocksCreate
          ? { explanationBlocks: explanationBlocksCreate }
          : {}),
        ...(perAnswerCreate ? { perAnswerExplanations: perAnswerCreate } : {}),
      },
      include: {
        choices: {
          orderBy: { order: "asc" },
        },
        questionStemBlocks: {
          orderBy: { order: "asc" },
        },
        explanationBlocks: {
          orderBy: { order: "asc" },
        },
        perAnswerExplanations: {
          include: {
            blocks: {
              orderBy: { order: "asc" },
            },
          },
        },
        productTag: true,
        chapter: true,
        section: true,
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
    } catch (error: any) {
      console.error("Error creating question:", error);
      console.error("Question DTO:", JSON.stringify(createQuestionDto, null, 2));
      
      // Provide more detailed error message
      if (error.code === "P2002") {
        throw new Error(`Unique constraint violation: ${error.meta?.target}`);
      } else if (error.code === "P2003") {
        throw new Error(`Foreign key constraint violation: ${error.meta?.field_name}`);
      } else if (error.message) {
        throw new Error(`Failed to create question: ${error.message}`);
      } else {
        throw new Error(`Failed to create question: ${JSON.stringify(error)}`);
      }
    }
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // For updates, replace explanation blocks if provided
    const {
      explanationBlocks,
      perAnswerExplanations,
      questionStemBlocks,
      tags,
      chapterId,
      sectionId,
      ...questionCore
    } = updateQuestionDto as any;

    let resolvedSectionId = sectionId;
    // If chapterId is provided, fetch chapter (name and sectionId)
    if (chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { name: true, sectionId: true },
      });
      if (chapter) {
        if (!questionCore.subject) questionCore.subject = chapter.name;
        // Derive section from chapter when sectionId not provided
        if (!resolvedSectionId && chapter.sectionId) resolvedSectionId = chapter.sectionId;
      }
    }

    // If sectionId is provided (or derived from chapter), fetch section name for system
    if (resolvedSectionId && !questionCore.system) {
      const section = await this.prisma.section.findUnique({
        where: { id: resolvedSectionId },
        select: { name: true },
      });
      if (section) {
        questionCore.system = section.name;
      }
    }

    // Prepare core update data
    const data: any = {
      ...questionCore,
    };
    if (Array.isArray(tags)) {
      data.tags = tags as unknown as any;
    }
    if (chapterId) {
      data.chapterId = chapterId;
    }
    if (resolvedSectionId) {
      data.sectionId = resolvedSectionId;
    }

    // Execute in a transaction to keep consistency
    return this.prisma.$transaction(async (tx) => {
      // Update core fields
      const updated = await tx.question.update({
        where: { id },
        data,
      });

      // Replace main explanation blocks if provided
      if (Array.isArray(explanationBlocks)) {
        await tx.explanationBlock.deleteMany({
          where: { questionId: id },
        });
        if (explanationBlocks.length > 0) {
          await tx.explanationBlock.createMany({
            data: explanationBlocks.map((b: any, idx: number) => ({
              questionId: id,
              type: b.type,
              order: typeof b.order === "number" ? b.order : idx,
              data: b.data,
            })),
          });
        }
      }

      // Replace per-answer explanations if provided
      if (perAnswerExplanations && typeof perAnswerExplanations === "object") {
        // Delete existing per-answer explanations and their blocks
        const existing = await tx.perAnswerExplanation.findMany({
          where: { questionId: id },
          select: { id: true },
        });
        if (existing.length > 0) {
          const existingIds = existing.map((e) => e.id);
          await tx.explanationBlock.deleteMany({
            where: { perAnswerId: { in: existingIds } },
          });
          await tx.perAnswerExplanation.deleteMany({
            where: { id: { in: existingIds } },
          });
        }
        // Create new ones
        for (const [label, blocks] of Object.entries(perAnswerExplanations)) {
          const pae = await tx.perAnswerExplanation.create({
            data: {
              questionId: id,
              choiceLabel: String(label),
            },
          });
          if (Array.isArray(blocks) && blocks.length > 0) {
            await tx.explanationBlock.createMany({
              data: blocks.map((b: any, idx: number) => ({
                perAnswerId: pae.id,
                type: b.type,
                order: typeof b.order === "number" ? b.order : idx,
                data: b.data,
              })),
            });
          }
        }
      }

      // Replace question stem blocks if provided
      if (Array.isArray(questionStemBlocks)) {
        // Use the correct Prisma model name (camelCase of QuestionStemBlock)
        const QuestionStemBlockModel = (tx as any).questionStemBlock;
        if (QuestionStemBlockModel) {
          await QuestionStemBlockModel.deleteMany({
            where: { questionId: id },
          });
          if (questionStemBlocks.length > 0) {
            await QuestionStemBlockModel.createMany({
              data: questionStemBlocks.map((b: any, idx: number) => ({
                questionId: id,
                type: b.type,
                order: typeof b.order === "number" ? b.order : idx,
                data: b.data,
              })),
            });
          }
        }
      }

      // Return full object with includes
      return tx.question.findUnique({
        where: { id },
        include: {
          choices: { orderBy: { order: "asc" } },
          questionStemBlocks: { orderBy: { order: "asc" } },
          explanationBlocks: { orderBy: { order: "asc" } },
          perAnswerExplanations: {
            include: { blocks: { orderBy: { order: "asc" } } },
          },
          productTag: true,
          chapter: true,
          section: true,
          topic: {
            include: {
              chapter: {
                include: {
                  section: {
                    include: {
                      product: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
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

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("Invalid file type. Only images are allowed.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException("File size exceeds 5MB limit");
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    try {
      // Process image with sharp to reduce size
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      
      // Resize image if it's too large (max width 1200px, maintain aspect ratio)
      const maxWidth = 1200;
      let processedImage = image;
      
      if (metadata.width && metadata.width > maxWidth) {
        processedImage = image.resize(maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Determine output format and filename
      let finalFilename = filename;
      let finalFilepath = filepath;

      // Compress and save based on image type
      if (file.mimetype === 'image/png') {
        await processedImage
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(finalFilepath);
      } else if (file.mimetype === 'image/gif') {
        // GIFs are converted to PNG for better compression
        finalFilename = filename.replace(/\.gif$/i, '.png');
        finalFilepath = path.join(uploadsDir, finalFilename);
        await processedImage
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(finalFilepath);
      } else if (file.mimetype === 'image/webp') {
        await processedImage
          .webp({ quality: 80 })
          .toFile(finalFilepath);
      } else {
        // JPEG - use quality compression
        await processedImage
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(finalFilepath);
      }

    // Return URL (adjust based on your server configuration)
    // Use API_URL if set, otherwise construct from request origin or use default
    const baseUrl = process.env.API_URL || process.env.FRONTEND_URL || "http://localhost:3000";
    const url = `${baseUrl}/uploads/${finalFilename}`;

    return { url };
    } catch (error) {
      console.error("Error processing image:", error);
      // Fallback to saving original file if processing fails
      fs.writeFileSync(filepath, file.buffer);
      const baseUrl = process.env.API_URL || process.env.FRONTEND_URL || "http://localhost:3000";
      const url = `${baseUrl}/uploads/${filename}`;
      return { url };
    }
  }

  /**
   * Get hierarchical data for test creation
   * Returns tags with question counts, and systems with subjects and topics with counts
   */
  async getTestCreationData(options?: {
    pool?: "unused" | "marked" | "incorrect" | "correct" | "omitted";
    marked?: boolean;
    userId?: string;
  }) {
    try {
      const { pool, marked, userId } = options || {};

      // Get all active product tags
      const productTags = await this.prisma.productTag.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      // Get all active sections with their chapters and topics
      const sections = await this.prisma.section.findMany({
        where: { isActive: true },
        include: {
          chapters: {
            where: { isActive: true },
            include: {
              topics: {
                where: { isActive: true },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });

      // Get all active questions to calculate counts
      const allQuestions = await this.prisma.question.findMany({
        where: { isActive: true },
        select: {
          id: true,
          productTagId: true,
          sectionId: true,
          chapterId: true,
          topicId: true,
          tags: true,
        },
      });

      // If pool is specified, filter questions based on user's question pool status
      let filteredQuestionIds: Set<string> | null = null;
      if (pool && userId) {
        // Early return: unused questions can't be marked, so if pool is "unused" and marked is true, return empty set
        if (pool === "unused" && marked === true) {
          filteredQuestionIds = new Set<string>();
        } else {
        // Get user's question paper questions to determine pool status
        const userQuestionPapers = await this.prisma.questionPaper.findMany({
          where: { userId },
          select: { id: true },
        });

        const questionPaperIds = userQuestionPapers.map((qp) => qp.id);

        if (questionPaperIds.length > 0) {
          // Get all question paper questions for this user
          // Include updatedAt to get the latest status for each question
          const allUserAnswers = await this.prisma.questionPaperQuestion.findMany({
            where: {
              questionPaperId: { in: questionPaperIds },
            },
            select: {
              questionId: true,
              userAnswer: true,
              isCorrect: true,
              markedForReview: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc', // Get most recent first
            },
          });

          // Track question status across all attempts
          // For marked status, use the LATEST value (most recent updatedAt)
          // For other statuses, use "ever" logic (once true, always true)
          const questionStatus = new Map<
            string,
            {
              everCorrect: boolean;
              everIncorrect: boolean;
              everOmitted: boolean;
              isMarked: boolean; // Changed from everMarked to isMarked - uses latest value
              everEncountered: boolean;
              latestUpdatedAt: Date; // Track the most recent update time
            }
          >();

          for (const answer of allUserAnswers) {
            const existing = questionStatus.get(answer.questionId);
            
            if (!existing) {
              // First time seeing this question - since we ordered by updatedAt desc,
              // this is the most recent record for this question
            questionStatus.set(answer.questionId, {
              everEncountered: true,
              isMarked: answer.markedForReview === true, // Use latest value (first record = most recent)
              everOmitted: answer.userAnswer === null,
              everCorrect: answer.isCorrect === true,
              everIncorrect: answer.isCorrect === false,
              latestUpdatedAt: answer.updatedAt,
            });
            } else {
              // We've seen this question before - update "ever" flags but keep the latest marked status
              // Since records are ordered by updatedAt desc, the first record we processed is the most recent
              questionStatus.set(answer.questionId, {
              everEncountered: true,
              isMarked: existing.isMarked, // Keep the first (most recent) value we saw
              everOmitted: existing.everOmitted || (answer.userAnswer === null),
              everCorrect: existing.everCorrect || (answer.isCorrect === true),
              everIncorrect: existing.everIncorrect || (answer.isCorrect === false),
              latestUpdatedAt: existing.latestUpdatedAt, // Keep the first (most recent) timestamp
            });
            }
          }

          // Filter questions based on pool
          const allQuestionIds = new Set(allQuestions.map((q) => q.id));
          const encounteredQuestionIds = new Set(questionStatus.keys());

          filteredQuestionIds = new Set<string>();
          let poolMatchCount = 0;
          let markedMatchCount = 0;
          let bothMatchCount = 0;
          for (const question of allQuestions) {
            const status = questionStatus.get(question.id) || {
              everCorrect: false,
              everIncorrect: false,
              everOmitted: false,
              isMarked: false, // Changed from everMarked to isMarked
              everEncountered: false,
              latestUpdatedAt: new Date(0), // Default to epoch if never encountered
            };

            let matchesPool = false;
            switch (pool) {
              case "unused":
                // Unused questions are those never encountered
                // If marked filter is true, unused questions can't be marked, so skip them
                if (marked === true) {
                  matchesPool = false; // Unused questions can't be marked
                } else {
                matchesPool = !encounteredQuestionIds.has(question.id);
                }
                break;
              case "marked":
                // Use isMarked (latest value) instead of everMarked
                matchesPool = status.isMarked;
                break;
              case "correct":
                matchesPool = status.everCorrect;
                break;
              case "incorrect":
                matchesPool = status.everIncorrect && !status.everCorrect;
                break;
              case "omitted":
                matchesPool = status.everOmitted && !status.everCorrect && !status.everIncorrect;
                break;
            }
            if (matchesPool) poolMatchCount++;

            // Apply marked filter if specified (AND logic with pool)
            // Note: For "unused" pool with marked=true, we already handled it above
            // Use isMarked (latest value) instead of everMarked
            let matchesMarked = true;
            if (marked !== undefined) {
              // Skip marked filter for "unused" pool when marked=true (already handled in matchesPool)
              if (!(pool === "unused" && marked === true)) {
                if (marked) {
                  matchesMarked = status.isMarked; // Use latest value
                } else {
                  matchesMarked = !status.isMarked; // Use latest value
                }
              }
            }
            if (matchesMarked) markedMatchCount++;

            // Question must match both pool and marked criteria
            if (matchesPool && matchesMarked) {
              filteredQuestionIds.add(question.id);
              bothMatchCount++;
            }
          }
        } else if (pool === "unused") {
          // User has no tests, so all questions are unused
            // But if marked filter is enabled and true, unused questions can't be marked, so return empty
            if (marked === true) {
              filteredQuestionIds = new Set<string>();
            } else {
          filteredQuestionIds = new Set(allQuestions.map((q) => q.id));
            }
        } else {
          // User has no tests but wants marked/correct/incorrect/omitted - no questions match
          filteredQuestionIds = new Set<string>();
          }
        }
      }

      // Helper function to check if a question matches a tag
      const questionMatchesTag = (question: any, tagId: string): boolean => {
        // Check direct productTagId
        if (question.productTagId === tagId) {
          return true;
        }
        // Check tags JSON field for productTagIds
        if (question.tags && Array.isArray(question.tags)) {
          for (const tag of question.tags) {
            if (typeof tag === "string" && tag.startsWith("__productTagIds:")) {
              try {
                const tagIdsJson = tag.replace("__productTagIds:", "");
                const tagIds = JSON.parse(tagIdsJson);
                if (Array.isArray(tagIds) && tagIds.includes(tagId)) {
                  return true;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
        return false;
      };

      // Calculate question counts for each tag
      const tagsWithCounts = productTags.map((tag) => {
        let questionsToCount = allQuestions.filter((q) => questionMatchesTag(q, tag.id));
        if (filteredQuestionIds !== null) {
          questionsToCount = questionsToCount.filter((q) => filteredQuestionIds!.has(q.id));
        }
        const count = questionsToCount.length;
        return {
          id: tag.id,
          name: tag.name,
          description: tag.description,
          color: tag.color,
          count,
        };
      });

      // Build hierarchical structure for systems
      const systemsWithData = sections.map((section) => {
        const subjectsWithData = section.chapters.map((chapter) => {
          const topicsWithData = chapter.topics.map((topic) => {
            // Count questions for this topic across all tags
            const topicCountsByTag: Record<string, number> = {};
            
            productTags.forEach((tag) => {
              let questionsToCount = allQuestions.filter((q) => {
                return (
                  q.topicId === topic.id &&
                  questionMatchesTag(q, tag.id)
                );
              });
              if (filteredQuestionIds !== null) {
                questionsToCount = questionsToCount.filter((q) => filteredQuestionIds!.has(q.id));
              }
              const count = questionsToCount.length;
              if (count > 0) {
                topicCountsByTag[tag.id] = count;
              }
            });

            // Total count for this topic (across all tags)
            let topicQuestions = allQuestions.filter((q) => q.topicId === topic.id);
            if (filteredQuestionIds !== null) {
              topicQuestions = topicQuestions.filter((q) => filteredQuestionIds!.has(q.id));
            }
            const totalCount = topicQuestions.length;

            return {
              id: topic.id,
              name: topic.name,
              description: topic.description,
              order: topic.order,
              count: totalCount,
              countsByTag: topicCountsByTag,
            };
          });

          // Count questions for this chapter (subject) across all tags
          const chapterCountsByTag: Record<string, number> = {};
          productTags.forEach((tag) => {
            let questionsToCount = allQuestions.filter((q) => {
              return (
                q.chapterId === chapter.id &&
                questionMatchesTag(q, tag.id)
              );
            });
            if (filteredQuestionIds !== null) {
              questionsToCount = questionsToCount.filter((q) => filteredQuestionIds!.has(q.id));
            }
            const count = questionsToCount.length;
            if (count > 0) {
              chapterCountsByTag[tag.id] = count;
            }
          });

          // Total count for this chapter
          let chapterQuestions = allQuestions.filter((q) => q.chapterId === chapter.id);
          if (filteredQuestionIds !== null) {
            chapterQuestions = chapterQuestions.filter((q) => filteredQuestionIds!.has(q.id));
          }
          const totalChapterCount = chapterQuestions.length;

          return {
            id: chapter.id,
            name: chapter.name,
            description: chapter.description,
            order: chapter.order,
            count: totalChapterCount,
            countsByTag: chapterCountsByTag,
            topics: topicsWithData,
          };
        });

        // Count questions for this section (system) across all tags
        const sectionCountsByTag: Record<string, number> = {};
        productTags.forEach((tag) => {
          let questionsToCount = allQuestions.filter((q) => {
            return (
              q.sectionId === section.id &&
              questionMatchesTag(q, tag.id)
            );
          });
          if (filteredQuestionIds !== null) {
            questionsToCount = questionsToCount.filter((q) => filteredQuestionIds!.has(q.id));
          }
          const count = questionsToCount.length;
          if (count > 0) {
            sectionCountsByTag[tag.id] = count;
          }
        });

        // Total count for this section
        let sectionQuestions = allQuestions.filter((q) => q.sectionId === section.id);
        if (filteredQuestionIds !== null) {
          sectionQuestions = sectionQuestions.filter((q) => filteredQuestionIds!.has(q.id));
        }
        const totalSectionCount = sectionQuestions.length;

        return {
          id: section.id,
          name: section.name,
          description: section.description,
          order: section.order,
          count: totalSectionCount,
          countsByTag: sectionCountsByTag,
          subjects: subjectsWithData,
        };
      });

      return {
        tags: tagsWithCounts,
        systems: systemsWithData,
      };
    } catch (error) {
      console.error("Error fetching test creation data:", error);
      throw error;
    }
  }

  /**
   * Get filtered questions for test taking based on tags, systems, subjects, and topics
   */
  async getFilteredQuestions(filters: {
    tagIds?: string[];
    systemIds?: string[];
    subjectIds?: string[];
    topicIds?: string[];
    pool?: "unused" | "incorrect" | "correct" | "omitted";
    marked?: boolean;
    limit?: number;
    userId?: string;
    userRoles?: string[]; // User roles to check for ADMIN/SUPERADMIN bypass
  }) {
    try {
      const { tagIds = [], systemIds = [], subjectIds = [], topicIds = [], pool, marked, limit = 100, userId, userRoles = [] } = filters;

      // Build where clause
      const where: any = {
        isActive: true,
      };

      // Filter by topics (if provided)
      if (topicIds.length > 0) {
        where.topicId = { in: topicIds };
      }

      // Filter by sections/systems (if provided)
      if (systemIds.length > 0) {
        where.sectionId = { in: systemIds };
      }

      // Filter by chapters/subjects (if provided)
      if (subjectIds.length > 0) {
        where.chapterId = { in: subjectIds };
      }

      // Get all questions first to filter by tags (since tags can be in JSON field)
      // For pool filtering, we need to fetch more questions to ensure we have enough after filtering
      // If pool is specified, fetch a larger batch to account for questions that will be filtered out
      const fetchLimit = pool ? Math.max(limit * 20, 500) : limit * 2; // Fetch more if pool filtering is active
      let questions = await this.prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: { order: "asc" },
          },
          questionStemBlocks: {
            orderBy: { order: "asc" },
          },
          explanationBlocks: {
            orderBy: { order: "asc" },
          },
          perAnswerExplanations: {
            include: {
              blocks: { orderBy: { order: "asc" } },
            },
          },
          productTag: true,
          chapter: true,
          section: true,
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
          createdAt: "asc",
        },
        take: fetchLimit,
      });

      // Filter by tags if provided
      if (tagIds.length > 0) {
        questions = questions.filter((question) => {
          // Check direct productTagId
          if (question.productTagId && tagIds.includes(question.productTagId)) {
            return true;
          }
          
          // Check tags JSON field for productTagIds
          if (question.tags && Array.isArray(question.tags)) {
            for (const tag of question.tags) {
              if (typeof tag === "string" && tag.startsWith("__productTagIds:")) {
                try {
                  const tagIdsJson = tag.replace("__productTagIds:", "");
                  const questionTagIds = JSON.parse(tagIdsJson);
                  if (Array.isArray(questionTagIds)) {
                    // Check if any of the question's tags match any selected tag
                    if (questionTagIds.some((qTagId) => tagIds.includes(qTagId))) {
                      return true;
                    }
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
          
          return false;
        });
      }

      // Filter by question pool if provided
      if (pool && userId) {
        // Get user's question paper questions to determine pool status
        const userQuestionPapers = await this.prisma.questionPaper.findMany({
          where: { userId },
          select: { id: true },
        });

        const questionPaperIds = userQuestionPapers.map((qp) => qp.id);

        if (questionPaperIds.length > 0) {
          // Get all question paper questions for this user
          // Include updatedAt to get the latest status for each question
          const allUserAnswers = await this.prisma.questionPaperQuestion.findMany({
            where: {
              questionPaperId: { in: questionPaperIds },
            },
            select: {
              questionId: true,
              userAnswer: true,
              isCorrect: true,
              markedForReview: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc', // Get most recent first
            },
          });

          // Track question status across all attempts
          // For marked status, use the LATEST value (most recent updatedAt)
          // For other statuses, use "ever" logic (once true, always true)
          const questionStatus = new Map<
            string,
            {
              everCorrect: boolean;
              everIncorrect: boolean;
              everOmitted: boolean;
              isMarked: boolean; // Changed from everMarked to isMarked - uses latest value
              everEncountered: boolean;
              latestUpdatedAt: Date; // Track the most recent update time
            }
          >();

          for (const answer of allUserAnswers) {
            const existing = questionStatus.get(answer.questionId);
            
            if (!existing) {
              // First time seeing this question - since we ordered by updatedAt desc,
              // this is the most recent record for this question
            questionStatus.set(answer.questionId, {
              everEncountered: true,
              isMarked: answer.markedForReview === true, // Use latest value (first record = most recent)
              everOmitted: answer.userAnswer === null,
              everCorrect: answer.isCorrect === true,
              everIncorrect: answer.isCorrect === false,
              latestUpdatedAt: answer.updatedAt,
            });
            } else {
              // We've seen this question before - update "ever" flags but keep the latest marked status
              // Since records are ordered by updatedAt desc, the first record we processed is the most recent
              questionStatus.set(answer.questionId, {
              everEncountered: true,
              isMarked: existing.isMarked, // Keep the first (most recent) value we saw
              everOmitted: existing.everOmitted || (answer.userAnswer === null),
              everCorrect: existing.everCorrect || (answer.isCorrect === true),
              everIncorrect: existing.everIncorrect || (answer.isCorrect === false),
              latestUpdatedAt: existing.latestUpdatedAt, // Keep the first (most recent) timestamp
            });
            }
          }

          // Filter questions based on pool
          const questionIds = new Set(questions.map((q) => q.id));
          const encounteredQuestionIds = new Set(questionStatus.keys());

          questions = questions.filter((question) => {
            const status = questionStatus.get(question.id) || {
              everCorrect: false,
              everIncorrect: false,
              everOmitted: false,
              isMarked: false, // Changed from everMarked to isMarked
              everEncountered: false,
              latestUpdatedAt: new Date(0), // Default to epoch if never encountered
            };

            // First filter by pool type
            let matchesPool = true;
            if (pool) {
            switch (pool) {
              case "unused":
                // Questions never encountered in any test
                  matchesPool = !encounteredQuestionIds.has(question.id);
                  break;
              case "correct":
                // Questions that have ever been answered correctly (even if also marked/incorrect)
                  matchesPool = status.everCorrect;
                  break;
              case "incorrect":
                // Questions that have ever been answered incorrectly (even if also marked)
                // But not if they were ever answered correctly
                  matchesPool = status.everIncorrect && !status.everCorrect;
                  break;
              case "omitted":
                // Questions that have been omitted (not answered) in at least one test
                // But not if they were ever answered
                  matchesPool = status.everOmitted && !status.everCorrect && !status.everIncorrect;
                  break;
              default:
                  matchesPool = true;
            }
            }

            // Then apply marked filter if specified
            // Use isMarked (latest value) instead of everMarked
            let matchesMarked = true;
            if (marked !== undefined) {
              if (marked) {
                // Only include marked questions (using latest value)
                matchesMarked = status.isMarked;
              } else {
                // Exclude marked questions (using latest value)
                matchesMarked = !status.isMarked;
              }
            }

            // Question must match both pool and marked criteria
            return matchesPool && matchesMarked;
          });
        } else if (pool === "unused") {
          // User has no tests, so all questions are unused
          // But if marked filter is enabled and true, unused questions can't be marked, so return empty
          if (marked === true) {
            questions = [];
          }
          // If marked is false or undefined, all questions are unused and not marked (or we don't care about marked), so no filtering needed
        } else {
          // User has no tests but wants marked/correct/incorrect/omitted - return empty
          questions = [];
        }
      }

      // Check if user has ADMIN or SUPERADMIN role - bypass subscription checks
      const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN');
      
      // Check subscription status for non-subscribed users
      // If user has no active subscription, always return the same 10 fixed demo questions
      // But allow full count for count checks (when limit is very high or not set)
      // ADMIN and SUPERADMIN bypass subscription checks
      let hasActiveSubscription = false;
      if (isAdmin) {
        // ADMIN and SUPERADMIN have full access regardless of subscription
        hasActiveSubscription = true;
      } else if (userId) {
        try {
          const activeSubscriptions = await this.subscriptionsService.getUserSubscriptions(
            userId,
            "ACTIVE"
          );
          hasActiveSubscription = activeSubscriptions && activeSubscriptions.length > 0;
        } catch (error) {
          // If subscription check fails, assume no subscription (fail-safe)
          console.error("Error checking subscription status:", error);
          hasActiveSubscription = false;
        }
      }

      // Determine if this is a count check or test generation
      // Count checks typically set limit to 999+ or use default 100
      // Test generation typically sets a specific limit (like 40)
      const isCountCheck = limit >= 999;
      const isTestGeneration = limit < 999 && limit > 0;

      // For non-subscribed users during test generation, always return the same 10 fixed demo questions
      if (!hasActiveSubscription && isTestGeneration) {
        // Get or initialize the fixed demo question IDs
        if (!this.demoQuestionIds) {
          await this.initializeDemoQuestions();
        }

        // Fetch the fixed demo questions with full details
        if (this.demoQuestionIds && this.demoQuestionIds.length > 0) {
          const demoQuestions = await this.prisma.question.findMany({
            where: {
              id: { in: this.demoQuestionIds },
              isActive: true,
            },
            include: {
              choices: {
                orderBy: { order: "asc" },
              },
              questionStemBlocks: {
                orderBy: { order: "asc" },
              },
              explanationBlocks: {
                orderBy: { order: "asc" },
              },
              perAnswerExplanations: {
                include: {
                  blocks: { orderBy: { order: "asc" } },
                },
              },
              productTag: true,
              chapter: true,
              section: true,
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

          // Return the demo questions in the same order as stored IDs
          const orderedDemoQuestions = this.demoQuestionIds
            .map((id) => demoQuestions.find((q) => q.id === id))
            .filter((q) => q !== undefined);

          return orderedDemoQuestions;
        }
      } else if (hasActiveSubscription || isCountCheck) {
        // Subscribed users or count checks: limit to requested amount
        questions = questions.slice(0, limit || questions.length);
      } else {
        // No subscription but count check: return all for accurate count
        questions = questions.slice(0, limit || questions.length);
      }

      return questions;
    } catch (error) {
      console.error("Error fetching filtered questions:", error);
      throw error;
    }
  }

  /**
   * Initialize the fixed demo questions for non-subscribed users
   * Selects the first N active questions from the database (N = DEMO_QUESTION_COUNT)
   */
  private async initializeDemoQuestions(): Promise<void> {
    try {
      // Get the first N active questions (ordered by creation date for consistency)
      const demoQuestions = await this.prisma.question.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: this.demoQuestionCount,
      });

      this.demoQuestionIds = demoQuestions.map((q) => q.id);

      if (this.demoQuestionIds.length < this.demoQuestionCount) {
        console.warn(
          `⚠️ Only found ${this.demoQuestionIds.length} active questions for demo. Expected ${this.demoQuestionCount}.`
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ Initialized ${this.demoQuestionIds.length} demo questions for non-subscribed users (config: ${this.demoQuestionCount})`
        );
      }
    } catch (error) {
      console.error("Error initializing demo questions:", error);
      // Set to empty array as fallback
      this.demoQuestionIds = [];
    }
  }

  /**
   * Convert DOCX HTML content to Markdown using OpenAI.
   *
   * IMPORTANT: The model returns Markdown directly, following the
   * existing question-generator template. The frontend parser
   * expects this exact structure.
   */
  async convertDocxToMarkdown(dto: ConvertDocxDto): Promise<{ markdown: string }> {
    if (!this.openai) {
      throw new BadRequestException(
        "OpenAI API key is not configured. Please set OPENAI_API_KEY in environment variables."
      );
    }

    const template = `---
title: "<Subject & Topic> — <Specific Focus>"
tags: [<Tag1>, <Tag2>]
difficulty: <easy|medium|hard>
correct_answer: <Correct Option Letter>
question_id: <Unique Question ID>
---

# <Subject & Topic> — <Specific Focus>
## Topic: <Topic or Subtopic>

## Question
<Question Stem Here>

## Options and Explanations

**A. <Option A Text>**

### Choice A Explanation
- <First key point or sentence.>
- <Second key point. Use bullets for each distinct idea.>
- <Third key point. Do not use one long paragraph.>

**B. <Option B Text>**

### Choice B Explanation
- <First key point.>
- <Second key point.>

**C. <Option C Text>**

### Choice C Explanation
<Explanation for Option C>

<!-- Add more options as needed -->

**Correct Answer:** <Correct Option Letter>

---

## Explanation

<If keywords are provided, include this section:>

### Keywords in the Stem to Identify the Correct Option
- **"<Keyword1>"** – <Explanation of relevance>  
- **"<Keyword2>"** – <Explanation of relevance>  
<Add more keywords if needed>

---

## Choice-by-Choice Explanations

<Per-option explanations go here, in the form:
(Option A) ...
(Option B) ...
etc. After this block, include any remaining tables, differential diagnosis,
and notes as plain markdown.>`;

    // Build image information for LLM (as plain instructions)
    let imageNote = "";
    let imageInstructions = "";
    if (dto.imagePlaceholders && dto.imagePlaceholders.length > 0) {
      imageNote = `\n\n⚠️ CRITICAL: IMAGE PLACEHOLDERS DETECTED ⚠️\n\nThe HTML content contains ${
        dto.imagePlaceholders.length
      } embedded image(s) with placeholders like: <img src="[IMAGE_PLACEHOLDER:filename]" />\n\nAvailable image placeholders in the HTML:\n${dto.imagePlaceholders
        .map((name, idx) => `  ${idx + 1}. [IMAGE_PLACEHOLDER:${name}]`)
        .join(
          "\n"
        )}\n\nYou MUST preserve these placeholders in your Markdown output!`;
      
      imageInstructions = `\n\n7. IMAGES (CRITICAL - DO NOT OMIT)\n   - The HTML source contains image placeholders like:\n     <img src="[IMAGE_PLACEHOLDER:image_0.png]" />\n   - You MUST include these placeholders in your Markdown output.\n   - Convert them to Markdown image syntax:\n     ![Description]([IMAGE_PLACEHOLDER:image_0.png])\n   - Place images in the appropriate location:\n     * If in the question stem → place in "## Question" section\n     * If in explanations → place in "## Explanation" section\n   - DO NOT remove or ignore image placeholders.\n   - DO NOT replace them with text descriptions.\n   - The system requires these placeholders to work correctly.\n   - Available placeholders: ${dto.imagePlaceholders.join(", ")}`;
    }

    const prompt = `You are a medical question parser.
Your task is to perform a **faithful, structure-preserving conversion** of HTML
content (extracted from a DOCX exam question) into Markdown that EXACTLY follows
the template below.

The frontend parser expects this exact structure:
- YAML frontmatter with: title, tags, difficulty, correct_answer, question_id
- "# ..." title line
- "## Topic: ..." line
- "## Question" section with the full clinical case / stem
- "## Options and Explanations" with options A–E in the '**A. text**' format and
  a '### Choice X Explanation' block for each option
- A line '**Correct Answer:** X' where X is A–E
- "## Explanation" section with:
  - ONE '### Keywords in the Stem to Identify the Correct Option' heading
  - A bullet list of keywords (each keyword appears only once)
  - A '---' separator
- '## Choice-by-Choice Explanations' section with:
  - Per-option explanations in the form:
    (Option A) Option A text:
    explanation...

    (Option B) Option B text:
    explanation...
    etc.
  - AFTER those per-option blocks, include any remaining explanation content
    such as tables, or simple text content as plain markdown
    (do NOT repeat the keywords heading there).

DO NOT change this structure. Do NOT omit the correct answer.

====================
HTML CONTENT (SOURCE)
====================
${dto.htmlContent}
${imageNote}

====================
TEMPLATE FORMAT TO FOLLOW
====================
${template}

====================
CRITICAL INSTRUCTIONS
====================
1. FRONTMATTER
   - Fill in: title, tags, difficulty (easy/medium/hard), correct_answer (A–E), question_id.
2. QUESTION STEM
   - Put the full clinical case/question text under '## Question'.
3. OPTIONS
   - Extract all options (A–E) and render them exactly as:
     **A. Option A text**
     **B. Option B text**
     ...
   - For each option, include a '### Choice X Explanation' section immediately after.
4. PER-CHOICE EXPLANATION FORMATTING (CRITICAL – BULLETS AND PARAGRAPHS)
   - Each '### Choice X Explanation' block MUST use proper Markdown so that bullets,
     lists, and paragraphs display correctly in the app. Do NOT output one long
     run-on paragraph.
   - Use bullet lists for key points: start each distinct idea or sentence with
     \"- \" (dash space). Example:
       ### Choice A Explanation
       - Single placenta, one chorion, one amniotic sac.
       - High-risk due to cord entanglement and twin-to-twin transfusion syndrome (TTTS).
       - USG would show one sac with both fetuses inside. Not the case here.
   - If the source has a numbered list, use \"1. \", \"2. \", etc. in Markdown.
   - Use a blank line between paragraphs when there are multiple distinct ideas
     that are not in a list.
   - Use **bold** for important medical terms when appropriate (e.g. **TTTS**).
   - Preserve all content and wording from the source; only add Markdown structure
     (bullets, line breaks, bold) so that formatting renders correctly.
5. CORRECT ANSWER
   - Determine the correct answer letter (A–E) from the HTML (e.g. "ANSWER: C").
   - Set it in both:
     - Frontmatter: correct_answer: C
     - Body: **Correct Answer:** C
6. EXPLANATION SECTION LAYOUT (MUST INCLUDE ALL CONTENT, NOTHING DROPPED)
   - Under '## Explanation', build the content in **this exact order**:
     
     STEP 1 – CHOICE-BY-CHOICE EXPLANATIONS PLACEHOLDER (FIRST)
     - As the very first line under '## Explanation', you MUST include:
       ## Choice-by-Choice Explanations
     - This is a placeholder header that the system requires. Without this
       line the system will fail.
     - Under '## Choice-by-Choice Explanations' you MUST output **only this
       single header line as a placeholder**. Do NOT repeat any per-option
       explanations here.
     - All per-option explanations (for A–E) MUST appear **only** as:
         ### Choice A Explanation
         ...
         ### Choice B Explanation
         ...
       immediately after their corresponding options in the
       '## Options and Explanations' section.
     - Do NOT copy these per-option explanations into the '## Explanation'
       block.
     
     STEP 2 – KEYWORDS BLOCK
     - After the '## Choice-by-Choice Explanations' placeholder, create one heading:
       '### Keywords in the Stem to Identify the Correct Option'
     - Under this heading, include a bullet list of **all important words/phrases
       from the stem that help identify the correct option**, in this format:
         - **"Keyword"** – short explanation
     - These bullets should be derived from the stem text only; do not pull in
       per-option explanations here.
     - After the keywords list, include a '---' line, then a blank line.
     
     STEP 3 – FULL EXPLANATION CONTENT (QUESTION-LEVEL ONLY)
     - After the '---' line, you must output **all remaining question-level
       explanation content** from the DOCX **in the same order it appears in
       the doc**, converted to Markdown:
       - Plain text paragraphs
       - Lists
       - Headings/subheadings
       - Tables (as Markdown tables)
       - Images (as Markdown images with placeholders)
     - This content should explain the reasoning, key concepts, differentials,
       tables, notes, etc. that apply to the **question as a whole**.
     - Do NOT include any per-option explanation blocks in this section (no
       lines starting with "(Option A)", "(Option B)", etc.).
     - Do NOT invent new headings; reuse the logical structure from the source.
     - Do NOT drop, merge, or reorder any content; every piece of text, table,
       or image that appears in the source explanation must appear here.

7. FIDELITY TO SOURCE (CRITICAL – NO PARAPHRASING OR RESTRUCTURING)
   - **Do NOT paraphrase or summarize** any medical content, sentences, or bullet points.
   - **Preserve wording as-is** from the HTML/source whenever possible; only adjust
     formatting so it fits valid Markdown and the required template.
   - **Do NOT invent, infer, or add** new medical facts, explanations, or examples
     that are not explicitly present in the source.
   - **Do NOT move content between headings**. Content that appears under a
     specific heading in the HTML must stay under that same logical heading
     in the Markdown.
   - If any heading exists in the source (whatever its exact text is), you MUST:
       - Preserve the heading text exactly (same wording, same level of meaning).
       - Keep **all content under that heading together and in the same order** as
         in the source.
   - For tables:
       - **Every table in the HTML must appear in the Markdown**.
       - Convert each table 1:1 into a Markdown table, preserving:
         - All rows and columns
         - All header labels
         - The original order of rows and columns
       - Do NOT merge or split tables. Do NOT rename or change column headings.
   - For any content that you are not sure where to place, do NOT drop it and do
     NOT rewrite it. It must still appear somewhere in the Markdown, with the
     same wording and order (you may only adjust formatting to valid Markdown).
   - If the source contains explicit metadata lines such as "Subject:",
     "System:", "Topic:", "Competency Domain:", "Cognitive Level:",
     "Clinical Skill:", or "Difficulty Level:", you may use them to infer
     frontmatter fields (title, tags, difficulty, etc.), but you MUST NOT
     copy these label/value lines into the body of the Markdown (they should
     not appear under '## Question' or '## Explanation').
   - If the source contains a line like "Question ID:", "Question Id", or
     similar, you may use it to set the question_id in the frontmatter, but
     you MUST NOT include that line in the visible question stem or
     explanation text.

${imageInstructions}

Output ONLY the final Markdown. Do NOT wrap it in backticks.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at converting medical question documents into Markdown that follows a strict template used by a parser.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      });

      
      const rawMarkdown = completion.choices[0]?.message?.content?.trim() || "";
      if (!rawMarkdown) {
        throw new BadRequestException("OpenAI did not return any content");
      }

      // Log the raw markdown so you can inspect it in the backend terminal
      // (look for "DOCX->Markdown (raw)" in the NestJS logs).
      console.log("===== DOCX->Markdown (raw) =====\n", rawMarkdown, "\n===============================");
      
      // Check for image placeholders before normalization
      const placeholderCount = (rawMarkdown.match(/\[IMAGE_PLACEHOLDER:[^\]]+\]/g) || []).length;
      console.log(`[Backend] Found ${placeholderCount} image placeholders in raw markdown`);

      let processedMarkdown = normalizeKeywordsSection(rawMarkdown);
      
      // Verify placeholders are still present after normalization
      const placeholderCountAfter = (processedMarkdown.match(/\[IMAGE_PLACEHOLDER:[^\]]+\]/g) || []).length;
      console.log(`[Backend] Found ${placeholderCountAfter} image placeholders after normalization`);
      
      // If placeholders are missing, try to inject them from HTML
      if (dto.imagePlaceholders && dto.imagePlaceholders.length > 0 && placeholderCountAfter === 0) {
        console.warn(`[Backend] ⚠️ WARNING: LLM did not include image placeholders. Attempting to inject them from HTML...`);
        processedMarkdown = injectMissingImagePlaceholders(processedMarkdown, dto.htmlContent, dto.imagePlaceholders);
        const injectedCount = (processedMarkdown.match(/\[IMAGE_PLACEHOLDER:[^\]]+\]/g) || []).length;
        console.log(`[Backend] Injected ${injectedCount} image placeholders from HTML`);
      }
      
      return { markdown: processedMarkdown };
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      throw new BadRequestException(
        `Failed to convert DOCX to Markdown: ${error.message || "Unknown error"}`
      );
    }
  }
}

/**
 * Post-process the markdown to:
 * - Ensure the "Keywords in the Stem..." section appears only once
 * - De-duplicate keyword bullet lines
 * - Avoid touching other headings like "Key Concepts", "Notes", etc.
 */
function normalizeKeywordsSection(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  const seenKeywords = new Set<string>();

  let inKeywords = false;
  let keywordsSectionSeen = false;

  const isKeywordsHeading = (line: string) =>
    /^###\s+Keywords in the Stem to Identify the Correct Option/i.test(line.trim());

  const isSectionBreak = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (/^---\s*$/.test(trimmed)) return true;
    if (/^##\s+/.test(trimmed)) return true;
    if (/^###\s+/.test(trimmed) && !isKeywordsHeading(trimmed)) return true;
    return false;
  };

  // First pass: normalize and deduplicate keywords section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Start of a keywords heading
    if (isKeywordsHeading(trimmed)) {
      // If we've already handled a keywords section, skip this entire duplicate block
      if (keywordsSectionSeen) {
        inKeywords = true;
        // Skip this heading and its bullets
        continue;
      }

      // First (and only) keywords section
      keywordsSectionSeen = true;
      inKeywords = true;
      result.push("### Keywords in the Stem to Identify the Correct Option");
      continue;
    }

    if (inKeywords) {
      // If we hit a break, close the keywords block and continue normal copy
      if (isSectionBreak(line)) {
        inKeywords = false;
        // Preserve the break line itself
        result.push(line);
        continue;
      }

      // Handle bullet lines in keywords section
      if (/^[-*•]\s+/.test(trimmed)) {
        // Try to extract the quoted keyword text between **"..."**
        // Examples:
        // - **"Keyword"** – explanation
        // - **“Keyword”** – explanation
        const keywordMatch = trimmed.match(/\*\*["“]?([^"”]+)["”]?\*\*/);
        const keywordText = keywordMatch ? keywordMatch[1].trim() : trimmed;

        if (!seenKeywords.has(keywordText)) {
          seenKeywords.add(keywordText);
          result.push(line);
        }
        // Skip duplicate bullets
        continue;
      }

      // Any non-bullet non-break line inside keywords: just copy once
      result.push(line);
      continue;
    }

    // Outside keywords block: copy as-is
    result.push(line);
  }

  // Second pass: remove duplicated per-option blocks under "## Choice-by-Choice Explanations"
  const lines2 = result.join("\n").split("\n");
  const finalLines: string[] = [];
  let inChoiceSection = false;

  for (let i = 0; i < lines2.length; i++) {
    const line = lines2[i];
    const trimmed = line.trim();

    if (/^##\s+Choice-by-Choice Explanations/i.test(trimmed)) {
      // Always keep only the clean header line without any trailing content
      finalLines.push("## Choice-by-Choice Explanations");
      inChoiceSection = true;
      continue;
    }

    if (inChoiceSection) {
      // Skip any "(Option X)" blocks – these are duplicates of the per-choice explanations.
      // We skip the line itself and all following non-empty lines until a blank line
      // or a new section header. This handles both list-style and paragraph-style blocks.
      if (/^\(Option\s+[A-E]\)/i.test(trimmed) || /^-\s*\(Option\s+[A-E]\)/i.test(trimmed)) {
        i++;
        while (
          i < lines2.length &&
          lines2[i].trim() !== "" &&
          !/^##\s+/.test(lines2[i].trim())
        ) {
          i++;
        }
        // for-loop will i++ again; adjust
        i--;
        continue;
      }

      // If we hit another section/header, we are out of the choice section
      if (/^##\s+/.test(trimmed) && !/^##\s+Choice-by-Choice Explanations/i.test(trimmed)) {
        inChoiceSection = false;
        finalLines.push(line);
        continue;
      }

      // Otherwise, keep whatever remains (e.g. Key Concept, Exam Pearl headings, tables)
      finalLines.push(line);
      continue;
    }

    finalLines.push(line);
  }

  return finalLines.join("\n");
}

/**
 * Inject missing image placeholders into markdown by analyzing HTML source
 * This is a fallback when LLM doesn't preserve placeholders
 */
function injectMissingImagePlaceholders(
  markdown: string,
  htmlContent: string,
  imagePlaceholders: string[]
): string {
  // Extract image positions from HTML
  const imagePositions: Array<{ placeholder: string; context: string; position: number }> = [];
  
  for (const placeholder of imagePlaceholders) {
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const imgPattern = new RegExp(`<img[^>]*src=["']\\[IMAGE_PLACEHOLDER:${escapedPlaceholder}\\][^>]*>`, "gi");
    const matches = Array.from(htmlContent.matchAll(imgPattern));
    
    for (const match of matches) {
      const position = match.index || 0;
      // Extract surrounding context (50 chars before and after)
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(htmlContent.length, position + match[0].length + 50);
      const context = htmlContent.substring(contextStart, contextEnd).replace(/<[^>]+>/g, " ").trim();
      
      imagePositions.push({
        placeholder,
        context: context.substring(0, 100), // Limit context length
        position,
      });
    }
  }
  
  // If no images found in HTML, return markdown as-is
  if (imagePositions.length === 0) {
    return markdown;
  }
  
  // Try to find appropriate locations in markdown to inject placeholders
  // Strategy: Look for sections that might contain images (Question, Explanation sections)
  let result = markdown;
  const injected: Set<string> = new Set();
  
  for (const imgInfo of imagePositions) {
    if (injected.has(imgInfo.placeholder)) continue;
    
    // Try to find a good location based on context
    // If context mentions "question", "stem", "case" → inject in Question section
    // Otherwise → inject in Explanation section
    
    const contextLower = imgInfo.context.toLowerCase();
    let insertionPoint = -1;
    
    if (contextLower.includes("question") || contextLower.includes("stem") || contextLower.includes("case") || contextLower.includes("patient")) {
      // Insert in Question section
      const questionMatch = result.match(/^##\s+Question\s*$/m);
      if (questionMatch && questionMatch.index !== undefined) {
        // Find the end of the question text (before Options section)
        const questionEnd = result.indexOf("## Options", questionMatch.index);
        if (questionEnd > questionMatch.index) {
          insertionPoint = questionEnd;
        } else {
          insertionPoint = questionMatch.index + questionMatch[0].length;
        }
      }
    } else {
      // Insert in Explanation section (after Choice-by-Choice Explanations)
      const choiceSectionMatch = result.match(/^##\s+Choice-by-Choice Explanations\s*$/m);
      if (choiceSectionMatch && choiceSectionMatch.index !== undefined) {
        // Find the end of per-option blocks (look for next ## heading or end of section)
        let searchStart = choiceSectionMatch.index + choiceSectionMatch[0].length;
        const nextSectionMatch = result.substring(searchStart).match(/^##\s+/m);
        if (nextSectionMatch) {
          insertionPoint = searchStart + nextSectionMatch.index;
        } else {
          // Insert at end of Choice-by-Choice section
          insertionPoint = result.length;
        }
      } else {
        // Fallback: insert at end of Explanation section
        const explanationMatch = result.match(/^##\s+Explanation\s*$/m);
        if (explanationMatch && explanationMatch.index !== undefined) {
          insertionPoint = explanationMatch.index + explanationMatch[0].length;
        }
      }
    }
    
    // Insert placeholder if we found a location
    if (insertionPoint >= 0) {
      const imageMarkdown = `\n\n![Image]([IMAGE_PLACEHOLDER:${imgInfo.placeholder}])\n\n`;
      result = result.substring(0, insertionPoint) + imageMarkdown + result.substring(insertionPoint);
      injected.add(imgInfo.placeholder);
      console.log(`[Backend] Injected placeholder ${imgInfo.placeholder} at position ${insertionPoint}`);
    }
  }
  
  // If we still have uninjected placeholders, add them at the end of Explanation section
  for (const placeholder of imagePlaceholders) {
    if (!injected.has(placeholder)) {
      const explanationMatch = result.match(/^##\s+Explanation\s*$/m);
      if (explanationMatch && explanationMatch.index !== undefined) {
        // Find end of explanation section
        let searchStart = explanationMatch.index + explanationMatch[0].length;
        const nextMajorSection = result.substring(searchStart).match(/^#\s+/m);
        const insertionPoint = nextMajorSection 
          ? searchStart + nextMajorSection.index 
          : result.length;
        
        const imageMarkdown = `\n\n![Image]([IMAGE_PLACEHOLDER:${placeholder}])\n\n`;
        result = result.substring(0, insertionPoint) + imageMarkdown + result.substring(insertionPoint);
        injected.add(placeholder);
        console.log(`[Backend] Injected placeholder ${placeholder} at end of Explanation section`);
      }
    }
  }
  
  return result;
}
