-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "groupingDelta" TEXT NOT NULL,
    "collectionId" TEXT,
    "groupingId" TEXT,
    CONSTRAINT "ContentItem_groupingId_fkey" FOREIGN KEY ("groupingId") REFERENCES "Grouping" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentItemsOnMediaAsset" (
    "contentItemId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,

    PRIMARY KEY ("contentItemId", "mediaAssetId"),
    CONSTRAINT "ContentItemsOnMediaAsset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItemsOnMediaAsset_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "MediaAssetOnBroadcastEvent" (
    "mediaAssetId" TEXT NOT NULL,
    "broadcastEventId" TEXT NOT NULL,

    PRIMARY KEY ("mediaAssetId", "broadcastEventId"),
    CONSTRAINT "MediaAssetOnBroadcastEvent_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MediaAssetOnBroadcastEvent_broadcastEventId_fkey" FOREIGN KEY ("broadcastEventId") REFERENCES "BroadcastEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "title" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    CONSTRAINT "Chapter_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BroadcastEvent" (
    "id" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "broadcastChannelId" TEXT NOT NULL,
    CONSTRAINT "BroadcastEvent_broadcastChannelId_fkey" FOREIGN KEY ("broadcastChannelId") REFERENCES "BroadcastChannel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BroadcastChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "broadcastEventId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PublicationChannel" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    CONSTRAINT "Transcript_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grouping" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ordinalNumber" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rssFeedUrl" TEXT NOT NULL,
    "creationDate" DATETIME NOT NULL,
    "terminationDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" REAL NOT NULL,
    "hash" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "codec" TEXT NOT NULL,
    "bitrate" REAL NOT NULL,
    "resolution" TEXT NOT NULL,
    "additionalMetadata" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    CONSTRAINT "Image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL,
    "contactInformation" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Related" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_Related_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Related_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "License_id_key" ON "License"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_id_key" ON "ContentItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_id_key" ON "MediaAsset"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_id_key" ON "Chapter"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastEvent_id_key" ON "BroadcastEvent"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastEvent_broadcastChannelId_key" ON "BroadcastEvent"("broadcastChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastChannel_id_key" ON "BroadcastChannel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastChannel_broadcastEventId_key" ON "BroadcastChannel"("broadcastEventId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationChannel_id_key" ON "PublicationChannel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_id_key" ON "Transcript"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Grouping_id_key" ON "Grouping"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_id_key" ON "Collection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "File_id_key" ON "File"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Image_id_key" ON "Image"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_id_key" ON "Contribution"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_id_key" ON "Actor"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_Related_AB_unique" ON "_Related"("A", "B");

-- CreateIndex
CREATE INDEX "_Related_B_index" ON "_Related"("B");
