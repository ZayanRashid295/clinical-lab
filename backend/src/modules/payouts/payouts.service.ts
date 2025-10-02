import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreatePayoutDto } from "./dto/create-payout.dto";
import { UpdatePayoutDto } from "./dto/update-payout.dto";
import { PayoutFiltersDto } from "./dto/payout-filters.dto";
import {
  CreatePayoutSettingsDto,
  UpdatePayoutSettingsDto,
} from "./dto/payout-settings.dto";
import {
  CreateEarningsDto,
  UpdateEarningsDto,
  EarningsFiltersDto,
} from "./dto/earnings.dto";
import {
  PayoutStatus,
  PayoutMethod,
  PayoutFrequency,
  EarningsStatus,
} from "@prisma/client";

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PAYOUT OPERATIONS ====================

  async createPayout(createPayoutDto: CreatePayoutDto) {
    console.log("🔍 Creating payout:", createPayoutDto);

    // Verify driver exists
    const driver = await this.prisma.user.findUnique({
      where: { id: createPayoutDto.driverId },
    });

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createPayoutDto.driverId} not found`
      );
    }

    // Create payout
    const payout = await this.prisma.payout.create({
      data: {
        driverId: createPayoutDto.driverId,
        amount: createPayoutDto.amount,
        currency: createPayoutDto.currency || "USD",
        payoutMethod: createPayoutDto.payoutMethod,
        description: createPayoutDto.description,
        scheduledAt: new Date(createPayoutDto.scheduledAt),
        status: PayoutStatus.PENDING,
      },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        payoutItems: {
          include: {
            ride: {
              select: {
                id: true,
                fare: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        earnings: true,
      },
    });

    console.log("✅ Payout created:", payout.id);
    return payout;
  }

  async getPayouts(filters: PayoutFiltersDto) {
    console.log("🔍 Getting payouts with filters:", filters);

    const {
      driverId,
      status,
      payoutMethod,
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: any = {};

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    if (payoutMethod) {
      where.payoutMethod = payoutMethod;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { transactionId: { contains: search, mode: "insensitive" } },
        {
          driver: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.payout.count({ where });

    // Get payouts
    const payouts = await this.prisma.payout.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        payoutItems: {
          include: {
            ride: {
              select: {
                id: true,
                fare: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        earnings: true,
      },
    });

    return {
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getPayoutById(id: string) {
    console.log("🔍 Getting payout by ID:", id);

    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        payoutItems: {
          include: {
            ride: {
              select: {
                id: true,
                fare: true,
                status: true,
                createdAt: true,
                pickupLocation: true,
                dropoffLocation: true,
              },
            },
          },
        },
        earnings: true,
        payoutMethodDetails: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout with ID ${id} not found`);
    }

    return payout;
  }

  async updatePayout(id: string, updatePayoutDto: UpdatePayoutDto) {
    console.log("🔍 Updating payout:", id, updatePayoutDto);

    const existingPayout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!existingPayout) {
      throw new NotFoundException(`Payout with ID ${id} not found`);
    }

    // Prepare update data
    const updateData: any = {};

    if (updatePayoutDto.status !== undefined) {
      updateData.status = updatePayoutDto.status;
    }

    if (updatePayoutDto.payoutMethod !== undefined) {
      updateData.payoutMethod = updatePayoutDto.payoutMethod;
    }

    if (updatePayoutDto.transactionId !== undefined) {
      updateData.transactionId = updatePayoutDto.transactionId;
    }

    if (updatePayoutDto.description !== undefined) {
      updateData.description = updatePayoutDto.description;
    }

    if (updatePayoutDto.processedAt !== undefined) {
      updateData.processedAt = new Date(updatePayoutDto.processedAt);
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        payoutItems: {
          include: {
            ride: {
              select: {
                id: true,
                fare: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        earnings: true,
      },
    });

    console.log("✅ Payout updated:", updatedPayout.id);
    return updatedPayout;
  }

  async deletePayout(id: string) {
    console.log("🔍 Deleting payout:", id);

    const existingPayout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!existingPayout) {
      throw new NotFoundException(`Payout with ID ${id} not found`);
    }

    // Check if payout can be deleted (only pending payouts)
    if (existingPayout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException("Only pending payouts can be deleted");
    }

    await this.prisma.payout.delete({
      where: { id },
    });

    console.log("✅ Payout deleted:", id);
    return { message: "Payout deleted successfully" };
  }

  // ==================== EARNINGS OPERATIONS ====================

  async createEarnings(createEarningsDto: CreateEarningsDto) {
    console.log("🔍 Creating earnings:", createEarningsDto);

    // Verify driver and ride exist
    const [driver, ride] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: createEarningsDto.driverId },
      }),
      this.prisma.ride.findUnique({ where: { id: createEarningsDto.rideId } }),
    ]);

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createEarningsDto.driverId} not found`
      );
    }

    if (!ride) {
      throw new NotFoundException(
        `Ride with ID ${createEarningsDto.rideId} not found`
      );
    }

    // Check if earnings already exist for this ride
    const existingEarnings = await this.prisma.earnings.findFirst({
      where: { rideId: createEarningsDto.rideId },
    });

    if (existingEarnings) {
      throw new BadRequestException("Earnings already exist for this ride");
    }

    const earnings = await this.prisma.earnings.create({
      data: {
        driverId: createEarningsDto.driverId,
        rideId: createEarningsDto.rideId,
        grossEarnings: createEarningsDto.grossEarnings,
        platformFee: createEarningsDto.platformFee,
        netEarnings: createEarningsDto.netEarnings,
        status: EarningsStatus.PENDING,
      },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        ride: {
          select: {
            id: true,
            fare: true,
            status: true,
            createdAt: true,
          },
        },
        payout: true,
      },
    });

    console.log("✅ Earnings created:", earnings.id);
    return earnings;
  }

  async getEarnings(filters: EarningsFiltersDto) {
    console.log("🔍 Getting earnings with filters:", filters);

    const {
      driverId,
      status,
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
    } = filters;

    // Build where clause
    const where: any = {};

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.netEarnings = {};
      if (minAmount !== undefined) where.netEarnings.gte = minAmount;
      if (maxAmount !== undefined) where.netEarnings.lte = maxAmount;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        {
          driver: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.earnings.count({ where });

    // Get earnings
    const earnings = await this.prisma.earnings.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        ride: {
          select: {
            id: true,
            fare: true,
            status: true,
            createdAt: true,
          },
        },
        payout: true,
      },
    });

    return {
      data: earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getPendingEarnings(driverId: string) {
    console.log("🔍 Getting pending earnings for driver:", driverId);

    const earnings = await this.prisma.earnings.findMany({
      where: {
        driverId,
        status: EarningsStatus.PENDING,
      },
      include: {
        ride: {
          select: {
            id: true,
            fare: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return earnings;
  }

  // ==================== PAYOUT SETTINGS OPERATIONS ====================

  async getPayoutSettings(driverId: string) {
    console.log("🔍 Getting payout settings for driver:", driverId);

    let settings = await this.prisma.payoutSettings.findUnique({
      where: { driverId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await this.prisma.payoutSettings.create({
        data: {
          driverId,
          defaultPayoutMethod: PayoutMethod.BANK_TRANSFER,
          autoPayout: false,
          minimumPayoutAmount: 50.0,
          payoutFrequency: PayoutFrequency.WEEKLY,
        },
      });
    }

    return settings;
  }

  async updatePayoutSettings(
    driverId: string,
    updateSettingsDto: UpdatePayoutSettingsDto
  ) {
    console.log(
      "🔍 Updating payout settings for driver:",
      driverId,
      updateSettingsDto
    );

    const existingSettings = await this.prisma.payoutSettings.findUnique({
      where: { driverId },
    });

    if (!existingSettings) {
      throw new NotFoundException(
        `Payout settings for driver ${driverId} not found`
      );
    }

    const updatedSettings = await this.prisma.payoutSettings.update({
      where: { driverId },
      data: updateSettingsDto,
    });

    console.log("✅ Payout settings updated for driver:", driverId);
    return updatedSettings;
  }

  // ==================== UTILITY METHODS ====================

  async calculateEarningsForRide(rideId: string) {
    console.log("🔍 Calculating earnings for ride:", rideId);

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (!ride.driverId) {
      throw new BadRequestException("Ride has no assigned driver");
    }

    // Calculate platform fee (10% for now, should be configurable)
    const platformFeePercentage = 0.1;
    const grossEarnings = Number(ride.fare);
    const platformFee = grossEarnings * platformFeePercentage;
    const netEarnings = grossEarnings - platformFee;

    // Check if earnings already exist
    const existingEarnings = await this.prisma.earnings.findFirst({
      where: { rideId },
    });

    if (existingEarnings) {
      return existingEarnings;
    }

    // Create earnings record
    const earnings = await this.prisma.earnings.create({
      data: {
        driverId: ride.driverId,
        rideId: ride.id,
        grossEarnings,
        platformFee,
        netEarnings,
        status: EarningsStatus.PENDING,
      },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        ride: {
          select: {
            id: true,
            fare: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    console.log("✅ Earnings calculated for ride:", rideId);
    return earnings;
  }

  async processScheduledPayouts() {
    console.log("🔍 Processing scheduled payouts");

    const drivers = await this.prisma.user.findMany({
      where: {
        roles: { some: { role: { name: "DRIVER" } } },
        payoutSchedules: {
          some: {
            isActive: true,
            nextScheduledAt: { lte: new Date() },
          },
        },
      },
      include: {
        payoutSchedules: true,
        earnings: {
          where: { status: EarningsStatus.PENDING },
        },
      },
    });

    const processedPayouts = [];

    for (const driver of drivers) {
      const totalPending = driver.earnings.reduce(
        (sum, earning) => sum + Number(earning.netEarnings),
        0
      );
      const schedule = driver.payoutSchedules[0];

      if (totalPending >= Number(schedule.minimumAmount)) {
        const payout = await this.createScheduledPayout(driver.id);
        processedPayouts.push(payout);
      }
    }

    console.log(`✅ Processed ${processedPayouts.length} scheduled payouts`);
    return processedPayouts;
  }

  private async createScheduledPayout(driverId: string) {
    console.log("🔍 Creating scheduled payout for driver:", driverId);

    // Get pending earnings
    const pendingEarnings = await this.getPendingEarnings(driverId);

    if (pendingEarnings.length === 0) {
      throw new BadRequestException("No pending earnings found for driver");
    }

    const totalAmount = pendingEarnings.reduce(
      (sum, earning) => sum + Number(earning.netEarnings),
      0
    );

    // Get driver's payout settings
    const settings = await this.getPayoutSettings(driverId);

    // Create payout
    const payout = await this.prisma.payout.create({
      data: {
        driverId,
        amount: totalAmount,
        currency: "USD",
        payoutMethod: settings.defaultPayoutMethod,
        description: "Scheduled payout",
        scheduledAt: new Date(),
        status: PayoutStatus.PENDING,
      },
    });

    // Create payout items and update earnings
    for (const earning of pendingEarnings) {
      await this.prisma.payoutItem.create({
        data: {
          payoutId: payout.id,
          rideId: earning.rideId,
          amount: earning.grossEarnings,
          fee: earning.platformFee,
          netAmount: earning.netEarnings,
        },
      });

      await this.prisma.earnings.update({
        where: { id: earning.id },
        data: {
          payoutId: payout.id,
          status: EarningsStatus.PAID_OUT,
          paidOutAt: new Date(),
        },
      });
    }

    // Update next scheduled payout
    await this.updateNextScheduledPayout(driverId);

    console.log("✅ Scheduled payout created:", payout.id);
    return payout;
  }

  private async updateNextScheduledPayout(driverId: string) {
    const schedule = await this.prisma.payoutSchedule.findFirst({
      where: { driverId, isActive: true },
    });

    if (!schedule) return;

    let nextDate = new Date();

    switch (schedule.frequency) {
      case PayoutFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case PayoutFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case PayoutFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case PayoutFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return;
    }

    await this.prisma.payoutSchedule.update({
      where: { id: schedule.id },
      data: {
        lastProcessedAt: new Date(),
        nextScheduledAt: nextDate,
      },
    });
  }
}
