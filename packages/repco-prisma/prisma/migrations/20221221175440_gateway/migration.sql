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

-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "gateways" TEXT[];
