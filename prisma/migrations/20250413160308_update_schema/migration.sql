/*
  Warnings:

  - A unique constraint covering the columns `[licenseNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `DriverId` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carModel` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carModelYear` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seats` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseNumber` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseURL` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "DriverId" TEXT NOT NULL,
ADD COLUMN     "carModel" TEXT NOT NULL,
ADD COLUMN     "carModelYear" TEXT NOT NULL,
ADD COLUMN     "seats" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "licenseNumber" TEXT NOT NULL,
ADD COLUMN     "licenseURL" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "DriverId" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carModelYear" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_licenseNumber_key" ON "User"("licenseNumber");
