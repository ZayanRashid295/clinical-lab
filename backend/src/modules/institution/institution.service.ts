import { Injectable } from "@nestjs/common";
import {
  InstitutionMemberResolvedVia,
  InstitutionMemberStatus,
  Prisma,
  StudentActivityType,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { institutionLinkedNotification } from "../faculty/faculty-notifications.util";

function parseEmailDomains(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((d) => String(d).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((d) => String(d).trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      return raw
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
    }
  }
  return [];
}

@Injectable()
export class InstitutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  extractDomain(email: string): string | null {
    const normalized = email.trim().toLowerCase();
    const at = normalized.lastIndexOf("@");
    if (at < 1) return null;
    return normalized.slice(at + 1);
  }

  async findInstitutionByEmail(email: string) {
    const domain = this.extractDomain(email);
    if (!domain) return null;

    const institutions = await this.prisma.institution.findMany({
      where: { isActive: true },
    });

    let best: { id: string; name: string } | null = null;
    let bestLen = -1;

    for (const inst of institutions) {
      const domains = parseEmailDomains(inst.emailDomains);
      for (const d of domains) {
        const needle = d.toLowerCase();
        if (domain === needle || domain.endsWith(`.${needle}`)) {
          if (needle.length > bestLen) {
            bestLen = needle.length;
            best = { id: inst.id, name: inst.name };
          }
        }
      }
    }
    return best;
  }

  async resolveMemberForUser(
    userId: string,
    email: string,
    resolvedVia: InstitutionMemberResolvedVia = InstitutionMemberResolvedVia.DOMAIN,
  ) {
    const institution = await this.findInstitutionByEmail(email);
    if (!institution) return null;

    const primaryFaculty = await this.prisma.facultyProfile.findFirst({
      where: { institutionId: institution.id, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const existingMember = await this.prisma.institutionMember.findUnique({
      where: { userId },
    });

    const member = await this.prisma.institutionMember.upsert({
      where: { userId },
      update: {
        institutionId: institution.id,
        status: InstitutionMemberStatus.ACTIVE,
      },
      create: {
        institutionId: institution.id,
        userId,
        status: InstitutionMemberStatus.ACTIVE,
        resolvedVia,
        primaryFacultyUserId: primaryFaculty?.userId ?? null,
      },
      include: {
        institution: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!existingMember) {
      await this.notifications.emit({
        userId,
        ...institutionLinkedNotification({
          institutionId: institution.id,
          institutionName: institution.name,
        }),
      });
    }

    return member;
  }

  async getMemberForUser(userId: string) {
    return this.prisma.institutionMember.findUnique({
      where: { userId },
      include: {
        institution: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async recordActivity(
    userId: string,
    type: StudentActivityType,
    summary?: string,
    metadata?: Record<string, unknown>,
  ) {
    const member = await this.getMemberForUser(userId);
    if (!member) return null;
    return this.prisma.studentActivityEvent.create({
      data: {
        institutionId: member.institutionId,
        userId,
        type,
        summary: summary?.slice(0, 190) ?? null,
        metadata: metadata
          ? (metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }
}
