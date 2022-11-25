/*
  Warnings:

  - The `type` column on the `Agent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `variant` on the `ContentGrouping` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "type",
ADD COLUMN     "type" "AgentType";

-- AlterTable
ALTER TABLE "ContentGrouping" DROP COLUMN "variant",
ADD COLUMN     "variant" "ContentGroupingVariant" NOT NULL;

-- CreateTable
CREATE TABLE "Ucans" (
    "scope" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "cid" TEXT NOT NULL,

    CONSTRAINT "Ucans_pkey" PRIMARY KEY ("cid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ucans_cid_key" ON "Ucans"("cid");
