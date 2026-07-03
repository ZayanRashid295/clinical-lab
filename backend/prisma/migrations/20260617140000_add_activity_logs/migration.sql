-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `affectedUserId` VARCHAR(191) NULL,
    `component` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(191) NOT NULL,
    `contextType` VARCHAR(191) NULL,
    `contextId` VARCHAR(191) NULL,
    `contextLabel` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `activity_logs_affectedUserId_createdAt_idx`(`affectedUserId`, `createdAt`),
    INDEX `activity_logs_component_createdAt_idx`(`component`, `createdAt`),
    INDEX `activity_logs_eventName_createdAt_idx`(`eventName`, `createdAt`),
    INDEX `activity_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
