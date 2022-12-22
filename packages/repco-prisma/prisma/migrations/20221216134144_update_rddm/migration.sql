/*
  Warnings:

  - You are about to drop the `Actor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BroadcastService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActorToContribution` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `kind` to the `Concept` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConceptKind" AS ENUM ('TAG', 'CATEGORY');

-- DropForeignKey
ALTER TABLE "Actor" DROP CONSTRAINT "Actor_profilePictureUid_fkey";

-- DropForeignKey
ALTER TABLE "Actor" DROP CONSTRAINT "Actor_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "BroadcastEvent" DROP CONSTRAINT "BroadcastEvent_broadcastServiceUid_fkey";

-- DropForeignKey
ALTER TABLE "BroadcastService" DROP CONSTRAINT "BroadcastService_publisherUid_fkey";

-- DropForeignKey
ALTER TABLE "BroadcastService" DROP CONSTRAINT "BroadcastService_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "_ActorToContribution" DROP CONSTRAINT "_ActorToContribution_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActorToContribution" DROP CONSTRAINT "_ActorToContribution_B_fkey";

-- AlterTable
ALTER TABLE "Concept" ADD COLUMN     "kind" "ConceptKind" NOT NULL,
ADD COLUMN     "parentUid" TEXT;

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "publicationServiceUid" TEXT;

-- DropTable
DROP TABLE "Actor";

-- DropTable
DROP TABLE "BroadcastService";

-- DropTable
DROP TABLE "_ActorToContribution";

-- CreateTable
CREATE TABLE "Contributor" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personOrOrganization" TEXT NOT NULL,
    "contactInformation" TEXT NOT NULL,
    "profilePictureUid" TEXT NOT NULL,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "PublicationService" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "medium" TEXT,
    "address" TEXT NOT NULL,
    "publisherUid" TEXT,

    CONSTRAINT "PublicationService_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Translation" (
    "uid" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "mediaAssetUid" TEXT NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "_ContributionToContributor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_uid_key" ON "Contributor"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_revisionId_key" ON "Contributor"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationService_uid_key" ON "PublicationService"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationService_revisionId_key" ON "PublicationService"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_uid_key" ON "Translation"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "_ContributionToContributor_AB_unique" ON "_ContributionToContributor"("A", "B");

-- CreateIndex
CREATE INDEX "_ContributionToContributor_B_index" ON "_ContributionToContributor"("B");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_publicationServiceUid_fkey" FOREIGN KEY ("publicationServiceUid") REFERENCES "PublicationService"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_profilePictureUid_fkey" FOREIGN KEY ("profilePictureUid") REFERENCES "File"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEvent" ADD CONSTRAINT "BroadcastEvent_broadcastServiceUid_fkey" FOREIGN KEY ("broadcastServiceUid") REFERENCES "PublicationService"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_publisherUid_fkey" FOREIGN KEY ("publisherUid") REFERENCES "Contributor"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_mediaAssetUid_fkey" FOREIGN KEY ("mediaAssetUid") REFERENCES "MediaAsset"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_parentUid_fkey" FOREIGN KEY ("parentUid") REFERENCES "Concept"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContributionToContributor" ADD CONSTRAINT "_ContributionToContributor_A_fkey" FOREIGN KEY ("A") REFERENCES "Contribution"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContributionToContributor" ADD CONSTRAINT "_ContributionToContributor_B_fkey" FOREIGN KEY ("B") REFERENCES "Contributor"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
