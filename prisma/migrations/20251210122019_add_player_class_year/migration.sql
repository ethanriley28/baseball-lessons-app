/*
  Warnings:

  - You are about to drop the column `class` on the `Player` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "school" TEXT,
    "classYear" TEXT,
    "position" TEXT,
    "bats" TEXT,
    "height" TEXT,
    "weight" INTEGER,
    "travelOrg" TEXT,
    "age" INTEGER,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("age", "bats", "createdAt", "height", "id", "name", "parentId", "photoUrl", "position", "school", "travelOrg", "weight") SELECT "age", "bats", "createdAt", "height", "id", "name", "parentId", "photoUrl", "position", "school", "travelOrg", "weight" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
