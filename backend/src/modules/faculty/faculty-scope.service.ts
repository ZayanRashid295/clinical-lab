import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface FacultyScope {
  userId: string;
  institutionId: string;
  profileId: string;
}

@Injectable()
export class FacultyScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async requireFaculty(userId: string): Promise<FacultyScope> {
    const profile = await this.prisma.facultyProfile.findUnique({
      where: { userId },
    });
    if (!profile || !profile.isActive) {
      throw new ForbiddenException("Faculty profile required");
    }
    return {
      userId,
      institutionId: profile.institutionId,
      profileId: profile.id,
    };
  }

  async studentIdsInScope(institutionId: string): Promise<string[]> {
    const members = await this.prisma.institutionMember.findMany({
      where: {
        institutionId,
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async assertStudentInScope(institutionId: string, studentUserId: string) {
    const member = await this.prisma.institutionMember.findFirst({
      where: {
        institutionId,
        userId: studentUserId,
        status: "ACTIVE",
      },
    });
    if (!member) {
      throw new NotFoundException("Student not in your institution");
    }
    return member;
  }
}
