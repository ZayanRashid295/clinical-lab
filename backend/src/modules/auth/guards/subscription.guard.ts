import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
  SUBSCRIPTION_STATUS_KEY,
} from '../decorators/subscription.decorator';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireActive = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredStatuses = this.reflector.getAllAndOverride<string[]>(
      SUBSCRIPTION_STATUS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no subscription requirement, allow access
    if (!requireActive && (!requiredStatuses || requiredStatuses.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.userId || user.id;

    if (!userId) {
      throw new ForbiddenException('User ID not found');
    }

    // Check for active subscription
    if (requireActive) {
      const activeSubscriptions = await this.subscriptionsService.getUserSubscriptions(
        userId,
        'ACTIVE'
      );

      if (!activeSubscriptions || activeSubscriptions.length === 0) {
        throw new ForbiddenException(
          'Active subscription required to access this resource'
        );
      }
    }

    // Check for specific subscription statuses
    if (requiredStatuses && requiredStatuses.length > 0) {
      const userSubscriptions = await this.subscriptionsService.getUserSubscriptions(
        userId
      );

      const hasRequiredStatus = userSubscriptions.some((sub) =>
        requiredStatuses.includes(sub.status)
      );

      if (!hasRequiredStatus) {
        throw new ForbiddenException(
          `Access denied. Required subscription status: ${requiredStatuses.join(', ')}`
        );
      }
    }

    return true;
  }
}




