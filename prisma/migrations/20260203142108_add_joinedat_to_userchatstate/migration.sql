/*
  Warnings:

  - You are about to drop the column `messageId` on the `UserChatState` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserChatState" DROP CONSTRAINT "UserChatState_messageId_fkey";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "messageId" INTEGER;

-- AlterTable
ALTER TABLE "UserChatState" DROP COLUMN "messageId",
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
