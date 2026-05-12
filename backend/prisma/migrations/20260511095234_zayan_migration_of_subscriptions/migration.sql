-- DropIndex
DROP INDEX `entitlement_definitions_productSubtypeId_idx` ON `entitlement_definitions`;

-- DropIndex
DROP INDEX `sp_ent_ent_idx` ON `subscription_package_entitlements`;

-- DropIndex
DROP INDEX `sp_ent_pkg_idx` ON `subscription_package_entitlements`;

-- AlterTable
ALTER TABLE `entitlement_definitions` MODIFY `description` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `entitlement_usages` RENAME INDEX `ent_usage_uq` TO `entitlement_usages_userId_entitlementDefinitionId_periodStar_key`;

-- RenameIndex
ALTER TABLE `entitlement_usages` RENAME INDEX `ent_usage_user_ent_idx` TO `entitlement_usages_userId_entitlementDefinitionId_idx`;

-- RenameIndex
ALTER TABLE `subscription_package_entitlements` RENAME INDEX `sp_ent_pkg_ent_uq` TO `subscription_package_entitlements_subscriptionPackageId_enti_key`;
