-- DropForeignKey
ALTER TABLE "PublicationService" DROP CONSTRAINT "PublicationService_publisherUid_fkey";

-- AlterTable
ALTER TABLE "PublicationService" ADD COLUMN     "contentItemUid" TEXT,
ALTER COLUMN "medium" DROP NOT NULL,
ALTER COLUMN "publisherUid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_publisherUid_fkey" FOREIGN KEY ("publisherUid") REFERENCES "Contributer"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_contentItemUid_fkey" FOREIGN KEY ("contentItemUid") REFERENCES "ContentItem"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
