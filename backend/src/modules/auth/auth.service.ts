import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { TokenBlacklistService } from "./token-blacklist.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Get user with access information
    const userWithAccess = await this.getUserWithAccess(user.id);

    // Extract roles and permissions for JWT payload
    const roles = userWithAccess?.roles || [];
    const permissions = userWithAccess?.permissions || [];

    const payload = {
      email: user.email,
      sub: user.id,
      roles: roles,
      permissions: permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithAccess || user,
    };
  }

  async register(registerDto: RegisterDto) {
    // Validate email format
    if (!this.isValidEmail(registerDto.email)) {
      throw new Error("Invalid email format");
    }

    // Validate password strength
    if (!this.isValidPassword(registerDto.password)) {
      throw new Error(
        "Password must be at least 8 characters long and contain at least one letter and one number"
      );
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, one letter, one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userSettings: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Get user with all access information (roles, permissions)
   */
  async getUserWithAccess(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      return null;
    }

    // Extract role names
    const roles = user.roles?.map((ur) => {
      // ur is a UserRole object with { role: Role }
      if (ur && typeof ur === 'object' && 'role' in ur) {
        return ur.role?.name;
      }
      return null;
    }).filter(Boolean) as string[] || [];

    // Extract permissions from roles
    const rolePermissions = new Set<string>();
    user.roles?.forEach((ur) => {
      if (ur && typeof ur === 'object' && 'role' in ur) {
        const role = ur.role;
        if (role?.permissions) {
          role.permissions.forEach((rp: any) => {
            if (rp && typeof rp === 'object' && 'permission' in rp) {
              const permission = rp.permission;
              if (permission?.name) {
                rolePermissions.add(permission.name);
              }
            }
          });
        }
      }
    });

    // Extract direct user permissions
    const userPermissions = user.permissions?.map((up) => {
      if (up && typeof up === 'object' && 'permission' in up) {
        return up.permission?.name;
      }
      return null;
    }).filter(Boolean) as string[] || [];

    // Combine all permissions
    const allPermissions = Array.from(
      new Set([...Array.from(rolePermissions), ...userPermissions])
    );

    return {
      ...user,
      roles: roles,
      permissions: allPermissions,
    };
  }

  /**
   * Check if user has a specific permission
   */
  async userHasPermission(userId: string, permission: string): Promise<boolean> {
    const userWithAccess = await this.getUserWithAccess(userId);
    if (!userWithAccess) {
      return false;
    }
    return userWithAccess.permissions.includes(permission);
  }

  /**
   * Check if user has a specific role
   */
  async userHasRole(userId: string, role: string): Promise<boolean> {
    const userWithAccess = await this.getUserWithAccess(userId);
    if (!userWithAccess) {
      return false;
    }
    return userWithAccess.roles.includes(role);
  }

  async logout(userId: string, token?: string) {
    try {
      // Add token to blacklist if provided
      if (token) {
        this.tokenBlacklistService.addToBlacklist(token);
      }

      // Update user's last logout time
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        message: "User successfully logged out",
        timestamp: new Date().toISOString(),
        blacklisted: !!token,
      };
    } catch (error) {
      // Even if there's an error updating the user, we should still return success
      // because the client-side token will be removed regardless
      return {
        message: "User successfully logged out",
        timestamp: new Date().toISOString(),
        blacklisted: !!token,
      };
    }
  }
}
