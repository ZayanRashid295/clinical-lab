-- Make subtopic optional on questions
ALTER TABLE `questions` MODIFY `subtopicId` VARCHAR(191) NULL;

-- Drop existing foreign key (name may vary; use safe approach)
SET @fk_name := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'questions'
    AND COLUMN_NAME = 'subtopicId'
    AND REFERENCED_TABLE_NAME = 'subtopics'
  LIMIT 1
);

SET @drop_fk := IF(
  @fk_name IS NOT NULL,
  CONCAT('ALTER TABLE `questions` DROP FOREIGN KEY `', @fk_name, '`'),
  'SELECT 1'
);
PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `questions`
  ADD CONSTRAINT `questions_subtopicId_fkey`
  FOREIGN KEY (`subtopicId`) REFERENCES `subtopics`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
