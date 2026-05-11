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
import {
  CreateEntitlementDefinitionDto,
  EntitlementType,
} from "./dto/create-entitlement-definition.dto";
import { UpdateEntitlementDefinitionDto } from "./dto/update-entitlement-definition.dto";
import { QueryEntitlementDefinitionDto } from "./dto/query-entitlement-definition.dto";

/** Merge per-mode caps when user has multiple subscriptions (best allowance wins; null = unlimited). */
function mergeLimitsPerModeRecord(
  prev: Record<string, unknown> | undefined,
  inc: Record<string, unknown> | undefined,
): Record<string, number | null> | undefined {
  const keys = new Set([...Object.keys(prev ?? {}), ...Object.keys(inc ?? {})]);
  if (keys.size === 0) return undefined;
  const out: Record<string, number | null> = {};
  for (const k of keys) {
    const a = prev?.[k];
    const b = inc?.[k];
    if (a === null || b === null) {
      out[k] = null;
      continue;
    }
    const hasA = a !== undefined;
    const hasB = b !== undefined;
    if (!hasA && !hasB) continue;
    if (!hasA) {
      const n = Number(b);
      out[k] = Number.isFinite(n) ? n : null;
      continue;
    }
    if (!hasB) {
      const n = Number(a);
      out[k] = Number.isFinite(n) ? n : null;
      continue;
    }
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) {
      out[k] = null;
    } else {
      out[k] = Math.max(na, nb);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function mergeMedprepLimitPeriod(prev?: unknown, inc?: unknown): string {
  const p = typeof prev === "string" ? prev.toUpperCase() : "MONTH";
  const i = typeof inc === "string" ? inc.toUpperCase() : "MONTH";
  if (p === "DAY" || i === "DAY") return "DAY";
  return "MONTH";
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ========== PRICING CATALOG (initial implementation) ==========
  // This is a server-side quote calculator so admin can compose packages and get
  // consistent pricing. You can refine these numbers/rules any time without DB migrations.
  //
  // Currency handling: currently assumes USD-like pricing; for production multi-currency,
  // add FX conversion or per-currency catalogs.

  async calculatePricingQuote(dto: {
    validityDays: number;
    currency?: string;
    entitlements: Array<{ key: string; valueJson?: any }>;
  }) {
    const currency = (dto.currency || "USD").toUpperCase();
    const days = Number(dto.validityDays);

    const monthlyFactor = days / 30;

    // Base unit prices per 30 days
    const unitPrices: Record<string, number> = {
      "qbank.access": 20,
      "medprepai.access": 25,
      "aitutor.chat": 5, // per 100 chats/month above free (see below)
      "study.flashcards": 0,
      "study.planner": 0,
      "study.notes": 0,
    };

    const lineItems: Array<{ key: string; label: string; amount: number }> = [];
    let subtotal = 0;

    for (const e of dto.entitlements || []) {
      const key = e.key;
      const value: any = e.valueJson ?? { enabled: true };
      const enabled = typeof value === "object" && "enabled" in value ? Boolean(value.enabled) : true;
      if (!enabled) continue;

      if (key === "aitutor.chat") {
        // Pricing is based on quota. Free is 20/day baseline; only charge above that.
        const limit = typeof value.limit === "number" ? value.limit : 20;
        const period = typeof value.period === "string" ? String(value.period).toUpperCase() : "DAY";
        // Convert to approx monthly chats:
        const monthlyChats = period === "MONTH" ? limit : limit * 30;
        const freeMonthlyChats = 20 * 30;
        const billable = Math.max(0, monthlyChats - freeMonthlyChats);
        const blocks = Math.ceil(billable / 100);
        const unit = unitPrices[key] || 0;
        const amount = blocks * unit * monthlyFactor;
        if (amount > 0) {
          subtotal += amount;
          lineItems.push({
            key,
            label: `AI Tutor chat quota (${monthlyChats}/mo)`,
            amount,
          });
        }
        continue;
      }

      if (key === "medprepai.modes") {
        // Each enabled mode adds a fixed monthly amount.
        const modes = Array.isArray(value.items) ? value.items : [];
        const perMode = 10;
        const amount = modes.length * perMode * monthlyFactor;
        if (amount > 0) {
          subtotal += amount;
          lineItems.push({
            key,
            label: `MedPrepAI modes (${modes.length})`,
            amount,
          });
        }
        continue;
      }

      const unit = unitPrices[key] ?? 0;
      if (unit <= 0) continue;
      const amount = unit * monthlyFactor;
      subtotal += amount;
      lineItems.push({ key, label: key, amount });
    }

    // Basic rounding + simple long-term discount
    let discount = 0;
    if (days >= 365) discount = subtotal * 0.15;
    else if (days >= 180) discount = subtotal * 0.08;

    const total = Math.max(0, subtotal - discount);

    return {
      currency,
      validityDays: days,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number(total.toFixed(2)),
      lineItems: lineItems.map((li) => ({ ...li, amount: Number(li.amount.toFixed(2)) })),
    };
  }

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
          { name: { contains: search } },
          { description: { contains: search } },
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
          entitlements: {
            include: {
              entitlementDefinition: true,
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
        entitlements: {
          include: {
            entitlementDefinition: true,
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
        entitlements: {
          include: {
            entitlementDefinition: true,
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

  async getPackageEntitlements(id: string) {
    const package_ = await this.prisma.subscriptionPackage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return this.prisma.subscriptionPackageEntitlement.findMany({
      where: { subscriptionPackageId: id },
      include: { entitlementDefinition: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async setPackageEntitlements(
    packageId: string,
    entitlements: Array<{ entitlementDefinitionId: string; valueJson?: any }>
  ) {
    const package_ = await this.prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
      select: { id: true },
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${packageId} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPackageEntitlement.deleteMany({
        where: { subscriptionPackageId: packageId },
      });

      if (entitlements.length > 0) {
        await tx.subscriptionPackageEntitlement.createMany({
          data: entitlements.map((e) => ({
            subscriptionPackageId: packageId,
            entitlementDefinitionId: e.entitlementDefinitionId,
            valueJson: e.valueJson ?? { enabled: true },
          })),
        });
      }
    });

    return this.getPackageEntitlements(packageId);
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
        entitlements: {
          include: {
            entitlementDefinition: true,
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
        entitlements: {
          include: {
            entitlementDefinition: true,
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
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
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
            entitlements: {
              include: {
                entitlementDefinition: true,
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
   * Get merged entitlements for a user based on ACTIVE subscriptions.
   * Returns a map keyed by EntitlementDefinition.key -> valueJson payload.
   */
  async getUserEntitlements(userId: string): Promise<Record<string, any>> {
    const activeSubscriptions = await this.getUserSubscriptions(userId, "ACTIVE");

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return {};
    }

    const merged: Record<string, any> = {};

    for (const subscription of activeSubscriptions) {
      const ents = subscription.subscriptionPackage?.entitlements || [];
      for (const pe of ents) {
        const key = pe.entitlementDefinition?.key;
        if (!key) continue;

        const incoming: any = (pe.valueJson ?? { enabled: true }) as any;
        const prev: any = merged[key];

        // Merge strategy (safe defaults; can be refined as products expand):
        // - BOOLEAN: enabled if any says enabled
        // - SET: union arrays under `items`
        // - NUMBER_LIMIT: take max `limit`
        // - JSON_CONSTRAINTS: shallow merge (last write wins for conflicts)
        const type = pe.entitlementDefinition?.type;

        if (!prev || typeof prev !== "object") {
          merged[key] = incoming;
          continue;
        }

        if (type === "BOOLEAN") {
          merged[key] = {
            ...(prev as any),
            ...(typeof incoming === "object" ? incoming : {}),
            enabled:
              Boolean((prev as any).enabled) ||
              Boolean(typeof incoming === "object" ? (incoming as any).enabled : false),
          };
          continue;
        }

        if (type === "SET") {
          const prevItems = Array.isArray((prev as any).items) ? (prev as any).items : [];
          const incItems =
            typeof incoming === "object" && Array.isArray((incoming as any).items)
              ? (incoming as any).items
              : [];
          const baseMerged = {
            ...(prev as any),
            ...(typeof incoming === "object" ? incoming : {}),
            items: Array.from(new Set([...prevItems, ...incItems])),
          };

          if (key === "medprepai.modes") {
            const mergedLimits = mergeLimitsPerModeRecord(
              (prev as any)?.limitsPerMode as Record<string, unknown> | undefined,
              (incoming as any)?.limitsPerMode as Record<string, unknown> | undefined,
            );
            const limitPeriod = mergeMedprepLimitPeriod(
              (prev as any)?.limitPeriod,
              (incoming as any)?.limitPeriod,
            );
            merged[key] = {
              ...baseMerged,
              ...(mergedLimits ? { limitsPerMode: mergedLimits } : {}),
              limitPeriod,
            };
          } else {
            merged[key] = baseMerged;
          }
          continue;
        }

        if (type === "NUMBER_LIMIT") {
          const prevLimit = typeof (prev as any).limit === "number" ? (prev as any).limit : 0;
          const incLimit =
            typeof incoming === "object" && typeof (incoming as any).limit === "number"
              ? (incoming as any).limit
              : 0;
          merged[key] = {
            ...(prev as any),
            ...(typeof incoming === "object" ? incoming : {}),
            limit: Math.max(prevLimit, incLimit),
            enabled:
              typeof incoming === "object" && "enabled" in incoming
                ? (incoming as any).enabled
                : (prev as any).enabled ?? true,
          };
          continue;
        }

        // JSON_CONSTRAINTS or unknown: shallow merge
        merged[key] = {
          ...(prev as any),
          ...(typeof incoming === "object" ? incoming : {}),
        };
      }
    }

    return merged;
  }

  async getUserEntitlementKeys(userId: string): Promise<string[]> {
    const map = await this.getUserEntitlements(userId);
    return Object.keys(map).filter((k) => {
      const v = map[k];
      // If payload has enabled=false, treat as disabled
      if (v && typeof v === "object" && "enabled" in v) {
        return Boolean((v as any).enabled);
      }
      return true;
    });
  }

  async userHasEntitlement(userId: string, entitlementKey: string): Promise<boolean> {
    const keys = await this.getUserEntitlementKeys(userId);
    return keys.includes(entitlementKey);
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
          { name: { contains: search } },
          { description: { contains: search } },
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

  // ========== ENTITLEMENT DEFINITIONS (new system) ==========
  async findAllEntitlementDefinitions(query: QueryEntitlementDefinitionDto) {
    const {
      search,
      status,
      productSubtypeId,
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { key: { contains: search } },
        { displayName: { contains: search } },
      ];
    }
    if (status) {
      where.isActive = status === "ACTIVE";
    }
    if (productSubtypeId) {
      where.productSubtypeId = productSubtypeId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const total = await this.prisma.entitlementDefinition.count({ where });

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const defs = await this.prisma.entitlementDefinition.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        productSubtype: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      data: defs,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getEntitlementDefinitionStats() {
    const total = await this.prisma.entitlementDefinition.count();
    const active = await this.prisma.entitlementDefinition.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.entitlementDefinition.count({
      where: { isActive: false },
    });

    return { total, active, inactive };
  }

  async getEntitlementDefinition(id: string) {
    const def = await this.prisma.entitlementDefinition.findUnique({
      where: { id },
      include: { productSubtype: { select: { id: true, name: true } } },
    });

    if (!def) {
      throw new NotFoundException(
        `Entitlement definition with ID ${id} not found`
      );
    }

    return def;
  }

  async createEntitlementDefinition(dto: CreateEntitlementDefinitionDto) {
    return this.prisma.entitlementDefinition.create({
      data: {
        key: dto.key,
        displayName: dto.displayName,
        description: dto.description,
        productSubtypeId: dto.productSubtypeId,
        type: (dto.type || EntitlementType.BOOLEAN) as any,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateEntitlementDefinition(
    id: string,
    dto: UpdateEntitlementDefinitionDto
  ) {
    const existing = await this.prisma.entitlementDefinition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Entitlement definition with ID ${id} not found`
      );
    }

    return this.prisma.entitlementDefinition.update({
      where: { id },
      data: {
        key: dto.key,
        displayName: dto.displayName,
        description: dto.description,
        productSubtypeId: dto.productSubtypeId,
        type: dto.type as any,
        isActive: dto.isActive,
      },
    });
  }

  async removeEntitlementDefinition(id: string) {
    const existing = await this.prisma.entitlementDefinition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Entitlement definition with ID ${id} not found`
      );
    }

    return this.prisma.entitlementDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
