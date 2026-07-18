import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateQuestionPaperDto } from "./dto/create-question-paper.dto";
import { UpdateQuestionPaperDto } from "./dto/update-question-paper.dto";
import { CreateQuestionPaperQuestionDto } from "./dto/create-question-paper-question.dto";
import { UpdateQuestionPaperQuestionDto } from "./dto/update-question-paper-question.dto";
import { StartAssessmentDto } from "./dto/start-assessment.dto";
import { SubmitAssessmentDto } from "./dto/submit-assessment.dto";
import { QueryQuestionPaperDto } from "./dto/query-question-paper.dto";
import { QueryQuestionPaperQuestionDto } from "./dto/query-question-paper-question.dto";
import { AchievementsService } from "../achievements/achievements.service";
import { buildQuestionPaperAuditSnapshot } from "../../common/utils/question-paper-audit.util";

@Injectable()
export class AssessmentsService {
  constructor(
    private prisma: PrismaService,
    private achievements: AchievementsService
  ) {}

  // ========== QUESTION PAPERS ==========
  async findAll(query: QueryQuestionPaperDto) {
    try {
      const {
        search,
        status,
        type,
        userId,
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
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Type filter
      if (type) {
        where.type = type;
      }

      // User ID filter
      if (userId) {
        where.userId = userId;
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
      const total = await this.prisma.questionPaper.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get question papers with pagination and sorting
      const questionPapers = await this.prisma.questionPaper.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              questionPaperQuestions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: questionPapers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching question papers:", error);
      throw error;
    }
  }

  async getUserQuestionPapers(
    userId: string,
    type?: string,
    isActive?: boolean
  ) {
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.questionPaper.findMany({
      where,
      include: {
        _count: {
          select: {
            questionPaperQuestions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getStats() {
    const total = await this.prisma.questionPaper.count();
    const active = await this.prisma.questionPaper.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.questionPaper.count({
      where: { isActive: false },
    });

    const byType = await this.prisma.questionPaper.groupBy({
      by: ["type"],
      _count: true,
    });

    return {
      total,
      active,
      inactive,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  async findOne(id: string) {
    return this.getQuestionPaper(id);
  }

  async getQuestionPaper(id: string) {
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        questionPaperQuestions: {
          include: {
            question: {
              include: {
                choices: {
                  orderBy: {
                    order: "asc",
                  },
                },
                system: {
                  select: {
                    id: true,
                    name: true,
                    product: { select: { id: true, name: true } }
                  }
                },
                topic: { select: { id: true, name: true } },
                subtopic: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            questionPaperQuestions: true,
          },
        },
      },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    return questionPaper;
  }

  async getQuestionPaperQuestions(id: string) {
    // First check if question paper exists
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    return this.prisma.questionPaperQuestion.findMany({
      where: {
        questionPaperId: id,
      },
      include: {
        question: {
          include: {
            choices: {
              orderBy: {
                order: "asc",
              },
            },
            system: {
                  select: {
                    id: true,
                    name: true,
                    product: { select: { id: true, name: true } }
                  }
                },
                topic: { select: { id: true, name: true } },
                subtopic: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async create(createQuestionPaperDto: CreateQuestionPaperDto) {
    return this.createQuestionPaper(createQuestionPaperDto);
  }

  async createQuestionPaper(createQuestionPaperDto: CreateQuestionPaperDto) {
    try {
      console.log(`[AssessmentsService] Creating question paper for user: ${createQuestionPaperDto.userId}`);
      const { userId, ...paperData } = createQuestionPaperDto;

      return await this.prisma.questionPaper.create({
        data: {
          ...paperData,
          user: {
            connect: { id: userId },
          },
        },
        include: {
          _count: {
            select: {
              questionPaperQuestions: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`[AssessmentsService] Error creating question paper:`, error);
      console.error(`[AssessmentsService] DTO Content:`, JSON.stringify(createQuestionPaperDto, null, 2));
      if ((error as any)?.code === "P2025") {
        throw new UnauthorizedException("Authenticated user not found. Please sign in again.");
      }
      throw error;
    }
  }

  async update(id: string, updateQuestionPaperDto: UpdateQuestionPaperDto) {
    return this.updateQuestionPaper(id, updateQuestionPaperDto);
  }

  async updateQuestionPaper(
    id: string,
    updateQuestionPaperDto: UpdateQuestionPaperDto
  ) {
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    return this.prisma.questionPaper.update({
      where: { id },
      data: updateQuestionPaperDto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questionPaperQuestions: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.removeQuestionPaper(id);
  }

  async removeQuestionPaper(id: string) {
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    return this.prisma.questionPaper.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========== ASSESSMENT ACTIONS ==========
  async startAssessment(id: string, startAssessmentDto: StartAssessmentDto) {
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    // Reset any existing answers for this user
    await this.prisma.questionPaperQuestion.updateMany({
      where: {
        questionPaperId: id,
      },
      data: {
        userAnswer: null,
        isCorrect: null,
        timeSpent: null,
      },
    });

    return {
      message: "Assessment started successfully",
      questionPaper: {
        id: questionPaper.id,
        name: questionPaper.name,
        description: questionPaper.description,
        type: questionPaper.type,
        timeLimit: questionPaper.timeLimit,
        totalQuestions: questionPaper.totalQuestions,
      },
      startTime: new Date(),
    };
  }

  async submitAssessment(
    id: string,
    submitAssessmentDto: SubmitAssessmentDto,
    userId?: string
  ) {
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    let correctAnswers = 0;
    let totalQuestions = 0;

    // Process each answer
    for (const answer of submitAssessmentDto.answers) {
      const questionPaperQuestion =
        await this.prisma.questionPaperQuestion.findUnique({
          where: { id: answer.questionPaperQuestionId },
          include: {
            question: {
              include: {
                choices: true,
              },
            },
          },
        });

      if (questionPaperQuestion) {
        totalQuestions++;

        // Find the correct answer
        const correctChoice = questionPaperQuestion.question.choices.find(
          (choice) => choice.isCorrect
        );

        const isCorrect =
          correctChoice && answer.userAnswer === correctChoice.text;
        if (isCorrect) {
          correctAnswers++;
        }

        // Update the question paper question with the answer
        await this.prisma.questionPaperQuestion.update({
          where: { id: answer.questionPaperQuestionId },
          data: {
            userAnswer: answer.userAnswer,
            isCorrect: isCorrect,
            timeSpent: answer.timeSpent,
            markedForReview: answer.markedForReview ?? false,
          },
        });
      }
    }

    const score =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    if (userId) {
      const tasks: Promise<unknown>[] = [];
      tasks.push(
        this.achievements
          .recordActivity(userId, "QUESTIONS_ANSWERED", 0)
          .catch(() => undefined),
        this.achievements
          .recordActivity(userId, "CORRECT_ANSWERS", 0)
          .catch(() => undefined),
        this.achievements
          .recordActivity(userId, "TESTS_COMPLETED", 0)
          .catch(() => undefined),
        this.achievements
          .recordActivity(userId, "STUDY_MINUTES", 0)
          .catch(() => undefined)
      );
      await Promise.all(tasks);
    }

    return {
      message: "Assessment submitted successfully",
      results: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        percentage: Math.round(score),
      },
      submittedAt: new Date(),
    };
  }

  /** Compact audit snapshot for activity logs and admin review. */
  async getQuestionPaperAuditSnapshot(questionPaperId: string) {
    return buildQuestionPaperAuditSnapshot(this.prisma, questionPaperId);
  }

  async getAssessmentResults(id: string) {
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id },
    });

    if (!questionPaper) {
      throw new NotFoundException(`Question paper with ID ${id} not found`);
    }

    const questionPaperQuestions =
      await this.prisma.questionPaperQuestion.findMany({
        where: {
          questionPaperId: id,
        },
        include: {
          question: {
            include: {
              choices: {
                orderBy: {
                  order: "asc",
                },
              },
              category: { select: { id: true, name: true } },
              product: {
                select: {
                  id: true,
                  name: true,
                  category: { select: { id: true, name: true } },
                },
              },
              system: {
                select: {
                  id: true,
                  name: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      category: { select: { id: true, name: true } },
                    },
                  },
                },
              },
              topic: {
                select: {
                  id: true,
                  name: true,
                  system: { select: { id: true, name: true } },
                },
              },
              subtopic: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      });

    const totalQuestions = questionPaperQuestions.length;
    const answeredQuestions = questionPaperQuestions.filter(
      (q) => q.userAnswer !== null
    ).length;
    const correctAnswers = questionPaperQuestions.filter(
      (q) => q.isCorrect === true
    ).length;
    const incorrectAnswers = questionPaperQuestions.filter(
      (q) => q.isCorrect === false
    ).length;
    const unansweredQuestions = totalQuestions - answeredQuestions;

    const score =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return {
      questionPaper: {
        id: questionPaper.id,
        name: questionPaper.name,
        description: questionPaper.description,
        type: questionPaper.type,
        timeLimit: questionPaper.timeLimit,
      },
      results: {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
        correctAnswers,
        incorrectAnswers,
        score: Math.round(score * 100) / 100,
        percentage: Math.round(score),
      },
      questions: questionPaperQuestions.map((qpq) => ({
        id: qpq.id,
        order: qpq.order,
        question: qpq.question,
        userAnswer: qpq.userAnswer,
        isCorrect: qpq.isCorrect,
        timeSpent: qpq.timeSpent,
      })),
    };
  }

  // ========== QUESTION PAPER QUESTIONS ==========
  async findAllQuestionPaperQuestions(query: QueryQuestionPaperQuestionDto) {
    try {
      const {
        questionPaperId,
        questionId,
        hasAnswer,
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

      // Question paper ID filter
      if (questionPaperId) {
        where.questionPaperId = questionPaperId;
      }

      // Question ID filter
      if (questionId) {
        where.questionId = questionId;
      }

      // Has answer filter
      if (hasAnswer !== undefined) {
        if (hasAnswer) {
          where.userAnswer = { not: null };
        } else {
          where.userAnswer = null;
        }
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
      const total = await this.prisma.questionPaperQuestion.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get question paper questions with pagination and sorting
      const questionPaperQuestions =
        await this.prisma.questionPaperQuestion.findMany({
          where,
          include: {
            questionPaper: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            question: {
              include: {
                choices: {
                  orderBy: {
                    order: "asc",
                  },
                },
                category: { select: { id: true, name: true } },
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: { select: { id: true, name: true } },
                  },
                },
                system: {
                  select: {
                    id: true,
                    name: true,
                    product: {
                      select: {
                        id: true,
                        name: true,
                        category: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
                topic: {
                  select: {
                    id: true,
                    name: true,
                    system: { select: { id: true, name: true } },
                  },
                },
                subtopic: { select: { id: true, name: true } },
              },
            },
          },
          skip,
          take: limit,
          orderBy,
        });

      const totalPages = Math.ceil(total / limit);

      return {
        data: questionPaperQuestions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching question paper questions:", error);
      throw error;
    }
  }

  async getQuestionPaperQuestionStats() {
    const total = await this.prisma.questionPaperQuestion.count();
    const answered = await this.prisma.questionPaperQuestion.count({
      where: { userAnswer: { not: null } },
    });
    const unanswered = await this.prisma.questionPaperQuestion.count({
      where: { userAnswer: null },
    });
    const correct = await this.prisma.questionPaperQuestion.count({
      where: { isCorrect: true },
    });
    const incorrect = await this.prisma.questionPaperQuestion.count({
      where: { isCorrect: false },
    });

    return {
      total,
      answered,
      unanswered,
      correct,
      incorrect,
    };
  }

  async findOneQuestionPaperQuestion(id: string) {
    const questionPaperQuestion =
      await this.prisma.questionPaperQuestion.findUnique({
        where: { id },
        include: {
          questionPaper: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          question: {
            include: {
              choices: {
                orderBy: {
                  order: "asc",
                },
              },
              system: {
                  select: {
                    id: true,
                    name: true,
                    product: { select: { id: true, name: true } }
                  }
                },
                topic: { select: { id: true, name: true } },
                subtopic: { select: { id: true, name: true } },
            },
          },
        },
      });

    if (!questionPaperQuestion) {
      throw new NotFoundException(
        `Question paper question with ID ${id} not found`
      );
    }

    return questionPaperQuestion;
  }

  async createQuestionPaperQuestion(
    createQuestionPaperQuestionDto: CreateQuestionPaperQuestionDto
  ) {
    // First check if question paper exists
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id: createQuestionPaperQuestionDto.questionPaperId },
    });

    if (!questionPaper) {
      throw new NotFoundException(
        `Question paper with ID ${createQuestionPaperQuestionDto.questionPaperId} not found`
      );
    }

    // Check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id: createQuestionPaperQuestionDto.questionId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with ID ${createQuestionPaperQuestionDto.questionId} not found`
      );
    }

    // Check if question already exists in this paper
    const existing = await this.prisma.questionPaperQuestion.findUnique({
      where: {
        questionPaperId_questionId: {
          questionPaperId: createQuestionPaperQuestionDto.questionPaperId,
          questionId: createQuestionPaperQuestionDto.questionId,
        },
      },
    });

    if (existing) {
      throw new NotFoundException(
        "This question is already in the question paper"
      );
    }

    // Get the maximum order value for this question paper
    const maxOrder = await this.prisma.questionPaperQuestion.findFirst({
      where: {
        questionPaperId: createQuestionPaperQuestionDto.questionPaperId,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    const order =
      createQuestionPaperQuestionDto.order ??
      (maxOrder ? maxOrder.order + 1 : 0);

    return this.prisma.questionPaperQuestion.create({
      data: {
        questionPaperId: createQuestionPaperQuestionDto.questionPaperId,
        questionId: createQuestionPaperQuestionDto.questionId,
        order,
      },
      include: {
        questionPaper: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        question: {
          include: {
            choices: {
              orderBy: {
                order: "asc",
              },
            },
            system: {
                  select: {
                    id: true,
                    name: true,
                    product: { select: { id: true, name: true } }
                  }
                },
                topic: { select: { id: true, name: true } },
                subtopic: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async addQuestionToPaper(
    questionPaperId: string,
    createQuestionPaperQuestionDto: CreateQuestionPaperQuestionDto
  ) {
    // First check if question paper exists
    const questionPaper = await this.prisma.questionPaper.findUnique({
      where: { id: questionPaperId },
    });

    if (!questionPaper) {
      throw new NotFoundException(
        `Question paper with ID ${questionPaperId} not found`
      );
    }

    // Check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id: createQuestionPaperQuestionDto.questionId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with ID ${createQuestionPaperQuestionDto.questionId} not found`
      );
    }

    return this.prisma.questionPaperQuestion.create({
      data: {
        questionPaperId,
        questionId: createQuestionPaperQuestionDto.questionId,
        order: createQuestionPaperQuestionDto.order || 0,
      },
      include: {
        question: {
          include: {
            choices: true,
            system: true,
          },
        },
      },
    });
  }

  async updateQuestionPaperQuestion(
    id: string,
    updateQuestionPaperQuestionDto: UpdateQuestionPaperQuestionDto
  ) {
    return this.updateQuestionPaperQuestionById(
      id,
      updateQuestionPaperQuestionDto
    );
  }

  async updateQuestionPaperQuestionById(
    questionPaperQuestionId: string,
    updateQuestionPaperQuestionDto: UpdateQuestionPaperQuestionDto
  ) {
    const questionPaperQuestion =
      await this.prisma.questionPaperQuestion.findUnique({
        where: { id: questionPaperQuestionId },
        include: { questionPaper: { select: { userId: true } } },
      });

    if (!questionPaperQuestion) {
      throw new NotFoundException(
        `Question paper question with ID ${questionPaperQuestionId} not found`
      );
    }

    // Ensure markedForReview is explicitly updated when provided (including false)
    // This ensures that unmarking a question (setting to false) properly updates the database
    const updateData: any = { ...updateQuestionPaperQuestionDto };
    if (updateQuestionPaperQuestionDto.markedForReview !== undefined) {
      updateData.markedForReview = updateQuestionPaperQuestionDto.markedForReview;
    }

    const updated = await this.prisma.questionPaperQuestion.update({
      where: { id: questionPaperQuestionId },
      data: updateData,
      include: {
        question: {
          include: {
            choices: true,
            system: true,
          },
        },
      },
    });

    const ownerId = questionPaperQuestion.questionPaper.userId;
    if (
      ownerId &&
      (updateData.userAnswer !== undefined ||
        updateData.isCorrect !== undefined ||
        updateData.timeSpent !== undefined)
    ) {
      void Promise.all([
        this.achievements
          .recordActivity(ownerId, "QUESTIONS_ANSWERED", 0)
          .catch(() => undefined),
        this.achievements
          .recordActivity(ownerId, "CORRECT_ANSWERS", 0)
          .catch(() => undefined),
        this.achievements
          .recordActivity(ownerId, "TESTS_COMPLETED", 0)
          .catch(() => undefined),
        this.achievements
          .recordActivity(ownerId, "STUDY_MINUTES", 0)
          .catch(() => undefined),
      ]);
    }

    return updated;
  }

  async removeQuestionPaperQuestion(id: string) {
    return this.removeQuestionFromPaper(id);
  }

  async removeQuestionFromPaper(questionPaperQuestionId: string) {
    const questionPaperQuestion =
      await this.prisma.questionPaperQuestion.findUnique({
        where: { id: questionPaperQuestionId },
      });

    if (!questionPaperQuestion) {
      throw new NotFoundException(
        `Question paper question with ID ${questionPaperQuestionId} not found`
      );
    }

    return this.prisma.questionPaperQuestion.delete({
      where: { id: questionPaperQuestionId },
    });
  }

  async getUserQuestionPoolStats(
    userId: string,
    filters?: {
      tagIds?: string[];
      systemIds?: string[];
      subjectIds?: string[];
      topicIds?: string[];
      marked?: boolean;
    }
  ) {
    // Build where clause for filtering questions
    const questionWhere: any = {
      isActive: true,
      isDemo: false,
    };

    // Filter by topics (if provided)
    if (filters?.topicIds && filters.topicIds.length > 0) {
      questionWhere.topicId = { in: filters.topicIds };
    }

    // Filter by systems (if provided)
    if (filters?.systemIds && filters.systemIds.length > 0) {
      questionWhere.systemId = { in: filters.systemIds };
    }

    // Filter by subtopics (subjectIds in some legacy contexts)
    if (filters?.subjectIds && filters.subjectIds.length > 0) {
      questionWhere.subtopicId = { in: filters.subjectIds };
    }

    // Fetch full question data for tag filtering
    const allFilteredQuestions = await this.prisma.question.findMany({
      where: questionWhere,
      select: {
        id: true,
        systemId: true,
        tags: true,
      },
    });

    // Apply tag filtering if needed
    let filteredQuestionIds: string[];
    if (filters?.tagIds && filters.tagIds.length > 0) {
      filteredQuestionIds = allFilteredQuestions
        .filter((question) => {
          // Check direct systemId
          if (question.systemId && filters.tagIds!.includes(question.systemId)) {
            return true;
          }

          // Check tags JSON field for systemIds
          if (question.tags && Array.isArray(question.tags)) {
            for (const tag of question.tags) {
              if (typeof tag === "string" && tag.startsWith("__systemIds:")) {
                try {
                  const tagIdsJson = tag.replace("__systemIds:", "");
                  const questionTagIds = JSON.parse(tagIdsJson);
                  if (Array.isArray(questionTagIds)) {
                    // Check if any of the question's tags match any selected tag
                    if (questionTagIds.some((qTagId) => filters.tagIds!.includes(qTagId))) {
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
        })
        .map((q) => q.id);
    } else {
      filteredQuestionIds = allFilteredQuestions.map((q) => q.id);
    }

    const totalQuestionsCount = filteredQuestionIds.length;

    // Get all question papers for this user
    const userQuestionPapers = await this.prisma.questionPaper.findMany({
      where: { userId },
      select: { id: true },
    });

    const questionPaperIds = userQuestionPapers.map((qp) => qp.id);

    if (questionPaperIds.length === 0) {
      // User has no question papers, so all filtered questions are unused
      // If marked filter is enabled and true, unused should be 0 (unused questions can't be marked)
      const unusedCount = filters?.marked === true ? 0 : totalQuestionsCount;
      return {
        unused: unusedCount,
        incorrect: 0,
        marked: 0,
        omitted: 0,
        correct: 0,
        total: totalQuestionsCount,
      };
    }

    // Get all question paper questions for this user (across all tests)
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

    // Track question status across all attempts for ALL questions
    const questionStatus = new Map<
      string,
      {
        everCorrect: boolean;
        everIncorrect: boolean;
        everOmitted: boolean;
        isMarked: boolean;
        latestUpdatedAt: Date;
      }
    >();

    for (const answer of allUserAnswers) {
      const existing = questionStatus.get(answer.questionId);
      
      if (!existing) {
        questionStatus.set(answer.questionId, {
          everCorrect: answer.isCorrect === true,
          everIncorrect: answer.isCorrect === false,
          everOmitted: answer.userAnswer === null,
          isMarked: answer.markedForReview === true,
          latestUpdatedAt: answer.updatedAt,
        });
      } else {
        questionStatus.set(answer.questionId, {
          everCorrect: existing.everCorrect || (answer.isCorrect === true),
          everIncorrect: existing.everIncorrect || (answer.isCorrect === false),
          everOmitted: existing.everOmitted || (answer.userAnswer === null),
          isMarked: existing.isMarked, // Keep most recent
          latestUpdatedAt: existing.latestUpdatedAt,
        });
      }
    }

    // Filter to only questions that match the current filter criteria
    const filteredQuestionStatus = new Map<string, typeof questionStatus extends Map<string, infer V> ? V : never>();
    for (const questionId of filteredQuestionIds) {
      const status = questionStatus.get(questionId);
      if (status) {
        filteredQuestionStatus.set(questionId, status);
      }
    }

    // Get all encountered question IDs (from filtered questions only)
    const encounteredQuestionIds = new Set(filteredQuestionStatus.keys());

    // Calculate unused: questions never encountered (within filtered set)
    const unused = totalQuestionsCount - encounteredQuestionIds.size;

    // Calculate statistics (only for filtered questions)
    // Note: A question can be in multiple categories (e.g., marked AND correct)
    // If marked filter is enabled, apply AND logic: only count questions that are in the pool AND marked
    let correct = 0;
    let incorrect = 0;
    let omitted = 0;
    let marked = 0;

    for (const [questionId, status] of filteredQuestionStatus.entries()) {
      // If marked filter is enabled, only count questions that are marked
      // Use isMarked (latest value) instead of everMarked
      const matchesMarkedFilter = filters?.marked === undefined || (filters.marked === true && status.isMarked) || (filters.marked === false && !status.isMarked);
      
      if (!matchesMarkedFilter) {
        continue; // Skip this question if it doesn't match the marked filter
      }

      // Count correct: questions that have ever been answered correctly
      // (can also be marked or have been incorrect in other attempts)
      if (status.everCorrect) {
        correct++;
      }
      
      // Count incorrect: questions answered incorrectly but never correctly
      // (can also be marked)
      if (status.everIncorrect && !status.everCorrect) {
        incorrect++;
      }
      
      // Count omitted: questions that were omitted but never answered
      // (can also be marked)
      if (status.everOmitted && !status.everCorrect && !status.everIncorrect) {
        omitted++;
      }

      // Count marked: questions that are CURRENTLY marked (using latest markedForReview value)
      // (can also be correct, incorrect, or omitted)
      if (status.isMarked) {
        marked++;
      }
    }

    // If marked filter is enabled, also filter unused count
    let unusedCount = unused;
    if (filters?.marked === true) {
      // For unused questions, we need to check if they would be marked
      // Since unused questions haven't been encountered, they can't be marked
      // So if marked filter is true, unused should be 0
      unusedCount = 0;
    } else if (filters?.marked === false) {
      // If marked filter is false, unused count remains the same (unused questions are not marked)
      // No change needed
    }

    // Calculate total based on filtered counts (reflecting marked filter if applied)
    const totalCount = unusedCount + incorrect + omitted + correct;

    return {
      unused: unusedCount,
      incorrect,
      marked,
      omitted,
      correct,
      total: totalCount,
    };
  }
}
