import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignLMSRoles() {
  console.log('👥 Assigning LMS roles to existing users...');

  try {
    // Create/Update LMS roles
    console.log('\n📝 Creating/updating LMS roles...');
    
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {
        displayName: 'Administrator',
        description: 'Full system access with all permissions',
        isActive: true,
      },
      create: {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Full system access with all permissions',
        isActive: true,
      },
    });
    console.log('✅ ADMIN role ready');

    const studentRole = await prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {
        displayName: 'Student',
        description: 'Medical students who can subscribe and practice',
        isActive: true,
      },
      create: {
        name: 'STUDENT',
        displayName: 'Student',
        description: 'Medical students who can subscribe and practice',
        isActive: true,
      },
    });
    console.log('✅ STUDENT role ready');

    const institutionManagerRole = await prisma.role.upsert({
      where: { name: 'INSTITUTION_MANAGER' },
      update: {
        displayName: 'Institution Manager',
        description: 'Manages institution students and study plans',
        isActive: true,
      },
      create: {
        name: 'INSTITUTION_MANAGER',
        displayName: 'Institution Manager',
        description: 'Manages institution students and study plans',
        isActive: true,
      },
    });
    console.log('✅ INSTITUTION_MANAGER role ready');

    // Get all existing users
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n📋 Found ${allUsers.length} users to assign roles`);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found. Please seed users first.');
      return;
    }

    // First pass: Assign ADMIN to admin@uber.com specifically
    const adminUser = allUsers.find((u) => u.email.toLowerCase() === 'admin@uber.com');
    if (adminUser) {
      // Remove any existing roles for admin user
      await prisma.userRole.deleteMany({
        where: { userId: adminUser.id },
      });
      
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });
      console.log(`✅ Assigned ADMIN role to: ${adminUser.email} (${adminUser.firstName} ${adminUser.lastName})`);
    }

    // Second pass: Assign INSTITUTION_MANAGER
    const institutionUser = allUsers.find(
      (u) =>
        u.email.toLowerCase().includes('institution') ||
        u.email.toLowerCase().includes('manager') ||
        u.email.toLowerCase() === 'jane.smith@example.com'
    ) || allUsers[1]; // Fallback to second user

    if (institutionUser && institutionUser.id !== adminUser?.id) {
      // Remove any existing roles for institution user
      await prisma.userRole.deleteMany({
        where: { userId: institutionUser.id },
      });
      
      await prisma.userRole.create({
        data: {
          userId: institutionUser.id,
          roleId: institutionManagerRole.id,
        },
      });
      console.log(`✅ Assigned INSTITUTION_MANAGER role to: ${institutionUser.email} (${institutionUser.firstName} ${institutionUser.lastName})`);
    }

    // Third pass: Assign STUDENT to all remaining users
    const assignedUserIds = new Set([
      adminUser?.id,
      institutionUser?.id,
    ].filter(Boolean));

    for (const user of allUsers) {
      if (assignedUserIds.has(user.id)) {
        continue; // Skip already assigned users
      }

      // Remove any existing roles and assign STUDENT
      await prisma.userRole.deleteMany({
        where: { userId: user.id },
      });
      
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: studentRole.id,
        },
      });
      console.log(`✅ Assigned STUDENT role to: ${user.email} (${user.firstName} ${user.lastName})`);
    }

    // Summary
    console.log('\n📊 Role Assignment Summary:');
    const adminUsers = await prisma.userRole.findMany({
      where: { roleId: adminRole.id },
      include: { user: true },
    });
    console.log(`   ADMIN: ${adminUsers.length} user(s)`);
    adminUsers.forEach((ur) => {
      console.log(`     - ${ur.user.email}`);
    });

    const studentUsers = await prisma.userRole.findMany({
      where: { roleId: studentRole.id },
      include: { user: true },
    });
    console.log(`   STUDENT: ${studentUsers.length} user(s)`);
    if (studentUsers.length <= 5) {
      studentUsers.forEach((ur) => {
        console.log(`     - ${ur.user.email}`);
      });
    } else {
      studentUsers.slice(0, 5).forEach((ur) => {
        console.log(`     - ${ur.user.email}`);
      });
      console.log(`     ... and ${studentUsers.length - 5} more`);
    }

    const institutionUsers = await prisma.userRole.findMany({
      where: { roleId: institutionManagerRole.id },
      include: { user: true },
    });
    console.log(`   INSTITUTION_MANAGER: ${institutionUsers.length} user(s)`);
    institutionUsers.forEach((ur) => {
      console.log(`     - ${ur.user.email}`);
    });

    console.log('\n🎉 Role assignment completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   ADMIN: Check the first user or user with "admin" in email');
    console.log('   INSTITUTION_MANAGER: Check the second user or user with "institution/manager" in email');
    console.log('   STUDENT: All other users');
  } catch (error) {
    console.error('❌ Error assigning roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

assignLMSRoles();

