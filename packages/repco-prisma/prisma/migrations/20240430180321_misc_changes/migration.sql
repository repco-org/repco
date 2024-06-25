/*
  Warnings:

  - Changed the type of `kind` on the `Concept` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `removed` to the `ContentItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Concept" DROP COLUMN "kind",
ADD COLUMN     "kind" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "removed" BOOLEAN NOT NULL;
