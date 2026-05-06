-- AlterTable
ALTER TABLE `notification_logs` MODIFY `type` ENUM('RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_CANCELLED', 'RIDE_COMPLETED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROMO_CODE', 'SECURITY_ALERT', 'SYSTEM_UPDATE', 'GENERAL', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'STUDY_REMINDER', 'GOAL_PROGRESS', 'GOAL_COMPLETED', 'DISCUSSION_REPLY', 'STUDY_GROUP_POST', 'FEEDBACK_REPLY', 'QUESTION_REPORT_UPDATE', 'MOCK_EXAM_RESULT') NOT NULL;

-- AlterTable
ALTER TABLE `notification_queue` MODIFY `type` ENUM('RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_CANCELLED', 'RIDE_COMPLETED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROMO_CODE', 'SECURITY_ALERT', 'SYSTEM_UPDATE', 'GENERAL', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'STUDY_REMINDER', 'GOAL_PROGRESS', 'GOAL_COMPLETED', 'DISCUSSION_REPLY', 'STUDY_GROUP_POST', 'FEEDBACK_REPLY', 'QUESTION_REPORT_UPDATE', 'MOCK_EXAM_RESULT') NOT NULL;

-- AlterTable
ALTER TABLE `notification_templates` MODIFY `type` ENUM('RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_CANCELLED', 'RIDE_COMPLETED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROMO_CODE', 'SECURITY_ALERT', 'SYSTEM_UPDATE', 'GENERAL', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'STUDY_REMINDER', 'GOAL_PROGRESS', 'GOAL_COMPLETED', 'DISCUSSION_REPLY', 'STUDY_GROUP_POST', 'FEEDBACK_REPLY', 'QUESTION_REPORT_UPDATE', 'MOCK_EXAM_RESULT') NOT NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_CANCELLED', 'RIDE_COMPLETED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROMO_CODE', 'SECURITY_ALERT', 'SYSTEM_UPDATE', 'GENERAL', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'STUDY_REMINDER', 'GOAL_PROGRESS', 'GOAL_COMPLETED', 'DISCUSSION_REPLY', 'STUDY_GROUP_POST', 'FEEDBACK_REPLY', 'QUESTION_REPORT_UPDATE', 'MOCK_EXAM_RESULT') NOT NULL;

-- CreateTable
CREATE TABLE `achievements` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('STUDY', 'STREAK', 'PROGRESS', 'COMMUNITY', 'MASTERY', 'MILESTONE') NOT NULL DEFAULT 'STUDY',
    `icon` VARCHAR(191) NOT NULL DEFAULT 'trophy',
    `points` INTEGER NOT NULL DEFAULT 10,
    `threshold` INTEGER NOT NULL DEFAULT 1,
    `metric` ENUM('QUESTIONS_ANSWERED', 'CORRECT_ANSWERS', 'TESTS_COMPLETED', 'FLASHCARDS_REVIEWED', 'NOTES_CREATED', 'STREAK_DAYS', 'STUDY_MINUTES', 'DISCUSSION_POSTS', 'GOAL_COMPLETED') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `achievements_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `progress` INTEGER NOT NULL DEFAULT 0,

    INDEX `user_achievements_userId_idx`(`userId`),
    UNIQUE INDEX `user_achievements_userId_achievementId_key`(`userId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_streaks` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `currentStreak` INTEGER NOT NULL DEFAULT 0,
    `longestStreak` INTEGER NOT NULL DEFAULT 0,
    `lastActiveDate` DATETIME(3) NULL,
    `freezeTokens` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_streaks_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_points` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_points_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `points_ledger` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `points_ledger_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_tutor_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'New conversation',
    `context` ENUM('GENERAL', 'QUESTION', 'TOPIC', 'SYSTEM', 'PRODUCT', 'STUDY_PLAN') NOT NULL DEFAULT 'GENERAL',
    `contextId` VARCHAR(191) NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ai_tutor_conversations_userId_lastMessageAt_idx`(`userId`, `lastMessageAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_tutor_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    `content` TEXT NOT NULL,
    `tokensIn` INTEGER NULL,
    `tokensOut` INTEGER NULL,
    `model` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_tutor_messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discussions` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `context` ENUM('GENERAL', 'QUESTION', 'TOPIC', 'SYSTEM', 'PRODUCT') NOT NULL DEFAULT 'GENERAL',
    `questionId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `systemId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `replyCount` INTEGER NOT NULL DEFAULT 0,
    `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `discussions_context_idx`(`context`),
    INDEX `discussions_questionId_idx`(`questionId`),
    INDEX `discussions_authorId_createdAt_idx`(`authorId`, `createdAt`),
    INDEX `discussions_lastActivityAt_idx`(`lastActivityAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discussion_replies` (
    `id` VARCHAR(191) NOT NULL,
    `discussionId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `isAnswer` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `discussion_replies_discussionId_createdAt_idx`(`discussionId`, `createdAt`),
    INDEX `discussion_replies_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discussion_votes` (
    `id` VARCHAR(191) NOT NULL,
    `discussionId` VARCHAR(191) NULL,
    `replyId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `vote` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `discussion_votes_discussionId_idx`(`discussionId`),
    INDEX `discussion_votes_replyId_idx`(`replyId`),
    UNIQUE INDEX `discussion_votes_userId_discussionId_replyId_key`(`userId`, `discussionId`, `replyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `category` ENUM('GENERAL', 'BUG', 'FEATURE_REQUEST', 'CONTENT', 'BILLING', 'ACCOUNT') NOT NULL DEFAULT 'GENERAL',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `attachmentUrl` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NULL,
    `closedAt` DATETIME(3) NULL,
    `lastReplyAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `feedback_tickets_userId_status_idx`(`userId`, `status`),
    INDEX `feedback_tickets_status_lastReplyAt_idx`(`status`, `lastReplyAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_replies` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `isStaff` BOOLEAN NOT NULL DEFAULT false,
    `body` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedback_replies_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goals` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `metric` ENUM('QUESTIONS_ANSWERED', 'CORRECT_ANSWERS', 'STUDY_MINUTES', 'FLASHCARDS_REVIEWED', 'NOTES_CREATED', 'TESTS_COMPLETED') NOT NULL,
    `target` INTEGER NOT NULL,
    `period` ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'DAILY',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `reminderEnabled` BOOLEAN NOT NULL DEFAULT true,
    `reminderHour` INTEGER NOT NULL DEFAULT 18,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `goals_userId_isActive_idx`(`userId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goal_progress` (
    `id` VARCHAR(191) NOT NULL,
    `goalId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bucket` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `achieved` BOOLEAN NOT NULL DEFAULT false,
    `achievedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `goal_progress_userId_bucket_idx`(`userId`, `bucket`),
    UNIQUE INDEX `goal_progress_goalId_bucket_key`(`goalId`, `bucket`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mock_exams` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `totalQuestions` INTEGER NOT NULL DEFAULT 40,
    `durationMinutes` INTEGER NOT NULL DEFAULT 60,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'mixed',
    `productId` VARCHAR(191) NULL,
    `systemIds` JSON NULL,
    `topicIds` JSON NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mock_exams_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mock_exam_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `mockExamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionPaperId` VARCHAR(191) NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `totalQuestions` INTEGER NOT NULL DEFAULT 0,
    `correctAnswers` INTEGER NOT NULL DEFAULT 0,
    `scorePercent` DOUBLE NOT NULL DEFAULT 0,
    `timeSpentSeconds` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `mock_exam_attempts_questionPaperId_key`(`questionPaperId`),
    INDEX `mock_exam_attempts_userId_startedAt_idx`(`userId`, `startedAt`),
    INDEX `mock_exam_attempts_mockExamId_idx`(`mockExamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_reports` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reason` ENUM('INCORRECT_ANSWER', 'TYPO', 'UNCLEAR', 'OUTDATED', 'DUPLICATE', 'OFFENSIVE', 'OTHER') NOT NULL,
    `details` TEXT NULL,
    `status` ENUM('OPEN', 'TRIAGED', 'ACCEPTED', 'REJECTED', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `resolverId` VARCHAR(191) NULL,
    `resolution` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `question_reports_questionId_idx`(`questionId`),
    INDEX `question_reports_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `question_reports_reporterId_idx`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `icon` VARCHAR(191) NOT NULL DEFAULT 'users',
    `color` VARCHAR(191) NOT NULL DEFAULT 'emerald',
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `inviteCode` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `chatRoomId` VARCHAR(191) NULL,
    `memberCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `study_groups_inviteCode_key`(`inviteCode`),
    INDEX `study_groups_category_idx`(`category`),
    INDEX `study_groups_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_group_members` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `study_group_members_userId_idx`(`userId`),
    UNIQUE INDEX `study_group_members_groupId_userId_key`(`groupId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_group_posts` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `study_group_posts_groupId_createdAt_idx`(`groupId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
