-- AlterTable
ALTER TABLE `questions`
    ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `productId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `questions_categoryId_idx` ON `questions`(`categoryId`);

-- CreateIndex
CREATE INDEX `questions_productId_idx` ON `questions`(`productId`);

-- AddForeignKey
ALTER TABLE `questions`
    ADD CONSTRAINT `questions_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions`
    ADD CONSTRAINT `questions_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `products`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
