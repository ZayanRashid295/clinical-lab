-- Question quality review bundles (shareable URLs for external MCQ review)

CREATE TABLE `question_review_bundles` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `question_review_bundles_slug_key` (`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_review_bundle_items` (
  `id` VARCHAR(191) NOT NULL,
  `bundleId` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `order` INTEGER NOT NULL DEFAULT 0,

  UNIQUE INDEX `question_review_bundle_items_bundleId_questionId_key` (`bundleId`, `questionId`),
  INDEX `question_review_bundle_items_bundleId_order_idx` (`bundleId`, `order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_review_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `bundleId` VARCHAR(191) NOT NULL,
  `attemptSecret` VARCHAR(191) NOT NULL,
  `reviewerName` VARCHAR(191) NOT NULL,
  `reviewerEmail` VARCHAR(191) NULL,
  `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,

  UNIQUE INDEX `question_review_attempts_attemptSecret_key` (`attemptSecret`),
  INDEX `question_review_attempts_bundleId_status_idx` (`bundleId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_review_responses` (
  `id` VARCHAR(191) NOT NULL,
  `attemptId` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  `userAnswer` VARCHAR(191) NULL,
  `isCorrect` BOOLEAN NULL,
  `qualityComment` TEXT NULL,
  `timeSpent` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `question_review_responses_attemptId_questionId_key` (`attemptId`, `questionId`),
  INDEX `question_review_responses_attemptId_order_idx` (`attemptId`, `order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
