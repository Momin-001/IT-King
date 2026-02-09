/*
  Warnings:

  - Made the column `messageId` on table `UserChatState` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserChatState" DROP CONSTRAINT "UserChatState_messageId_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserChatState" ALTER COLUMN "messageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "UserChatState" ADD CONSTRAINT "UserChatState_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
