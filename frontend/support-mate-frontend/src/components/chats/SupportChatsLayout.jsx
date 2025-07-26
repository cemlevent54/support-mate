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
    setSelectedChat(chatObj);
    const chatId = chatObj?._id || chatObj?.chatId || chatObj?.id;
    if (chatId) {
      navigate(`/support/chats/${chatId}`);
    }
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