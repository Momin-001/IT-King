import http from "http";
import { exit } from "process";
import { Server, type DefaultEventsMap } from "socket.io";
import getUserChatIds from "../services/getUserChats.js";

let io:
  | undefined
  | Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

export default async function initializeSockets(server: http.Server) {
  if (!io) {
    try {
      // Socket Initialization
      io = new Server(server, {
        cors: {
          origin: "*",
        },
      });

      // Setting Socket Events
      io.on("connection", async (socket) => {
        const { userId } = socket.handshake.auth;
        const chatIds = await getUserChatIds(userId);
        const rooms = chatIds.map((chat) => chat.toString());
        socket.join(rooms);
        console.log(`User ${userId} Connected. Groups Joined: `, chatIds);
      });
    } catch (err: any) {
      console.log("Cannot start sockets: ", err);
      exit(1);
    }
  }

  // Returning socket instance
  return io;
}

export async function getSocket() {
  // Made to be called in files other than the main app.ts
  return io;
}
