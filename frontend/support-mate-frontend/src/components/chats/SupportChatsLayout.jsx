import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatList from './ChatList';
import SupportChats from './SupportChats';

export default function SupportChatsLayout() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const handleSelectChat = (ticketId, title) => {
    navigate(`/support/chats/${ticketId}`);
  };

  return (
    <Box display="flex" minHeight="100vh">
      <ChatList 
        activeChatTicketId={chatId} 
        onSelectChat={handleSelectChat} 
        refreshTrigger={0}
      />
      <Box flex={1} height="100vh" bgcolor="#f5f5f5">
        {chatId ? (
          <SupportChats 
            ticketId={chatId} 
            ticketTitle={""} 
            onMessageSent={() => {}}
          />
        ) : (
          <Typography mt={4} ml={4} color="text.secondary">Bir talep seçin ve chat başlatın.</Typography>
        )}
      </Box>
    </Box>
  );
} 