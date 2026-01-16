import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('👤 Creating admin user: tahir@uber.com');

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'tahir@uber.com' },
      include: { roles: { include: { role: true } } },
    });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating password and ensuring ADMIN role...');
      
      // Update password
      await prisma.user.update({
        where: { email: 'tahir@uber.com' },
        data: { password: hashedPassword },
      });

      // Get ADMIN role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' },
      });

      if (!adminRole) {
        throw new Error('ADMIN role not found. Please run migrations first.');
      }

      // Check if user already has ADMIN role
      const hasAdminRole = existingUser.roles.some(
        (ur) => ur.role.name === 'ADMIN'
      );

      if (!hasAdminRole) {
        // Remove existing roles and assign ADMIN
        await prisma.userRole.deleteMany({
          where: { userId: existingUser.id },
        });

        await prisma.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: adminRole.id,
          },
        });
        console.log('✅ Assigned ADMIN role to existing user');
      } else {
        console.log('✅ User already has ADMIN role');
      }

      console.log('✅ User updated successfully');
      console.log('📧 Email: tahir@uber.com');
      console.log('🔑 Password: password123');
      console.log('👑 Role: ADMIN');
      return;
    }

    // Get or create ADMIN role
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Full system access with all permissions',
        isActive: true,
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'tahir@uber.com',
        password: hashedPassword,
        firstName: 'Tahir',
        lastName: 'User',
        isActive: true,
      },
    });

    // Assign ADMIN role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: tahir@uber.com');
    console.log('🔑 Password: password123');
    console.log('👑 Role: ADMIN');
    console.log('🆔 User ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

