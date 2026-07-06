-- Extend billing promotions engine

ALTER TABLE `billing_coupons`
  ADD COLUMN `name` VARCHAR(191) NULL AFTER `code`,
  ADD COLUMN `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_FIRST_CYCLE', 'MULTI_CYCLE_PERCENTAGE', 'LIFETIME_PERCENTAGE') NOT NULL DEFAULT 'PERCENTAGE' AFTER `description`,
  ADD COLUMN `maxDiscountAmount` DECIMAL(10, 2) NULL AFTER `amountOff`,
  ADD COLUMN `durationCycles` INT NULL AFTER `durationMonths`,
  ADD COLUMN `maxRedemptionsPerUser` INT NULL DEFAULT 1 AFTER `maxRedemptions`,
  ADD COLUMN `applicablePlanIds` JSON NOT NULL DEFAULT ('[]') AFTER `planId`,
  ADD COLUMN `applicableIntervals` JSON NOT NULL DEFAULT ('[]') AFTER `applicablePlanIds`,
  ADD COLUMN `firstTimeOnly` BOOLEAN NOT NULL DEFAULT false AFTER `applicableIntervals`,
  ADD COLUMN `existingCustomersOnly` BOOLEAN NOT NULL DEFAULT false AFTER `firstTimeOnly`,
  ADD COLUMN `stackable` BOOLEAN NOT NULL DEFAULT false AFTER `existingCustomersOnly`,
  ADD COLUMN `autoApply` BOOLEAN NOT NULL DEFAULT false AFTER `stackable`,
  ADD COLUMN `archivedAt` DATETIME(3) NULL AFTER `validUntil`,
  ADD COLUMN `createdBy` VARCHAR(191) NULL AFTER `providerCouponId`,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL AFTER `createdBy`,
  ADD COLUMN `metadataJson` JSON NOT NULL DEFAULT ('{}') AFTER `updatedBy`;

ALTER TABLE `billing_coupons`
  MODIFY `description` TEXT NULL;

DROP INDEX `billing_coupon_redemptions_couponId_userId_key` ON `billing_coupon_redemptions`;

ALTER TABLE `billing_coupon_redemptions`
  ADD COLUMN `subscriptionId` VARCHAR(191) NULL AFTER `userId`,
  ADD COLUMN `originalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `subscriptionId`,
  ADD COLUMN `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `originalAmount`,
  ADD COLUMN `finalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `discountAmount`,
  ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD' AFTER `finalAmount`,
  ADD COLUMN `billingInterval` ENUM('MONTHLY', 'YEARLY') NULL AFTER `currency`,
  ADD COLUMN `metadataJson` JSON NOT NULL DEFAULT ('{}') AFTER `billingInterval`;

CREATE INDEX `billing_coupons_active_idx` ON `billing_coupons` (`isActive`, `validFrom`, `validUntil`);
CREATE INDEX `billing_coupon_redemptions_coupon_user_idx` ON `billing_coupon_redemptions` (`couponId`, `userId`);
