import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { QueryCategoryDto } from "./dto/query-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCategoryDto) {
    try {
      const {
        search, status, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "order", sortOrder = "asc",
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.category.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      if (query.listAll) {
        const categories = await this.prisma.category.findMany({
          where,
          include: { _count: { select: { products: true } } },
          orderBy,
        });
        return {
          data: categories,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const categories = await this.prisma.category.findMany({
        where,
        include: { _count: { select: { products: true } } },
        skip, take: limit, orderBy,
      });

      return {
        data: categories,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async findAllPublic() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          select: { id: true, name: true, description: true, order: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, name: true, description: true, isActive: true, order: true },
          orderBy: { order: "asc" },
        },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);
    return category;
  }

  async getProducts(id: string, isActive?: boolean) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);

    const where: any = { categoryId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.product.findMany({
      where,
      include: { _count: { select: { systems: true } } },
      orderBy: { order: "asc" },
    });
  }

  async getStats() {
    const total = await this.prisma.category.count();
    const active = await this.prisma.category.count({ where: { isActive: true } });
    const inactive = await this.prisma.category.count({ where: { isActive: false } });
    return { total, active, inactive };
  }

  async create(createDto: CreateCategoryDto) {
    const name = (createDto.name ?? "").trim();
    if (!name) throw new BadRequestException("Category name is required");
    return this.prisma.category.create({
      data: { ...createDto, name },
      include: { _count: { select: { products: true } } },
    });
  }

  async update(id: string, updateDto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category with ID ${id} not found`);
    return this.prisma.category.update({
      where: { id }, data: updateDto,
      include: { _count: { select: { products: true } } },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category with ID ${id} not found`);
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
