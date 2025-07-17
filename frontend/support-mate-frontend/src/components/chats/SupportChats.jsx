import React, { useState, useEffect } from 'react';
import ChatArea from './ChatArea';
import TaskCreateModal from './TaskCreateModal';
import Box from '@mui/material/Box';
import { listMessagesByTicketId, sendMessage } from '../../api/messagesApi';
import { getUserIdFromJWT } from '../../utils/jwt';

export default function SupportChats({ ticketId, ticketTitle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await listMessagesByTicketId(ticketId);
        console.log('API response:', res);
        if (res && res.success && res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
        } else {
          setMessages([]);
        }
      } catch (e) {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [ticketId]);

  // messages değiştiğinde logla
  useEffect(() => {
    console.log('SupportChats - Ekranda gösterilecek messages:', messages);
  }, [messages]);

  // ChatArea'ya gönderilen props'u render sırasında logla
  useEffect(() => {
    console.log('SupportChats render: ChatArea props', {
      messages,
      input,
      ticketId,
      ticketTitle
    });
  });

  // Render debug
  console.log('SupportChats ticketId:', ticketId, 'messages:', messages);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !ticketId) return;
    
    try {
      // JWT token'dan kullanıcı ID'sini al
      const userId = getUserIdFromJWT();
      
      if (!userId) {
        console.error('Kullanıcı ID bulunamadı');
        return;
      }
      
      // Önce ticket ID'si ile chat'i bul
      const chatResponse = await listMessagesByTicketId(ticketId);
      console.log('Chat response:', chatResponse);
      
      if (!chatResponse.success || !chatResponse.data || !chatResponse.data.chatId) {
        console.error('Chat bulunamadı veya chatId yok');
        return;
      }
      
      const chatId = chatResponse.data.chatId;
      console.log('Bulunan chat ID:', chatId);
      
      const messageData = {
        chatId: chatId, // Gerçek chat ID'sini kullan
        text: input,
        senderId: userId,
        senderRole: 'Support' // Agent/Support rolü
      };
      
      console.log('Gönderilecek mesaj:', messageData);
      console.log('Ticket ID:', ticketId);
      console.log('Chat ID:', chatId);
      console.log('User ID:', userId);
      
      const response = await sendMessage(messageData);
      console.log('Send message response:', response);
      
      if (response.success) {
        // Yeni mesajı listeye ekle
        setMessages(prev => [...prev, response.data]);
        setInput("");
      } else {
        console.error('Mesaj gönderilemedi:', response.message);
        console.error('Response details:', response);
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const openTaskModal = () => setTaskModalOpen(true);
  const closeTaskModal = () => setTaskModalOpen(false);

  return (
    <Box display="flex" height="100%" boxShadow={2} borderRadius={2} bgcolor="#fff" overflow="hidden">
      <ChatArea
        messages={messages || []}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        openTaskModal={openTaskModal}
        ticketId={ticketId}
        ticketTitle={ticketTitle}
      />
      <TaskCreateModal open={taskModalOpen} onClose={closeTaskModal} />
    </Box>
  );
} 