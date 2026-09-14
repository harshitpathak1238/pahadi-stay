-- Migration: add accommodations JSON column to Listing (MariaDB / Hostinger).
-- Stores the admin-curated "Private Spaces" entries (title, description, image,
-- bedrooms, beds) per stay. New rows default to an empty array.
-- Fully idempotent: safe to run as part of `prisma migrate deploy` even when the
-- column already exists (uses PREPARE so the ADD COLUMN is skipped, not errored).

SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Listing'
    AND COLUMN_NAME = 'accommodations'
);
SET @addSql = IF(@exist = 0, 'ALTER TABLE `Listing` ADD COLUMN `accommodations` JSON NOT NULL DEFAULT ''[]''', 'SELECT 1');
PREPARE _add FROM @addSql;
EXECUTE _add;
DEALLOCATE PREPARE _add;
