/*
  Warnings:

  - You are about to drop the column `contentItemUid` on the `PublicationService` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PublicationService" DROP CONSTRAINT "PublicationService_contentItemUid_fkey";

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "publicationServiceUid" TEXT;

-- AlterTable
ALTER TABLE "PublicationService" DROP COLUMN "contentItemUid";

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_publicationServiceUid_fkey" FOREIGN KEY ("publicationServiceUid") REFERENCES "PublicationService"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
