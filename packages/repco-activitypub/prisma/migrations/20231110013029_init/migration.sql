-- CreateTable
CREATE TABLE "ApLocalActor" (
    "name" TEXT NOT NULL,
    "keypair" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "ApFollowedActors" (
    "localName" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ApMessages" (
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
CREATE UNIQUE INDEX "ApFollowedActors_localName_remoteId_key" ON "ApFollowedActors"("localName", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "ApMessages_id_key" ON "ApMessages"("id");
