-- Admin QA workflow: issues, discussions, versions, production approval

CREATE TABLE `qa_issues` (
  `id` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `annotationId` VARCHAR(191) NULL,
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
  `category` VARCHAR(191) NULL,
  `severity` ENUM('MINOR', 'MAJOR', 'CRITICAL') NOT NULL DEFAULT 'MINOR',
  `title` VARCHAR(500) NOT NULL,
  `body` TEXT NOT NULL,
  `selectedText` TEXT NULL,
  `currentContent` TEXT NULL,
  `suggestedRevision` TEXT NULL,
  `status` ENUM(
    'NEW',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_MEDICAL_REVIEW',
    'RESOLVED',
    'VERIFIED',
    'CLOSED',
    'REJECTED'
  ) NOT NULL DEFAULT 'NEW',
  `assignedToId` VARCHAR(191) NULL,
  `reporterNames` JSON NOT NULL,
  `sourceAnnotationIds` JSON NOT NULL,
  `replyCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `resolvedAt` DATETIME(3) NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `qa_issues_annotationId_key`(`annotationId`),
  INDEX `qa_issues_questionId_status_idx`(`questionId`, `status`),
  INDEX `qa_issues_questionId_targetKey_idx`(`questionId`, `targetKey`),
  INDEX `qa_issues_status_severity_idx`(`status`, `severity`),
  INDEX `qa_issues_assignedToId_idx`(`assignedToId`),
  CONSTRAINT `qa_issues_questionId_fkey`
    FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_issues_annotationId_fkey`
    FOREIGN KEY (`annotationId`) REFERENCES `question_review_annotations`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `qa_issues_assignedToId_fkey`
    FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `qa_issue_comments` (
  `id` VARCHAR(191) NOT NULL,
  `issueId` VARCHAR(191) NOT NULL,
  `authorId` VARCHAR(191) NULL,
  `authorName` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `isInternal` BOOLEAN NOT NULL DEFAULT false,
  `mentions` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `qa_issue_comments_issueId_createdAt_idx`(`issueId`, `createdAt`),
  CONSTRAINT `qa_issue_comments_issueId_fkey`
    FOREIGN KEY (`issueId`) REFERENCES `qa_issues`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_issue_comments_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `qa_issue_activities` (
  `id` VARCHAR(191) NOT NULL,
  `issueId` VARCHAR(191) NULL,
  `questionId` VARCHAR(191) NULL,
  `actorId` VARCHAR(191) NULL,
  `actorName` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `meta` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `qa_issue_activities_issueId_createdAt_idx`(`issueId`, `createdAt`),
  INDEX `qa_issue_activities_questionId_createdAt_idx`(`questionId`, `createdAt`),
  CONSTRAINT `qa_issue_activities_issueId_fkey`
    FOREIGN KEY (`issueId`) REFERENCES `qa_issues`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_issue_activities_questionId_fkey`
    FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qa_issue_activities_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_qa_records` (
  `id` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `productionStatus` ENUM('DRAFT', 'NEEDS_REVISION', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
  `draftSnapshot` JSON NULL,
  `ratings` JSON NULL,
  `decisionNote` TEXT NULL,
  `approvedById` VARCHAR(191) NULL,
  `approvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `question_qa_records_questionId_key`(`questionId`),
  CONSTRAINT `question_qa_records_questionId_fkey`
    FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `question_qa_records_approvedById_fkey`
    FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `question_qa_versions` (
  `id` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `version` INTEGER NOT NULL,
  `authorId` VARCHAR(191) NOT NULL,
  `summary` TEXT NULL,
  `snapshot` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `question_qa_versions_questionId_version_key`(`questionId`, `version`),
  INDEX `question_qa_versions_questionId_createdAt_idx`(`questionId`, `createdAt`),
  CONSTRAINT `question_qa_versions_questionId_fkey`
    FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `question_qa_versions_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
