import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: any) {
    // Validate required fields
    if (!createPaymentDto.userId) {
      throw new Error("User ID is required");
    }
    if (!createPaymentDto.rideId) {
      throw new Error("Ride ID is required");
    }
    if (!createPaymentDto.amount) {
      throw new Error("Amount is required");
    }

    // Validate amount
    if (createPaymentDto.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Validate payment method
    if (!createPaymentDto.paymentMethod) {
      throw new Error("Payment method is required");
    }

    return this.prisma.payment.create({
      data: createPaymentDto,
      include: {
        user: true,
      },
    });
  }

  async findAll(queryParams?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = queryParams?.page || 1;
    const limit = queryParams?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (queryParams?.status) {
      where.status = queryParams.status;
    }

    if (queryParams?.method) {
      where.method = queryParams.method;
    }

    if (queryParams?.search) {
      where.OR = [
        { transactionId: { contains: queryParams.search, mode: "insensitive" } },
        { description: { contains: queryParams.search, mode: "insensitive" } },
        { user: { email: { contains: queryParams.search, mode: "insensitive" } } },
        { user: { firstName: { contains: queryParams.search, mode: "insensitive" } } },
        { user: { lastName: { contains: queryParams.search, mode: "insensitive" } } },
      ];
    }

    if (queryParams?.dateFrom || queryParams?.dateTo) {
      where.createdAt = {};
      if (queryParams.dateFrom) {
        where.createdAt.gte = new Date(queryParams.dateFrom);
      }
      if (queryParams.dateTo) {
        where.createdAt.lte = new Date(queryParams.dateTo);
      }
    }

    if (queryParams?.minAmount || queryParams?.maxAmount) {
      where.amount = {};
      if (queryParams.minAmount) {
        where.amount.gte = queryParams.minAmount;
      }
      if (queryParams.maxAmount) {
        where.amount.lte = queryParams.maxAmount;
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" }; // Default sort
    if (queryParams?.sortBy) {
      orderBy = {};
      orderBy[queryParams.sortBy] = queryParams.sortOrder || "desc";
    }

    // Get total count for pagination
    const total = await this.prisma.payment.count({ where });

    // Get paginated results
    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,

        refunds: true,
      },
    });
  }

  // Payment Methods methods
  async getPaymentMethods(userId?: string) {
    console.log(
      "🔍 PaymentService.getPaymentMethods called with userId:",
      userId
    );

    const where = userId ? { userId } : {};
    console.log("🔍 Where clause:", where);

    try {
      const result = await this.prisma.paymentMethod.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      console.log("🔍 Payment methods found:", result.length);
      console.log("🔍 Result:", result);

      return result;
    } catch (error) {
      console.error("❌ Error in getPaymentMethods:", error);
      throw error;
    }
  }

  async createPaymentMethod(createPaymentMethodDto: any) {
    // Validate required fields
    if (!createPaymentMethodDto.userId) {
      throw new Error("User ID is required");
    }
    if (!createPaymentMethodDto.type) {
      throw new Error("Payment method type is required");
    }
    if (!createPaymentMethodDto.provider) {
      throw new Error("Provider is required");
    }
    if (!createPaymentMethodDto.providerId) {
      throw new Error("Provider ID is required");
    }

    // If this is set as default, unset other defaults for this user
    if (createPaymentMethodDto.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          userId: createPaymentMethodDto.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentMethod.create({
      data: createPaymentMethodDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updatePaymentMethod(id: string, updatePaymentMethodDto: any) {
    // If this is set as default, unset other defaults for this user
    if (updatePaymentMethodDto.isDefault) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (paymentMethod) {
        await this.prisma.paymentMethod.updateMany({
          where: {
            userId: paymentMethod.userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: updatePaymentMethodDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deletePaymentMethod(id: string) {
    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}
