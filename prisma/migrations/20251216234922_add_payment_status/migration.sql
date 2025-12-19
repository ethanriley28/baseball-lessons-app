-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "lessonType" TEXT NOT NULL DEFAULT 'Hitting',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "photoUrl" TEXT,
    CONSTRAINT "Booking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("completedAt", "createdAt", "durationMinutes", "end", "id", "lessonType", "notes", "parentId", "photoUrl", "playerId", "start", "status") SELECT "completedAt", "createdAt", "durationMinutes", "end", "id", "lessonType", "notes", "parentId", "photoUrl", "playerId", "start", "status" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
