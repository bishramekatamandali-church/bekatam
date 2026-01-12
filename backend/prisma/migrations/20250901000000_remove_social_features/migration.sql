-- Drop social columns
ALTER TABLE `User`
  DROP COLUMN `receiveFriendActivityNotifications`,
  DROP COLUMN `friendsListPrivacy`,
  DROP COLUMN `friendRequestPrivacy`,
  DROP COLUMN `groupInvitePrivacy`;

ALTER TABLE `BlogPost`
  DROP COLUMN `taggedFriends`,
  DROP COLUMN `feelingActivity`,
  DROP COLUMN `backgroundTheme`;

ALTER TABLE `PrayerRequest`
  DROP COLUMN `taggedFriends`,
  DROP COLUMN `feelingActivity`,
  DROP COLUMN `backgroundTheme`;

ALTER TABLE `Testimonial`
  DROP COLUMN `taggedFriends`,
  DROP COLUMN `feelingActivity`,
  DROP COLUMN `backgroundTheme`;

-- Drop friendship/group messaging tables
ALTER TABLE `Friendship` DROP FOREIGN KEY `Friendship_requesterId_fkey`;
ALTER TABLE `Friendship` DROP FOREIGN KEY `Friendship_addresseeId_fkey`;
ALTER TABLE `GroupMember` DROP FOREIGN KEY `GroupMember_groupId_fkey`;
ALTER TABLE `GroupMember` DROP FOREIGN KEY `GroupMember_userId_fkey`;
ALTER TABLE `GroupMessage` DROP FOREIGN KEY `GroupMessage_groupId_fkey`;
ALTER TABLE `GroupMessage` DROP FOREIGN KEY `GroupMessage_senderId_fkey`;

DROP TABLE `GroupMessage`;
DROP TABLE `GroupMember`;
DROP TABLE `Group`;
DROP TABLE `Friendship`;

