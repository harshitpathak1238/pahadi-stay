-- Migration: seasonal pricing (peak / off-season rates) for listings + ride fares.
--
-- Adds two optional price columns to Listing and RideFare, plus a single-row
-- PricingMode table that holds the global "show peak prices" switch and the
-- categories it applies to.
--
-- Every column is NULL by default and every statement is idempotent, so an
-- existing catalogue keeps rendering exactly the sellPrice it did before and
-- the migration is safe to re-run as part of `prisma migrate deploy`.

SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Listing' AND COLUMN_NAME = 'seasonPrice'
);
SET @addSql = IF(@exist = 0, 'ALTER TABLE `Listing` ADD COLUMN `seasonPrice` DECIMAL(10,2) NULL', 'SELECT 1');
PREPARE _add FROM @addSql; EXECUTE _add; DEALLOCATE PREPARE _add;

SET @exist2 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Listing' AND COLUMN_NAME = 'offSeasonPrice'
);
SET @addSql2 = IF(@exist2 = 0, 'ALTER TABLE `Listing` ADD COLUMN `offSeasonPrice` DECIMAL(10,2) NULL', 'SELECT 1');
PREPARE _add2 FROM @addSql2; EXECUTE _add2; DEALLOCATE PREPARE _add2;

SET @exist3 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RideFare' AND COLUMN_NAME = 'seasonPrice'
);
SET @addSql3 = IF(@exist3 = 0, 'ALTER TABLE `RideFare` ADD COLUMN `seasonPrice` DOUBLE NULL', 'SELECT 1');
PREPARE _add3 FROM @addSql3; EXECUTE _add3; DEALLOCATE PREPARE _add3;

SET @exist4 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RideFare' AND COLUMN_NAME = 'offSeasonPrice'
);
SET @addSql4 = IF(@exist4 = 0, 'ALTER TABLE `RideFare` ADD COLUMN `offSeasonPrice` DOUBLE NULL', 'SELECT 1');
PREPARE _add4 FROM @addSql4; EXECUTE _add4; DEALLOCATE PREPARE _add4;

-- CreateTable
CREATE TABLE IF NOT EXISTS `PricingMode` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `peakModeEnabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `activeCategories` JSON NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT 'Peak season',
    `note` TEXT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Guarantee the singleton row exists so reads never have to special-case "no row".
INSERT INTO `PricingMode` (`id`, `peakModeEnabled`, `activeCategories`, `label`, `updatedAt`)
VALUES (1, FALSE, JSON_ARRAY('STAY', 'RIDE', 'RENTAL', 'ACTIVITY'), 'Peak season', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `id` = `id`;