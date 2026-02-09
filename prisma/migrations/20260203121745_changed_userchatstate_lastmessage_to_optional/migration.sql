-- DropForeignKey
ALTER TABLE "UserChatState" DROP CONSTRAINT "UserChatState_messageId_fkey";

-- AlterTable
ALTER TABLE "UserChatState" ALTER COLUMN "messageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserChatState" ADD CONSTRAINT "UserChatState_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
