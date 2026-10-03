-- Guest checkout has no session, so cancelling a trip item needs a per-trip
-- secret issued at checkout. Additive and nullable: existing trips simply have
-- no token and cannot be cancelled by guests.

SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Trip' AND COLUMN_NAME = 'cancelToken'
);
SET @addSql = IF(@exist = 0, 'ALTER TABLE `Trip` ADD COLUMN `cancelToken` VARCHAR(191) NULL', 'SELECT 1');
PREPARE _add FROM @addSql; EXECUTE _add; DEALLOCATE PREPARE _add;

SET @idxExist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Trip' AND INDEX_NAME = 'Trip_cancelToken_idx'
);
SET @idxSql = IF(@idxExist = 0, 'CREATE INDEX `Trip_cancelToken_idx` ON `Trip`(`cancelToken`)', 'SELECT 1');
PREPARE _idx FROM @idxSql; EXECUTE _idx; DEALLOCATE PREPARE _idx;