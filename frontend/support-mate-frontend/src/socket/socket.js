// src/socket.js
import { io } from "socket.io-client";

// API Gateway'in dışarıya açılan portu (9000) kullanılacak!
const SOCKET_URL = "http://localhost:9000"; // veya sunucu adresiniz

const socket = io(SOCKET_URL, {
  path: "/ws", // ticket-service'de mount edilen path
  transports: ["websocket"], // opsiyonel, fallback istemiyorsanız
  withCredentials: true,     // gerekiyorsa
});

// Bağlantı logları
socket.on("connect", () => {
  console.log("[SOCKET] Connected:", socket.id);
});
socket.on("disconnect", (reason) => {
  console.log("[SOCKET] Disconnected:", reason);
});
socket.on("connect_error", (err) => {
  console.error("[SOCKET] Connection error:", err);
});
socket.on("reconnect", (attempt) => {
  console.log("[SOCKET] Reconnected. Attempt:", attempt);
});
socket.on("reconnect_attempt", (attempt) => {
  console.log("[SOCKET] Reconnect attempt:", attempt);
});
socket.on("reconnect_failed", () => {
  console.error("[SOCKET] Reconnect failed");
});

// ticket-service tarafındaki eventleri logla
const eventList = [
  'user_online',
  'user_offline',
  'user_joined',
  'user_left',
  'new_message',
  'typing',
  'stop_typing',
  'delivered',
  'seen',
];
eventList.forEach(event => {
  socket.on(event, (data) => {
    console.log(`[SOCKET EVENT] ${event}:`, data);
  });
});

export default socket;