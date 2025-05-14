/*
  Warnings:

  - You are about to drop the column `DriverId` on the `Request` table. All the data in the column will be lost.
  - Made the column `phoneNumber` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "DriverId",
ALTER COLUMN "carModel" DROP NOT NULL,
ALTER COLUMN "carModelYear" DROP NOT NULL,
ALTER COLUMN "seats" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phoneNumber" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "licenseNumber" DROP NOT NULL,
ALTER COLUMN "licenseURL" DROP NOT NULL;
