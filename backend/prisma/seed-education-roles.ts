import { PrismaClient } from "@prisma/client";

/** Canonical roles for MedPrepAI (education). */
export const EDUCATION_ROLE_NAMES = [
  "SUPERADMIN",
  "ADMIN",
  "FACULTY",
  "STUDENT",
  "INSTITUTION_MANAGER",
] as const;

export type EducationRoleName = (typeof EDUCATION_ROLE_NAMES)[number];

export interface EducationRoles {
  superadmin: { id: string; name: string };
  admin: { id: string; name: string };
  faculty: { id: string; name: string };
  student: { id: string; name: string };
  institutionManager: { id: string; name: string };
}

/**
 * Removes all user↔role and role↔permission links, deletes every role, then
 * upserts only education roles. Safe for a full re-seed (e.g. migrate reset).
 */
export async function resetRolesAndSeedEducationRoles(
  prisma: PrismaClient
): Promise<EducationRoles> {
  console.log("🎓 Resetting roles for education platform…");

  const rolesToRemove = await prisma.role.findMany({
    where: { name: { notIn: [...EDUCATION_ROLE_NAMES] } },
    select: { id: true },
  });
  const removeIds = rolesToRemove.map((r) => r.id);
  if (removeIds.length > 0) {
    await prisma.userRole.deleteMany({ where: { roleId: { in: removeIds } } });
    await prisma.rolePermission.deleteMany({
      where: { roleId: { in: removeIds } },
    });
    await prisma.role.deleteMany({ where: { id: { in: removeIds } } });
  }

  const upsertRole = async (
    name: EducationRoleName,
    displayName: string,
    description: string
  ) => {
    const row = await prisma.role.upsert({
      where: { name },
      update: { displayName, description, isActive: true },
      create: { name, displayName, description, isActive: true },
    });
    return { id: row.id, name: row.name };
  };

  const superadmin = await upsertRole(
    "SUPERADMIN",
    "Super administrator",
    "Full platform access: billing, tenants, technical operations"
  );
  const admin = await upsertRole(
    "ADMIN",
    "Administrator",
    "Program or organization admin: users, subscriptions, content, settings"
  );
  const faculty = await upsertRole(
    "FACULTY",
    "Faculty",
    "Teacher or clinician: author and review content, assessments, cohort tools"
  );
  const student = await upsertRole(
    "STUDENT",
    "Student",
    "Learner: study, practice tests, subscriptions, personal progress"
  );
  const institutionManager = await upsertRole(
    "INSTITUTION_MANAGER",
    "Institution manager",
    "B2B: seats, cohorts, invites, org-level reporting"
  );

  console.log(`✅ Education roles ready: ${EDUCATION_ROLE_NAMES.join(", ")}`);

  return {
    superadmin,
    admin,
    faculty,
    student,
    institutionManager,
  };
}
