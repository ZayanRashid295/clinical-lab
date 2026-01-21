import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreateSubscriptionPackageDto } from "./dto/create-subscription-package.dto";
import { UpdateSubscriptionPackageDto } from "./dto/update-subscription-package.dto";
import { CreatePackageFeatureDto } from "./dto/create-package-feature.dto";
import { UpdatePackageFeatureDto } from "./dto/update-package-feature.dto";
import { QuerySubscriptionDto } from "./dto/query-subscription.dto";
import { QuerySubscriptionPackageDto } from "./dto/query-subscription-package.dto";
import { QueryPackageFeatureDto } from "./dto/query-package-feature.dto";

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ========== SUBSCRIPTION PACKAGES ==========
  async findAllPackages(query: QuerySubscriptionPackageDto) {
    try {
      const {
        search,
        status,
        productSubtypeId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Product subtype filter
      if (productSubtypeId) {
        where.productSubtypeId = productSubtypeId;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await this.prisma.subscriptionPackage.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get packages with pagination and sorting
      const packages = await this.prisma.subscriptionPackage.findMany({
        where,
        include: {
          productSubtype: {
            select: {
              id: true,
              name: true,
            },
          },
          subscriptionFeatures: {
            include: {
              packageFeature: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: packages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching subscription packages:", error);
      throw error;
    }
  }

  async getPackages(productSubtypeId?: string, isActive?: boolean) {
    const where: any = {};

    if (productSubtypeId) {
      where.productSubtypeId = productSubtypeId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.subscriptionPackage.findMany({
      where,
      include: {
        productSubtype: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subscriptionFeatures: {
          include: {
            packageFeature: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: {
        price: "asc",
      },
    });
  }

  async getPackageStats() {
    const total = await this.prisma.subscriptionPackage.count();
    const active = await this.prisma.subscriptionPackage.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.subscriptionPackage.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  async getPackage(id: string) {
    const package_ = await this.prisma.subscriptionPackage.findUnique({
      where: { id },
      include: {
        productSubtype: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subscriptionFeatures: {
          include: {
            packageFeature: true,
          },
        },
        subscriptions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Limit to recent subscriptions
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return package_;
  }

  async getPackageFeatures(id: string) {
    // First check if package exists
    const package_ = await this.prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return this.prisma.subscriptionFeatures.findMany({
      where: {
        subscriptionPackageId: id,
      },
      include: {
        packageFeature: true,
      },
    });
  }

  async createPackage(createPackageDto: CreateSubscriptionPackageDto) {
    return this.prisma.subscriptionPackage.create({
      data: createPackageDto,
      include: {
        productSubtype: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subscriptionFeatures: {
          include: {
            packageFeature: true,
          },
        },
      },
    });
  }

  async updatePackage(
    id: string,
    updatePackageDto: UpdateSubscriptionPackageDto
  ) {
    const package_ = await this.prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return this.prisma.subscriptionPackage.update({
      where: { id },
      data: updatePackageDto,
      include: {
        productSubtype: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subscriptionFeatures: {
          include: {
            packageFeature: true,
          },
        },
      },
    });
  }

  async removePackage(id: string) {
    const package_ = await this.prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return this.prisma.subscriptionPackage.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========== USER SUBSCRIPTIONS ==========
  async findAll(query: QuerySubscriptionDto) {
    try {
      const {
        search,
        status,
        userId,
        subscriptionPackageId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter - search in user name or email
      if (search) {
        where.user = {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // User ID filter
      if (userId) {
        where.userId = userId;
      }

      // Package ID filter
      if (subscriptionPackageId) {
        where.subscriptionPackageId = subscriptionPackageId;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await this.prisma.subscription.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get subscriptions with pagination and sorting
      const subscriptions = await this.prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          subscriptionPackage: {
            include: {
              productSubtype: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subscriptionPackage: {
          include: {
            productSubtype: {
              select: {
                id: true,
                name: true,
              },
            },
            subscriptionFeatures: {
              include: {
                packageFeature: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async getUserSubscriptions(userId: string, status?: string) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    return this.prisma.subscription.findMany({
      where,
      include: {
        subscriptionPackage: {
          include: {
            productSubtype: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            subscriptionFeatures: {
              include: {
                packageFeature: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Limit to recent payments
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get all active features for a user based on their active subscriptions
   */
  async getUserActiveFeatures(userId: string): Promise<string[]> {
    const activeSubscriptions = await this.getUserSubscriptions(userId, 'ACTIVE');

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return [];
    }

    // Collect all unique feature names from all active subscriptions
    const featureSet = new Set<string>();

    for (const subscription of activeSubscriptions) {
      const features = subscription.subscriptionPackage?.subscriptionFeatures || [];
      for (const subFeature of features) {
        const featureName = subFeature.packageFeature?.name;
        if (featureName) {
          featureSet.add(featureName);
        }
      }
    }

    return Array.from(featureSet);
  }

  /**
   * Check if user has a specific feature
   */
  async userHasFeature(userId: string, featureName: string): Promise<boolean> {
    const userFeatures = await this.getUserActiveFeatures(userId);
    return userFeatures.includes(featureName);
  }

  /**
   * Get user's active subscription with all features loaded
   */
  async getUserActiveSubscriptionWithFeatures(userId: string) {
    const activeSubscriptions = await this.getUserSubscriptions(userId, 'ACTIVE');
    
    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return null;
    }

    // Return the most recent active subscription
    return activeSubscriptions[0];
  }

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    // Use a transaction to ensure atomicity: cancel old subscriptions and create new one
    // This prevents race conditions and ensures only one ACTIVE subscription per user
    return await this.prisma.$transaction(async (tx) => {
      // First, cancel ALL existing ACTIVE subscriptions for this user
      // This must happen in the same transaction to prevent race conditions
      const cancelledCount = await tx.subscription.updateMany({
        where: {
          userId: createSubscriptionDto.userId,
          status: "ACTIVE" as any,
        },
        data: {
          status: "CANCELLED" as any,
        },
      });

      // Cancelled existing active subscriptions

      // Now create the new subscription
      return await tx.subscription.create({
        data: {
          userId: createSubscriptionDto.userId,
          subscriptionPackageId: createSubscriptionDto.subscriptionPackageId,
          status: createSubscriptionDto.status as any,
          startDate: new Date(createSubscriptionDto.startDate),
          endDate: new Date(createSubscriptionDto.endDate),
          autoRenew: createSubscriptionDto.autoRenew,
        },
        include: {
          subscriptionPackage: {
            include: {
              productSubtype: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              subscriptionFeatures: {
                include: {
                  packageFeature: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });
  }

  async updateSubscription(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // If updating status to ACTIVE, ensure only one active subscription per user
    if (updateSubscriptionDto.status === "ACTIVE") {
      return await this.prisma.$transaction(async (tx) => {
        // First, cancel ALL other existing ACTIVE subscriptions for this user
        const cancelledCount = await tx.subscription.updateMany({
          where: {
            userId: subscription.userId,
            status: "ACTIVE" as any,
            id: { not: id }, // Exclude the current subscription
          },
          data: {
            status: "CANCELLED" as any,
          },
        });

        // Cancelled existing active subscriptions

        // Now update the subscription
        const updateData: any = {};
        if (updateSubscriptionDto.status)
          updateData.status = updateSubscriptionDto.status as any;
        if (updateSubscriptionDto.startDate)
          updateData.startDate = new Date(updateSubscriptionDto.startDate);
        if (updateSubscriptionDto.endDate)
          updateData.endDate = new Date(updateSubscriptionDto.endDate);
        if (updateSubscriptionDto.autoRenew !== undefined)
          updateData.autoRenew = updateSubscriptionDto.autoRenew;

        return await tx.subscription.update({
          where: { id },
          data: updateData,
          include: {
            subscriptionPackage: {
              include: {
                productSubtype: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                subscriptionFeatures: {
                  include: {
                    packageFeature: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      });
    }

    // For non-ACTIVE status updates, proceed normally
    const updateData: any = {};
    if (updateSubscriptionDto.status)
      updateData.status = updateSubscriptionDto.status as any;
    if (updateSubscriptionDto.startDate)
      updateData.startDate = new Date(updateSubscriptionDto.startDate);
    if (updateSubscriptionDto.endDate)
      updateData.endDate = new Date(updateSubscriptionDto.endDate);
    if (updateSubscriptionDto.autoRenew !== undefined)
      updateData.autoRenew = updateSubscriptionDto.autoRenew;

    return this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        subscriptionPackage: {
          include: {
            productSubtype: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            subscriptionFeatures: {
              include: {
                packageFeature: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async cancelSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return this.prisma.subscription.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        subscriptionPackage: {
          include: {
            productSubtype: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Clean up duplicate active subscriptions for a user
   * Keeps only the most recent active subscription, cancels all others
   */
  async cleanupDuplicateActiveSubscriptions(userId: string) {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: "ACTIVE" as any,
      },
      orderBy: {
        createdAt: "desc", // Most recent first
      },
    });

    if (activeSubscriptions.length <= 1) {
      return {
        kept: activeSubscriptions.length,
        cancelled: 0,
        message: "No duplicate subscriptions found",
      };
    }

    // Keep the most recent one, cancel all others
    const toCancel = activeSubscriptions.slice(1); // All except the first (most recent)
    const cancelledIds = toCancel.map((s) => s.id);

    const updateResult = await this.prisma.subscription.updateMany({
      where: {
        id: {
          in: cancelledIds,
        },
      },
      data: {
        status: "CANCELLED" as any,
      },
    });

    return {
      kept: 1,
      cancelled: updateResult.count,
      keptSubscriptionId: activeSubscriptions[0].id,
      cancelledSubscriptionIds: cancelledIds,
      message: `Kept most recent subscription, cancelled ${updateResult.count} duplicate(s)`,
    };
  }

  /**
   * Clean up duplicate active subscriptions for ALL users
   * Useful for fixing existing data issues
   */
  async cleanupAllDuplicateActiveSubscriptions() {
    // Get all users with multiple active subscriptions
    const usersWithDuplicates = await this.prisma.subscription.groupBy({
      by: ["userId"],
      where: {
        status: "ACTIVE" as any,
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

    const results = [];
    for (const userGroup of usersWithDuplicates) {
      const result = await this.cleanupDuplicateActiveSubscriptions(userGroup.userId);
      results.push({
        userId: userGroup.userId,
        ...result,
      });
    }

    return {
      totalUsersProcessed: results.length,
      totalCancelled: results.reduce((sum, r) => sum + r.cancelled, 0),
      results,
      message: `Processed ${results.length} user(s) with duplicate active subscriptions`,
    };
  }

  async getStats() {
    const total = await this.prisma.subscription.count();
    const active = await this.prisma.subscription.count({
      where: { status: "ACTIVE" },
    });
    const expired = await this.prisma.subscription.count({
      where: { status: "EXPIRED" },
    });
    const cancelled = await this.prisma.subscription.count({
      where: { status: "CANCELLED" },
    });
    const suspended = await this.prisma.subscription.count({
      where: { status: "SUSPENDED" },
    });
    const pending = await this.prisma.subscription.count({
      where: { status: "PENDING" },
    });

    return {
      total,
      active,
      expired,
      cancelled,
      suspended,
      pending,
    };
  }

  // ========== PACKAGE FEATURES ==========
  async findAllFeatures(query: QueryPackageFeatureDto) {
    try {
      const {
        search,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await this.prisma.packageFeatures.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get features with pagination and sorting
      const features = await this.prisma.packageFeatures.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: features,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching package features:", error);
      throw error;
    }
  }

  async getFeatures(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};

    return this.prisma.packageFeatures.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptionFeatures: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getFeatureStats() {
    const total = await this.prisma.packageFeatures.count();
    const active = await this.prisma.packageFeatures.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.packageFeatures.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  async getFeature(id: string) {
    const feature = await this.prisma.packageFeatures.findUnique({
      where: { id },
      include: {
        subscriptionFeatures: {
          include: {
            subscriptionPackage: {
              include: {
                productSubtype: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            subscriptionFeatures: true,
          },
        },
      },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return feature;
  }

  async createFeature(createFeatureDto: CreatePackageFeatureDto) {
    return this.prisma.packageFeatures.create({
      data: createFeatureDto,
      include: {
        _count: {
          select: {
            subscriptionFeatures: true,
          },
        },
      },
    });
  }

  async updateFeature(id: string, updateFeatureDto: UpdatePackageFeatureDto) {
    const feature = await this.prisma.packageFeatures.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return this.prisma.packageFeatures.update({
      where: { id },
      data: updateFeatureDto,
      include: {
        _count: {
          select: {
            subscriptionFeatures: true,
          },
        },
      },
    });
  }

  async removeFeature(id: string) {
    const feature = await this.prisma.packageFeatures.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return this.prisma.packageFeatures.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
