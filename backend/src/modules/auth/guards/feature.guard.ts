import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_FEATURES_KEY } from '../decorators/features.decorator';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_FEATURES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true; // No features required, allow access
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

    // Get user roles from request
    const userRoles = user.roles || [];
    const userRoleNames = userRoles.map((role: any) => 
      typeof role === 'string' ? role : role.name || role.role?.name
    ).filter(Boolean);

    // ADMIN and SUPERADMIN bypass feature checks
    if (userRoleNames.includes('ADMIN') || userRoleNames.includes('SUPERADMIN')) {
      return true;
    }

    // Get user's active features
    const userFeatures = await this.subscriptionsService.getUserActiveFeatures(
      userId
    );

    // Check if user has ALL required features (AND logic)
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

    return true;
  }
}







