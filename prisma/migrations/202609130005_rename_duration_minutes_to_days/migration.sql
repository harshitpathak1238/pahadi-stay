-- Rename durationMinutes to durationDays in RideRoute table
ALTER TABLE `RideRoute` CHANGE COLUMN `durationMinutes` `durationDays` INT NULL;

