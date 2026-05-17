-- Faculty dashboard & institution learning operations

-- Institution extensions
ALTER TABLE `institutions` ADD COLUMN `emailDomains` JSON NOT NULL DEFAULT ('[]');
ALTER TABLE `institutions` ADD COLUMN `requireInstitutionMatch` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `institutions` ADD COLUMN `settings` JSON NULL;

-- Chat type for faculty-student messaging
ALTER TABLE `chat_rooms` MODIFY `type` ENUM('DIRECT', 'GROUP', 'SUPPORT', 'RIDE', 'FACULTY_STUDENT') NOT NULL DEFAULT 'DIRECT';

-- Notification types
ALTER TABLE `notifications` MODIFY `type` ENUM(
  'RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_CANCELLED', 'RIDE_COMPLETED',
  'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROMO_CODE', 'SECURITY_ALERT', 'SYSTEM_UPDATE', 'GENERAL',
  'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'STREAK_RISK', 'STUDY_REMINDER',
  'GOAL_PROGRESS', 'GOAL_COMPLETED', 'GOAL_DUE',
  'DISCUSSION_REPLY', 'DISCUSSION_CREATED', 'DISCUSSION_UPVOTE',
  'STUDY_GROUP_POST', 'STUDY_GROUP_JOIN',
  'FEEDBACK_REPLY', 'FEEDBACK_TICKET_CREATED', 'FEEDBACK_USER_REPLY',
  'QUESTION_REPORT_UPDATE', 'QUESTION_REPORT_CREATED',
  'MOCK_EXAM_RESULT', 'MOCK_EXAM_PUBLISHED',
  'WELCOME', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_RENEWED',
  'FACULTY_MESSAGE', 'ASSIGNMENT_PUBLISHED', 'ASSIGNMENT_DUE'
) NOT NULL;

CREATE TABLE `institution_members` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PENDING', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `resolvedVia` ENUM('DOMAIN', 'INVITE', 'MANUAL') NOT NULL DEFAULT 'DOMAIN',
    `primaryFacultyUserId` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `institution_members_userId_key`(`userId`),
    INDEX `institution_members_institutionId_idx`(`institutionId`),
    INDEX `institution_members_primaryFacultyUserId_idx`(`primaryFacultyUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faculty_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `faculty_profiles_userId_key`(`userId`),
    INDEX `faculty_profiles_institutionId_idx`(`institutionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faculty_student_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `facultyUserId` VARCHAR(191) NOT NULL,
    `studentUserId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NULL,
    UNIQUE INDEX `faculty_student_assignments_facultyUserId_studentUserId_key`(`facultyUserId`, `studentUserId`),
    INDEX `faculty_student_assignments_institutionId_idx`(`institutionId`),
    INDEX `faculty_student_assignments_studentUserId_idx`(`studentUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_activity_events` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('LOGIN', 'MEDPREP_SESSION_START', 'MEDPREP_SESSION_COMPLETE', 'QBANK_ACTIVITY', 'ASSIGNMENT_OPENED', 'ASSIGNMENT_SUBMITTED', 'MESSAGE_SENT') NOT NULL,
    `summary` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `student_activity_events_institutionId_createdAt_idx`(`institutionId`, `createdAt`),
    INDEX `student_activity_events_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faculty_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `createdByFacultyId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `instructions` TEXT NULL,
    `type` ENUM('MEDPREP_CASE', 'MCQ_SET', 'MIXED') NOT NULL DEFAULT 'MIXED',
    `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `dueAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `faculty_assignments_institutionId_status_idx`(`institutionId`, `status`),
    INDEX `faculty_assignments_createdByFacultyId_idx`(`createdByFacultyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `institution_cases` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `createdByFacultyId` VARCHAR(191) NOT NULL,
    `mode` ENUM('PRACTICE', 'LEARNING', 'EVALUATION', 'SHADOW') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `specialty` VARCHAR(191) NULL,
    `difficulty` VARCHAR(191) NULL DEFAULT 'medium',
    `disease` VARCHAR(191) NOT NULL,
    `diseaseName` VARCHAR(191) NULL,
    `symptoms` JSON NOT NULL,
    `history` JSON NOT NULL,
    `labs` JSON NOT NULL,
    `patientProfile` JSON NOT NULL,
    `learningObjectives` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `institution_cases_institutionId_mode_status_idx`(`institutionId`, `mode`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `institution_question_sets` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `createdByFacultyId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `institution_question_sets_institutionId_idx`(`institutionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `institution_questions` (
    `id` VARCHAR(191) NOT NULL,
    `setId` VARCHAR(191) NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `createdByFacultyId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `explanation` TEXT NULL,
    `choices` JSON NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `tags` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `institution_questions_institutionId_idx`(`institutionId`),
    INDEX `institution_questions_setId_idx`(`setId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faculty_assignment_items` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `itemType` ENUM('CASE', 'MCQ_SET') NOT NULL,
    `medprepMode` ENUM('PRACTICE', 'LEARNING', 'EVALUATION', 'SHADOW') NULL,
    `institutionCaseId` VARCHAR(191) NULL,
    `institutionQuestionSetId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    INDEX `faculty_assignment_items_assignmentId_idx`(`assignmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faculty_assignment_progress` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `studentUserId` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'LATE') NOT NULL DEFAULT 'NOT_STARTED',
    `score` DOUBLE NULL,
    `conversationId` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `faculty_assignment_progress_assignmentId_studentUserId_key`(`assignmentId`, `studentUserId`),
    INDEX `faculty_assignment_progress_studentUserId_idx`(`studentUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faculty_student_threads` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `facultyUserId` VARCHAR(191) NOT NULL,
    `studentUserId` VARCHAR(191) NOT NULL,
    `chatRoomId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `faculty_student_threads_chatRoomId_key`(`chatRoomId`),
    UNIQUE INDEX `fst_inst_fac_stu_uniq`(`institutionId`, `facultyUserId`, `studentUserId`),
    INDEX `faculty_student_threads_facultyUserId_idx`(`facultyUserId`),
    INDEX `faculty_student_threads_studentUserId_idx`(`studentUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `institution_members` ADD CONSTRAINT `institution_members_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `institution_members` ADD CONSTRAINT `institution_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `faculty_profiles` ADD CONSTRAINT `faculty_profiles_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `faculty_profiles` ADD CONSTRAINT `faculty_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `faculty_student_assignments` ADD CONSTRAINT `faculty_student_assignments_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_activity_events` ADD CONSTRAINT `student_activity_events_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_activity_events` ADD CONSTRAINT `student_activity_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `faculty_assignments` ADD CONSTRAINT `faculty_assignments_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `institution_cases` ADD CONSTRAINT `institution_cases_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `institution_question_sets` ADD CONSTRAINT `institution_question_sets_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `institution_questions` ADD CONSTRAINT `institution_questions_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `institution_questions` ADD CONSTRAINT `institution_questions_setId_fkey` FOREIGN KEY (`setId`) REFERENCES `institution_question_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `faculty_assignment_items` ADD CONSTRAINT `faculty_assignment_items_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `faculty_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `faculty_assignment_items` ADD CONSTRAINT `faculty_assignment_items_institutionCaseId_fkey` FOREIGN KEY (`institutionCaseId`) REFERENCES `institution_cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `faculty_assignment_items` ADD CONSTRAINT `faculty_assignment_items_institutionQuestionSetId_fkey` FOREIGN KEY (`institutionQuestionSetId`) REFERENCES `institution_question_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `faculty_assignment_progress` ADD CONSTRAINT `faculty_assignment_progress_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `faculty_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `faculty_assignment_progress` ADD CONSTRAINT `faculty_assignment_progress_studentUserId_fkey` FOREIGN KEY (`studentUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `faculty_student_threads` ADD CONSTRAINT `faculty_student_threads_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `faculty_student_threads` ADD CONSTRAINT `faculty_student_threads_chatRoomId_fkey` FOREIGN KEY (`chatRoomId`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
