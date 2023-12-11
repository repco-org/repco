-- CreateTable
CREATE TABLE "ApLocalActor" (
    "name" TEXT NOT NULL,
    "keypair" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "ApFollows" (
    "localName" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ApActivities" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "details" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ApLocalActor_name_key" ON "ApLocalActor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApFollows_localName_remoteId_key" ON "ApFollows"("localName", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "ApActivities_id_key" ON "ApActivities"("id");
