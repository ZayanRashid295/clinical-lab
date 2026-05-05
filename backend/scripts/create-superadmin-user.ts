import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { EDUCATION_SEED_USERS } from '../prisma/education-users.seed';

const prisma = new PrismaClient();

const superSeed = EDUCATION_SEED_USERS.find((u) => u.role === 'SUPERADMIN')!;

async function createSuperAdminUser() {
  console.log(`👑 Creating SUPERADMIN user: ${superSeed.email}`);

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Get or create SUPERADMIN role
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPERADMIN' },
      update: {
        displayName: 'Super Administrator',
        description: 'Full system access with all menu items and permissions',
        isActive: true,
      },
      create: {
        name: 'SUPERADMIN',
        displayName: 'Super Administrator',
        description: 'Full system access with all menu items and permissions',
        isActive: true,
      },
    });

    console.log('✅ SUPERADMIN role ready');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: superSeed.email },
      include: { roles: { include: { role: true } } },
    });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating password and ensuring SUPERADMIN role...');
      
      // Update password
      await prisma.user.update({
        where: { email: superSeed.email },
        data: { password: hashedPassword },
      });

      // Check if user already has SUPERADMIN role
      const hasSuperAdminRole = existingUser.roles.some(
        (ur) => ur.role.name === 'SUPERADMIN'
      );

      if (!hasSuperAdminRole) {
        // Remove existing roles and assign SUPERADMIN
        await prisma.userRole.deleteMany({
          where: { userId: existingUser.id },
        });

        await prisma.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: superAdminRole.id,
          },
        });
        console.log('✅ Assigned SUPERADMIN role to existing user');
      } else {
        console.log('✅ User already has SUPERADMIN role');
      }

      console.log('✅ User updated successfully');
      console.log(`📧 Email: ${superSeed.email}`);
      console.log('🔑 Password: password123');
      console.log('👑 Role: SUPERADMIN');
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: superSeed.email,
        password: hashedPassword,
        firstName: superSeed.firstName,
        lastName: superSeed.lastName,
        phone: superSeed.phone,
        isActive: true,
      },
    });

    // Assign SUPERADMIN role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    });

    console.log('✅ SuperAdmin user created successfully!');
    console.log(`📧 Email: ${superSeed.email}`);
    console.log('🔑 Password: password123');
    console.log('👑 Role: SUPERADMIN');
    console.log('🆔 User ID:', user.id);
    console.log('');
    console.log('📋 Menu Access: ALL menu items (Dashboard, Content, Subscriptions, Products, Study, Test Creation, Administration, Assessments, Misc, Messages, Payments, Development)');
  } catch (error) {
    console.error('❌ Error creating superadmin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdminUser()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

