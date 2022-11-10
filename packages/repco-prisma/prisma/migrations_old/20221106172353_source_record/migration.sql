-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "derivedFromUid" TEXT;

-- CreateTable
CREATE TABLE "SourceRecord" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "domainType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "dataSourceUid" TEXT NOT NULL,

    CONSTRAINT "SourceRecord_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceRecord_uid_key" ON "SourceRecord"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRecord_revisionId_key" ON "SourceRecord"("revisionId");

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_derivedFromUid_fkey" FOREIGN KEY ("derivedFromUid") REFERENCES "SourceRecord"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRecord" ADD CONSTRAINT "SourceRecord_dataSourceUid_fkey" FOREIGN KEY ("dataSourceUid") REFERENCES "DataSource"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRecord" ADD CONSTRAINT "SourceRecord_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
