import { PrismaClient } from "@prisma/client";

export async function seedPayments(prisma: PrismaClient) {
  console.log("💳 Starting payment seeding...");

  // Get existing users to create payments for
  const users = await prisma.user.findMany({
    take: 10,
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (users.length === 0) {
    console.log("⚠️ No users found. Please run seed-base first.");
    return;
  }

  // Get existing payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    select: { id: true, userId: true, type: true, provider: true },
  });

  // Payment data templates
  const paymentTemplates = [
    {
      descriptions: [
        "Medical consultation fee",
        "Lab test payment",
        "Prescription medication",
        "Emergency room visit",
        "Surgery procedure",
        "Physical therapy session",
        "X-ray examination",
        "Blood work analysis",
        "Specialist consultation",
        "Follow-up appointment",
        "Dental cleaning",
        "Eye examination",
        "Vaccination",
        "MRI scan",
        "CT scan",
        "Ultrasound",
        "Biopsy procedure",
        "Chemotherapy session",
        "Radiation therapy",
        "Physical examination",
      ],
      statuses: [
        "COMPLETED",
        "PENDING",
        "PROCESSING",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ] as const,
      methods: ["CARD", "WALLET", "CASH", "BANK_TRANSFER"] as const,
      gateways: ["STRIPE", "PAYPAL", "RAZORPAY", "SQUARE"] as const,
      amounts: [
        25, 50, 75, 100, 150, 200, 300, 450, 500, 750, 1000, 1500, 2000,
      ],
    },
  ];

  const { descriptions, statuses, methods, gateways, amounts } =
    paymentTemplates[0];

  // Create payments
  console.log("💰 Creating payments...");
  const payments = [];

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const gateway = gateways[Math.floor(Math.random() * gateways.length)];
    const description =
      descriptions[Math.floor(Math.random() * descriptions.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    // Generate random date within the last 6 months
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 180));
    createdAt.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60),
      0,
      0
    );

    const updatedAt = new Date(
      createdAt.getTime() + Math.floor(Math.random() * 86400000)
    ); // Add random time up to 1 day

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: amount,
        currency: "USD",
        status: status,
        method: method,
        transactionId: `txn_${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        gateway: gateway,
        description: description,
        createdAt: createdAt,
        updatedAt: updatedAt,
        gatewayData: {
          chargeId: `ch_${Math.random().toString(36).substr(2, 12)}`,
          balanceTransaction: `txn_${Math.random().toString(36).substr(2, 12)}`,
          receiptUrl: `https://payments.example.com/receipts/${Math.random().toString(36).substr(2, 12)}`,
          metadata: {
            source: "web",
            userAgent: "Mozilla/5.0 (compatible; PaymentBot/1.0)",
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          },
        },
      },
    });

    payments.push(payment);
  }

  // Create refunds for some completed payments
  console.log("🔄 Creating refunds...");
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const refundReasons = [
    "Patient requested refund",
    "Service not provided",
    "Duplicate payment",
    "Technical error",
    "Insurance coverage",
    "Cancelled appointment",
    "Quality issue",
    "Billing error",
  ];

  for (let i = 0; i < Math.min(10, completedPayments.length); i++) {
    const payment = completedPayments[i];
    const reason =
      refundReasons[Math.floor(Math.random() * refundReasons.length)];
    const refundAmount = payment.amount; // Full refund for simplicity

    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: refundAmount,
        reason: reason,
        status: "COMPLETED",
        gatewayRefundId: `re_${Math.random().toString(36).substr(2, 12)}`,
        processedAt: new Date(
          payment.createdAt.getTime() +
            Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        ), // Within a week
        createdAt: new Date(
          payment.createdAt.getTime() +
            Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)
        ), // Within 3 days
        updatedAt: new Date(),
      },
    });

    // Update payment status to REFUNDED
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });
  }

  // Create wallet transactions for wallet payments
  console.log("💼 Creating wallet transactions...");
  const walletPayments = payments.filter((p) => p.method === "WALLET");

  for (const payment of walletPayments) {
    // Get or create wallet for user
    let wallet = await prisma.wallet.findUnique({
      where: { userId: payment.userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: payment.userId,
          balance: 0,
          currency: "USD",
          isActive: true,
        },
      });
    }

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        paymentId: payment.id,
        type: "DEBIT",
        amount: payment.amount,
        balance: Math.max(
          0,
          wallet.balance.toNumber() - payment.amount.toNumber()
        ),
        description: `Payment for ${payment.description}`,
        reference: payment.transactionId,
        createdAt: payment.createdAt,
      },
    });

    // Update wallet balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: Math.max(
          0,
          wallet.balance.toNumber() - payment.amount.toNumber()
        ),
      },
    });
  }

  // Create promo code usages for some payments
  console.log("🎟️ Creating promo code usages...");
  const promoCode = await prisma.promoCode.findFirst({
    where: { code: "WELCOME10" },
  });

  if (promoCode) {
    const eligiblePayments = payments.filter(
      (p) => p.status === "COMPLETED" && p.amount.toNumber() >= 20 // Minimum amount for promo
    );

    for (let i = 0; i < Math.min(5, eligiblePayments.length); i++) {
      const payment = eligiblePayments[i];
      const discount = Math.min(payment.amount.toNumber() * 0.1, 5); // 10% up to $5

      await prisma.promoCodeUsage.create({
        data: {
          promoCodeId: promoCode.id,
          userId: payment.userId,
          paymentId: payment.id,
          discount: discount,
          createdAt: payment.createdAt,
        },
      });
    }
  }

  // Create additional payment methods for users who don't have them
  console.log("💳 Creating additional payment methods...");
  const usersWithoutPaymentMethods = users.filter(
    (user) => !paymentMethods.some((pm) => pm.userId === user.id)
  );

  for (const user of usersWithoutPaymentMethods.slice(0, 5)) {
    const methodTypes = ["CARD", "WALLET", "BANK_TRANSFER"] as const;
    const providers = ["stripe", "paypal", "razorpay"];

    const methodType =
      methodTypes[Math.floor(Math.random() * methodTypes.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];

    await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        type: methodType,
        provider: provider,
        providerId: `pm_${Math.random().toString(36).substr(2, 12)}`,
        isDefault: true,
        isActive: true,
        metadata:
          methodType === "CARD"
            ? {
                last4: Math.floor(Math.random() * 9000 + 1000).toString(),
                brand: ["visa", "mastercard", "amex"][
                  Math.floor(Math.random() * 3)
                ],
                expMonth: Math.floor(Math.random() * 12) + 1,
                expYear:
                  new Date().getFullYear() + Math.floor(Math.random() * 5) + 1,
              }
            : {},
      },
    });
  }

  console.log("✅ Payment seeding completed successfully!");
  console.log("\n📊 Payment Summary:");
  console.log(`- Total payments created: ${payments.length}`);
  console.log(`- Completed payments: ${completedPayments.length}`);
  console.log(`- Refunds created: ${Math.min(10, completedPayments.length)}`);
  console.log(`- Wallet transactions: ${walletPayments.length}`);
  console.log(
    `- Additional payment methods: ${Math.min(5, usersWithoutPaymentMethods.length)}`
  );

  // Show payment status distribution
  const statusCounts = statuses.reduce(
    (acc, status) => {
      acc[status] = payments.filter((p) => p.status === status).length;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log("\n📈 Payment Status Distribution:");
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Show payment method distribution
  const methodCounts = methods.reduce(
    (acc, method) => {
      acc[method] = payments.filter((p) => p.method === method).length;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log("\n💳 Payment Method Distribution:");
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`  ${method}: ${count}`);
  });

  // Show gateway distribution
  const gatewayCounts = gateways.reduce(
    (acc, gateway) => {
      acc[gateway] = payments.filter((p) => p.gateway === gateway).length;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log("\n🏦 Payment Gateway Distribution:");
  Object.entries(gatewayCounts).forEach(([gateway, count]) => {
    console.log(`  ${gateway}: ${count}`);
  });

  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount.toNumber(),
    0
  );
  console.log(`\n💰 Total Payment Volume: $${totalAmount.toFixed(2)}`);
  console.log(
    `📊 Average Payment Amount: $${(totalAmount / payments.length).toFixed(2)}`
  );
}
