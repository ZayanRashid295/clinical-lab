-- Remove My Notes, Goals, and related achievement metrics

DELETE FROM `bookmarks` WHERE `resourceType` = 'NOTE';

DELETE FROM `user_achievements`
WHERE `achievementId` IN (
  SELECT `id` FROM `achievements`
  WHERE `metric` IN ('NOTES_CREATED', 'GOAL_COMPLETED')
    OR `code` IN ('NOTE_TAKER', 'GOAL_GETTER')
);

DELETE FROM `achievements`
WHERE `metric` IN ('NOTES_CREATED', 'GOAL_COMPLETED')
   OR `code` IN ('NOTE_TAKER', 'GOAL_GETTER');

DROP TABLE IF EXISTS `goal_progress`;
DROP TABLE IF EXISTS `goals`;
DROP TABLE IF EXISTS `student_notes`;

ALTER TABLE `bookmarks`
  MODIFY `resourceType` ENUM(
    'QUESTION',
    'TOPIC',
    'SUBTOPIC',
    'PRODUCT',
    'MATERIAL'
  ) NOT NULL;

ALTER TABLE `achievements`
  MODIFY `metric` ENUM(
    'QUESTIONS_ANSWERED',
    'CORRECT_ANSWERS',
    'TESTS_COMPLETED',
    'STREAK_DAYS',
    'STUDY_MINUTES',
    'DISCUSSION_POSTS',
    'AI_TUTOR_MESSAGES',
    'STUDY_TASKS_COMPLETED',
    'STUDY_GROUP_POSTS',
    'MEDPREP_CONVERSATIONS',
    'QUESTION_REPORTS_SUBMITTED',
    'FEEDBACK_TICKETS_SUBMITTED',
    'MOCK_EXAMS_COMPLETED',
    'STUDY_GROUPS_JOINED'
  ) NOT NULL;
