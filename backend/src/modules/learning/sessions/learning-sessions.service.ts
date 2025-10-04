import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CreateLearningSessionDto } from "./create-learning-session.dto";

@Injectable()
export class LearningSessionsService {
  constructor(private prisma: PrismaService) {}

  async createLearningSession(
    userId: string,
    createLearningSessionDto: CreateLearningSessionDto
  ) {
    try {
      return this.prisma.learningSession.create({
        data: {
          ...createLearningSessionDto,
          userId,
          conversation: JSON.stringify(
            createLearningSessionDto.conversation || []
          ),
          soapNote: createLearningSessionDto.soapNote
            ? JSON.stringify(createLearningSessionDto.soapNote)
            : null,
        },
      });
    } catch (error) {
      throw new BadRequestException("Failed to create learning session");
    }
  }

  async getLearningSessionById(id: string, userId: string) {
    const session = await this.prisma.learningSession.findFirst({
      where: { id, userId },
      include: { case: true },
    });

    if (!session) {
      throw new NotFoundException("Learning session not found");
    }

    return {
      ...session,
      conversation: JSON.parse(session.conversation as string),
      soapNote: session.soapNote
        ? JSON.parse(session.soapNote as string)
        : null,
      case: {
        ...session.case,
        symptoms: JSON.parse(session.case.symptoms as string),
        history: JSON.parse(session.case.history as string),
        labs: JSON.parse(session.case.labs as string),
        expectedQuestions: JSON.parse(session.case.expectedQuestions as string),
        patientProfile: JSON.parse(session.case.patientProfile as string),
        vitalSigns: session.case.vitalSigns
          ? JSON.parse(session.case.vitalSigns as string)
          : null,
        physicalExam: session.case.physicalExam
          ? JSON.parse(session.case.physicalExam as string)
          : null,
      },
    };
  }

  async updateLearningSession(
    id: string,
    userId: string,
    updateData: Partial<CreateLearningSessionDto>
  ) {
    const session = await this.prisma.learningSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException("Learning session not found");
    }

    try {
      return this.prisma.learningSession.update({
        where: { id },
        data: {
          ...updateData,
          conversation: updateData.conversation
            ? JSON.stringify(updateData.conversation)
            : undefined,
          soapNote: updateData.soapNote
            ? JSON.stringify(updateData.soapNote)
            : undefined,
        },
      });
    } catch (error) {
      throw new BadRequestException("Failed to update learning session");
    }
  }

  async getUserLearningSessions(userId: string) {
    const sessions = await this.prisma.learningSession.findMany({
      where: { userId },
      include: { case: true },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) => ({
      ...session,
      conversation: JSON.parse(session.conversation as string),
      soapNote: session.soapNote
        ? JSON.parse(session.soapNote as string)
        : null,
      case: {
        ...session.case,
        symptoms: JSON.parse(session.case.symptoms as string),
        history: JSON.parse(session.case.history as string),
        labs: JSON.parse(session.case.labs as string),
        expectedQuestions: JSON.parse(session.case.expectedQuestions as string),
        patientProfile: JSON.parse(session.case.patientProfile as string),
        vitalSigns: session.case.vitalSigns
          ? JSON.parse(session.case.vitalSigns as string)
          : null,
        physicalExam: session.case.physicalExam
          ? JSON.parse(session.case.physicalExam as string)
          : null,
      },
    }));
  }

  async deleteLearningSession(id: string, userId: string) {
    const session = await this.prisma.learningSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException("Learning session not found");
    }

    try {
      return this.prisma.learningSession.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException("Failed to delete learning session");
    }
  }
}
