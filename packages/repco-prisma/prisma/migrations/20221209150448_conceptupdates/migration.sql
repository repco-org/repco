/*
  Warnings:

  - Added the required column `kind` to the `Concept` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConceptKind" AS ENUM ('TAG', 'CATEGORY');

-- AlterTable
ALTER TABLE "Concept" ADD COLUMN     "kind" "ConceptKind" NOT NULL,
ADD COLUMN     "parentUid" TEXT;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_parentUid_fkey" FOREIGN KEY ("parentUid") REFERENCES "Concept"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
