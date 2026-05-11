-- AlterTable
ALTER TABLE `user_settings` ADD COLUMN `uiColorScheme` VARCHAR(191) NOT NULL DEFAULT 'emerald',
    ADD COLUMN `uiFontSize` VARCHAR(191) NOT NULL DEFAULT 'medium',
    ADD COLUMN `uiMenuLayout` VARCHAR(191) NOT NULL DEFAULT 'vertical',
    ADD COLUMN `uiMenuStyle` VARCHAR(191) NOT NULL DEFAULT 'sidebar',
    ADD COLUMN `uiTheme` VARCHAR(191) NOT NULL DEFAULT 'light',
    ADD COLUMN `uiTypographyPreset` VARCHAR(191) NOT NULL DEFAULT 'system';
