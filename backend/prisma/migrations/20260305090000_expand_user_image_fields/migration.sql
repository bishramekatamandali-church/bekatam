-- Expand user image fields to LONGTEXT to support larger uploads
ALTER TABLE `User`
  MODIFY `profileImageUrl` LONGTEXT NULL,
  MODIFY `coverPhotoUrl` LONGTEXT NULL;
