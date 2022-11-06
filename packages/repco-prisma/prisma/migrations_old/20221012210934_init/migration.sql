-- CreateEnum
CREATE TYPE "ContentGroupingVariant" AS ENUM ('EPISODIC', 'SERIAL');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('DATASOURCE', 'USER');

-- CreateTable
CREATE TABLE "Repo" (
    "uid" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Agent" (
    "uid" TEXT NOT NULL,
    "type" "AgentType",

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "User" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "uid" TEXT NOT NULL,
    "pluginUid" TEXT,
    "config" JSONB,
    "cursor" TEXT NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Block" (
    "cid" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("cid")
);

-- CreateTable
CREATE TABLE "Entity" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "prevRevisionId" TEXT,
    "uid" TEXT NOT NULL,
    "repoDid" TEXT NOT NULL,
    "agentDid" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "dateModified" TIMESTAMP(3) NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "entityUris" TEXT[],
    "revisionUris" TEXT[],
    "revisionCid" TEXT NOT NULL,
    "contentCid" TEXT NOT NULL,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGrouping" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "groupingType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "variant" "ContentGroupingVariant" NOT NULL,
    "broadcastSchedule" TEXT,
    "startingDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "licenseUid" TEXT,

    CONSTRAINT "ContentGrouping_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "pubDate" TIMESTAMP(3),
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "contentFormat" TEXT NOT NULL,
    "primaryGroupingUid" TEXT,
    "licenseUid" TEXT,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "License" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUid" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "mediaType" TEXT NOT NULL,
    "teaserImageUid" TEXT,
    "licenseUid" TEXT,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Actor" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personOrOrganization" TEXT NOT NULL,
    "contactInformation" TEXT NOT NULL,
    "profilePictureUid" TEXT NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mediaAssetUid" TEXT NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "BroadcastEvent" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "contentItemUid" TEXT NOT NULL,
    "broadcastServiceUid" TEXT NOT NULL,

    CONSTRAINT "BroadcastEvent_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "BroadcastService" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisherUid" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "BroadcastService_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "uid" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "mediaAssetUid" TEXT NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "File" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "multihash" TEXT,
    "duration" DOUBLE PRECISION,
    "codec" TEXT,
    "bitrate" INTEGER,
    "resolution" TEXT,
    "additionalMetadata" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Concept" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "originNamespace" TEXT,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "wikidataID" TEXT,
    "sameAsUid" TEXT,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Metadata" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "targetUid" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "content" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "_ContentGroupingToContentItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ContentItemToMediaAsset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ContentItemToContribution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ContributionToMediaAsset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActorToContribution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ConceptToContentItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ConceptToMediaAsset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Repo_uid_key" ON "Repo"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_uid_key" ON "Agent"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_uid_key" ON "DataSource"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Block_cid_key" ON "Block"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_uid_key" ON "Entity"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_revisionId_key" ON "Entity"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_id_key" ON "Revision"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_prevRevisionId_key" ON "Revision"("prevRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_revisionCid_key" ON "Revision"("revisionCid");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_contentCid_key" ON "Revision"("contentCid");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGrouping_uid_key" ON "ContentGrouping"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGrouping_revisionId_key" ON "ContentGrouping"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_uid_key" ON "ContentItem"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_revisionId_key" ON "ContentItem"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "License_uid_key" ON "License"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "License_revisionId_key" ON "License"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_uid_key" ON "MediaAsset"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_revisionId_key" ON "MediaAsset"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_uid_key" ON "Contribution"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_revisionId_key" ON "Contribution"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_uid_key" ON "Actor"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_revisionId_key" ON "Actor"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_uid_key" ON "Chapter"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_revisionId_key" ON "Chapter"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastEvent_uid_key" ON "BroadcastEvent"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastEvent_revisionId_key" ON "BroadcastEvent"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastService_uid_key" ON "BroadcastService"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastService_revisionId_key" ON "BroadcastService"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_uid_key" ON "Transcript"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "File_uid_key" ON "File"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "File_revisionId_key" ON "File"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_uid_key" ON "Concept"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_revisionId_key" ON "Concept"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_sameAsUid_key" ON "Concept"("sameAsUid");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_uid_key" ON "Metadata"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_revisionId_key" ON "Metadata"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentGroupingToContentItem_AB_unique" ON "_ContentGroupingToContentItem"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentGroupingToContentItem_B_index" ON "_ContentGroupingToContentItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentItemToMediaAsset_AB_unique" ON "_ContentItemToMediaAsset"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentItemToMediaAsset_B_index" ON "_ContentItemToMediaAsset"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentItemToContribution_AB_unique" ON "_ContentItemToContribution"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentItemToContribution_B_index" ON "_ContentItemToContribution"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContributionToMediaAsset_AB_unique" ON "_ContributionToMediaAsset"("A", "B");

-- CreateIndex
CREATE INDEX "_ContributionToMediaAsset_B_index" ON "_ContributionToMediaAsset"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActorToContribution_AB_unique" ON "_ActorToContribution"("A", "B");

-- CreateIndex
CREATE INDEX "_ActorToContribution_B_index" ON "_ActorToContribution"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToContentItem_AB_unique" ON "_ConceptToContentItem"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToContentItem_B_index" ON "_ConceptToContentItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToMediaAsset_AB_unique" ON "_ConceptToMediaAsset"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToMediaAsset_B_index" ON "_ConceptToMediaAsset"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_uid_fkey" FOREIGN KEY ("uid") REFERENCES "Agent"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_uid_fkey" FOREIGN KEY ("uid") REFERENCES "Agent"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_repoDid_fkey" FOREIGN KEY ("repoDid") REFERENCES "Repo"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_agentDid_fkey" FOREIGN KEY ("agentDid") REFERENCES "Agent"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_contentCid_fkey" FOREIGN KEY ("contentCid") REFERENCES "Block"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_revisionCid_fkey" FOREIGN KEY ("revisionCid") REFERENCES "Block"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_prevRevisionId_fkey" FOREIGN KEY ("prevRevisionId") REFERENCES "Revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGrouping" ADD CONSTRAINT "ContentGrouping_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGrouping" ADD CONSTRAINT "ContentGrouping_licenseUid_fkey" FOREIGN KEY ("licenseUid") REFERENCES "License"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_primaryGroupingUid_fkey" FOREIGN KEY ("primaryGroupingUid") REFERENCES "ContentGrouping"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_licenseUid_fkey" FOREIGN KEY ("licenseUid") REFERENCES "License"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_licenseUid_fkey" FOREIGN KEY ("licenseUid") REFERENCES "License"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_fileUid_fkey" FOREIGN KEY ("fileUid") REFERENCES "File"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_teaserImageUid_fkey" FOREIGN KEY ("teaserImageUid") REFERENCES "File"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actor" ADD CONSTRAINT "Actor_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actor" ADD CONSTRAINT "Actor_profilePictureUid_fkey" FOREIGN KEY ("profilePictureUid") REFERENCES "File"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_mediaAssetUid_fkey" FOREIGN KEY ("mediaAssetUid") REFERENCES "MediaAsset"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEvent" ADD CONSTRAINT "BroadcastEvent_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEvent" ADD CONSTRAINT "BroadcastEvent_contentItemUid_fkey" FOREIGN KEY ("contentItemUid") REFERENCES "ContentItem"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEvent" ADD CONSTRAINT "BroadcastEvent_broadcastServiceUid_fkey" FOREIGN KEY ("broadcastServiceUid") REFERENCES "BroadcastService"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastService" ADD CONSTRAINT "BroadcastService_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastService" ADD CONSTRAINT "BroadcastService_publisherUid_fkey" FOREIGN KEY ("publisherUid") REFERENCES "Actor"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_mediaAssetUid_fkey" FOREIGN KEY ("mediaAssetUid") REFERENCES "MediaAsset"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_sameAsUid_fkey" FOREIGN KEY ("sameAsUid") REFERENCES "Concept"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_targetUid_fkey" FOREIGN KEY ("targetUid") REFERENCES "Entity"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentGroupingToContentItem" ADD CONSTRAINT "_ContentGroupingToContentItem_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentGrouping"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentGroupingToContentItem" ADD CONSTRAINT "_ContentGroupingToContentItem_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToMediaAsset" ADD CONSTRAINT "_ContentItemToMediaAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToMediaAsset" ADD CONSTRAINT "_ContentItemToMediaAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "MediaAsset"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToContribution" ADD CONSTRAINT "_ContentItemToContribution_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToContribution" ADD CONSTRAINT "_ContentItemToContribution_B_fkey" FOREIGN KEY ("B") REFERENCES "Contribution"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContributionToMediaAsset" ADD CONSTRAINT "_ContributionToMediaAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "Contribution"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContributionToMediaAsset" ADD CONSTRAINT "_ContributionToMediaAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "MediaAsset"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActorToContribution" ADD CONSTRAINT "_ActorToContribution_A_fkey" FOREIGN KEY ("A") REFERENCES "Actor"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActorToContribution" ADD CONSTRAINT "_ActorToContribution_B_fkey" FOREIGN KEY ("B") REFERENCES "Contribution"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptToContentItem" ADD CONSTRAINT "_ConceptToContentItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptToContentItem" ADD CONSTRAINT "_ConceptToContentItem_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptToMediaAsset" ADD CONSTRAINT "_ConceptToMediaAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptToMediaAsset" ADD CONSTRAINT "_ConceptToMediaAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "MediaAsset"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
