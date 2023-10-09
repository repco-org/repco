/*
  Warnings:

  - You are about to drop the column `fileUid` on the `MediaAsset` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_fileUid_fkey";

-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN "fileUid";

-- CreateTable
CREATE TABLE "_FileToMediaAsset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FileToMediaAsset_AB_unique" ON "_FileToMediaAsset"("A", "B");

-- CreateIndex
CREATE INDEX "_FileToMediaAsset_B_index" ON "_FileToMediaAsset"("B");

-- AddForeignKey
ALTER TABLE "_FileToMediaAsset" ADD CONSTRAINT "_FileToMediaAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToMediaAsset" ADD CONSTRAINT "_FileToMediaAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "MediaAsset"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
