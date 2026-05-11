import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_ENTITLEMENTS_KEY } from "../decorators/entitlements.decorator";
import { SubscriptionsService } from "../../subscriptions/subscriptions.service";

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ENTITLEMENTS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    const userId = user.userId || user.id;
    if (!userId) {
      throw new ForbiddenException("User ID not found");
    }

    const userRoles = user.roles || [];
    const userRoleNames = userRoles
      .map((role: any) => (typeof role === "string" ? role : role.name || role.role?.name))
      .filter(Boolean);

    if (userRoleNames.includes("ADMIN") || userRoleNames.includes("SUPERADMIN")) {
      return true;
    }

    const userEntitlementKeys =
      await this.subscriptionsService.getUserEntitlementKeys(userId);

    const hasAll = required.every((k) => userEntitlementKeys.includes(k));

    if (!hasAll) {
      const missing = required.filter((k) => !userEntitlementKeys.includes(k));
      throw new ForbiddenException(
        `Access denied. Missing entitlements: ${missing.join(
          ", "
        )}. Please upgrade your subscription.`
      );
    }

    return true;
  }
}

