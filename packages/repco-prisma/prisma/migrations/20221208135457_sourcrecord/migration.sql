/*
  Warnings:

  - The `type` column on the `Agent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `domainType` on the `SourceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `revisionId` on the `SourceRecord` table. All the data in the column will be lost.
  - Changed the type of `variant` on the `ContentGrouping` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `sourceType` to the `SourceRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceUri` to the `SourceRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `SourceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SourceRecord" DROP CONSTRAINT "SourceRecord_revisionId_fkey";

-- DropIndex
DROP INDEX "SourceRecord_revisionId_key";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "type",
ADD COLUMN     "type" "AgentType";

-- AlterTable
ALTER TABLE "ContentGrouping" DROP COLUMN "variant",
ADD COLUMN     "variant" "ContentGroupingVariant" NOT NULL;

-- AlterTable
ALTER TABLE "SourceRecord" DROP COLUMN "domainType",
DROP COLUMN "revisionId",
ADD COLUMN     "containedEntityUris" TEXT[],
ADD COLUMN     "sourceType" TEXT NOT NULL,
ADD COLUMN     "sourceUri" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;
