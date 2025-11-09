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

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
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
            role: true,
          },
        },
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
