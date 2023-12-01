/*
  Warnings:

  - A unique constraint covering the columns `[revisionId]` on the table `Transcript` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `author` to the `Transcript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `license` to the `Transcript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revisionId` to the `Transcript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtitleUrl` to the `Transcript` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PublicationService" ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Transcript" ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "license" TEXT NOT NULL,
ADD COLUMN     "revisionId" TEXT NOT NULL,
ADD COLUMN     "subtitleUrl" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_revisionId_key" ON "Transcript"("revisionId");

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
