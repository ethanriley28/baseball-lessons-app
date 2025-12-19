/*
  Warnings:

  - You are about to drop the column `coachId` on the `AvailabilityBlock` table. All the data in the column will be lost.
  - You are about to drop the column `dayOfWeek` on the `AvailabilityBlock` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `AvailabilityBlock` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `AvailabilityBlock` table. All the data in the column will be lost.
  - Added the required column `end` to the `AvailabilityBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start` to the `AvailabilityBlock` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AvailabilityBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AvailabilityBlock" ("id") SELECT "id" FROM "AvailabilityBlock";
DROP TABLE "AvailabilityBlock";
ALTER TABLE "new_AvailabilityBlock" RENAME TO "AvailabilityBlock";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
