-- Create ContentLike table (idempotent)
CREATE TABLE IF NOT EXISTS `contentlike` (
  `id` VARCHAR(191) NOT NULL,
  `itemType` VARCHAR(191) NOT NULL,
  `itemId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `guestName` VARCHAR(191) NULL,
  `guestEmail` VARCHAR(255) NULL,
  `guestPhone` VARCHAR(50) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_contentlike_item` (`itemType`, `itemId`),
  INDEX `idx_contentlike_user` (`userId`),
  UNIQUE KEY `uq_contentlike_user` (`itemType`, `itemId`, `userId`),
  UNIQUE KEY `uq_contentlike_guestEmail` (`itemType`, `itemId`, `guestEmail`),
  UNIQUE KEY `uq_contentlike_guestPhone` (`itemType`, `itemId`, `guestPhone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
