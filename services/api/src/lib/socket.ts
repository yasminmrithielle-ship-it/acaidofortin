import { Server as HttpServer } from "http";

import { Server } from "socket.io";

let io: Server | null = null;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    socket.on("order:subscribe", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });
  });

  return io;
}

export function emitOrderUpdated(orderId: string, payload: unknown) {
  io?.to(`order:${orderId}`).emit("order:updated", payload);
  io?.emit("order:updated", payload);
}

