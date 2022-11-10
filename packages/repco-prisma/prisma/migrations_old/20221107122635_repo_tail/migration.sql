/*
  Warnings:

  - A unique constraint covering the columns `[tail]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "tail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repo_tail_key" ON "Repo"("tail");
