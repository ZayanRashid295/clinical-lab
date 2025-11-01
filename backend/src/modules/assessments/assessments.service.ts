import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateQuestionPaperDto } from "./dto/create-question-paper.dto";
import { UpdateQuestionPaperDto } from "./dto/update-question-paper.dto";
import { CreateQuestionPaperQuestionDto } from "./dto/create-question-paper-question.dto";
import { UpdateQuestionPaperQuestionDto } from "./dto/update-question-paper-question.dto";
import { StartAssessmentDto } from "./dto/start-assessment.dto";
import { SubmitAssessmentDto } from "./dto/submit-assessment.dto";
import { QueryQuestionPaperDto } from "./dto/query-question-paper.dto";
import { QueryQuestionPaperQuestionDto } from "./dto/query-question-paper-question.dto";

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

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
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
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
    return this.prisma.questionPaper.create({
      data: createQuestionPaperDto,
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

  async submitAssessment(id: string, submitAssessmentDto: SubmitAssessmentDto) {
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
          },
        });
      }
    }

    const score =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

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
            productTag: true,
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
      });

    if (!questionPaperQuestion) {
      throw new NotFoundException(
        `Question paper question with ID ${questionPaperQuestionId} not found`
      );
    }

    return this.prisma.questionPaperQuestion.update({
      where: { id: questionPaperQuestionId },
      data: updateQuestionPaperQuestionDto,
      include: {
        question: {
          include: {
            choices: true,
            productTag: true,
          },
        },
      },
    });
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
}
