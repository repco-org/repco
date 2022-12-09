/*
  Warnings:

  - You are about to drop the `Actor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BroadcastService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActorToContribution` table. If the table is not empty, all the data it contains will be lost.

*/
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

-- DropTable
DROP TABLE "Actor";

-- DropTable
DROP TABLE "BroadcastService";

-- DropTable
DROP TABLE "_ActorToContribution";

-- CreateTable
CREATE TABLE "Contributer" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personOrOrganization" TEXT NOT NULL,
    "contactInformation" TEXT NOT NULL,
    "profilePictureUid" TEXT NOT NULL,

    CONSTRAINT "Contributer_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "PublicationService" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "publisherUid" TEXT NOT NULL,

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
CREATE TABLE "_ContributerToContribution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Contributer_uid_key" ON "Contributer"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Contributer_revisionId_key" ON "Contributer"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationService_uid_key" ON "PublicationService"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationService_revisionId_key" ON "PublicationService"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_uid_key" ON "Translation"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "_ContributerToContribution_AB_unique" ON "_ContributerToContribution"("A", "B");

-- CreateIndex
CREATE INDEX "_ContributerToContribution_B_index" ON "_ContributerToContribution"("B");

-- AddForeignKey
ALTER TABLE "Contributer" ADD CONSTRAINT "Contributer_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributer" ADD CONSTRAINT "Contributer_profilePictureUid_fkey" FOREIGN KEY ("profilePictureUid") REFERENCES "File"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEvent" ADD CONSTRAINT "BroadcastEvent_broadcastServiceUid_fkey" FOREIGN KEY ("broadcastServiceUid") REFERENCES "PublicationService"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_publisherUid_fkey" FOREIGN KEY ("publisherUid") REFERENCES "Contributer"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationService" ADD CONSTRAINT "PublicationService_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_mediaAssetUid_fkey" FOREIGN KEY ("mediaAssetUid") REFERENCES "MediaAsset"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContributerToContribution" ADD CONSTRAINT "_ContributerToContribution_A_fkey" FOREIGN KEY ("A") REFERENCES "Contributer"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContributerToContribution" ADD CONSTRAINT "_ContributerToContribution_B_fkey" FOREIGN KEY ("B") REFERENCES "Contribution"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
