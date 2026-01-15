-- Make comments support guest users
ALTER TABLE `Comment`
  MODIFY `userId` VARCHAR(191) NULL,
  ADD COLUMN `guestEmail` VARCHAR(191) NULL,
  ADD COLUMN `guestPhone` VARCHAR(191) NULL,
  ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT false;

-- Create ContentLike table to store real likes per user/guest
CREATE TABLE `ContentLike` (
  `id` VARCHAR(191) NOT NULL,
  `itemType` VARCHAR(191) NOT NULL,
  `itemId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `guestName` VARCHAR(191) NULL,
  `guestEmail` VARCHAR(191) NULL,
  `guestPhone` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ContentLike_user_unique` (`userId`, `itemType`, `itemId`),
  UNIQUE KEY `ContentLike_guest_unique` (`guestEmail`, `itemType`, `itemId`),
  KEY `ContentLike_itemType_itemId_idx` (`itemType`, `itemId`),
  KEY `ContentLike_userId_fkey` (`userId`),
  CONSTRAINT `ContentLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
