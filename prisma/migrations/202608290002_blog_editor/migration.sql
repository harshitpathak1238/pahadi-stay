ALTER TABLE `BlogPost` ADD COLUMN `authorId` VARCHAR(191) NULL,
    ADD COLUMN `scheduledAt` DATETIME(3) NULL;

ALTER TABLE `BlogPost` MODIFY `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

CREATE INDEX `BlogPost_status_scheduledAt_idx` ON `BlogPost`(`status`, `scheduledAt`);
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;