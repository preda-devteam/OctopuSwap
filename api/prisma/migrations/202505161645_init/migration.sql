-- CreateTable
CREATE TABLE "AMM" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poolId" TEXT NOT NULL,
    "xAmount" TEXT,
    "yAmount" TEXT
);

-- CreateTable
CREATE TABLE "Cursor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventSeq" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AMM_poolId_key" ON "AMM"("poolId");
