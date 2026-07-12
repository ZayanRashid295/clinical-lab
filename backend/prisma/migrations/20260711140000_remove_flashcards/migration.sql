-- Remove flashcards feature entirely

DELETE FROM `bookmarks` WHERE `resourceType` = 'FLASHCARD';
DELETE FROM `study_tasks` WHERE `type` = 'FLASHCARDS';
UPDATE `study_sessions` SET `type` = 'STUDY' WHERE `type` = 'FLASHCARDS';

DELETE FROM `user_achievements`
WHERE `achievementId` IN (
  SELECT `id` FROM `achievements`
  WHERE `metric` = 'FLASHCARDS_REVIEWED' OR `code` IN ('DECK_50', 'DECK_500')
);

DELETE FROM `achievements` WHERE `metric` = 'FLASHCARDS_REVIEWED';
DELETE FROM `achievements` WHERE `code` IN ('DECK_50', 'DECK_500');
DELETE FROM `goal_progress`
WHERE `goalId` IN (SELECT `id` FROM `goals` WHERE `metric` = 'FLASHCARDS_REVIEWED');
DELETE FROM `goals` WHERE `metric` = 'FLASHCARDS_REVIEWED';

DROP TABLE IF EXISTS `flashcard_reviews`;
DROP TABLE IF EXISTS `flashcards`;

ALTER TABLE `bookmarks`
  MODIFY `resourceType` ENUM(
    'QUESTION',
    'NOTE',
    'TOPIC',
    'SUBTOPIC',
    'PRODUCT',
    'MATERIAL'
  ) NOT NULL;

ALTER TABLE `study_tasks`
  MODIFY `type` ENUM(
    'READING',
    'PRACTICE',
    'REVIEW',
    'ASSESSMENT',
    'GENERAL'
  ) NOT NULL DEFAULT 'GENERAL';

ALTER TABLE `study_sessions`
  MODIFY `type` ENUM(
    'STUDY',
    'PRACTICE',
    'ASSESSMENT',
    'REVIEW'
  ) NOT NULL DEFAULT 'STUDY';

ALTER TABLE `achievements`
  MODIFY `metric` ENUM(
    'QUESTIONS_ANSWERED',
    'CORRECT_ANSWERS',
    'TESTS_COMPLETED',
    'NOTES_CREATED',
    'STREAK_DAYS',
    'STUDY_MINUTES',
    'DISCUSSION_POSTS',
    'GOAL_COMPLETED',
    'AI_TUTOR_MESSAGES',
    'STUDY_TASKS_COMPLETED',
    'STUDY_GROUP_POSTS',
    'MEDPREP_CONVERSATIONS',
    'QUESTION_REPORTS_SUBMITTED',
    'FEEDBACK_TICKETS_SUBMITTED',
    'MOCK_EXAMS_COMPLETED',
    'STUDY_GROUPS_JOINED'
  ) NOT NULL;

ALTER TABLE `goals`
  MODIFY `metric` ENUM(
    'QUESTIONS_ANSWERED',
    'CORRECT_ANSWERS',
    'STUDY_MINUTES',
    'NOTES_CREATED',
    'TESTS_COMPLETED'
  ) NOT NULL;
