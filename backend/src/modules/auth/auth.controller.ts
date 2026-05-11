import {
  Controller,
  Post,
  Patch,
  Body,
  Patch,
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
import { PatchUiPreferencesDto } from "./dto/patch-ui-preferences.dto";
import { UsersService } from "../users/users.service";
import { UpdateOwnProfileDto } from "../users/dto/update-own-profile.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

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

  @Get("profile/ui-preferences")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get persisted UI preferences" })
  @ApiResponse({ status: 200, description: "UI preferences" })
  async getUiPreferences(@Request() req) {
    const prefs = await this.authService.getUiPreferences(req.user.userId);
    return prefs ?? {};
  }

  @Patch("profile/ui-preferences")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update persisted UI preferences" })
  @ApiResponse({ status: 200, description: "Updated UI preferences" })
  async patchUiPreferences(
    @Request() req,
    @Body() dto: PatchUiPreferencesDto,
  ) {
    return this.authService.patchUiPreferences(req.user.userId, dto);
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update own profile",
    description:
      "Update first name, last name, email, or phone for the authenticated user.",
  })
  @ApiResponse({ status: 200, description: "Profile updated" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Email or phone already in use" })
  async updateOwnProfile(
    @Request() req,
    @Body() dto: UpdateOwnProfileDto
  ) {
    return this.usersService.updateOwnProfile(req.user.userId, dto);
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
