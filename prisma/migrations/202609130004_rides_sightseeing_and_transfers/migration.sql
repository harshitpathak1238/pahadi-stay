-- CreateTable
CREATE TABLE `VehicleType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 4,
    `image` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleType_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RideRoute` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` ENUM('SIGHTSEEING', 'TRANSFER') NOT NULL DEFAULT 'SIGHTSEEING',
    `description` LONGTEXT NOT NULL DEFAULT '',
    `fromLocation` VARCHAR(191) NULL,
    `toLocation` VARCHAR(191) NULL,
    `distanceKm` DOUBLE NULL,
    `durationMinutes` INTEGER NULL,
    `images` JSON NOT NULL,
    `status` ENUM('DRAFT', 'LIVE', 'PAUSED') NOT NULL DEFAULT 'DRAFT',
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RideRoute_slug_key`(`slug`),
    INDEX `RideRoute_status_type_order_idx`(`status`, `type`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RideStop` (
    `id` VARCHAR(191) NOT NULL,
    `rideRouteId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `RideStop_rideRouteId_idx`(`rideRouteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RideFare` (
    `id` VARCHAR(191) NOT NULL,
    `rideRouteId` VARCHAR(191) NOT NULL,
    `vehicleTypeId` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,

    INDEX `RideFare_vehicleTypeId_idx`(`vehicleTypeId`),
    UNIQUE INDEX `RideFare_rideRouteId_vehicleTypeId_key`(`rideRouteId`, `vehicleTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RideStop` ADD CONSTRAINT `RideStop_rideRouteId_fkey` FOREIGN KEY (`rideRouteId`) REFERENCES `RideRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RideFare` ADD CONSTRAINT `RideFare_rideRouteId_fkey` FOREIGN KEY (`rideRouteId`) REFERENCES `RideRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RideFare` ADD CONSTRAINT `RideFare_vehicleTypeId_fkey` FOREIGN KEY (`vehicleTypeId`) REFERENCES `VehicleType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;