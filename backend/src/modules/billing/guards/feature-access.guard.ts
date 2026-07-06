import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_FEATURES_KEY } from "../../auth/decorators/features.decorator";
import { BillingSubscriptionsService } from "../subscriptions/billing-subscriptions.service";

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private billingService: BillingSubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException("User not authenticated");

    const userId = user.userId || user.id;
    const roles: string[] = (user.roles ?? []).map((r: any) =>
      typeof r === "string" ? r : r.name || r.role?.name
    );

    if (roles.includes("ADMIN") || roles.includes("SUPERADMIN")) return true;

    const features = await this.billingService.getUserFeatures(userId);
    const resolveFeatureKey = (key: string): string => {
      const normalized = key.trim().toLowerCase();
      if (normalized === "qbank access" || normalized === "qbank") {
        return "qbank.access";
      }
      return key;
    };
    const missing = required
      .map(resolveFeatureKey)
      .filter((k) => !features.includes(k));

    if (missing.length) {
      throw new ForbiddenException(
        `Access denied. Missing features: ${missing.join(", ")}. Please upgrade your plan.`
      );
    }

    return true;
  }
}
