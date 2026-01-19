-- Add location field to sermons
ALTER TABLE `Sermon`
  ADD COLUMN `location` VARCHAR(191) NULL;
