import axiosInstance from './axiosInstance';

const BASE_URL = 'http://localhost:9000' + '/api/tickets/messages';
const BASE_URL2 = 'http://localhost:9000' + '/api/tickets';

// Mesaj gönder
export const sendMessage = async (messageData) => {
  const response = await axiosInstance.post(BASE_URL, messageData);
  return response.data;
};

// create message
export const createMessage = async (messageData) => {
  const response = await axiosInstance.post(BASE_URL + '/create', messageData);
  return response.data;
};

// Belirli bir chat_id ile mesajları getir
export const listMessages = async (chatId) => {
  const response = await axiosInstance.get(`${BASE_URL}/${chatId}`);
  return response.data;
};

// İki kullanıcı arasında mesajları getir
export const listMessagesBetweenUsers = async (senderId, receiverId) => {
  const response = await axiosInstance.get(`${BASE_URL}/between/${senderId}/${receiverId}`);
  return response.data;
};

// Admin/agent/user için iki kullanıcı arası mesajlar (opsiyonel, query parametreli)
export const listMessagesBetweenUsersForRole = async (role, senderId, receiverId) => {
  // role: 'admin', 'agent', 'user'
  const response = await axiosInstance.get(`${BASE_URL.replace('/messages','')}/${role}/messages`, {
    params: { sender_id: senderId, receiver_id: receiverId }
  });
  return response.data;
};

// TicketId ile mesajları getir
export const listMessagesByTicketId = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/ticket/${ticketId}`);
  return response.data;
};

// Non-ticket (chat bazlı) sohbetleri getir
export const listNonTicketChats = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/chat`);
  return response.data;
};

// ChatId ile mesajları getir (ticket ve non-ticket için ortak)
export const listMessagesByChatId = async (chatId) => {
  const response = await axiosInstance.get(`${BASE_URL}/chat/${chatId}`);
  return response.data;
};

export const listAgentChatsWithMessages = async () => {
  const response = await axiosInstance.get(`${BASE_URL2}/agent/messages`);
  return response.data;
};



