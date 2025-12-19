-- CreateTable
CREATE TABLE "MetricsEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "teeExitVelo" REAL,
    "softTossExitVelo" REAL,
    "sixtyTime" REAL,
    "fiveTenFiveTime" REAL,
    "homeToFirstTime" REAL,
    "homeToSecondTime" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricsEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
