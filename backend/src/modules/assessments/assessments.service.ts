import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateQuestionPaperDto } from "./dto/create-question-paper.dto";
import { UpdateQuestionPaperDto } from "./dto/update-question-paper.dto";
import { CreateQuestionPaperQuestionDto } from "./dto/create-question-paper-question.dto";
import { UpdateQuestionPaperQuestionDto } from "./dto/update-question-paper-question.dto";
import { StartAssessmentDto } from "./dto/start-assessment.dto";
import { SubmitAssessmentDto } from "./dto/submit-assessment.dto";

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  // ========== QUESTION PAPERS ==========
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
