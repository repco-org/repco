-- CreateTable
CREATE TABLE "DataSource" (
    "uid" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_uid_key" ON "DataSource"("uid");
