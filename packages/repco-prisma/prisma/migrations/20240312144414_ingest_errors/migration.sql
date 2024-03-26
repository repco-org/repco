-- CreateTable
CREATE TABLE "IngestError" (
    "id" TEXT NOT NULL,
    "repoDid" TEXT NOT NULL,
    "datasourceUid" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cursor" TEXT,
    "sourceRecordId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "errorDetails" JSONB,

    CONSTRAINT "IngestError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestError_id_key" ON "IngestError"("id");
