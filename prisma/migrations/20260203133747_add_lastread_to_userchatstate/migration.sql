-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserChatState" ADD COLUMN     "lastReadId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserChatState" ADD CONSTRAINT "UserChatState_lastReadId_fkey" FOREIGN KEY ("lastReadId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
