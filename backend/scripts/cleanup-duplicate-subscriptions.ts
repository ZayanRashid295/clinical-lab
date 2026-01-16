/**
 * Script to clean up duplicate active subscriptions
 * Run this to fix existing data issues where users have multiple ACTIVE subscriptions
 * 
 * Usage: npx ts-node scripts/cleanup-duplicate-subscriptions.ts
 */

import { PrismaClient, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateSubscriptions() {
  console.log("🔍 Starting cleanup of duplicate active subscriptions...");

  try {
    // Get all users with multiple active subscriptions
    const usersWithDuplicates = await prisma.subscription.groupBy({
      by: ["userId"],
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`Found ${usersWithDuplicates.length} user(s) with duplicate active subscriptions`);

    let totalCancelled = 0;

    for (const userGroup of usersWithDuplicates) {
      const userId = userGroup.userId;
      
      // Get all active subscriptions for this user, ordered by creation date (newest first)
      const activeSubscriptions = await prisma.subscription.findMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (activeSubscriptions.length <= 1) {
        continue;
      }

      // Keep the most recent one, cancel all others
      const toCancel = activeSubscriptions.slice(1);
      const cancelledIds = toCancel.map((s) => s.id);

      const updateResult = await prisma.subscription.updateMany({
        where: {
          id: {
            in: cancelledIds,
          },
        },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
      });

      totalCancelled += updateResult.count;
      console.log(
        `✅ User ${userId}: Kept subscription ${activeSubscriptions[0].id}, cancelled ${updateResult.count} duplicate(s)`
      );
    }

    console.log(`\n✅ Cleanup complete! Cancelled ${totalCancelled} duplicate active subscription(s) across ${usersWithDuplicates.length} user(s)`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateSubscriptions()
  .then(() => {
    console.log("✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });





