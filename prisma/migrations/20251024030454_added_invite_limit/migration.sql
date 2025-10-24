-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inviteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inviteMonth" TEXT;
