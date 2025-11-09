import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    try {
      console.log("Query received:", query);
      const {
        search,
        status,
        role,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      console.log("Search parameter:", search);

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ];
      }

      // Status filter
      if (status) {
        where.isActive = status === "ACTIVE";
      }

      // Role filter
      if (role) {
        where.roles = {
          some: {
            role: {
              name: role,
            },
          },
        };
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
      const total = await this.prisma.user.count({ where });

      // Handle special sorting cases
      let orderBy: any = {};
      let needsApplicationSorting = false;

      if (sortBy === "role") {
        // Need to sort by role name after fetching (application-level sorting)
        needsApplicationSorting = true;
        // Fetch without orderBy first, we'll sort in memory
        orderBy = undefined;
      } else if (sortBy === "isActive") {
        // Sort by isActive field
        orderBy = {
          isActive: sortOrder,
        };
      } else {
        // Standard sorting
        orderBy = {
          [sortBy]: sortOrder,
        };
      }

      // Get users with pagination and sorting
      let users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        ...(orderBy && { orderBy }),
      });

      // Handle role sorting at application level
      if (needsApplicationSorting) {
        users = users.sort((a, b) => {
          const roleA = a.roles?.[0]?.role?.name || "";
          const roleB = b.roles?.[0]?.role?.name || "";

          if (sortOrder === "asc") {
            return roleA.localeCompare(roleB);
          } else {
            return roleB.localeCompare(roleA);
          }
        });

        // Apply pagination after sorting
        users = users.slice(skip, skip + limit);
      }

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userSettings: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, updateData: any) {
    // Validate email format if provided
    if (updateData.email && !this.isValidEmail(updateData.email)) {
      throw new Error("Invalid email format");
    }

    // Validate phone format if provided
    if (updateData.phone && !this.isValidPhone(updateData.phone)) {
      throw new Error("Invalid phone format");
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    const total = await this.prisma.user.count();
    const active = await this.prisma.user.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.user.count({
      where: { isActive: false },
    });

    // For now, we'll set pending to 0 since we don't have a pending status in the schema
    // You can modify this based on your business logic
    const pending = 0;

    return {
      total,
      active,
      inactive,
      pending,
    };
  }

  async create(createUserDto: CreateUserDto) {
    // Validate email format if provided
    if (createUserDto.email && !this.isValidEmail(createUserDto.email)) {
      throw new Error("Invalid email format");
    }

    // Validate phone format if provided
    if (createUserDto.phone && !this.isValidPhone(createUserDto.phone)) {
      throw new Error("Invalid phone format");
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password if provided
    let hashedPassword = createUserDto.password;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    }

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
