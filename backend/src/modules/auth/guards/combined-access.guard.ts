import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
  SUBSCRIPTION_STATUS_KEY,
} from '../decorators/subscription.decorator';
import { REQUIRED_FEATURES_KEY } from '../decorators/features.decorator';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Injectable()
export class CombinedAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.userId || user.id;

    // Check roles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles || [];
      const userRoleNames = userRoles.map((role: any) =>
        typeof role === 'string' ? role : role.name || role.role?.name
      );

      const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        );
      }
    }

    // Check permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = user.permissions || [];
      const userPermissionNames = userPermissions.map((perm: any) =>
        typeof perm === 'string' ? perm : perm.name || perm.permission?.name
      );

      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissionNames.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
        );
      }
    }

    // Check subscription
    const requireActive = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredStatuses = this.reflector.getAllAndOverride<string[]>(
      SUBSCRIPTION_STATUS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requireActive || (requiredStatuses && requiredStatuses.length > 0)) {
      if (requireActive) {
        const activeSubscriptions =
          await this.subscriptionsService.getUserSubscriptions(userId, 'ACTIVE');

        if (!activeSubscriptions || activeSubscriptions.length === 0) {
          throw new ForbiddenException(
            'Active subscription required to access this resource'
          );
        }
      }

      if (requiredStatuses && requiredStatuses.length > 0) {
        const userSubscriptions =
          await this.subscriptionsService.getUserSubscriptions(userId);

        const hasRequiredStatus = userSubscriptions.some((sub) =>
          requiredStatuses.includes(sub.status)
        );

        if (!hasRequiredStatus) {
          throw new ForbiddenException(
            `Access denied. Required subscription status: ${requiredStatuses.join(', ')}`
          );
        }
      }
    }

    // Check features
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_FEATURES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredFeatures && requiredFeatures.length > 0) {
      const userFeatures = await this.subscriptionsService.getUserActiveFeatures(
        userId
      );

      const hasAllFeatures = requiredFeatures.every((feature) =>
        userFeatures.includes(feature)
      );

      if (!hasAllFeatures) {
        const missingFeatures = requiredFeatures.filter(
          (feature) => !userFeatures.includes(feature)
        );
        throw new ForbiddenException(
          `Access denied. Required features: ${missingFeatures.join(', ')}. Please upgrade your subscription.`
        );
      }
    }

    return true;
  }
}



