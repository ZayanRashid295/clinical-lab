/*
  Warnings:

  - You are about to drop the column `chapterId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `productTagId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `system` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `chapterId` on the `topics` table. All the data in the column will be lost.
  - You are about to drop the `_ProductToProductTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chapters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sections` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[systemId,name]` on the table `topics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subtopicId` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemId` to the `topics` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `topics_chapterId_name_key` ON `topics`;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `questions` DROP COLUMN `chapterId`,
    DROP COLUMN `productTagId`,
    DROP COLUMN `sectionId`,
    DROP COLUMN `subject`,
    DROP COLUMN `system`,
    ADD COLUMN `subtopicId` VARCHAR(191) NOT NULL,
    ADD COLUMN `systemId` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(500) NULL,
    MODIFY `topicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `topics` DROP COLUMN `chapterId`,
    ADD COLUMN `systemId` VARCHAR(191) NOT NULL,
    MODIFY `name` VARCHAR(500) NOT NULL;

-- DropTable
DROP TABLE `_ProductToProductTag`;

-- DropTable
DROP TABLE `chapters`;

-- DropTable
DROP TABLE `product_tags`;

-- DropTable
DROP TABLE `sections`;

-- CreateTable
CREATE TABLE `subtopics` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subtopics_topicId_name_key`(`topicId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `systems` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `description` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `systems_productId_name_key`(`productId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `topics_systemId_name_key` ON `topics`(`systemId`, `name`);
