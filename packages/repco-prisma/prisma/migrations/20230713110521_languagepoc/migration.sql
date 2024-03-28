/*
  Warnings:

  - The `languages` column on the `Revision` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Revision" DROP COLUMN "languages",
ADD COLUMN     "languages" JSONB NOT NULL DEFAULT '[]';
