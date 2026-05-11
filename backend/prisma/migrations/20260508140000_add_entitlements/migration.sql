-- CreateTable
CREATE TABLE `entitlement_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `productSubtypeId` VARCHAR(191) NULL,
    `type` ENUM('BOOLEAN', 'SET', 'NUMBER_LIMIT', 'JSON_CONSTRAINTS') NOT NULL DEFAULT 'BOOLEAN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `entitlement_definitions_key_key`(`key`),
    INDEX `entitlement_definitions_productSubtypeId_idx`(`productSubtypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_package_entitlements` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionPackageId` VARCHAR(191) NOT NULL,
    `entitlementDefinitionId` VARCHAR(191) NOT NULL,
    `valueJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sp_ent_pkg_ent_uq`(`subscriptionPackageId`, `entitlementDefinitionId`),
    INDEX `sp_ent_pkg_idx`(`subscriptionPackageId`),
    INDEX `sp_ent_ent_idx`(`entitlementDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entitlement_usages` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `entitlementDefinitionId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `metadataJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ent_usage_uq`(`userId`, `entitlementDefinitionId`, `periodStart`, `periodEnd`),
    INDEX `ent_usage_user_ent_idx`(`userId`, `entitlementDefinitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

