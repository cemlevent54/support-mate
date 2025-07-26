// src/socket.js
import { io } from "socket.io-client";



// API Gateway'in dışarıya açılan portu (9000) kullanılacak!
const SOCKET_URL = "http://localhost:9000"; // veya sunucu adresiniz

const socket = io(SOCKET_URL, {
  path: "/ws/socket.io/", // ticket-service'de mount edilen path + socket.io default path
  transports: ["websocket"], // opsiyonel, fallback istemiyorsanız
  withCredentials: true,     // gerekiyorsa
});

// Kullanıcı kimliği ve rolünü localStorage veya JWT'den al
const token = localStorage.getItem('jwt');
let userId = null;
let userRole = null;
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload.userId || payload.id || payload.sub;
    userRole = payload.roleName || payload.role;
  } catch (e) {}
}

socket.on('connect', () => {
  console.log("[SOCKET] Connected:", socket.id);
  // Bağlantı kurulduğunda authenticate_and_join eventini emit et
  if (userId && userRole) {
    socket.emit('authenticate_and_join', { userId, userRole });
  }
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
  'receive_chat_message',
  'new_chat_created',
  'typing',
  'stop_typing',
  'delivered',
  'seen',
  'message_read',
  'unread_count',
  'unread_counts',
];
eventList.forEach(event => {
  socket.on(event, (data) => {
    console.log(`[SOCKET EVENT] ${event}:`, data);
  });
});

export default socket;