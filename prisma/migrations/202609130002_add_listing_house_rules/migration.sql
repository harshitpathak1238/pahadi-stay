-- Migration: add houseRules JSON column to Listing (MariaDB / Hostinger).
-- New rows default to an empty array; existing rows are backfilled below.
-- Fully idempotent: safe to run as part of `prisma migrate deploy` even when the
-- column already exists (uses PREPARE so the ADD COLUMN is skipped, not errored).
-- NOTE: Prisma's $executeRaw uses a prepared-statement protocol that rejects PREPARE
-- on this host, so direct application should use prisma/house-rules-backfill.sql
-- (plain ALTER + UPDATE) instead. This file is for `prisma migrate deploy` / dev.

-- 1) Add the column if it does not yet exist (idempotent via dynamic SQL).
SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Listing'
    AND COLUMN_NAME = 'houseRules'
);
SET @addSql = CONCAT('ALTER TABLE `Listing` ADD COLUMN `houseRules` JSON NOT NULL DEFAULT ''[]''');
PREPARE _add FROM @addSql;
EXECUTE _add;
DEALLOCATE PREPARE _add;

-- 2) Backfill: apply the standard house-rules template to every row that doesn't
-- already have a customised set. Idempotent — safe to re-run.
UPDATE `Listing`
SET `houseRules` = '[
  {"title": "Check-in & check-out", "text": "Check-in from 14:00. Check-out by 11:00."},
  {"title": "Pets", "text": "No pets allowed."},
  {"title": "Parties & events", "text": "No parties or events."},
  {"title": "Smoking", "text": "No smoking indoors."},
  {"title": "Quiet hours", "text": "Quiet hours between 22:00 and 07:00."},
  {"title": "Extra guests", "text": "Guests may not bring extra people without prior approval."}
]'
WHERE COALESCE(`houseRules`, '') = '[]'
   OR `houseRules` IS NULL;
