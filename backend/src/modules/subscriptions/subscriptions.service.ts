import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreateSubscriptionPackageDto } from "./dto/create-subscription-package.dto";
import { UpdateSubscriptionPackageDto } from "./dto/update-subscription-package.dto";
import { CreatePackageFeatureDto } from "./dto/create-package-feature.dto";
import { UpdatePackageFeatureDto } from "./dto/update-package-feature.dto";

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ========== SUBSCRIPTION PACKAGES ==========
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

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
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

  // ========== PACKAGE FEATURES ==========
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
