-- Remove legacy owner role and standardize to admin/user only
UPDATE `user` SET `role` = 'admin' WHERE `role` = 'owner';

ALTER TABLE `user`
  MODIFY COLUMN `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user';

