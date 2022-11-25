-- DropForeignKey
ALTER TABLE "SourceRecord" DROP CONSTRAINT "SourceRecord_dataSourceUid_fkey";

-- AlterTable
ALTER TABLE "SourceRecord" ALTER COLUMN "meta" DROP NOT NULL,
ALTER COLUMN "dataSourceUid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SourceRecord" ADD CONSTRAINT "SourceRecord_dataSourceUid_fkey" FOREIGN KEY ("dataSourceUid") REFERENCES "DataSource"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
