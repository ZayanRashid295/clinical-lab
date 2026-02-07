import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { QueryProductTagDto } from "./dto/query-product-tag.dto";
import { QueryProductSubtypeDto } from "./dto/query-product-subtype.dto";
import { CreateProductTagDto } from "./dto/create-product-tag.dto";
import { UpdateProductTagDto } from "./dto/update-product-tag.dto";
import { CreateProductSubtypeDto } from "./dto/create-product-subtype.dto";
import { UpdateProductSubtypeDto } from "./dto/update-product-subtype.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductDto) {
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
      const total = await this.prisma.product.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get products with pagination and sorting
      const products = await this.prisma.product.findMany({
        where,
        include: {
          productTags: true,
          productSubtypes: true,
          _count: {
            select: {
              sections: true,
              productTags: true,
              productSubtypes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async findAllLegacy(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};

    return this.prisma.product.findMany({
      where,
      include: {
        productTags: true,
        productSubtypes: true,
        _count: {
          select: {
            sections: true,
            productTags: true,
            productSubtypes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getStats() {
    const total = await this.prisma.product.count();
    const active = await this.prisma.product.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.product.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        productTags: true,
        productSubtypes: true,
        sections: {
          include: {
            _count: {
              select: {
                chapters: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            sections: true,
            productTags: true,
            productSubtypes: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getProductSections(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const where = {
      productId: id,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    return this.prisma.section.findMany({
      where,
      include: {
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async getProductSubtypes(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const where = {
      productId: id,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    return this.prisma.productSubtype.findMany({
      where,
      include: {
        subscriptionPackages: {
          include: {
            subscriptionFeatures: {
              include: {
                packageFeature: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getProductTags(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const where = {
      products: {
        some: {
          id: id,
        },
      },
      ...(isActive !== undefined ? { isActive } : {}),
    };

    return this.prisma.productTag.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getProductStructure(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const sectionWhere = {
      productId: id,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const chapterWhere = isActive !== undefined ? { isActive } : {};
    const topicWhere = isActive !== undefined ? { isActive } : {};

    return this.prisma.section.findMany({
      where: sectionWhere,
      include: {
        chapters: {
          where: chapterWhere,
          include: {
            topics: {
              where: topicWhere,
              include: {
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
            _count: {
              select: {
                topics: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async create(createProductDto: CreateProductDto) {
    const { tagIds, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
        productTags: tagIds && tagIds.length > 0
          ? {
              connect: tagIds.map((tagId) => ({ id: tagId })),
            }
          : undefined,
      },
      include: {
        productTags: true,
        productSubtypes: true,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const { tagIds, ...productData } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        productTags: tagIds !== undefined
          ? {
              set: tagIds.length > 0
                ? tagIds.map((tagId) => ({ id: tagId }))
                : [],
            }
          : undefined,
      },
      include: {
        productTags: true,
        productSubtypes: true,
      },
    });
  }

  async remove(id: string) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete by setting isActive to false
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========== PRODUCT TAGS ==========
  async findAllTags(query: QueryProductTagDto) {
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
      const total = await this.prisma.productTag.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get tags with pagination and sorting
      const tags = await this.prisma.productTag.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
              questions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: tags,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching product tags:", error);
      throw error;
    }
  }

  async getTag(id: string) {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            questions: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Product tag with ID ${id} not found`);
    }

    return tag;
  }

  async createTag(createTagDto: CreateProductTagDto) {
    const name = (createTagDto.name ?? "").trim();
    if (!name) {
      throw new BadRequestException("Tag name is required");
    }
    return this.prisma.productTag.upsert({
      where: { name },
      create: { ...createTagDto, name },
      update: { isActive: true },
      include: {
        _count: {
          select: {
            products: true,
            questions: true,
          },
        },
      },
    });
  }

  async updateTag(id: string, updateTagDto: UpdateProductTagDto) {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Product tag with ID ${id} not found`);
    }

    return this.prisma.productTag.update({
      where: { id },
      data: updateTagDto,
      include: {
        _count: {
          select: {
            products: true,
            questions: true,
          },
        },
      },
    });
  }

  async removeTag(id: string) {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Product tag with ID ${id} not found`);
    }

    return this.prisma.productTag.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getTagStats() {
    const total = await this.prisma.productTag.count();
    const active = await this.prisma.productTag.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.productTag.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }

  // ========== PRODUCT SUBTYPES ==========
  async findAllSubtypes(query: QueryProductSubtypeDto) {
    try {
      const {
        search,
        status,
        productId,
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

      // Product ID filter
      if (productId) {
        where.productId = productId;
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
      const total = await this.prisma.productSubtype.count({ where });

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get subtypes with pagination and sorting
      const subtypes = await this.prisma.productSubtype.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          subscriptionPackages: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: subtypes,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching product subtypes:", error);
      throw error;
    }
  }

  async getSubtype(id: string) {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        subscriptionPackages: {
          include: {
            subscriptionFeatures: {
              include: {
                packageFeature: true,
              },
            },
          },
        },
      },
    });

    if (!subtype) {
      throw new NotFoundException(`Product subtype with ID ${id} not found`);
    }

    return subtype;
  }

  async createSubtype(createSubtypeDto: CreateProductSubtypeDto) {
    return this.prisma.productSubtype.create({
      data: createSubtypeDto,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateSubtype(id: string, updateSubtypeDto: UpdateProductSubtypeDto) {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id },
    });

    if (!subtype) {
      throw new NotFoundException(`Product subtype with ID ${id} not found`);
    }

    return this.prisma.productSubtype.update({
      where: { id },
      data: updateSubtypeDto,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async removeSubtype(id: string) {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id },
    });

    if (!subtype) {
      throw new NotFoundException(`Product subtype with ID ${id} not found`);
    }

    return this.prisma.productSubtype.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSubtypeStats() {
    const total = await this.prisma.productSubtype.count();
    const active = await this.prisma.productSubtype.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.productSubtype.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }
}
