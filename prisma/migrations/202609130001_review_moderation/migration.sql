-- Dynamic guest reviews: moderation queue, per-category scores, verified flag.
-- Extends the legacy Review table (listingId/userId/rating/comment) without
-- dropping existing rows: new columns are nullable or have defaults, and the
-- legacy columns stay until a follow-up cleanup migration.
ALTER TABLE `Review`
    ADD COLUMN `bookingId` VARCHAR(191) NULL,
    ADD COLUMN `guestName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `guestEmail` VARCHAR(191) NULL,
    ADD COLUMN `overallRating` DOUBLE NOT NULL DEFAULT 5,
    ADD COLUMN `staff` DOUBLE NULL,
    ADD COLUMN `facilities` DOUBLE NULL,
    ADD COLUMN `cleanliness` DOUBLE NULL,
    ADD COLUMN `comfort` DOUBLE NULL,
    ADD COLUMN `valueForMoney` DOUBLE NULL,
    ADD COLUMN `location` DOUBLE NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    MODIFY `userId` VARCHAR(191) NULL,
    MODIFY `rating` INTEGER NULL,
    MODIFY `comment` TEXT NOT NULL;

-- Backfill: legacy rows become approved reviews so existing content survives.
UPDATE `Review` SET `status` = 'APPROVED' WHERE `status` = 'PENDING';
UPDATE `Review` SET `overallRating` = `rating` WHERE `overallRating` = 5 AND `rating` IS NOT NULL;
UPDATE `Review` SET `guestName` = 'Guest' WHERE `guestName` = '';

CREATE INDEX `Review_listingId_status_idx` ON `Review`(`listingId`, `status`);
CREATE INDEX `Review_status_createdAt_idx` ON `Review`(`status`, `createdAt`);
ALTER TABLE `Review` ADD CONSTRAINT `Review_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
