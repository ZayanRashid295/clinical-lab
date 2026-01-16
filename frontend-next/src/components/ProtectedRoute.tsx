import { ReactNode } from "react";
import { useRouter } from "next/router";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Lock, CreditCard, Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: string | string[];
  requirePermission?: string | string[];
  requireFeature?: string | string[];
  requireSubscription?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireRole,
  requirePermission,
  requireFeature,
  requireSubscription,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    loading,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasFeature,
    hasAnyFeature,
    hasActiveSubscription,
    canAccess,
  } = useAccessControl();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading access permissions...</p>
        </div>
      </div>
    );
  }

  // Check access requirements
  const hasAccess = canAccess({
    role: requireRole,
    permission: requirePermission,
    feature: requireFeature,
    requireSubscription,
  });

  if (!hasAccess) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // Default access denied UI
    let title = "Access Denied";
    let message = "You don't have permission to access this resource.";
    let icon = <Lock className="h-5 w-5" />;

    if (requireSubscription && !hasActiveSubscription) {
      title = "Subscription Required";
      message = "An active subscription is required to access this feature.";
      icon = <CreditCard className="h-5 w-5" />;
    } else if (requireFeature) {
      const features = Array.isArray(requireFeature) ? requireFeature : [requireFeature];
      title = "Feature Not Available";
      message = `This feature requires: ${features.join(", ")}. Please upgrade your subscription.`;
      icon = <CreditCard className="h-5 w-5" />;
    } else if (requireRole) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
      title = "Insufficient Permissions";
      message = `This resource requires one of the following roles: ${roles.join(", ")}.`;
      icon = <Shield className="h-5 w-5" />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <div className="flex items-center gap-3 mb-2">
              {icon}
              <h3 className="font-semibold">{title}</h3>
            </div>
            <AlertDescription className="mt-2">{message}</AlertDescription>
            <div className="mt-4 flex gap-2">
              {requireSubscription && !hasActiveSubscription && (
                <Button
                  onClick={() => router.push("/landing-page#pricing")}
                  variant="default"
                >
                  View Plans
                </Button>
              )}
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



