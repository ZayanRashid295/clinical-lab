-- CreateTable
CREATE TABLE `bookmarks` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `resourceType` ENUM('QUESTION', 'NOTE', 'FLASHCARD', 'TOPIC', 'SUBTOPIC', 'PRODUCT', 'MATERIAL') NOT NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookmarks_userId_resourceType_idx`(`userId`, `resourceType`),
    UNIQUE INDEX `bookmarks_userId_resourceType_resourceId_key`(`userId`, `resourceType`, `resourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_notes` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `color` VARCHAR(191) NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `tags` JSON NULL,
    `questionId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `subtopicId` VARCHAR(191) NULL,
    `systemId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_notes_userId_pinned_idx`(`userId`, `pinned`),
    INDEX `student_notes_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flashcards` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deck` VARCHAR(191) NOT NULL DEFAULT 'General',
    `front` TEXT NOT NULL,
    `back` TEXT NOT NULL,
    `hint` TEXT NULL,
    `tags` JSON NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` ENUM('NEW', 'LEARNING', 'REVIEW', 'MASTERED') NOT NULL DEFAULT 'NEW',
    `questionId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `subtopicId` VARCHAR(191) NULL,
    `systemId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NULL,
    `intervalDays` INTEGER NOT NULL DEFAULT 0,
    `easeFactor` DOUBLE NOT NULL DEFAULT 2.5,
    `repetitions` INTEGER NOT NULL DEFAULT 0,
    `dueAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastReviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `flashcards_userId_dueAt_idx`(`userId`, `dueAt`),
    INDEX `flashcards_userId_deck_idx`(`userId`, `deck`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flashcard_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `flashcardId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rating` ENUM('AGAIN', 'HARD', 'GOOD', 'EASY') NOT NULL,
    `intervalDays` INTEGER NOT NULL,
    `easeFactor` DOUBLE NOT NULL,
    `reviewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `flashcard_reviews_userId_reviewedAt_idx`(`userId`, `reviewedAt`),
    INDEX `flashcard_reviews_flashcardId_reviewedAt_idx`(`flashcardId`, `reviewedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_plans` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'My Study Plan',
    `description` VARCHAR(191) NULL,
    `goal` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `study_plans_userId_isActive_idx`(`userId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `studyPlanId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('READING', 'PRACTICE', 'REVIEW', 'FLASHCARDS', 'ASSESSMENT', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `scheduledFor` DATETIME(3) NOT NULL,
    `durationMinutes` INTEGER NOT NULL DEFAULT 30,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `completedAt` DATETIME(3) NULL,
    `systemId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `subtopicId` VARCHAR(191) NULL,
    `questionPaperId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `study_tasks_userId_scheduledFor_idx`(`userId`, `scheduledFor`),
    INDEX `study_tasks_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('STUDY', 'PRACTICE', 'ASSESSMENT', 'FLASHCARDS', 'REVIEW') NOT NULL DEFAULT 'STUDY',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `durationSeconds` INTEGER NOT NULL DEFAULT 0,
    `meta` JSON NULL,

    INDEX `study_sessions_userId_startedAt_idx`(`userId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
