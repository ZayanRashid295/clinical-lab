-- Demo questions: marketing-only flag + pack slug (admin-managed)
ALTER TABLE `questions` ADD COLUMN `isDemo` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `questions` ADD COLUMN `demoPack` VARCHAR(80) NULL;
CREATE INDEX `questions_isDemo_isActive_idx` ON `questions`(`isDemo`, `isActive`);
CREATE INDEX `questions_isDemo_demoPack_idx` ON `questions`(`isDemo`, `demoPack`);

CREATE TABLE IF NOT EXISTS `marketing_demo_leads` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `firstName` VARCHAR(120) NOT NULL,
  `lastName` VARCHAR(120) NOT NULL,
  `graduatingYear` VARCHAR(40) NULL,
  `country` VARCHAR(120) NULL,
  `pack` VARCHAR(80) NOT NULL,
  `ipHash` VARCHAR(64) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `marketing_demo_leads_email_pack_idx` (`email`, `pack`),
  INDEX `marketing_demo_leads_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
