import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatList from './ChatList';
import SupportChats from './SupportChats';
import socket from '../../socket/socket';
import { useTranslation } from 'react-i18next';
import CircularProgress from '@mui/material/CircularProgress';
import { getUserIdFromJWT } from '../../utils/jwt';

export default function SupportChatsLayout() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const { t } = useTranslation();
  const myUserId = getUserIdFromJWT();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  console.log('[SupportChatsLayout] chatId from params:', chatId);
  console.log('[SupportChatsLayout] selectedChat:', selectedChat);

  // handleUserJoinedChat fonksiyonunu component scope'unda tanımla (isteğe bağlı, gerekirse kullanılabilir)
  const handleUserJoinedChat = (chatId) => {
    // Artık chat listesini burada güncellemiyoruz, ChatList kendi içinde hallediyor
  };

  // Sadece chatId değiştiğinde seçili chatId'yi güncelle
  useEffect(() => {
    if (!chatId) setSelectedChat(null);
    // Seçili chat objesini ChatList'ten almak için bir mekanizma gerekiyorsa, prop/callback ile yapılabilir
  }, [chatId]);

  const handleSelectChat = (chatObj) => {
    console.log('[SupportChatsLayout] handleSelectChat called with:', chatObj);
    setSelectedChat(chatObj);
    const chatId = chatObj?._id || chatObj?.chatId || chatObj?.id;
    console.log('[SupportChatsLayout] Extracted chatId:', chatId);
    if (chatId) {
      navigate(`/support/chats/${chatId}`);
    }
  };

  // URL'den chatId geldiğinde, ChatList'ten bu chat'i bulup selectedChat'e set et
  useEffect(() => {
    if (chatId && !selectedChat) {
      // ChatList'ten chat objesini almak için bir callback mekanizması gerekiyor
      // Şimdilik bu işlemi ChatList component'inde yapacağız
    }
  }, [chatId, selectedChat]);

  // ChatList'ten chat objesi almak için callback
  const handleChatFound = (chatObj) => {
    console.log('[SupportChatsLayout] handleChatFound called with:', chatObj);
    setSelectedChat(chatObj);
  };

  // ChatPanel veya SupportChats gibi bir componentten yeni chat oluşturulunca tetiklenecek fonksiyon
  const handleChatCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box display="flex" minHeight="100vh">
      <ChatList 
        activeChatTicketId={chatId} 
        onSelectChat={handleSelectChat}
        onUserJoinedChat={handleUserJoinedChat}
        onChatFound={handleChatFound}
        refreshTrigger={refreshTrigger}
      />
      <Box flex={1} height="100vh" bgcolor="#f5f5f5">
        {chatId && selectedChat ? (
          <SupportChats 
            chat={selectedChat}
            myUserId={myUserId}
            onChatCreated={handleChatCreated}
          />
        ) : (
          <Typography mt={4} ml={4} color="text.secondary">{t('supportDashboard.selectRequestToStartChat')}</Typography>
        )}
      </Box>
    </Box>
  );
} 