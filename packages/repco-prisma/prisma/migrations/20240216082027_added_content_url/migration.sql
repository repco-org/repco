/*
  Warnings:

  - Added the required column `contentUrl` to the `ContentItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "contentUrl" TEXT NOT NULL;
