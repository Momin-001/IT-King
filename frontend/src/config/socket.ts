// socketClient.ts
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

interface ConnectOptions {
  url: string;
  userId?: number;
}

export function getSocket(options: ConnectOptions): Socket {
  if (!socket) {
    socket = io(options.url, {
      auth: {
        userId: options.userId,
      },
      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}
