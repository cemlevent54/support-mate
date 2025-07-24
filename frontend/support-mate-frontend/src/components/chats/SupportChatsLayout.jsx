import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatList from './ChatList';
import SupportChats from './SupportChats';
import { listAgentChatsWithMessages } from '../../api/messagesApi';
import socket from '../../socket/socket';
import { useTranslation } from 'react-i18next';
import CircularProgress from '@mui/material/CircularProgress';
import { getUserIdFromJWT } from '../../utils/jwt';

export default function SupportChatsLayout() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [agentChats, setAgentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const myUserId = getUserIdFromJWT();

  // fetchAndAddNewChat fonksiyonunu component scope'unda tanımla
  const fetchAndAddNewChat = async (chatId, data, forceFetchMessages = false) => {
    try {
      let found = null;
      if (forceFetchMessages) {
        // Yeni chat için mesajları API'den çek
        const res = await listAgentChatsWithMessages();
        if (res.success && res.data) {
          found = res.data.find(chat => String(chat._id || chat.chatId || chat.id) === String(chatId));
        }
      }
      if (found) {
        setAgentChats(prev => [found, ...prev.filter(chat => String(chat._id || chat.chatId || chat.id) !== String(chatId))]);
        return;
      }
      // Eğer detay bulunamazsa, temel bilgilerle ekle
      setAgentChats(prev => [
        {
          id: chatId,
          chatId: chatId,
          messages: [{
            senderId: data.userId,
            text: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.timestamp || new Date().toISOString()
          }],
          lastMessage: data.message,
          lastMessageTime: data.timestamp || new Date().toISOString(),
        },
        ...prev
      ]);
    } catch (e) {
      setAgentChats(prev => [
        {
          id: chatId,
          chatId: chatId,
          messages: [{
            senderId: data.userId,
            text: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.timestamp || new Date().toISOString()
          }],
          lastMessage: data.message,
          lastMessageTime: data.timestamp || new Date().toISOString(),
        },
        ...prev
      ]);
    }
  };

  // handleUserJoinedChat fonksiyonunu component scope'unda tanımla
  const handleUserJoinedChat = (chatId) => {
    fetchAndAddNewChat(chatId, {}, true);
  };

  // Component mount olduğunda agent chatlerini çek
  useEffect(() => {
    async function fetchAgentChats() {
      setLoading(true);
      try {
        const response = await listAgentChatsWithMessages();
        if (response.success && response.data) {
          setAgentChats(response.data);
        }
      } catch (error) {
        setAgentChats([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAgentChats();
  }, []);

  // chatId değiştiğinde veya agentChats yüklendiğinde ilgili chat'i seçili yap
  useEffect(() => {
    if (chatId && agentChats.length > 0) {
      const found = agentChats.find(chat => String(chat._id || chat.chatId || chat.id) === String(chatId));
      if (found) setSelectedChat(found);
    }
  }, [chatId, agentChats]);

  // Yeni mesaj geldiğinde agentChats listesini güncelle
  useEffect(() => {
    const handleNewMessage = async (data) => {
      setAgentChats(prevChats => {
        let updated = false;
        let updatedChat = null;
        const newChats = prevChats.filter(chat => {
          const chatIds = [chat._id, chat.chatId, chat.id].map(id => id && String(id)).filter(Boolean);
          if (chatIds.includes(String(data.chatId))) {
            updated = true;
            const msgs = Array.isArray(chat.messages) ? [...chat.messages] : (Array.isArray(chat.chatMessages) ? [...chat.chatMessages] : []);
            msgs.push({
              senderId: data.userId,
              text: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              createdAt: data.timestamp || new Date().toISOString()
            });
            updatedChat = {
              ...chat,
              messages: msgs,
              lastMessage: data.message,
              lastMessageTime: data.timestamp || new Date().toISOString(),
            };
            return false;
          }
          return true;
        });
        if (updated && updatedChat) {
          return [updatedChat, ...newChats];
        } else {
          // --- YENİ CHAT GELDİ ---
          // Agent otomatik olarak join_room emit etsin
          if (data.chatId && myUserId) {
            socket.emit('join_room', { chatId: data.chatId, userId: myUserId, userRole: 'Support' });
          }
          fetchAndAddNewChat(data.chatId, data, true); // true: yeni chat, mesajları API'den çek
          setSelectedChat({
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
          return [
            {
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
            },
            ...newChats
          ];
        }
      });
      setSelectedChat(prev => {
        if (!prev) return prev;
        const chatIds = [prev._id, prev.chatId, prev.id].map(id => id && String(id)).filter(Boolean);
        if (chatIds.includes(String(data.chatId))) {
          const msgs = Array.isArray(prev.messages) ? [...prev.messages] : (Array.isArray(prev.chatMessages) ? [...prev.chatMessages] : []);
          msgs.push({
            senderId: data.userId,
            text: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.timestamp || new Date().toISOString()
          });
          return {
            ...prev,
            messages: msgs,
            lastMessage: data.message,
            lastMessageTime: data.timestamp || new Date().toISOString(),
          };
        }
        return prev;
      });
    };

    socket.on('receive_chat_message', handleNewMessage);
    return () => socket.off('receive_chat_message', handleNewMessage);
  }, []);

  const handleSelectChat = (chatObj) => {
    setSelectedChat(chatObj);
    const chatId = chatObj?._id || chatObj?.chatId || chatObj?.id;
    if (chatId) {
      navigate(`/support/chats/${chatId}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" minHeight="100vh">
      <ChatList 
        activeChatTicketId={chatId} 
        onSelectChat={handleSelectChat}
        refreshTrigger={0}
        agentChats={agentChats}
        loading={loading}
        onUserJoinedChat={handleUserJoinedChat}
      />
      <Box flex={1} height="100vh" bgcolor="#f5f5f5">
        {chatId && selectedChat ? (
          <SupportChats 
            chat={selectedChat}
            myUserId={myUserId}
          />
        ) : (
          <Typography mt={4} ml={4} color="text.secondary">{t('supportDashboard.selectRequestToStartChat')}</Typography>
        )}
      </Box>
    </Box>
  );
} 