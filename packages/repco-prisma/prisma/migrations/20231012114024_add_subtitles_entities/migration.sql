-- CreateTable
CREATE TABLE "Subtitles" (
    "uid" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "mediaAssetUid" TEXT NOT NULL,

    CONSTRAINT "Subtitles_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "_FileToSubtitles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Subtitles_uid_key" ON "Subtitles"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Subtitles_revisionId_key" ON "Subtitles"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "_FileToSubtitles_AB_unique" ON "_FileToSubtitles"("A", "B");

-- CreateIndex
CREATE INDEX "_FileToSubtitles_B_index" ON "_FileToSubtitles"("B");

-- AddForeignKey
ALTER TABLE "Subtitles" ADD CONSTRAINT "Subtitles_mediaAssetUid_fkey" FOREIGN KEY ("mediaAssetUid") REFERENCES "MediaAsset"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtitles" ADD CONSTRAINT "Subtitles_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToSubtitles" ADD CONSTRAINT "_FileToSubtitles_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToSubtitles" ADD CONSTRAINT "_FileToSubtitles_B_fkey" FOREIGN KEY ("B") REFERENCES "Subtitles"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
