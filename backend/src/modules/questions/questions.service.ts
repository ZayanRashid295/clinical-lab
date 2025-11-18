import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { Express } from "express";
import * as sharp from "sharp";
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

    // If chapterId is provided, fetch chapter name for subject
    if (chapterId && !questionCore.subject) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { name: true },
      });
      if (chapter) {
        questionCore.subject = chapter.name;
      }
    }

    // If sectionId is provided, fetch section name for system
    if (sectionId && !questionCore.system) {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
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
        ...(sectionId ? { sectionId } : {}),
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

    // If chapterId is provided, fetch chapter name for subject
    if (chapterId && !questionCore.subject) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { name: true },
      });
      if (chapter) {
        questionCore.subject = chapter.name;
      }
    }

    // If sectionId is provided, fetch section name for system
    if (sectionId && !questionCore.system) {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
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
    if (sectionId) {
      data.sectionId = sectionId;
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
    const baseUrl = process.env.API_URL || "http://localhost:3000";
      const url = `${baseUrl}/uploads/${finalFilename}`;

    return { url };
    } catch (error) {
      console.error("Error processing image:", error);
      // Fallback to saving original file if processing fails
      fs.writeFileSync(filepath, file.buffer);
      const baseUrl = process.env.API_URL || "http://localhost:3000";
      const url = `${baseUrl}/uploads/${filename}`;
      return { url };
    }
  }
}
