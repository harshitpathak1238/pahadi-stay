-- Migration: per-user wishlist for stays (MariaDB / Hostinger).
-- A user saves listing slugs; unique per (user, slug). Rows cascade away when
-- the user account is deleted. Fully idempotent for `prisma migrate deploy`.

-- 1) Table (CREATE TABLE IF NOT EXISTS is idempotent).
CREATE TABLE IF NOT EXISTS `WishlistItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `WishlistItem_userId_slug_key`(`userId`, `slug`),
    INDEX `WishlistItem_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2) Foreign key (added only when missing, via dynamic SQL).
SET @fkExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'WishlistItem'
    AND CONSTRAINT_NAME = 'WishlistItem_userId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @fkSql = IF(@fkExists = 0, 'ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE _fk FROM @fkSql;
EXECUTE _fk;
DEALLOCATE PREPARE _fk;
