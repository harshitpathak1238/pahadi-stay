ALTER TABLE `Listing`
  ADD COLUMN `mealPlan` VARCHAR(191) NULL,
  ADD COLUMN `breakfastIncluded` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `cuisineNotes` TEXT NULL;

CREATE TABLE `ListingLandmark` (
  `id` VARCHAR(191) NOT NULL,
  `listingId` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `distanceKm` DOUBLE NOT NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ListingLandmark_listingId_idx` ON `ListingLandmark`(`listingId`);

ALTER TABLE `ListingLandmark`
  ADD CONSTRAINT `ListingLandmark_listingId_fkey`
  FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `ListingService` (
  `id` VARCHAR(191) NOT NULL,
  `listingId` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `note` VARCHAR(191) NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ListingService_listingId_idx` ON `ListingService`(`listingId`);

ALTER TABLE `ListingService`
  ADD CONSTRAINT `ListingService_listingId_fkey`
  FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `ListingExperience` (
  `id` VARCHAR(191) NOT NULL,
  `listingId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `note` VARCHAR(191) NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ListingExperience_listingId_idx` ON `ListingExperience`(`listingId`);

ALTER TABLE `ListingExperience`
  ADD CONSTRAINT `ListingExperience_listingId_fkey`
  FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
