/*
  Warnings:

  - The `title` column on the `ContentItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Revision" ALTER COLUMN "languages" SET DEFAULT '{}';
