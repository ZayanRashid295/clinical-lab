import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TokenBlacklistService } from "../token-blacklist.service";

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(
    private tokenBlacklistService: TokenBlacklistService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true; // Let other guards handle missing auth
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return true; // Let other guards handle missing token
    }

    // Check if token is blacklisted
    if (this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException("Token has been revoked");
    }

    return true;
  }
}
