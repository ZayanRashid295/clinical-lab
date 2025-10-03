import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateLearningCaseDto } from "./dto/create-learning-case.dto";
import { CreateLearningSessionDto } from "./dto/create-learning-session.dto";
import {
  DoctorQuestionDto,
  DoctorQuestionResponseDto,
} from "./dto/doctor-question.dto";
import {
  PatientResponseDto,
  PatientResponseResponseDto,
} from "./dto/patient-response.dto";
import {
  DoctorThoughtDto,
  DoctorThoughtResponseDto,
} from "./dto/doctor-thought.dto";
import { AskDoctorDto, AskDoctorResponseDto } from "./dto/ask-doctor.dto";

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  // Learning Cases Management
  async createLearningCase(createLearningCaseDto: CreateLearningCaseDto) {
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

  // Learning Sessions Management
  async createLearningSession(
    userId: string,
    createLearningSessionDto: CreateLearningSessionDto
  ) {
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

  // AI Conversation Generation
  async generateDoctorQuestion(
    doctorQuestionDto: DoctorQuestionDto
  ): Promise<DoctorQuestionResponseDto> {
    // TODO: Integrate with OpenAI API for realistic doctor questions
    // For now, return a mock response
    const { context } = doctorQuestionDto;

    const mockQuestions = [
      "Can you tell me more about when these symptoms first started?",
      "How would you describe the pain? Is it sharp, dull, or burning?",
      "Have you experienced any similar episodes in the past?",
      "Are there any activities that seem to trigger or worsen your symptoms?",
      "Have you noticed any changes in your appetite or weight recently?",
      "Are you currently taking any medications or supplements?",
      "Do you have any allergies that I should be aware of?",
      "How has this been affecting your daily activities?",
    ];

    const randomQuestion =
      mockQuestions[Math.floor(Math.random() * mockQuestions.length)];

    return {
      question: randomQuestion,
      explanation:
        "This question helps gather more information about the patient's symptoms and medical history to aid in diagnosis.",
    };
  }

  async generatePatientResponse(
    patientResponseDto: PatientResponseDto
  ): Promise<PatientResponseResponseDto> {
    // TODO: Integrate with OpenAI API for realistic patient responses
    // For now, return a mock response
    const { question, context } = patientResponseDto;

    const mockResponses = [
      "The symptoms started about a week ago, and they've been getting worse.",
      "It's a sharp pain that comes and goes, usually worse in the morning.",
      "I've had similar episodes before, but not this severe.",
      "It seems to get worse when I'm stressed or haven't eaten properly.",
      "My appetite has been poor, and I've lost about 5 pounds.",
      "I'm taking my blood pressure medication and a multivitamin.",
      "I'm allergic to penicillin, but that's the only one I know of.",
      "It's been really difficult to concentrate at work and sleep at night.",
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      response: randomResponse,
      isComplete: Math.random() > 0.7, // 30% chance of being complete
    };
  }

  async generateDoctorThought(
    doctorThoughtDto: DoctorThoughtDto
  ): Promise<DoctorThoughtResponseDto> {
    // TODO: Integrate with OpenAI API for realistic doctor thoughts
    // For now, return a mock response
    const { context } = doctorThoughtDto;

    const mockThoughts = [
      "The patient's symptoms suggest a possible cardiac etiology that needs further investigation.",
      "Given the age and presentation, I should consider both acute and chronic conditions.",
      "The pain pattern and associated symptoms are consistent with several differential diagnoses.",
      "I need to gather more information about the patient's medical history and risk factors.",
      "The vital signs are within normal limits, which is reassuring but doesn't rule out serious conditions.",
      "The patient's description of the pain quality is important for narrowing down the differential.",
      "I should consider ordering some basic labs and imaging to help with the diagnosis.",
      "The patient's response provides valuable information for the clinical assessment.",
    ];

    const randomThought =
      mockThoughts[Math.floor(Math.random() * mockThoughts.length)];

    return {
      thought: randomThought,
    };
  }

  async askDoctor(askDoctorDto: AskDoctorDto): Promise<AskDoctorResponseDto> {
    // TODO: Integrate with OpenAI API for realistic doctor responses to student questions
    // For now, return a mock response
    const { question, context } = askDoctorDto;

    const mockResponses = [
      "That's an excellent question. In this case, we need to consider the patient's age, symptoms, and risk factors.",
      "Great observation! This is indeed an important aspect of the clinical presentation.",
      "You're thinking along the right lines. Let me explain the reasoning behind this approach.",
      "That's a common question students ask. The key is to look at the overall clinical picture.",
      "Good point! This is why we need to gather a comprehensive history and perform a thorough examination.",
      "You're absolutely right to question this. Let me walk you through the differential diagnosis process.",
      "Excellent clinical thinking! This is exactly the kind of reasoning we want to develop.",
      "That's a very insightful question. The answer lies in understanding the pathophysiology.",
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      response: randomResponse,
    };
  }

  // Learning Progress Management
  async updateLearningProgress(userId: string, sessionData: any) {
    const existingProgress = await this.prisma.learningProgress.findUnique({
      where: { userId },
    });

    if (existingProgress) {
      return this.prisma.learningProgress.update({
        where: { userId },
        data: {
          totalSessions: existingProgress.totalSessions + 1,
          completedSessions: sessionData.isComplete
            ? existingProgress.completedSessions + 1
            : existingProgress.completedSessions,
          totalDuration:
            existingProgress.totalDuration + (sessionData.duration || 0),
          averageScore: sessionData.score
            ? ((existingProgress.averageScore || 0) *
                existingProgress.completedSessions +
                sessionData.score) /
              (existingProgress.completedSessions +
                (sessionData.isComplete ? 1 : 0))
            : existingProgress.averageScore,
          lastSessionAt: new Date(),
        },
      });
    } else {
      return this.prisma.learningProgress.create({
        data: {
          userId,
          totalSessions: 1,
          completedSessions: sessionData.isComplete ? 1 : 0,
          totalDuration: sessionData.duration || 0,
          averageScore: sessionData.score || null,
          lastSessionAt: new Date(),
          specialties: JSON.stringify({}),
          difficultyLevel: JSON.stringify({}),
        },
      });
    }
  }

  async getLearningProgress(userId: string) {
    const progress = await this.prisma.learningProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return {
        userId,
        totalSessions: 0,
        completedSessions: 0,
        totalDuration: 0,
        averageScore: null,
        lastSessionAt: null,
        specialties: {},
        difficultyLevel: {},
      };
    }

    return {
      ...progress,
      specialties: JSON.parse(progress.specialties as string),
      difficultyLevel: JSON.parse(progress.difficultyLevel as string),
    };
  }
}
