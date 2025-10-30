/*
  Warnings:

  - You are about to drop the `Insight` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Insight" DROP CONSTRAINT "Insight_businessId_fkey";

-- DropTable
DROP TABLE "public"."Insight";
