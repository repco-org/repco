/*
  Warnings:

  - Changed the type of `contentUrl` on the `ContentItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "contentUrl",
ADD COLUMN     "contentUrl" JSONB NOT NULL;
