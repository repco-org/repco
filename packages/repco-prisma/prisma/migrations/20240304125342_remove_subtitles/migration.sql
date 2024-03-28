/*
  Warnings:

  - You are about to drop the `Subtitles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FileToSubtitles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BroadcastEvent" DROP CONSTRAINT "BroadcastEvent_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Commit" DROP CONSTRAINT "Commit_repoDid_fkey";

-- DropForeignKey
ALTER TABLE "Concept" DROP CONSTRAINT "Concept_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "ContentGrouping" DROP CONSTRAINT "ContentGrouping_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "ContentItem" DROP CONSTRAINT "ContentItem_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Contributor" DROP CONSTRAINT "Contributor_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "DataSource" DROP CONSTRAINT "DataSource_repoDid_fkey";

-- DropForeignKey
ALTER TABLE "Entity" DROP CONSTRAINT "Entity_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "PublicationService" DROP CONSTRAINT "PublicationService_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Revision" DROP CONSTRAINT "Revision_repoDid_fkey";

-- DropForeignKey
ALTER TABLE "SourceRecord" DROP CONSTRAINT "SourceRecord_dataSourceUid_fkey";

-- DropForeignKey
ALTER TABLE "Subtitles" DROP CONSTRAINT "Subtitles_mediaAssetUid_fkey";

-- DropForeignKey
ALTER TABLE "Subtitles" DROP CONSTRAINT "Subtitles_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "_FileToSubtitles" DROP CONSTRAINT "_FileToSubtitles_A_fkey";

-- DropForeignKey
ALTER TABLE "_FileToSubtitles" DROP CONSTRAINT "_FileToSubtitles_B_fkey";

-- DropTable
DROP TABLE "Subtitles";

-- DropTable
DROP TABLE "_FileToSubtitles";

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_repoDid_fkey" FOREIGN KEY ("repoDid") REFERENCES "Repo"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_repoDid_fkey" FOREIGN KEY ("repoDid") REFERENCES "Repo"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_repoDid_fkey" FOREIGN KEY ("repoDid") REFERENCES "Repo"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRecord" ADD CONSTRAINT "SourceRecord_dataSourceUid_fkey" FOREIGN KEY ("dataSourceUid") REFERENCES "DataSource"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGrouping" ADD CONSTRAINT "ContentGrouping_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEvent" ADD CONSTRAINT "BroadcastEvent_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
