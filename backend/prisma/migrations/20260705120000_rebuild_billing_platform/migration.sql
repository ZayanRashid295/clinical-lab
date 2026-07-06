-- Rebuild billing platform: drop legacy subscription/payment tables and create new billing schema

-- Drop legacy tables (order respects FK dependencies)
DROP TABLE IF EXISTS `promo_code_usages`;
DROP TABLE IF EXISTS `promo_codes`;
DROP TABLE IF EXISTS `wallet_transactions`;
DROP TABLE IF EXISTS `refunds`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `payment_methods`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `entitlement_usages`;
DROP TABLE IF EXISTS `subscription_package_entitlements`;
DROP TABLE IF EXISTS `entitlement_definitions`;
DROP TABLE IF EXISTS `subscription_features`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `subscription_packages`;
DROP TABLE IF EXISTS `package_features`;

-- Billing plans
CREATE TABLE `billing_plans` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `monthlyPrice` DECIMAL(10, 2) NOT NULL,
  `yearlyPrice` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  `trialEnabled` BOOLEAN NOT NULL DEFAULT false,
  `trialDurationDays` INTEGER NOT NULL DEFAULT 0,
  `featuresJson` JSON NOT NULL,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `isPopular` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `isPublic` BOOLEAN NOT NULL DEFAULT true,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `maxUsers` INTEGER NULL,
  `storageLimitMb` INTEGER NULL,
  `apiLimitMonthly` INTEGER NULL,
  `stripeProductId` VARCHAR(191) NULL,
  `stripeMonthlyPriceId` VARCHAR(191) NULL,
  `stripeYearlyPriceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `billing_plans_isActive_isPublic_displayOrder_idx` (`isActive`, `isPublic`, `displayOrder`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_subscriptions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `planId` VARCHAR(191) NOT NULL,
  `status` ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'INCOMPLETE', 'PAYMENT_FAILED', 'PAUSED') NOT NULL DEFAULT 'INCOMPLETE',
  `billingInterval` ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
  `trialStart` DATETIME(3) NULL,
  `trialEnd` DATETIME(3) NULL,
  `currentPeriodStart` DATETIME(3) NULL,
  `currentPeriodEnd` DATETIME(3) NULL,
  `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
  `canceledAt` DATETIME(3) NULL,
  `endedAt` DATETIME(3) NULL,
  `providerCustomerId` VARCHAR(191) NULL,
  `providerSubscriptionId` VARCHAR(191) NULL,
  `couponId` VARCHAR(191) NULL,
  `metadataJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_subscriptions_providerSubscriptionId_key` (`providerSubscriptionId`),
  INDEX `billing_subscriptions_userId_status_idx` (`userId`, `status`),
  INDEX `billing_subscriptions_status_currentPeriodEnd_idx` (`status`, `currentPeriodEnd`),
  INDEX `billing_subscriptions_trialEnd_idx` (`trialEnd`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_payment_methods` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'stripe',
  `providerMethodId` VARCHAR(191) NOT NULL,
  `cardBrand` VARCHAR(191) NULL,
  `cardLast4` VARCHAR(191) NULL,
  `cardExpMonth` INTEGER NULL,
  `cardExpYear` INTEGER NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `metadataJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_payment_methods_provider_providerMethodId_key` (`provider`, `providerMethodId`),
  INDEX `billing_payment_methods_userId_isDefault_idx` (`userId`, `isDefault`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_payments` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `subscriptionId` VARCHAR(191) NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
  `provider` VARCHAR(191) NOT NULL DEFAULT 'stripe',
  `providerPaymentId` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `failureReason` VARCHAR(191) NULL,
  `metadataJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_payments_providerPaymentId_key` (`providerPaymentId`),
  INDEX `billing_payments_userId_createdAt_idx` (`userId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_invoices` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `subscriptionId` VARCHAR(191) NULL,
  `invoiceNumber` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  `status` ENUM('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE') NOT NULL DEFAULT 'DRAFT',
  `providerInvoiceId` VARCHAR(191) NULL,
  `pdfUrl` VARCHAR(191) NULL,
  `periodStart` DATETIME(3) NULL,
  `periodEnd` DATETIME(3) NULL,
  `paidAt` DATETIME(3) NULL,
  `metadataJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_invoices_invoiceNumber_key` (`invoiceNumber`),
  UNIQUE INDEX `billing_invoices_providerInvoiceId_key` (`providerInvoiceId`),
  INDEX `billing_invoices_userId_createdAt_idx` (`userId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_coupons` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `percentOff` DECIMAL(5, 2) NULL,
  `amountOff` DECIMAL(10, 2) NULL,
  `currency` VARCHAR(191) NULL,
  `durationMonths` INTEGER NULL,
  `maxRedemptions` INTEGER NULL,
  `redemptionCount` INTEGER NOT NULL DEFAULT 0,
  `planId` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `validUntil` DATETIME(3) NULL,
  `providerCouponId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_coupons_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_coupon_redemptions` (
  `id` VARCHAR(191) NOT NULL,
  `couponId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_coupon_redemptions_couponId_userId_key` (`couponId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_events` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `type` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `billing_events_type_createdAt_idx` (`type`, `createdAt`),
  INDEX `billing_events_userId_createdAt_idx` (`userId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_webhook_events` (
  `id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'stripe',
  `eventId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `status` ENUM('PENDING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `errorMessage` VARCHAR(191) NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_webhook_events_eventId_key` (`eventId`),
  INDEX `billing_webhook_events_status_createdAt_idx` (`status`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_payment_retries` (
  `id` VARCHAR(191) NOT NULL,
  `subscriptionId` VARCHAR(191) NOT NULL,
  `attemptNumber` INTEGER NOT NULL,
  `scheduledAt` DATETIME(3) NOT NULL,
  `attemptedAt` DATETIME(3) NULL,
  `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'EXHAUSTED') NOT NULL DEFAULT 'PENDING',
  `failureReason` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `billing_payment_retries_subscriptionId_status_idx` (`subscriptionId`, `status`),
  INDEX `billing_payment_retries_scheduledAt_status_idx` (`scheduledAt`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `billing_feature_usages` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `featureKey` VARCHAR(191) NOT NULL,
  `periodStart` DATETIME(3) NOT NULL,
  `periodEnd` DATETIME(3) NOT NULL,
  `usedCount` INTEGER NOT NULL DEFAULT 0,
  `metadataJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `billing_fu_user_feat_period_key` (`userId`, `featureKey`, `periodStart`, `periodEnd`),
  INDEX `billing_feature_usages_userId_featureKey_idx` (`userId`, `featureKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
