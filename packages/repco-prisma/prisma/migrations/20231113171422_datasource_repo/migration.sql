/*
  Warnings:

  - Added the required column `repoDid` to the `DataSource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataSource" ADD COLUMN     "repoDid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_repoDid_fkey" FOREIGN KEY ("repoDid") REFERENCES "Repo"("did") ON DELETE RESTRICT ON UPDATE CASCADE;
