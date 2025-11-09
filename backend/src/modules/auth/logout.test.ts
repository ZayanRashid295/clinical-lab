import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenBlacklistService } from "./token-blacklist.service";
import { JwtService } from "@nestjs/jwt";

describe("Logout Functionality", () => {
  let controller: AuthController;
  let authService: AuthService;
  let tokenBlacklistService: TokenBlacklistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            logout: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            addToBlacklist: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService
    );
  });

  it("should call logout service with user ID and token", async () => {
    const mockRequest = {
      user: { userId: "test-user-id" },
      headers: {
        authorization: "Bearer test-token",
      },
    };

    const mockResponse = {
      message: "User successfully logged out",
      timestamp: "2024-01-15T10:30:00.000Z",
      blacklisted: true,
    };

    jest.spyOn(authService, "logout").mockResolvedValue(mockResponse);

    const result = await controller.logout(mockRequest);

    expect(authService.logout).toHaveBeenCalledWith(
      "test-user-id",
      "test-token"
    );
    expect(result).toEqual(mockResponse);
  });

  it("should handle logout without token", async () => {
    const mockRequest = {
      user: { userId: "test-user-id" },
      headers: {},
    };

    const mockResponse = {
      message: "User successfully logged out",
      timestamp: "2024-01-15T10:30:00.000Z",
      blacklisted: false,
    };

    jest.spyOn(authService, "logout").mockResolvedValue(mockResponse);

    const result = await controller.logout(mockRequest);

    expect(authService.logout).toHaveBeenCalledWith("test-user-id", undefined);
    expect(result).toEqual(mockResponse);
  });
});
