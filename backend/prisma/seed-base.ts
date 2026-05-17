import { PrismaClient, type User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { resetRolesAndSeedEducationRoles } from "./seed-education-roles";
import {
  EDUCATION_SEED_USERS,
  type EducationSeedRole,
} from "./education-users.seed";

export async function seedBase(prisma: PrismaClient) {
  console.log("🌱 Starting database seeding (MedPrepAI education)…");

  const roles = await resetRolesAndSeedEducationRoles(prisma);

  console.log("🔐 Creating permissions…");
  const permissions = [
    {
      name: "user:read",
      description: "Read user information",
      resource: "user",
      action: "read",
    },
    {
      name: "user:update",
      description: "Update user information",
      resource: "user",
      action: "update",
    },
    {
      name: "user:delete",
      description: "Delete user",
      resource: "user",
      action: "delete",
    },
    {
      name: "payment:create",
      description: "Process payments",
      resource: "payment",
      action: "create",
    },
    {
      name: "payment:read",
      description: "View payment information",
      resource: "payment",
      action: "read",
    },
    {
      name: "payment:refund",
      description: "Process refunds",
      resource: "payment",
      action: "refund",
    },
    {
      name: "admin:all",
      description: "Full admin access",
      resource: "admin",
      action: "all",
    },
    {
      name: "analytics:read",
      description: "View analytics",
      resource: "analytics",
      action: "read",
    },
    {
      name: "lms:content:write",
      description: "Create or update LMS content",
      resource: "lms",
      action: "content_write",
    },
    {
      name: "lms:assessment:manage",
      description: "Manage assessments and papers",
      resource: "lms",
      action: "assessment_manage",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log("👥 Creating education users…");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const roleIdByName: Record<EducationSeedRole, string> = {
    SUPERADMIN: roles.superadmin.id,
    ADMIN: roles.admin.id,
    FACULTY: roles.faculty.id,
    STUDENT: roles.student.id,
    INSTITUTION_MANAGER: roles.institutionManager.id,
  };

  const assign = async (userId: string, roleId: string) => {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  };

  console.log("🔗 Upserting users and roles…");
  const allUsers: User[] = [];
  for (const def of EDUCATION_SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {
        isActive: true,
        firstName: def.firstName,
        lastName: def.lastName,
        phone: def.phone,
        password: hashedPassword,
      },
      create: {
        email: def.email,
        password: hashedPassword,
        firstName: def.firstName,
        lastName: def.lastName,
        phone: def.phone,
        isActive: true,
      },
    });
    await assign(user.id, roleIdByName[def.role]);
    allUsers.push(user);
  }

  const byEmail = (e: string) =>
    allUsers.find((u) => u.email.toLowerCase() === e.toLowerCase());
  const studentPrimary = byEmail("student@clinicallab.test")!;
  const studentSecondary = byEmail("learner@clinicallab.test")!;
  const facultyUser = byEmail("faculty@clinicallab.test")!;

  console.log("⚙️ Creating user settings…");
  for (const user of allUsers) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        language: "en",
        timezone: "UTC",
        notifications: { email: true, push: true, sms: false },
        privacySettings: { shareLocation: false, sharePhone: false },
      },
    });
  }

  console.log("💰 Creating wallets…");
  for (const u of [studentPrimary, studentSecondary, facultyUser]) {
    await prisma.wallet.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        balance: 0,
        currency: "USD",
        isActive: true,
      },
    });
  }

  console.log("💬 Creating sample chat room…");
  const studyRoom = await prisma.chatRoom.create({
    data: {
      name: "Faculty — student Q&A",
      type: "GROUP",
      isActive: true,
    },
  });

  await prisma.chatParticipant.create({
    data: {
      chatRoomId: studyRoom.id,
      userId: studentPrimary.id,
      role: "MEMBER",
    },
  });
  await prisma.chatParticipant.create({
    data: {
      chatRoomId: studyRoom.id,
      userId: facultyUser.id,
      role: "MEMBER",
    },
  });

  await prisma.chatMessage.create({
    data: {
      chatRoomId: studyRoom.id,
      senderId: facultyUser.id,
      content: "Welcome — post your study questions here.",
      type: "TEXT",
    },
  });

  console.log("🔕 Creating notification preferences…");
  for (const user of allUsers) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        preferences: {
          courseUpdates: true,
          assessments: true,
          security: true,
          marketing: false,
        },
      },
    });
  }

  console.log("🎟️ Creating promo codes…");
  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "Welcome discount for new learners",
      type: "PERCENTAGE",
      value: 10.0,
      minAmount: 20.0,
      maxDiscount: 5.0,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("⚙️ Creating system settings…");
  const systemSettings = [
    { key: "app_name", value: "MedPrepAI", type: "string" },
    { key: "maintenance_mode", value: "false", type: "boolean" },
    {
      key: "supported_currencies",
      value: '["USD","EUR","GBP"]',
      type: "json",
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("✅ Education seed base completed.");
  console.log("\n📊 Summary:");
  console.log(`- Users: ${allUsers.length}`);
  console.log(`- Roles: SUPERADMIN, ADMIN, FACULTY, STUDENT, INSTITUTION_MANAGER`);
  console.log(`- Permissions: ${permissions.length}`);
  console.log("\n🔑 Test credentials (password: password123):");
  for (const def of EDUCATION_SEED_USERS) {
    console.log(`  ${def.role.padEnd(20)} ${def.email}`);
  }
}
