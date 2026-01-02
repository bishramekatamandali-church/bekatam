/*
  Warnings:

  - Added the required column `password` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User`
    ADD COLUMN IF NOT EXISTS `password` VARCHAR(191) NOT NULL DEFAULT '$2b$10$gmE2KJyDd9HCWkeq05AyN.AzVVAhDOPBUQcDfOL4S6h8fQaNwFhUq',
    ADD COLUMN IF NOT EXISTS `passwordHash` VARCHAR(191) NULL;
