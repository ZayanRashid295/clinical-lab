import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TokenBlacklistService } from "../token-blacklist.service";

@Injectable()
export class JwtAuthWithBlacklistGuard
  extends AuthGuard("jwt")
  implements CanActivate
{
  constructor(private tokenBlacklistService: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, let the parent JWT guard validate the token
    const isValid = await super.canActivate(context);

    if (!isValid) {
      return false;
    }

    // Then check if the token is blacklisted
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1]; // Bearer <token>

      if (token && this.tokenBlacklistService.isBlacklisted(token)) {
        throw new UnauthorizedException("Token has been revoked");
      }
    }

    return true;
  }
}
