/*
  Warnings:

  - The `name` column on the `Concept` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary` column on the `Concept` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `Concept` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `ContentGrouping` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary` column on the `ContentGrouping` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `title` column on the `ContentGrouping` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary` column on the `ContentItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `content` column on the `ContentItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `title` column on the `MediaAsset` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `MediaAsset` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `name` column on the `PublicationService` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Translation` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `title` on the `Chapter` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Translation" DROP CONSTRAINT "Translation_mediaAssetUid_fkey";

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Concept" DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL DEFAULT '{}',
DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "ContentGrouping" DROP COLUMN "description",
ADD COLUMN     "description" JSONB,
DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB,
DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN "title",
ADD COLUMN     "title" JSONB NOT NULL DEFAULT '{}',
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "PublicationService" DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Revision" ALTER COLUMN "languages" SET DEFAULT '',
ALTER COLUMN "languages" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Translation";
