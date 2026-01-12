-- Remove legacy owner role and standardize to admin/user only
UPDATE `User` SET `role` = 'admin' WHERE `role` = 'owner';

ALTER TABLE `User`
  MODIFY COLUMN `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user';

