import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { TokenBlacklistService } from "./token-blacklist.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InstitutionService } from "../institution/institution.service";
import { StudentActivityType } from "@prisma/client";
import { PatchUiPreferencesDto } from "./dto/patch-ui-preferences.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private notifications: NotificationsService,
    private institutionService: InstitutionService,
  ) {}

  private async ensureStudentRole(userId: string) {
    const studentRole = await this.prisma.role.findUnique({
      where: { name: "STUDENT" },
    });
    if (!studentRole) return;
    const hasRole = await this.prisma.userRole.findFirst({
      where: { userId, roleId: studentRole.id },
    });
    if (!hasRole) {
      await this.prisma.userRole.create({
        data: { userId, roleId: studentRole.id },
      });
    }
  }

  private async shouldAutoLinkInstitution(userId: string): Promise<boolean> {
    const faculty = await this.prisma.facultyProfile.findUnique({
      where: { userId },
    });
    if (faculty) return false;

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const names = userRoles.map((ur) => ur.role.name);
    return !names.some((n) =>
      ["FACULTY", "INSTITUTION_MANAGER", "SUPERADMIN", "ADMIN"].includes(n),
    );
  }

  private async linkInstitutionForUser(userId: string, email: string) {
    if (!(await this.shouldAutoLinkInstitution(userId))) return;
    await this.institutionService.resolveMemberForUser(userId, email);
    await this.institutionService.recordActivity(
      userId,
      StudentActivityType.LOGIN,
      "Signed in",
    );
  }

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
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.validateUser(email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.linkInstitutionForUser(user.id, email);

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
    const email = registerDto.email.trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      throw new BadRequestException("Invalid email format");
    }

    if (!this.isValidPassword(registerDto.password)) {
      throw new BadRequestException(
        "Password must be at least 8 characters and include at least one letter and one number"
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const phoneTrimmed = registerDto.phone?.trim();
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: registerDto.firstName.trim(),
        lastName: registerDto.lastName.trim(),
        password: hashedPassword,
        ...(phoneTrimmed ? { phone: phoneTrimmed } : {}),
      },
    });

    await this.ensureStudentRole(user.id);
    await this.linkInstitutionForUser(user.id, email);

    void this.notifications
      .emit({
        userId: user.id,
        type: "WELCOME",
        title: `Welcome, ${user.firstName}!`,
        message:
          "Your account is ready. Start with a practice test, set a goal, or join a study group.",
        data: { route: "/study" },
      })
      .catch(() => undefined);

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

  async getUiPreferences(userId: string) {
    const row = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: {
        uiTheme: true,
        uiColorScheme: true,
        uiMenuLayout: true,
        uiMenuStyle: true,
        uiFontSize: true,
        uiTypographyPreset: true,
      },
    });
    return row;
  }

  async patchUiPreferences(userId: string, dto: PatchUiPreferencesDto) {
    const updateData: Record<string, string> = {};
    if (dto.uiTheme !== undefined) updateData.uiTheme = dto.uiTheme;
    if (dto.uiColorScheme !== undefined) updateData.uiColorScheme = dto.uiColorScheme;
    if (dto.uiMenuLayout !== undefined) updateData.uiMenuLayout = dto.uiMenuLayout;
    if (dto.uiMenuStyle !== undefined) updateData.uiMenuStyle = dto.uiMenuStyle;
    if (dto.uiFontSize !== undefined) updateData.uiFontSize = dto.uiFontSize;
    if (dto.uiTypographyPreset !== undefined) {
      updateData.uiTypographyPreset = dto.uiTypographyPreset;
    }

    if (Object.keys(updateData).length === 0) {
      return (await this.getUiPreferences(userId)) ?? {};
    }

    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        language: "en",
        timezone: "UTC",
        notifications: {},
        privacySettings: {},
        uiTheme: dto.uiTheme ?? "light",
        uiColorScheme: dto.uiColorScheme ?? "emerald",
        uiMenuLayout: dto.uiMenuLayout ?? "vertical",
        uiMenuStyle: dto.uiMenuStyle ?? "sidebar",
        uiFontSize: dto.uiFontSize ?? "medium",
        uiTypographyPreset: dto.uiTypographyPreset ?? "system",
      },
      update: updateData,
      select: {
        uiTheme: true,
        uiColorScheme: true,
        uiMenuLayout: true,
        uiMenuStyle: true,
        uiFontSize: true,
        uiTypographyPreset: true,
      },
    });
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
