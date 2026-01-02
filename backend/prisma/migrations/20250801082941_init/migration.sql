-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `role` ENUM('user', 'admin', 'owner') NOT NULL DEFAULT 'user',
    `profileImageUrl` TEXT NULL,
    `coverPhotoUrl` TEXT NULL,
    `bio` TEXT NULL,
    `hometown` VARCHAR(191) NULL,
    `currentCity` VARCHAR(191) NULL,
    `work` VARCHAR(191) NULL,
    `education` VARCHAR(191) NULL,
    `relationshipStatus` ENUM('Single', 'In_a_relationship', 'Engaged', 'Married', 'Its_complicated', 'Separated', 'Divorced', 'Widowed') NULL,
    `interests` TEXT NULL,
    `favoriteScripture` VARCHAR(191) NULL,
    `receiveContentUpdateNotifications` BOOLEAN NOT NULL DEFAULT true,
    `receivePrayerRequestNotifications` BOOLEAN NOT NULL DEFAULT true,
    `receiveTestimonialNotifications` BOOLEAN NOT NULL DEFAULT true,
    `receiveFriendActivityNotifications` BOOLEAN NOT NULL DEFAULT true,
    `friendsListPrivacy` ENUM('public', 'friends', 'private') NOT NULL DEFAULT 'public',
    `profileInSearchPrivacy` BOOLEAN NOT NULL DEFAULT true,
    `friendRequestPrivacy` ENUM('everyone', 'friends_of_friends') NOT NULL DEFAULT 'everyone',
    `groupInvitePrivacy` ENUM('everyone', 'friends') NOT NULL DEFAULT 'everyone',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Friendship` (
    `id` VARCHAR(191) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `addresseeId` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'accepted', 'blocked', 'declined') NOT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Friendship_requesterId_addresseeId_key`(`requesterId`, `addresseeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `groupImageUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `editSettings` ENUM('admins_only', 'all_members') NOT NULL DEFAULT 'admins_only',
    `sendMessage` ENUM('admins_only', 'all_members') NOT NULL DEFAULT 'all_members',
    `addMembers` ENUM('admins_only', 'all_members') NOT NULL DEFAULT 'admins_only',
    `approveMembers` ENUM('admins_only', 'all_members') NOT NULL DEFAULT 'admins_only',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupMember` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'member') NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GroupMember_groupId_userId_key`(`groupId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupMessage` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `senderProfileImageUrl` TEXT NULL,
    `text` TEXT NULL,
    `mediaUrl` TEXT NULL,
    `mediaType` ENUM('image', 'video', 'file', 'location') NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sermon` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `category` ENUM('Sermon_Series', 'Guest_Speaker', 'Topical_Sermon', 'Special_Event_Sermon', 'Bible_Study') NULL,
    `date` DATETIME(3) NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `speaker` VARCHAR(191) NULL,
    `scripture` VARCHAR(191) NULL,
    `videoUrl` TEXT NULL,
    `audioUrl` TEXT NULL,
    `fullContent` TEXT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `category` ENUM('Community_Outreach', 'Conference', 'Workshop', 'Holiday_Service', 'Youth_Event', 'Worship_Night', 'Fellowship', 'Special_Meeting') NULL,
    `date` DATETIME(3) NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `time` VARCHAR(191) NULL,
    `expectations` TEXT NULL,
    `guests` VARCHAR(191) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `registrationLink` TEXT NULL,
    `capacity` INTEGER NULL,
    `isFeeRequired` BOOLEAN NOT NULL DEFAULT false,
    `feeAmount` VARCHAR(191) NULL,
    `videoUrl` TEXT NULL,
    `audioUrl` TEXT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ministry` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `category` ENUM('Youth_Young_Adults', 'Children_Family', 'Men_s_Ministry', 'Women_s_Ministry', 'Worship_Team', 'Outreach_Missions', 'Pastoral_Care') NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `leader` VARCHAR(191) NULL,
    `meetingTime` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `category` ENUM('Church_Life', 'Biblical_Study', 'Devotionals', 'Community_News', 'Testimonies') NULL,
    `date` DATETIME(3) NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `audioUrl` TEXT NULL,
    `mediaUrls` JSON NULL,
    `location` VARCHAR(191) NULL,
    `taggedFriends` VARCHAR(191) NULL,
    `feelingActivity` VARCHAR(191) NULL,
    `backgroundTheme` VARCHAR(191) NULL,
    `videoUrl` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `category` ENUM('Church_Announcements', 'Community_Updates', 'Special_Reports', 'Mission_News', 'Youth_Activities', 'Pastoral_Messages') NULL,
    `date` DATETIME(3) NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `videoUrl` TEXT NULL,
    `audioUrl` TEXT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeSlide` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NOT NULL,
    `ctaText` VARCHAR(191) NOT NULL,
    `linkPath` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AboutSection` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `isCoreSection` BOOLEAN NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KeyPerson` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NULL,
    `bio` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoryMilestone` (
    `id` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoryChapter` (
    `id` VARCHAR(191) NOT NULL,
    `chapterNumber` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('draft', 'published') NOT NULL,
    `imageUrl` TEXT NULL,
    `summary` TEXT NULL,
    `authorId` VARCHAR(191) NULL,
    `authorName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastPublishedAt` DATETIME(3) NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userProfileImageUrl` TEXT NULL,
    `text` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `editedAt` DATETIME(3) NULL,
    `sermonId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,
    `blogPostId` VARCHAR(191) NULL,
    `newsItemId` VARCHAR(191) NULL,
    `historyChapterId` VARCHAR(191) NULL,
    `prayerRequestId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrayerRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NULL,
    `userProfileImageUrl` TEXT NULL,
    `title` VARCHAR(191) NOT NULL,
    `requestText` TEXT NOT NULL,
    `visibility` ENUM('public', 'friends_only', 'private', 'anonymous') NOT NULL,
    `category` ENUM('Healing', 'Guidance', 'Family', 'Thanksgiving', 'Community', 'Personal', 'Other') NULL,
    `status` ENUM('active', 'prayed_for', 'answered', 'archived') NOT NULL DEFAULT 'active',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastPrayedAt` DATETIME(3) NULL,
    `adminNotes` TEXT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `mediaUrls` JSON NULL,
    `location` VARCHAR(191) NULL,
    `taggedFriends` VARCHAR(191) NULL,
    `feelingActivity` VARCHAR(191) NULL,
    `backgroundTheme` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prayer` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prayerRequestId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Prayer_userId_prayerRequestId_key`(`userId`, `prayerRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userProfileImageUrl` TEXT NULL,
    `title` VARCHAR(191) NOT NULL,
    `contentText` TEXT NOT NULL,
    `visibility` ENUM('public', 'friends_only') NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `mediaUrls` JSON NULL,
    `location` VARCHAR(191) NULL,
    `taggedFriends` VARCHAR(191) NULL,
    `feelingActivity` VARCHAR(191) NULL,
    `backgroundTheme` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonatePageContent` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `headerTitle` VARCHAR(191) NOT NULL,
    `headerSubtitle` TEXT NOT NULL,
    `headerImageUrl` TEXT NOT NULL,
    `localDonationsTitle` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `branch` VARCHAR(191) NOT NULL,
    `bankQrImageUrl` TEXT NULL,
    `eSewaId` VARCHAR(191) NOT NULL,
    `eSewaQrImageUrl` TEXT NULL,
    `localDonationsNote` TEXT NOT NULL,
    `internationalDonationsTitle` VARCHAR(191) NOT NULL,
    `internationalDonationsContent` TEXT NOT NULL,
    `internationalDonationsContactEmail` VARCHAR(191) NOT NULL,
    `internationalQrImageUrl` TEXT NULL,
    `receiptVerses` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonationRecord` (
    `id` VARCHAR(191) NOT NULL,
    `donorName` VARCHAR(191) NOT NULL,
    `donorEmail` VARCHAR(191) NOT NULL,
    `donorPhone` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `purpose` ENUM('General_Fund', 'Tithe', 'Worship_Ministry', 'Sunday_School', 'Outreach_Missions', 'Prayer_Ministry', 'Building_Fund_Maintenance', 'Leadership_Support_Pastor', 'Leadership_Support_Elders_Ministry_Leaders', 'Benevolence_Fund') NOT NULL,
    `donationDate` DATETIME(3) NOT NULL,
    `transactionTimestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paymentMethod` ENUM('Cash', 'Cheque', 'Bank_Transfer', 'eSewa', 'Other') NULL,
    `transactionReference` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isReceiptSent` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CollectionRecord` (
    `id` VARCHAR(191) NOT NULL,
    `collectorName` VARCHAR(191) NOT NULL,
    `collectionDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `purpose` ENUM('Tithe', 'General_Offering', 'Saturday_Fellowship_Offering', 'Wednesday_Fellowship_Offering', 'Friday_Program_Offering', 'Building_Fund', 'Mission_Support', 'Youth_Ministry_Support', 'Children_Ministry_Support', 'Women_Ministry_Support', 'Men_Ministry_Support', 'Thanksgiving_Offering', 'Special_Event_Collection', 'Other_Collections') NOT NULL,
    `source` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedByOwnerId` VARCHAR(191) NULL,
    `recordedByOwnerName` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `countedBy` VARCHAR(191) NULL,
    `isDeposited` BOOLEAN NOT NULL DEFAULT false,
    `depositDate` DATETIME(3) NULL,
    `bankDepositReference` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonorDetail` (
    `id` VARCHAR(191) NOT NULL,
    `donorName` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `address` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NULL,
    `collectionRecordId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('pending', 'replied') NOT NULL DEFAULT 'pending',
    `repliedAt` DATETIME(3) NULL,
    `replyNote` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchChurch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `pastorName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `serviceTimes` VARCHAR(191) NOT NULL,
    `mapEmbedUrl` TEXT NULL,
    `imageUrl` TEXT NULL,
    `description` TEXT NULL,
    `establishedDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MinistryJoinRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NOT NULL,
    `ministryId` VARCHAR(191) NOT NULL,
    `ministryName` VARCHAR(191) NOT NULL,
    `ministryGuidelines` TEXT NOT NULL,
    `requestDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `message` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `processedDate` DATETIME(3) NULL,
    `adminNotes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DirectMediaItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `url` TEXT NOT NULL,
    `mediaType` ENUM('image', 'video') NOT NULL,
    `category` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChurchMember` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `memberSince` DATETIME(3) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `baptismDate` DATETIME(3) NULL,
    `familyMembers` TEXT NULL,
    `notes` TEXT NULL,
    `isActiveMember` BOOLEAN NOT NULL,
    `profileImageUrl` TEXT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChurchMember_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingLog` (
    `id` VARCHAR(191) NOT NULL,
    `meetingDate` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `meetingType` ENUM('General_Leaders_Meeting', 'Elders_Meeting', 'Deacons_Meeting', 'General_Choir_Meeting', 'Worship_Team_Practice', 'Programme_Arrange_Meeting', 'Event_Planning_Meeting', 'Helping_Ministry_Meeting', 'Benevolence_Committee', 'Outreach_Planning_Meeting', 'Missions_Update_Meeting', 'Sunday_School_Teachers_Meeting', 'Youth_Leaders_Meeting', 'Men_s_Fellowship_Planning', 'Women_s_Fellowship_Planning', 'Prayer_Meeting', 'Bible_Study_Group', 'Financial_Committee_Meeting', 'Administrative_Meeting', 'Special_General_Meeting', 'Other_Specific_Meeting') NULL,
    `attendees` TEXT NOT NULL,
    `agenda` TEXT NOT NULL,
    `minutes` TEXT NOT NULL,
    `actionItems` TEXT NULL,
    `status` ENUM('Pending_Discussion', 'Agenda_Set', 'In_Progress', 'Completed', 'Decisions_Approved', 'Follow_up_Required', 'Postponed', 'Cancelled') NULL,
    `imageUrl` TEXT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingDecisionPoint` (
    `id` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `proposedBy` VARCHAR(191) NULL,
    `status` ENUM('Proposed', 'Approved', 'Implemented', 'Rejected', 'Follow_up_Required', 'Postponed', 'Cancelled') NOT NULL,
    `followUpNotes` TEXT NULL,
    `resolutionDate` DATETIME(3) NULL,
    `meetingLogId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DecisionLog` (
    `id` VARCHAR(191) NOT NULL,
    `decisionDate` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `madeBy` VARCHAR(191) NOT NULL,
    `status` ENUM('Proposed', 'Approved', 'Implemented', 'Rejected', 'Follow_up_Required', 'Postponed', 'Cancelled') NULL,
    `followUpActions` TEXT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpenseRecord` (
    `id` VARCHAR(191) NOT NULL,
    `expenseDate` DATETIME(3) NOT NULL,
    `category` ENUM('Ministry_Supplies', 'Utilities', 'Outreach_Events', 'Benevolence', 'Salaries_Stipends', 'Building_Maintenance', 'Office_Supplies', 'Travel', 'Bank_Charges', 'IT_Subscriptions', 'Other') NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payee` VARCHAR(191) NULL,
    `paymentMethod` ENUM('Cash', 'Cheque', 'Bank_Transfer', 'eSewa', 'Other') NULL,
    `transactionReference` VARCHAR(191) NULL,
    `receiptUrl` TEXT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `source` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `status` ENUM('paid', 'pending', 'overdue', 'cancelled') NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyThemeImage` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `imageUrls` JSON NOT NULL,
    `quoteOrCaption` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    UNIQUE INDEX `MonthlyThemeImage_year_month_key`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FellowshipRosterItem` (
    `id` VARCHAR(191) NOT NULL,
    `rosterType` ENUM('Saturday_Main_Fellowship', 'Saturday_Children_Fellowship', 'Saturday_Youth_Fellowship', 'Wednesday_Home_Fellowship', 'Friday_Evening_Program', 'Special_Meeting', 'Outreach_Program', 'Other_Regular_Program', 'Prayer_Team_Visit', 'Night_Prayer', 'Saturday_Prayer') NOT NULL,
    `groupNameOrEventTitle` VARCHAR(191) NOT NULL,
    `assignedDate` DATETIME(3) NOT NULL,
    `timeSlot` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `contactNumber` VARCHAR(191) NULL,
    `additionalNotesOrProgramDetails` TEXT NULL,
    `isTemplate` BOOLEAN NOT NULL DEFAULT false,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Responsibility` (
    `id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `assignedTo` VARCHAR(191) NOT NULL,
    `rosterItemId` VARCHAR(191) NULL,
    `generatedScheduleId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedScheduleItem` (
    `id` VARCHAR(191) NOT NULL,
    `basedOnRosterItemId` VARCHAR(191) NULL,
    `rosterType` ENUM('Saturday_Main_Fellowship', 'Saturday_Children_Fellowship', 'Saturday_Youth_Fellowship', 'Wednesday_Home_Fellowship', 'Friday_Evening_Program', 'Special_Meeting', 'Outreach_Program', 'Other_Regular_Program', 'Prayer_Team_Visit', 'Night_Prayer', 'Saturday_Prayer') NOT NULL,
    `groupNameOrEventTitle` VARCHAR(191) NOT NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `timeSlot` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `contactNumber` VARCHAR(191) NULL,
    `additionalNotesOrProgramDetails` TEXT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isPublishedAsEvent` BOOLEAN NOT NULL DEFAULT false,
    `publishedEventId` VARCHAR(191) NULL,
    `adminNotes` TEXT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Advertisement` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `adType` ENUM('image_banner', 'video_banner') NOT NULL,
    `imageUrl` TEXT NULL,
    `videoUrl` TEXT NULL,
    `linkUrl` TEXT NULL,
    `altText` VARCHAR(191) NULL,
    `placements` JSON NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL,
    `displayOrder` INTEGER NULL,
    `adSizeKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `postedByOwnerId` VARCHAR(191) NULL,
    `postedByOwnerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminActionLog` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NOT NULL,
    `adminName` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `details` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FrontendActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NULL,
    `itemType` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `targetUserId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('comment', 'ministry_request_update', 'admin_action', 'event_reminder', 'generic', 'new_content_published', 'schedule_update', 'feature_update', 'prayer_request_submitted_admin', 'prayer_request_status_user', 'prayer_request_prayed_for', 'friend_request_received', 'friend_request_accepted', 'new_prayer_request_friend', 'new_testimonial_friend', 'ad_expiring_soon') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_addresseeId_fkey` FOREIGN KEY (`addresseeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMessage` ADD CONSTRAINT `GroupMessage_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMessage` ADD CONSTRAINT `GroupMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_sermonId_fkey` FOREIGN KEY (`sermonId`) REFERENCES `Sermon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `EventItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_blogPostId_fkey` FOREIGN KEY (`blogPostId`) REFERENCES `BlogPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_newsItemId_fkey` FOREIGN KEY (`newsItemId`) REFERENCES `NewsItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_historyChapterId_fkey` FOREIGN KEY (`historyChapterId`) REFERENCES `HistoryChapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_prayerRequestId_fkey` FOREIGN KEY (`prayerRequestId`) REFERENCES `PrayerRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrayerRequest` ADD CONSTRAINT `PrayerRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prayer` ADD CONSTRAINT `Prayer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prayer` ADD CONSTRAINT `Prayer_prayerRequestId_fkey` FOREIGN KEY (`prayerRequestId`) REFERENCES `PrayerRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonorDetail` ADD CONSTRAINT `DonorDetail_collectionRecordId_fkey` FOREIGN KEY (`collectionRecordId`) REFERENCES `CollectionRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MinistryJoinRequest` ADD CONSTRAINT `MinistryJoinRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MinistryJoinRequest` ADD CONSTRAINT `MinistryJoinRequest_ministryId_fkey` FOREIGN KEY (`ministryId`) REFERENCES `Ministry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChurchMember` ADD CONSTRAINT `ChurchMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingDecisionPoint` ADD CONSTRAINT `MeetingDecisionPoint_meetingLogId_fkey` FOREIGN KEY (`meetingLogId`) REFERENCES `MeetingLog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Responsibility` ADD CONSTRAINT `Responsibility_rosterItemId_fkey` FOREIGN KEY (`rosterItemId`) REFERENCES `FellowshipRosterItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Responsibility` ADD CONSTRAINT `Responsibility_generatedScheduleId_fkey` FOREIGN KEY (`generatedScheduleId`) REFERENCES `GeneratedScheduleItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedScheduleItem` ADD CONSTRAINT `GeneratedScheduleItem_basedOnRosterItemId_fkey` FOREIGN KEY (`basedOnRosterItemId`) REFERENCES `FellowshipRosterItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminActionLog` ADD CONSTRAINT `AdminActionLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FrontendActivityLog` ADD CONSTRAINT `FrontendActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
