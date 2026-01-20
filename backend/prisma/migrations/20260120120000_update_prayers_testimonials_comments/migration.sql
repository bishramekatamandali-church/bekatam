-- Allow guest prayers and track unique guest identities
ALTER TABLE `prayer`
    MODIFY `userId` VARCHAR(191) NULL,
    ADD COLUMN `guestEmail` VARCHAR(191) NULL,
    ADD COLUMN `guestPhone` VARCHAR(191) NULL,
    ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `prayer_guestEmail_prayerRequestId_key` ON `prayer`(`guestEmail`, `prayerRequestId`);
CREATE UNIQUE INDEX `prayer_guestPhone_prayerRequestId_key` ON `prayer`(`guestPhone`, `prayerRequestId`);

-- Allow comments on testimonials
ALTER TABLE `comment`
    ADD COLUMN `testimonialId` VARCHAR(191) NULL;

CREATE INDEX `comment_testimonialId_fkey` ON `comment`(`testimonialId`);

ALTER TABLE `comment`
    ADD CONSTRAINT `comment_testimonialId_fkey`
    FOREIGN KEY (`testimonialId`) REFERENCES `testimonial`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add likes to testimonials
ALTER TABLE `testimonial`
    ADD COLUMN `likes` INT NOT NULL DEFAULT 0;
