-- Expand comment profile image field to LONGTEXT to support larger uploads
ALTER TABLE `comment`
  MODIFY `userProfileImageUrl` LONGTEXT NULL;
