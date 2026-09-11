-- Widen description columns to LONGTEXT so admin-entered full HTML documents (with embedded <style> CSS) fit.
-- VARCHAR(191) rejected or truncated long HTML, which broke rendering on /packages and /packages/[slug].
ALTER TABLE `Package` MODIFY `description` LONGTEXT NOT NULL;
ALTER TABLE `Listing` MODIFY `description` LONGTEXT NOT NULL;
