-- CreateTable
CREATE TABLE `medprep_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `caseInstanceId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    `interventionCount` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `abandonedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medprep_conversations_userId_idx`(`userId`),
    INDEX `medprep_conversations_caseId_idx`(`caseId`),
    INDEX `medprep_conversations_caseInstanceId_idx`(`caseInstanceId`),
    INDEX `medprep_conversations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medprep_conversation_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `role` ENUM('STUDENT', 'PATIENT', 'DOCTOR') NOT NULL,
    `content` TEXT NOT NULL,
    `isIntervention` BOOLEAN NOT NULL DEFAULT false,
    `relevanceScore` DOUBLE NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medprep_conversation_messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `medprep_conversation_messages_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medprep_diagnosis_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `submittedDiagnosis` TEXT NOT NULL,
    `actualDiagnosis` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `isRareCase` BOOLEAN NOT NULL DEFAULT false,
    `specialty` VARCHAR(191) NULL,
    `caseDifficulty` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medprep_diagnosis_submissions_conversationId_idx`(`conversationId`),
    INDEX `medprep_diagnosis_submissions_userId_idx`(`userId`),
    INDEX `medprep_diagnosis_submissions_submittedAt_idx`(`submittedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medprep_soap_notes` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subjective` TEXT NOT NULL,
    `objective` TEXT NOT NULL,
    `assessment` TEXT NOT NULL,
    `plan` TEXT NOT NULL,
    `aiSubjective` TEXT NULL,
    `aiObjective` TEXT NULL,
    `aiAssessment` TEXT NULL,
    `aiPlan` TEXT NULL,
    `grade` DOUBLE NULL,
    `feedback` TEXT NULL,
    `submittedAt` DATETIME(3) NULL,
    `lastSavedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medprep_soap_notes_userId_idx`(`userId`),
    INDEX `medprep_soap_notes_submittedAt_idx`(`submittedAt`),
    UNIQUE INDEX `medprep_soap_notes_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medprep_hint_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `sessionKey` VARCHAR(191) NOT NULL,
    `totalHintsUsed` INTEGER NOT NULL DEFAULT 0,
    `highImportanceHints` INTEGER NOT NULL DEFAULT 0,
    `mediumImportanceHints` INTEGER NOT NULL DEFAULT 0,
    `lowImportanceHints` INTEGER NOT NULL DEFAULT 0,
    `gradePenalty` DOUBLE NOT NULL DEFAULT 0,
    `hintTimestamps` JSON NULL,
    `hintsByCategory` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medprep_hint_sessions_userId_idx`(`userId`),
    INDEX `medprep_hint_sessions_conversationId_idx`(`conversationId`),
    UNIQUE INDEX `medprep_hint_sessions_sessionKey_key`(`sessionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
