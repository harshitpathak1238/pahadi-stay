-- Migration: add fullyBooked flag to Listing (MariaDB / Hostinger).
-- When true, the stay renders greyed-out on /stays with a "Fully booked"
-- badge, and Reserve / Add-to-trip actions are disabled.
-- Fully idempotent: safe to run as part of `prisma migrate deploy` even when
-- the column already exists (uses PREPARE so the ADD COLUMN is skipped, not errored).

SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Listing'
    AND COLUMN_NAME = 'fullyBooked'
);
SET @addSql = IF(@exist = 0, 'ALTER TABLE `Listing` ADD COLUMN `fullyBooked` BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1');
PREPARE _add FROM @addSql;
EXECUTE _add;
DEALLOCATE PREPARE _add;

SET @idxExist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Listing'
    AND INDEX_NAME = 'Listing_fullyBooked_idx'
);
SET @idxSql = IF(@idxExist = 0, 'CREATE INDEX `Listing_fullyBooked_idx` ON `Listing`(`fullyBooked`)', 'SELECT 1');
PREPARE _idx FROM @idxSql;
EXECUTE _idx;
DEALLOCATE PREPARE _idx;
