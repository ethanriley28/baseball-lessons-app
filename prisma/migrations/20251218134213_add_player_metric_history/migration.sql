-- CreateTable
CREATE TABLE "PlayerMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teeExitVelo" REAL,
    "softTossExitVelo" REAL,
    "sixtyTime" REAL,
    "fiveTenFiveTime" REAL,
    "homeToFirstTime" REAL,
    "homeToSecondTime" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerMetric_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
