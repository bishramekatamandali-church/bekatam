-- Add guest comment fields (safe if already exists)

SET @db := DATABASE();

-- guestEmail
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=@db AND TABLE_NAME='comment' AND COLUMN_NAME='guestEmail') = 0,
    'ALTER TABLE `comment` ADD COLUMN `guestEmail` VARCHAR(255) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- guestPhone
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=@db AND TABLE_NAME='comment' AND COLUMN_NAME='guestPhone') = 0,
    'ALTER TABLE `comment` ADD COLUMN `guestPhone` VARCHAR(50) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- isGuest
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=@db AND TABLE_NAME='comment' AND COLUMN_NAME='isGuest') = 0,
    'ALTER TABLE `comment` ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
