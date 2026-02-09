import { prisma } from "../config/prisma.js";

export default async function getUserChatIds(id: number) {
  const states = await prisma.userChatState.findMany({
    where: { userId: id },
    select: {
      chatId: true,
    },
    orderBy: { id: "desc" },
  });

  // Extract the IDs into a simple array
  const chatIds = states.map((state) => state.chatId);

  console.log("Chat IDs: ", chatIds);
  return chatIds;
}
