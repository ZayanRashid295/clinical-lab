import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { CreateLearningCaseDto } from "./create-learning-case.dto";

@Injectable()
export class LearningCasesService {
  constructor(private prisma: PrismaService) {}

  async createLearningCase(createLearningCaseDto: CreateLearningCaseDto) {
    try {
      return this.prisma.learningCase.create({
        data: {
          ...createLearningCaseDto,
          symptoms: JSON.stringify(createLearningCaseDto.symptoms),
          history: JSON.stringify(createLearningCaseDto.history),
          labs: JSON.stringify(createLearningCaseDto.labs),
          expectedQuestions: JSON.stringify(
            createLearningCaseDto.expectedQuestions
          ),
          patientProfile: JSON.stringify(createLearningCaseDto.patientProfile),
          vitalSigns: createLearningCaseDto.vitalSigns
            ? JSON.stringify(createLearningCaseDto.vitalSigns)
            : null,
          physicalExam: createLearningCaseDto.physicalExam
            ? JSON.stringify(createLearningCaseDto.physicalExam)
            : null,
        },
      });
    } catch (error) {
      throw new BadRequestException("Failed to create learning case");
    }
  }

  async getAllLearningCases() {
    const cases = await this.prisma.learningCase.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return cases.map((case_) => ({
      ...case_,
      symptoms: JSON.parse(case_.symptoms as string),
      history: JSON.parse(case_.history as string),
      labs: JSON.parse(case_.labs as string),
      expectedQuestions: JSON.parse(case_.expectedQuestions as string),
      patientProfile: JSON.parse(case_.patientProfile as string),
      vitalSigns: case_.vitalSigns
        ? JSON.parse(case_.vitalSigns as string)
        : null,
      physicalExam: case_.physicalExam
        ? JSON.parse(case_.physicalExam as string)
        : null,
    }));
  }

  async getLearningCaseById(id: string) {
    const case_ = await this.prisma.learningCase.findUnique({
      where: { id },
    });

    if (!case_) {
      throw new NotFoundException("Learning case not found");
    }

    return {
      ...case_,
      symptoms: JSON.parse(case_.symptoms as string),
      history: JSON.parse(case_.history as string),
      labs: JSON.parse(case_.labs as string),
      expectedQuestions: JSON.parse(case_.expectedQuestions as string),
      patientProfile: JSON.parse(case_.patientProfile as string),
      vitalSigns: case_.vitalSigns
        ? JSON.parse(case_.vitalSigns as string)
        : null,
      physicalExam: case_.physicalExam
        ? JSON.parse(case_.physicalExam as string)
        : null,
    };
  }

  async updateLearningCase(
    id: string,
    updateData: Partial<CreateLearningCaseDto>
  ) {
    const existingCase = await this.prisma.learningCase.findUnique({
      where: { id },
    });

    if (!existingCase) {
      throw new NotFoundException("Learning case not found");
    }

    try {
      return this.prisma.learningCase.update({
        where: { id },
        data: {
          ...updateData,
          symptoms: updateData.symptoms
            ? JSON.stringify(updateData.symptoms)
            : undefined,
          history: updateData.history
            ? JSON.stringify(updateData.history)
            : undefined,
          labs: updateData.labs ? JSON.stringify(updateData.labs) : undefined,
          expectedQuestions: updateData.expectedQuestions
            ? JSON.stringify(updateData.expectedQuestions)
            : undefined,
          patientProfile: updateData.patientProfile
            ? JSON.stringify(updateData.patientProfile)
            : undefined,
          vitalSigns: updateData.vitalSigns
            ? JSON.stringify(updateData.vitalSigns)
            : undefined,
          physicalExam: updateData.physicalExam
            ? JSON.stringify(updateData.physicalExam)
            : undefined,
        },
      });
    } catch (error) {
      throw new BadRequestException("Failed to update learning case");
    }
  }

  async deleteLearningCase(id: string) {
    const existingCase = await this.prisma.learningCase.findUnique({
      where: { id },
    });

    if (!existingCase) {
      throw new NotFoundException("Learning case not found");
    }

    try {
      // Soft delete by setting isActive to false
      return this.prisma.learningCase.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      throw new BadRequestException("Failed to delete learning case");
    }
  }
}
