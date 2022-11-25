/*
  Warnings:

  - Made the column `pluginUid` on table `DataSource` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DataSource" ALTER COLUMN "pluginUid" SET NOT NULL;
