import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { QueryProductSubtypeDto } from "./dto/query-product-subtype.dto";
import { CreateProductSubtypeDto } from "./dto/create-product-subtype.dto";
import { UpdateProductSubtypeDto } from "./dto/update-product-subtype.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private get productInclude() {
    return {
      category: { select: { id: true, name: true, slug: true } },
      productSubtypes: true,
      _count: { select: { systems: true, productSubtypes: true } },
    };
  }

  async findAll(query: QueryProductDto) {
    try {
      const {
        search, status, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc",
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.product.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      if (query.listAll) {
        const products = await this.prisma.product.findMany({
          where, include: this.productInclude, orderBy,
        });
        return {
          data: products,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const products = await this.prisma.product.findMany({
        where, include: this.productInclude, skip, take: limit, orderBy,
      });
      return {
        data: products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async findAllLegacy(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};
    return this.prisma.product.findMany({
      where, include: this.productInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats() {
    const total = await this.prisma.product.count();
    const active = await this.prisma.product.count({ where: { isActive: true } });
    const inactive = await this.prisma.product.count({ where: { isActive: false } });
    return { total, active, inactive };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        systems: {
          include: { _count: { select: { topics: true } } },
          orderBy: { order: "asc" },
        },
        productSubtypes: true,
        _count: { select: { systems: true, productSubtypes: true } },
      },
    });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async getProductSystems(id: string, isActive?: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const where: any = { productId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.system.findMany({
      where,
      include: { _count: { select: { topics: true } } },
      orderBy: { order: "asc" },
    });
  }

  async getProductSubtypes(id: string, isActive?: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const where: any = { productId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.productSubtype.findMany({
      where,
      include: {
        subscriptionPackages: {
          include: {
            subscriptionFeatures: { include: { packageFeature: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getProductStructure(id: string, isActive?: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const systemWhere: any = { productId: id };
    if (isActive !== undefined) systemWhere.isActive = isActive;
    const subtopicWhere = isActive !== undefined ? { isActive } : {};

    return this.prisma.system.findMany({
      where: systemWhere,
      include: {
        topics: {
          where: isActive !== undefined ? { isActive } : {},
          include: {
            subtopics: {
              where: subtopicWhere,
              include: { _count: { select: { questions: true } } },
              orderBy: { order: "asc" },
            },
            _count: { select: { subtopics: true } },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { topics: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async create(createProductDto: CreateProductDto) {
    const { categoryId, ...productData } = createProductDto;
    return this.prisma.product.create({
      data: {
        ...productData,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
      include: this.productInclude,
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const { categoryId, ...productData } = updateProductDto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        category: categoryId !== undefined
          ? categoryId
            ? { connect: { id: categoryId } }
            : { disconnect: true }
          : undefined,
      },
      include: this.productInclude,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  // ========== PRODUCT SUBTYPES ==========
  async findAllSubtypes(query: QueryProductSubtypeDto) {
    try {
      const {
        search, status, productId, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc",
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (productId) where.productId = productId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.productSubtype.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const include = {
        product: { select: { id: true, name: true } },
        subscriptionPackages: { select: { id: true, name: true } },
      };

      if (query.listAll) {
        const subtypes = await this.prisma.productSubtype.findMany({ where, include, orderBy });
        return {
          data: subtypes,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const subtypes = await this.prisma.productSubtype.findMany({ where, include, skip, take: limit, orderBy });
      return {
        data: subtypes,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
        product: { select: { id: true, name: true } },
        subscriptionPackages: {
          include: { subscriptionFeatures: { include: { packageFeature: true } } },
        },
      },
    });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    return subtype;
  }

  async createSubtype(createSubtypeDto: CreateProductSubtypeDto) {
    return this.prisma.productSubtype.create({
      data: createSubtypeDto,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async updateSubtype(id: string, updateSubtypeDto: UpdateProductSubtypeDto) {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    return this.prisma.productSubtype.update({
      where: { id }, data: updateSubtypeDto,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async removeSubtype(id: string) {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    return this.prisma.productSubtype.update({ where: { id }, data: { isActive: false } });
  }

  async getSubtypeStats() {
    const total = await this.prisma.productSubtype.count();
    const active = await this.prisma.productSubtype.count({ where: { isActive: true } });
    const inactive = await this.prisma.productSubtype.count({ where: { isActive: false } });
    return { total, active, inactive };
  }
}
