import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addIndexes() {
  console.log('🔧 Adding access control indexes...');

  try {
    // Note: Prisma doesn't support raw SQL indexes directly in migrations
    // We'll use raw SQL to add indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(userId);
    `;
    console.log('✅ Added index: idx_user_roles_user_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(roleId);
    `;
    console.log('✅ Added index: idx_user_roles_role_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(userId);
    `;
    console.log('✅ Added index: idx_user_permissions_user_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permissionId);
    `;
    console.log('✅ Added index: idx_user_permissions_permission_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(roleId);
    `;
    console.log('✅ Added index: idx_role_permissions_role_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permissionId);
    `;
    console.log('✅ Added index: idx_role_permissions_permission_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status ON subscriptions(userId, status);
    `;
    console.log('✅ Added index: idx_subscriptions_user_id_status');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end_date ON subscriptions(status, endDate);
    `;
    console.log('✅ Added index: idx_subscriptions_status_end_date');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_subscription_features_package_id ON subscription_features(subscriptionPackageId);
    `;
    console.log('✅ Added index: idx_subscription_features_package_id');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_subscription_features_feature_id ON subscription_features(packageFeatureId);
    `;
    console.log('✅ Added index: idx_subscription_features_feature_id');

    console.log('\n🎉 All indexes added successfully!');
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addIndexes();





