import { ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSystemDto } from "./dto/create-system.dto";
import { UpdateSystemDto } from "./dto/update-system.dto";
import { QuerySystemDto } from "./dto/query-system.dto";

@Injectable()
export class SystemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QuerySystemDto) {
    try {
      const {
        search, status, productId, dateFrom, dateTo,
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
      if (productId) where.productId = productId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.system.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const include = {
        product: { select: { id: true, name: true } },
        _count: { select: { topics: true } },
      };

      if (query.listAll) {
        const systems = await this.prisma.system.findMany({ where, include, orderBy });
        return {
          data: systems,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const systems = await this.prisma.system.findMany({ where, include, skip, take: limit, orderBy });
      return {
        data: systems,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching systems:", error);
      throw error;
    }
  }

  async getSystems(productId?: string, isActive?: boolean) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.system.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        _count: { select: { topics: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async getSystemStats() {
    const total = await this.prisma.system.count();
    const active = await this.prisma.system.count({ where: { isActive: true } });
    const inactive = await this.prisma.system.count({ where: { isActive: false } });
    return { total, active, inactive };
  }

  async getSystem(id: string) {
    const system = await this.prisma.system.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        topics: {
          include: { _count: { select: { subtopics: true, questions: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { topics: true } },
      },
    });
    if (!system) throw new NotFoundException(`System with ID ${id} not found`);
    return system;
  }

  async getSystemTopics(id: string, isActive?: boolean) {
    const system = await this.prisma.system.findUnique({ where: { id } });
    if (!system) throw new NotFoundException(`System with ID ${id} not found`);

    const where: any = { systemId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.topic.findMany({
      where,
      include: { _count: { select: { subtopics: true, questions: true } } },
      orderBy: { order: "asc" },
    });
  }

  async createSystem(createDto: CreateSystemDto) {
    const name = (createDto.name ?? "").trim();
    if (!name) throw new BadRequestException("System name is required");

    const systemName = name.length > 500 ? name.substring(0, 497) + "..." : name;

    const existing = await this.prisma.system.findFirst({
      where: { productId: createDto.productId, name: systemName },
      include: { product: { select: { id: true, name: true } } },
    });
    if (existing) return existing;

    return this.prisma.system.create({
      data: { ...createDto, name: systemName },
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async updateSystem(id: string, updateDto: UpdateSystemDto) {
    const existing = await this.prisma.system.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`System with ID ${id} not found`);

    const data = updateDto.name && updateDto.name.length > 500
      ? { ...updateDto, name: updateDto.name.substring(0, 497) + "..." }
      : updateDto;

    return this.prisma.system.update({
      where: { id }, data,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async removeSystem(id: string) {
    const existing = await this.prisma.system.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`System with ID ${id} not found`);
    return this.prisma.system.update({ where: { id }, data: { isActive: false } });
  }

  async removeSystemPermanent(id: string) {
    const existing = await this.prisma.system.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`System with ID ${id} not found`);
    try {
      await this.prisma.system.delete({ where: { id } });
      return { message: "System permanently deleted" };
    } catch (e: any) {
      if (e?.code === "P2003" || e?.code === "P2014") {
        throw new ConflictException(
          "Cannot delete this system while it is still referenced. Remove dependent records first.",
        );
      }
      throw e;
    }
  }
}
