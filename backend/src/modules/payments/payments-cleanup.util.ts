/**
 * Utility functions for cleaning up invalid payment data
 * Use these when testing with invalid user IDs or cleaning up orphaned payments
 */

import { PrismaService } from "../../common/prisma/prisma.service";

export class PaymentsCleanupUtil {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all payments with invalid user IDs (users that don't exist)
   */
  async findInvalidPayments() {
    const allPayments = await this.prisma.payment.findMany({
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    const validUserIds = await this.prisma.user.findMany({
      select: { id: true },
    });
    const validUserIdSet = new Set(validUserIds.map((u) => u.id));

    const invalidPayments = allPayments.filter(
      (p) => !validUserIdSet.has(p.userId)
    );

    return invalidPayments;
  }

  /**
   * Delete payments with invalid user IDs
   * WARNING: This permanently deletes payments. Use with caution!
   */
  async deleteInvalidPayments() {
    const invalidPayments = await this.findInvalidPayments();
    const invalidPaymentIds = invalidPayments.map((p) => p.id);

    if (invalidPaymentIds.length === 0) {
      return {
        deleted: 0,
        message: "No invalid payments found",
      };
    }

    const result = await this.prisma.payment.deleteMany({
      where: {
        id: {
          in: invalidPaymentIds,
        },
      },
    });

    return {
      deleted: result.count,
      message: `Deleted ${result.count} invalid payment(s)`,
    };
  }

  /**
   * Update invalid payments to use a default/system user
   * This preserves payment history while fixing data integrity
   */
  async fixInvalidPaymentsWithDefaultUser(defaultUserId: string) {
    // Verify default user exists
    const defaultUser = await this.prisma.user.findUnique({
      where: { id: defaultUserId },
    });

    if (!defaultUser) {
      throw new Error(`Default user ${defaultUserId} does not exist`);
    }

    const invalidPayments = await this.findInvalidPayments();
    const invalidPaymentIds = invalidPayments.map((p) => p.id);

    if (invalidPaymentIds.length === 0) {
      return {
        updated: 0,
        message: "No invalid payments found",
      };
    }

    const result = await this.prisma.payment.updateMany({
      where: {
        id: {
          in: invalidPaymentIds,
        },
      },
      data: {
        userId: defaultUserId,
      },
    });

    return {
      updated: result.count,
      message: `Updated ${result.count} invalid payment(s) to use default user`,
    };
  }

  /**
   * Get statistics about payment data integrity
   */
  async getPaymentIntegrityStats() {
    const totalPayments = await this.prisma.payment.count();
    const invalidPayments = await this.findInvalidPayments();
    const validPayments = totalPayments - invalidPayments.length;

    return {
      total: totalPayments,
      valid: validPayments,
      invalid: invalidPayments.length,
      integrityPercentage: totalPayments > 0 
        ? ((validPayments / totalPayments) * 100).toFixed(2) + "%"
        : "100%",
    };
  }
}































