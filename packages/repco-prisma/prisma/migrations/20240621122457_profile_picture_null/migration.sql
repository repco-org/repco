/*
  Warnings:

  - The `subtitle` column on the `ContentItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Contributor" DROP CONSTRAINT "Contributor_profilePictureUid_fkey";

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "subtitle",
ADD COLUMN     "subtitle" JSONB;

-- AlterTable
ALTER TABLE "Contributor" ALTER COLUMN "profilePictureUid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_profilePictureUid_fkey" FOREIGN KEY ("profilePictureUid") REFERENCES "File"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
