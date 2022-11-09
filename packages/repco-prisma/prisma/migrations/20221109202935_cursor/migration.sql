/*
  Warnings:

  - Made the column `pluginUid` on table `DataSource` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DataSource" ALTER COLUMN "pluginUid" SET NOT NULL,
ALTER COLUMN "cursor" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Cursor" (
    "uid" TEXT NOT NULL,
    "cursor" TEXT,

    CONSTRAINT "Cursor_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cursor_uid_key" ON "Cursor"("uid");
