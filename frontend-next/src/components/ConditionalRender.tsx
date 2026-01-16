import { ReactNode } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";

interface ConditionalRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface IfRoleProps extends ConditionalRenderProps {
  role: string | string[];
  requireAll?: boolean;
}

interface IfPermissionProps extends ConditionalRenderProps {
  permission: string | string[];
  requireAll?: boolean;
}

interface IfFeatureProps extends ConditionalRenderProps {
  feature: string | string[];
  requireAll?: boolean;
}

interface IfSubscriptionProps extends ConditionalRenderProps {
  active?: boolean;
}

/**
 * Render children only if user has the specified role(s)
 */
export function IfRole({ role, requireAll = false, children, fallback = null }: IfRoleProps) {
  const { hasRole, hasAnyRole } = useAccessControl();
  const roles = Array.isArray(role) ? role : [role];
  
  const hasAccess = requireAll
    ? roles.every((r) => hasRole(r))
    : hasAnyRole(roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render children only if user has the specified permission(s)
 */
export function IfPermission({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: IfPermissionProps) {
  const { hasPermission, hasAnyPermission } = useAccessControl();
  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render children only if user's subscription includes the specified feature(s)
 */
export function IfFeature({
  feature,
  requireAll = false,
  children,
  fallback = null,
}: IfFeatureProps) {
  const { hasFeature, hasAnyFeature } = useAccessControl();
  const features = Array.isArray(feature) ? feature : [feature];

  const hasAccess = requireAll
    ? features.every((f) => hasFeature(f))
    : hasAnyFeature(features);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render children only if user has an active subscription
 */
export function IfSubscription({
  active = true,
  children,
  fallback = null,
}: IfSubscriptionProps) {
  const { hasActiveSubscription } = useAccessControl();

  if (active) {
    return hasActiveSubscription ? <>{children}</> : <>{fallback}</>;
  } else {
    return !hasActiveSubscription ? <>{children}</> : <>{fallback}</>;
  }
}

/**
 * Render children only if user has the specified role
 */
export function IfAdmin({ children, fallback = null }: ConditionalRenderProps) {
  return <IfRole role="ADMIN" fallback={fallback}>{children}</IfRole>;
}

/**
 * Render children only if user has STUDENT role
 */
export function IfStudent({ children, fallback = null }: ConditionalRenderProps) {
  return <IfRole role="STUDENT" fallback={fallback}>{children}</IfRole>;
}

/**
 * Render children only if user has Qbank Access feature
 */
export function IfQbankAccess({ children, fallback = null }: ConditionalRenderProps) {
  return <IfFeature feature="Qbank Access" fallback={fallback}>{children}</IfFeature>;
}



