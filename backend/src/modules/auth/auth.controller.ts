import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "User successfully logged in" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req) {
    return this.authService.findUserById(req.user.userId);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "User successfully logged out" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Request() req) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    return this.authService.logout(req.user.userId, token);
  }
}
