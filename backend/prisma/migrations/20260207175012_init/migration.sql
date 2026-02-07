-- AlterTable
ALTER TABLE `question_paper_questions` ADD COLUMN `markedForReview` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `questions` ADD COLUMN `chapterId` VARCHAR(191) NULL,
    ADD COLUMN `sectionId` VARCHAR(191) NULL,
    ADD COLUMN `subject` VARCHAR(191) NULL,
    ADD COLUMN `system` VARCHAR(191) NULL,
    ADD COLUMN `tags` JSON NULL,
    MODIFY `question` TEXT NOT NULL,
    MODIFY `explanation` TEXT NULL;

-- CreateTable
CREATE TABLE `explanation_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NULL,
    `perAnswerId` VARCHAR(191) NULL,
    `type` ENUM('TEXT', 'TABLE', 'IMAGES') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `per_answer_explanations` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `choiceLabel` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `per_answer_explanations_questionId_choiceLabel_key`(`questionId`, `choiceLabel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_stem_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'IMAGES', 'TABLE') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
