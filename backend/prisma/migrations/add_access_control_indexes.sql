-- Add indexes for access control optimization
-- These indexes improve query performance for role, permission, and subscription checks

-- Index for user roles lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(userId);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(roleId);

-- Index for user permissions lookup
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(userId);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permissionId);

-- Index for role permissions lookup
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(roleId);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permissionId);

-- Index for subscriptions lookup (critical for access control)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status ON subscriptions(userId, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end_date ON subscriptions(status, endDate);

-- Index for subscription features lookup
CREATE INDEX IF NOT EXISTS idx_subscription_features_package_id ON subscription_features(subscriptionPackageId);
CREATE INDEX IF NOT EXISTS idx_subscription_features_feature_id ON subscription_features(packageFeatureId);

-- Composite index for active subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_lookup ON subscriptions(userId, status, endDate) 
WHERE status = 'ACTIVE';




