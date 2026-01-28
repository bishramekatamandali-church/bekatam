-- Expand comment profile image field to LONGTEXT to support larger uploads
ALTER TABLE `Comment`
  MODIFY `userProfileImageUrl` LONGTEXT NULL;
