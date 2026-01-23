-- Add location field to sermons
ALTER TABLE `sermon`
  ADD COLUMN `location` VARCHAR(191) NULL;
