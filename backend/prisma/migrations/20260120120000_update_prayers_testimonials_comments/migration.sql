-- Allow guest prayers and track unique guest identities
ALTER TABLE `Prayer`
    MODIFY `userId` VARCHAR(191) NULL,
    ADD COLUMN `guestEmail` VARCHAR(191) NULL,
    ADD COLUMN `guestPhone` VARCHAR(191) NULL,
    ADD COLUMN `isGuest` BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `Prayer_guestEmail_prayerRequestId_key` ON `Prayer`(`guestEmail`, `prayerRequestId`);
CREATE UNIQUE INDEX `Prayer_guestPhone_prayerRequestId_key` ON `Prayer`(`guestPhone`, `prayerRequestId`);

-- Allow comments on testimonials
ALTER TABLE `Comment`
    ADD COLUMN `testimonialId` VARCHAR(191) NULL;

CREATE INDEX `Comment_testimonialId_fkey` ON `Comment`(`testimonialId`);

ALTER TABLE `Comment`
    ADD CONSTRAINT `Comment_testimonialId_fkey` FOREIGN KEY (`testimonialId`) REFERENCES `Testimonial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add likes to testimonials
ALTER TABLE `Testimonial`
    ADD COLUMN `likes` INT NOT NULL DEFAULT 0;
