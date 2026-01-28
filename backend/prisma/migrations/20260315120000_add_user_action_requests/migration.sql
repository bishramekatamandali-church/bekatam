-- Add account status fields to user
ALTER TABLE `user`
  ADD COLUMN `accountStatus` ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
  ADD COLUMN `blockedAt` DATETIME NULL,
  ADD COLUMN `deletedAt` DATETIME NULL;

-- Create user action request table
CREATE TABLE `useractionrequest` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `actionType` ENUM('block', 'delete', 'unblock') NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `requestedByAdminId` VARCHAR(191) NOT NULL,
  `requestedByAdminName` VARCHAR(191) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processedAt` DATETIME NULL,
  `processedByAdminId` VARCHAR(191) NULL,
  INDEX `UserActionRequest_userId_idx` (`userId`),
  INDEX `UserActionRequest_requestedByAdminId_idx` (`requestedByAdminId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `UserActionRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `UserActionRequest_requestedByAdminId_fkey` FOREIGN KEY (`requestedByAdminId`) REFERENCES `user`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create approvals table
CREATE TABLE `useractionapproval` (
  `id` VARCHAR(191) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `adminId` VARCHAR(191) NOT NULL,
  `adminName` VARCHAR(191) NULL,
  `approvedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `UserActionApproval_requestId_adminId_key` (`requestId`, `adminId`),
  INDEX `UserActionApproval_adminId_idx` (`adminId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `UserActionApproval_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `useractionrequest`(`id`) ON DELETE CASCADE,
  CONSTRAINT `UserActionApproval_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
