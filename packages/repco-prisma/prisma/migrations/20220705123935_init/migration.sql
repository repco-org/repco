-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_licenseUid_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_primaryGroupingUid_fkey";

-- AlterTable
ALTER TABLE "ContentItem" ALTER COLUMN "primaryGroupingUid" DROP NOT NULL,
ALTER COLUMN "licenseUid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_primaryGroupingUid_fkey" FOREIGN KEY ("primaryGroupingUid") REFERENCES "ContentGrouping"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_licenseUid_fkey" FOREIGN KEY ("licenseUid") REFERENCES "License"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
