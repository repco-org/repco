/*
  Warnings:

  - You are about to drop the column `contentSize` on the `File` table. All the data in the column will be lost.
  - Added the required column `content` to the `Revision` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntityOrRevision" AS ENUM ('ENTITY', 'REVISION');

-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_licenseUid_fkey";

-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT "MediaAsset_teaserImageUid_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "contentSize",
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "multihash" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "codec" DROP NOT NULL,
ALTER COLUMN "bitrate" DROP NOT NULL,
ALTER COLUMN "resolution" DROP NOT NULL,
ALTER COLUMN "additionalMetadata" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MediaAsset" ALTER COLUMN "teaserImageUid" DROP NOT NULL,
ALTER COLUMN "licenseUid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "alternativeIds" TEXT[],
ADD COLUMN     "content" JSONB NOT NULL;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_licenseUid_fkey" FOREIGN KEY ("licenseUid") REFERENCES "License"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_teaserImageUid_fkey" FOREIGN KEY ("teaserImageUid") REFERENCES "File"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
