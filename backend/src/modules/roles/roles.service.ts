import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryRoleDto) {
    try {
      console.log("Query received:", query);
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

      console.log("Search parameter:", search);

      // Build where clause
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
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
      const total = await this.prisma.role.count({ where });

      // Get roles with pagination and sorting
      const roles = await this.prisma.role.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      // Transform roles to include permissions as array of strings
      const transformedRoles = roles.map((role) => ({
        ...role,
        permissions: role.permissions.map((rp) => rp.permission.name),
      }));

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: transformedRoles,
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
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    // Transform permissions to array of strings
    return {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission.name),
    };
  }

  async create(createRoleDto: CreateRoleDto) {
    // Check if role with this name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new Error("Role with this name already exists");
    }

    // Find or create permissions
    const permissionData = await Promise.all(
      createRoleDto.permissions.map(async (permissionName) => {
        let permission = await this.prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (!permission) {
          // Create permission if it doesn't exist
          permission = await this.prisma.permission.create({
            data: {
              name: permissionName,
              description: `${permissionName} permission`,
              resource: permissionName.split("_")[0] || "general",
              action: permissionName.split("_")[1] || "access",
            },
          });
        }

        return { permissionId: permission.id };
      })
    );

    // Create role with permissions
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        displayName: createRoleDto.displayName,
        description: createRoleDto.description,
        isActive: createRoleDto.isActive ?? true,
        permissions: {
          create: permissionData,
        },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Transform permissions to array of strings
    return {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission.name),
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new Error("Role not found");
    }

    // If updating permissions, handle them
    let permissionData = undefined;
    if (updateRoleDto.permissions) {
      const permissions = await Promise.all(
        updateRoleDto.permissions.map(async (permissionName) => {
          let permission = await this.prisma.permission.findUnique({
            where: { name: permissionName },
          });

          if (!permission) {
            // Create permission if it doesn't exist
            permission = await this.prisma.permission.create({
              data: {
                name: permissionName,
                description: `${permissionName} permission`,
                resource: permissionName.split("_")[0] || "general",
                action: permissionName.split("_")[1] || "access",
              },
            });
          }

          return { permissionId: permission.id };
        })
      );

      permissionData = {
        deleteMany: {}, // Remove existing permissions
        create: permissions, // Add new permissions
      };
    }

    // Update role
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...(updateRoleDto.name && { name: updateRoleDto.name }),
        ...(updateRoleDto.displayName && {
          displayName: updateRoleDto.displayName,
        }),
        ...(updateRoleDto.description && {
          description: updateRoleDto.description,
        }),
        ...(updateRoleDto.isActive !== undefined && {
          isActive: updateRoleDto.isActive,
        }),
        ...(permissionData && { permissions: permissionData }),
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Transform permissions to array of strings
    return {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission.name),
    };
  }

  async remove(id: string) {
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    const total = await this.prisma.role.count();
    const active = await this.prisma.role.count({
      where: { isActive: true },
    });
    const inactive = await this.prisma.role.count({
      where: { isActive: false },
    });

    return {
      total,
      active,
      inactive,
    };
  }
}
