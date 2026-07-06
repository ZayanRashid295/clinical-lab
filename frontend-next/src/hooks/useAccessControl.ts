import { useState, useEffect, useCallback } from "react";
import { authService } from "@/shared/services/auth.service";
import { billingService } from "@/app/services/billing/billing.service";

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
      const profile = await authService.getProfile();
      const roles = profile?.roles?.map((ur: any) => 
        typeof ur === 'string' ? ur : ur.role?.name || ur.name
      ).filter(Boolean) || [];
      
      const permissions = profile?.permissions?.map((up: any) =>
        typeof up === 'string' ? up : up.permission?.name || up.name
      ).filter(Boolean) || [];

      let hasActiveSubscription = false;
      let subscription = null;
      const features: string[] = [];

      if (profile?.id) {
        try {
          const billing = await billingService.getMyBilling();
          subscription = billing.subscription;
          hasActiveSubscription = !!subscription;
          features.push(...(await billingService.getMyFeatures()));
        } catch {
          hasActiveSubscription = false;
        }
      }

      setAccessInfo({
        roles,
        permissions,
        features,
        hasActiveSubscription,
        subscription,
      });
    } catch {
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
  }, [loadAccessInfo]);

  const hasAccess = useCallback(
    (requirements: AccessRequirements): boolean => {
      if (requirements.role) {
        const required = Array.isArray(requirements.role) ? requirements.role : [requirements.role];
        if (!required.some((r) => accessInfo.roles.includes(r))) return false;
      }
      if (requirements.permission) {
        const required = Array.isArray(requirements.permission) ? requirements.permission : [requirements.permission];
        if (!required.some((p) => accessInfo.permissions.includes(p))) return false;
      }
      if (requirements.feature) {
        const required = Array.isArray(requirements.feature) ? requirements.feature : [requirements.feature];
        if (!required.some((f) => accessInfo.features.includes(f))) return false;
      }
      if (requirements.requireSubscription && !accessInfo.hasActiveSubscription) return false;
      return true;
    },
    [accessInfo]
  );

  return { ...accessInfo, loading, hasAccess, refresh: loadAccessInfo };
}

export default useAccessControl;
