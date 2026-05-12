import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333/api";

export function connectRealtime() {
  if (socket) {
    return socket;
  }

  socket = io(API_BASE.replace("/api", ""), {
    transports: ["websocket"]
  });

  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}

