-- AlterTable
ALTER TABLE `medprep_conversations`
  ADD COLUMN `mode` ENUM('PRACTICE', 'LEARNING', 'EVALUATION') NOT NULL DEFAULT 'PRACTICE',
  ADD COLUMN `title` VARCHAR(191) NULL,
  ADD COLUMN `isGeneratedCase` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `score` DOUBLE NULL;

-- CreateIndex
CREATE INDEX `medprep_conversations_userId_status_updatedAt_idx`
  ON `medprep_conversations`(`userId`, `status`, `updatedAt`);

-- CreateIndex
CREATE INDEX `medprep_conversations_userId_mode_status_idx`
  ON `medprep_conversations`(`userId`, `mode`, `status`);
