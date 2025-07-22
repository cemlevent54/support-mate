import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatList from './ChatList';
import SupportChats from './SupportChats';
import { listAgentChatsWithMessages } from '../../api/messagesApi';
import socket from '../../socket/socket';

export default function SupportChatsLayout() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = React.useState(null);
  const [agentChats, setAgentChats] = useState([]);

  // Component mount olduğunda agent chatlerini çek
  useEffect(() => {
    async function fetchAgentChats() {
      try {
        const response = await listAgentChatsWithMessages();
        if (response.success && response.data) {
          setAgentChats(response.data);
        }
      } catch (error) {
        setAgentChats([]);
      }
    }
    fetchAgentChats();
  }, []);

  // Yeni mesaj geldiğinde agentChats listesini güncelle
  useEffect(() => {
    const handleNewMessage = (data) => {
      setAgentChats(prevChats => {
        // Chat'i bul
        let updated = false;
        const newChats = prevChats.map(chat => {
          const chatId = chat._id || chat.chatId || chat.id;
          if (chatId === data.chatId) {
            updated = true;
            // Son mesajı ekle
            const msgs = Array.isArray(chat.messages) ? [...chat.messages] : (Array.isArray(chat.chatMessages) ? [...chat.chatMessages] : []);
            msgs.push({
              senderId: data.userId,
              text: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              createdAt: data.timestamp || new Date().toISOString()
            });
            return {
              ...chat,
              messages: msgs,
              lastMessage: data.message,
              lastMessageTime: data.timestamp || new Date().toISOString(),
            };
          }
          return chat;
        });
        // Eğer chat yoksa yeni chat ekle (opsiyonel)
        if (!updated) {
          newChats.unshift({
            id: data.chatId,
            chatId: data.chatId,
            messages: [{
              senderId: data.userId,
              text: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              createdAt: data.timestamp || new Date().toISOString()
            }],
            lastMessage: data.message,
            lastMessageTime: data.timestamp || new Date().toISOString(),
          });
        }
        // Son mesaj zamanına göre sırala (en yeni yukarıda)
        return newChats.sort((a, b) => {
          const tA = new Date(a.lastMessageTime || a.updatedAt || a.createdAt || 0);
          const tB = new Date(b.lastMessageTime || b.updatedAt || b.createdAt || 0);
          return tB - tA;
        });
      });
    };
    socket.on('receive_chat_message', handleNewMessage);
    return () => socket.off('receive_chat_message', handleNewMessage);
  }, []);

  const handleSelectChat = (chatId, title, chatObj) => {
    setSelectedChat(chatObj);
    navigate(`/support/chats/${chatId}`);
  };

  return (
    <Box display="flex" minHeight="100vh">
      <ChatList 
        activeChatTicketId={chatId} 
        onSelectChat={(id, name, chatObj) => handleSelectChat(id, name, chatObj)}
        refreshTrigger={0}
        agentChats={agentChats}
      />
      <Box flex={1} height="100vh" bgcolor="#f5f5f5">
        {chatId ? (
          <SupportChats 
            ticketId={chatId} 
            ticketTitle={""} 
            onMessageSent={() => {}}
            messages={selectedChat?.messages || selectedChat?.chatMessages}
          />
        ) : (
          <Typography mt={4} ml={4} color="text.secondary">Bir talep seçin ve chat başlatın.</Typography>
        )}
      </Box>
    </Box>
  );
} 