-- MedPrep: add SHADOW mode for shadow-mode / AI doctor observation sessions
ALTER TABLE `medprep_conversations`
  MODIFY COLUMN `mode` ENUM('PRACTICE', 'LEARNING', 'EVALUATION', 'SHADOW') NOT NULL;
