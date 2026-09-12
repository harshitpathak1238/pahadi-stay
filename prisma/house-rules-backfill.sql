-- Migration: add houseRules JSON column to Listing (MariaDB/Hostinger).
-- New rows default to an empty array; existing rows are backfilled below.
-- Run order: 1) ADD COLUMN (idempotent — ignored if it already exists),
--            2) backfill template into rows without a custom set.

-- 1) Add column. MariaDB has no ADD COLUMN IF NOT EXISTS, so this errors if the
-- column is already present — the apply script ignores that error.
ALTER TABLE `Listing` ADD COLUMN `houseRules` JSON NOT NULL DEFAULT '[]';

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
