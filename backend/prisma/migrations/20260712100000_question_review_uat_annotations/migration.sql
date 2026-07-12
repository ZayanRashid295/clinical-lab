-- UAT review: granular annotations + overall review fields

ALTER TABLE `question_review_responses`
  ADD COLUMN `questionQualityRating` INT NULL,
  ADD COLUMN `explanationQualityRating` INT NULL,
  ADD COLUMN `imageQualityRating` INT NULL,
  ADD COLUMN `difficultyRating` ENUM('TOO_EASY', 'APPROPRIATE', 'TOO_DIFFICULT') NULL,
  ADD COLUMN `approvalStatus` ENUM('APPROVE', 'NEEDS_REVISION', 'REJECT') NULL,
  ADD COLUMN `overallComment` TEXT NULL,
  ADD COLUMN `reviewProgress` JSON NULL,
  ADD COLUMN `reviewModeEnteredAt` DATETIME(3) NULL;

CREATE TABLE `question_review_annotations` (
  `id` VARCHAR(191) NOT NULL,
  `responseId` VARCHAR(191) NOT NULL,
  `targetType` ENUM(
    'STEM',
    'OPTION',
    'EXPLANATION',
    'KEYWORD',
    'TABLE',
    'TABLE_CELL',
    'TABLE_ROW',
    'IMAGE',
    'METADATA',
    'OVERALL'
  ) NOT NULL,
  `targetKey` VARCHAR(191) NOT NULL,
  `section` VARCHAR(191) NOT NULL,
  `selectedText` TEXT NULL,
  `anchorMeta` JSON NULL,
  `body` TEXT NOT NULL,
  `tags` JSON NOT NULL,
  `severity` ENUM('MINOR', 'MAJOR', 'CRITICAL') NOT NULL DEFAULT 'MINOR',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `question_review_annotations_responseId_targetType_idx`(`responseId`, `targetType`),
  INDEX `question_review_annotations_responseId_targetKey_idx`(`responseId`, `targetKey`),
  CONSTRAINT `question_review_annotations_responseId_fkey`
    FOREIGN KEY (`responseId`) REFERENCES `question_review_responses`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
