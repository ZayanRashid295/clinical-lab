/**
 * Canonical education users for Clinical Lab — single source for Prisma seed
 * and documentation. Password is always set in seed-base (default: password123).
 */
export type EducationSeedRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "FACULTY"
  | "STUDENT"
  | "INSTITUTION_MANAGER";

export interface EducationSeedUser {
  email: string;
  firstName: string;
  lastName: string;
  /** Unique per user for MySQL */
  phone: string;
  role: EducationSeedRole;
}

export const EDUCATION_SEED_USERS: EducationSeedUser[] = [
  {
    email: "superadmin@clinicallab.test",
    firstName: "Super",
    lastName: "Admin",
    phone: "+10000000001",
    role: "SUPERADMIN",
  },
  {
    email: "admin@clinicallab.test",
    firstName: "Org",
    lastName: "Admin",
    phone: "+10000000002",
    role: "ADMIN",
  },
  {
    email: "faculty@clinicallab.test",
    firstName: "Faculty",
    lastName: "Member",
    phone: "+10000000003",
    role: "FACULTY",
  },
  {
    email: "student@clinicallab.test",
    firstName: "Alex",
    lastName: "Student",
    phone: "+10000000004",
    role: "STUDENT",
  },
  {
    email: "learner@clinicallab.test",
    firstName: "Sam",
    lastName: "Learner",
    phone: "+10000000005",
    role: "STUDENT",
  },
  {
    email: "scholar@clinicallab.test",
    firstName: "Jordan",
    lastName: "Scholar",
    phone: "+10000000006",
    role: "STUDENT",
  },
  {
    email: "institution@clinicallab.test",
    firstName: "Institution",
    lastName: "Manager",
    phone: "+10000000007",
    role: "INSTITUTION_MANAGER",
  },
];

export const EDUCATION_SEED_PRIMARY_STUDENT_EMAIL =
  "student@clinicallab.test";
