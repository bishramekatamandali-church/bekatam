ALTER TABLE `MinistryJoinRequest`
  ADD COLUMN `processedByAdminId` VARCHAR(191) NULL,
  ADD COLUMN `processedByAdminName` VARCHAR(191) NULL;

CREATE TABLE `MinistryMember` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `ministryId` VARCHAR(191) NULL,
  `ministryName` VARCHAR(191) NOT NULL,
  `membershipType` VARCHAR(191) NOT NULL,
  `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `MinistryMember_userId_fkey` (`userId`),
  INDEX `MinistryMember_ministryId_fkey` (`ministryId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MinistryMemberHistory` (
  `id` VARCHAR(191) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `memberId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `ministryId` VARCHAR(191) NULL,
  `ministryName` VARCHAR(191) NOT NULL,
  `previousMinistryId` VARCHAR(191) NULL,
  `previousMinistryName` VARCHAR(191) NULL,
  `action` ENUM('created', 'updated', 'moved', 'deleted') NOT NULL,
  `details` TEXT NULL,
  `performedByAdminId` VARCHAR(191) NULL,
  `performedByAdminName` VARCHAR(191) NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MinistryJoinRequestHistory` (
  `id` VARCHAR(191) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `requestId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `userName` VARCHAR(191) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `ministryId` VARCHAR(191) NULL,
  `ministryName` VARCHAR(191) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL,
  `action` ENUM('submitted', 'status_updated') NOT NULL,
  `adminNotes` TEXT NULL,
  `performedByAdminId` VARCHAR(191) NULL,
  `performedByAdminName` VARCHAR(191) NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MinistryMember`
  ADD CONSTRAINT `MinistryMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `MinistryMember_ministryId_fkey` FOREIGN KEY (`ministryId`) REFERENCES `Ministry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
