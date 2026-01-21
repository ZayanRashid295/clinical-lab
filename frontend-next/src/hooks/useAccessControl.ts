import { useState, useEffect, useCallback } from "react";
import { authService } from "@/shared/services/auth.service";
import { SubscriptionsService } from "@/app/services/subscriptions/subscriptions.service";

interface AccessInfo {
  roles: string[];
  permissions: string[];
  features: string[];
  hasActiveSubscription: boolean;
  subscription: any | null;
}

interface AccessRequirements {
  role?: string | string[];
  permission?: string | string[];
  feature?: string | string[];
  requireSubscription?: boolean;
}

export function useAccessControl() {
  const [accessInfo, setAccessInfo] = useState<AccessInfo>({
    roles: [],
    permissions: [],
    features: [],
    hasActiveSubscription: false,
    subscription: null,
  });
  const [loading, setLoading] = useState(true);

  const loadAccessInfo = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setAccessInfo({
        roles: [],
        permissions: [],
        features: [],
        hasActiveSubscription: false,
        subscription: null,
      });
      setLoading(false);
      return;
    }

    try {
      // Get user profile with roles and permissions
      const profile = await authService.getProfile();
      const roles = profile?.roles?.map((ur: any) => 
        typeof ur === 'string' ? ur : ur.role?.name || ur.name
      ).filter(Boolean) || [];
      
      const permissions = profile?.permissions?.map((up: any) =>
        typeof up === 'string' ? up : up.permission?.name || up.name
      ).filter(Boolean) || [];

      // Get active subscription and features
      const subscriptionsService = new SubscriptionsService();
      const activeSubscriptions = await subscriptionsService.getUserSubscriptions(
        profile.id,
        "ACTIVE"
      );

      const hasActiveSubscription = activeSubscriptions && activeSubscriptions.length > 0;
      const subscription = hasActiveSubscription ? activeSubscriptions[0] : null;

      // Extract features from active subscription
      const features: string[] = [];
      if (subscription?.subscriptionPackage?.subscriptionFeatures) {
        subscription.subscriptionPackage.subscriptionFeatures.forEach((sf: any) => {
          const featureName = sf.packageFeature?.name;
          if (featureName) {
            features.push(featureName);
          }
        });
      }

      setAccessInfo({
        roles,
        permissions,
        features,
        hasActiveSubscription,
        subscription,
      });
    } catch (error) {
      console.error("Error loading access info:", error);
      setAccessInfo({
        roles: [],
        permissions: [],
        features: [],
        hasActiveSubscription: false,
        subscription: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccessInfo();
    
    // Reload when auth state changes
    const interval = setInterval(() => {
      if (authService.isAuthenticated()) {
        loadAccessInfo();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [loadAccessInfo]);

  const hasRole = useCallback(
    (role: string): boolean => {
      return accessInfo.roles.includes(role);
    },
    [accessInfo.roles]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => accessInfo.roles.includes(role));
    },
    [accessInfo.roles]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return accessInfo.permissions.includes(permission);
    },
    [accessInfo.permissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((perm) => accessInfo.permissions.includes(perm));
    },
    [accessInfo.permissions]
  );

  const hasFeature = useCallback(
    (feature: string): boolean => {
      return accessInfo.features.includes(feature);
    },
    [accessInfo.features]
  );

  const hasAnyFeature = useCallback(
    (features: string[]): boolean => {
      return features.some((feature) => accessInfo.features.includes(feature));
    },
    [accessInfo.features]
  );

  const canAccess = useCallback(
    (requirements: AccessRequirements): boolean => {
      // Check role
      if (requirements.role) {
        const requiredRoles = Array.isArray(requirements.role)
          ? requirements.role
          : [requirements.role];
        if (!hasAnyRole(requiredRoles)) {
          return false;
        }
      }

      // Check permission
      if (requirements.permission) {
        const requiredPermissions = Array.isArray(requirements.permission)
          ? requirements.permission
          : [requirements.permission];
        if (!hasAnyPermission(requiredPermissions)) {
          return false;
        }
      }

      // Check feature
      if (requirements.feature) {
        const requiredFeatures = Array.isArray(requirements.feature)
          ? requirements.feature
          : [requirements.feature];
        if (!hasAnyFeature(requiredFeatures)) {
          return false;
        }
      }

      // Check subscription
      if (requirements.requireSubscription && !accessInfo.hasActiveSubscription) {
        return false;
      }

      return true;
    },
    [accessInfo, hasAnyRole, hasAnyPermission, hasAnyFeature]
  );

  return {
    ...accessInfo,
    loading,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasFeature,
    hasAnyFeature,
    canAccess,
    refresh: loadAccessInfo,
  };
}








