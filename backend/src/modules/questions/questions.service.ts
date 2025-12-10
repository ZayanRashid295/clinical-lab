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
      console.log(`🔍 Service - Processing: pool=${pool}, marked=${marked}, userId=${userId}`);

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
          console.log(`🔍 Early return: pool=unused, marked=true, filteredQuestionIds size=${filteredQuestionIds.size}`);
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
          console.log(`🔍 Filtering results: pool=${pool}, marked=${marked}, poolMatch=${poolMatchCount}, markedMatch=${markedMatchCount}, bothMatch=${bothMatchCount}, finalCount=${filteredQuestionIds.size}`);
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
      console.log(`🔍 Before tag counts: filteredQuestionIds is ${filteredQuestionIds === null ? 'null' : filteredQuestionIds instanceof Set ? `Set with size ${filteredQuestionIds.size}` : 'unknown'}`);
      const tagsWithCounts = productTags.map((tag) => {
        let questionsToCount = allQuestions.filter((q) => questionMatchesTag(q, tag.id));
        if (filteredQuestionIds !== null) {
          questionsToCount = questionsToCount.filter((q) => filteredQuestionIds!.has(q.id));
        }
        const count = questionsToCount.length;
        if (tag.name === "Anatomy" || tag.name === "Behavioral science") {
          console.log(`🔍 Tag ${tag.name}: filteredQuestionIds=${filteredQuestionIds === null ? 'null' : `Set(size=${filteredQuestionIds.size})`}, beforeFilter=${allQuestions.filter((q) => questionMatchesTag(q, tag.id)).length}, afterFilter=${count}`);
        }
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
  }) {
    try {
      const { tagIds = [], systemIds = [], subjectIds = [], topicIds = [], pool, marked, limit = 100, userId } = filters;

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

      // Limit to requested amount
      questions = questions.slice(0, limit);

      return questions;
    } catch (error) {
      console.error("Error fetching filtered questions:", error);
      throw error;
    }
  }
}
