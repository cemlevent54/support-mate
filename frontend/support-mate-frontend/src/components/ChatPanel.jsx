import React from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InfoIcon from '@mui/icons-material/Info';

const ChatPanel = ({ 
  chatTicket, 
  messages, 
  input, 
  sending, 
  someoneTyping, 
  messagesEndRef, 
  onClose, 
  onSend, 
  onInputChange,
  isModal = false
}) => {
  const { t } = useTranslation();
  
  // Debug için console.log
  console.log('ChatPanel - chatTicket:', chatTicket);
  console.log('ChatPanel - assignedAgentId:', chatTicket?.assignedAgentId);
  
  return (
    <Box 
      flex={1} 
      minWidth={isModal ? 400 : 400} 
      maxWidth={isModal ? 400 : 600} 
      display="flex" 
      flexDirection="column" 
      minHeight={0}
      height={isModal ? '70vh' : 'auto'}
    >
      <Box 
        bgcolor="#f9f9f9" 
        borderRadius={2} 
        boxShadow={3} 
        p={2} 
        display="flex" 
        flexDirection="column" 
        flex={1} 
        minHeight={0} 
        mt={isModal ? 0 : 6}
        height="100%"
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6">{t('chatPanel.title', { title: chatTicket?.title })}</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        
        {/* Agent durumu bildirimi */}
        {chatTicket && !chatTicket.assignedAgentId && (
          <Alert 
            severity="info" 
            icon={<InfoIcon />}
            sx={{ mb: 2, borderRadius: 1 }}
          >
            {t('chatPanel.noAgentAssigned')}
          </Alert>
        )}
        
        <Box 
          flex={1} 
          my={2} 
          p={1} 
          bgcolor="#fff" 
          borderRadius={1} 
          boxShadow={1} 
          minHeight={0}
          style={{
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#c1c1c1 #f1f1f1'
          }}
          sx={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}
        >
          {messages.length === 0 ? (
            <Typography color="text.secondary" align="center" mt={2}>{t('chatPanel.noMessages')}</Typography>
          ) : (
            messages.map((msg, idx) => (
              <Box key={msg._id || idx} mb={1} display="flex" flexDirection="column" alignItems={msg.senderId === chatTicket?.customerId ? 'flex-end' : 'flex-start'}>
                <Box px={2} py={1} bgcolor={msg.senderId === chatTicket?.customerId ? '#e3f2fd' : '#f1f1f1'} borderRadius={2} maxWidth="70%">
                  <Typography fontSize={15}>{typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}</Typography>
                  <Typography fontSize={11} color="#888" textAlign="right">
                    {(() => {
                      const timestamp = msg.timestamp || msg.createdAt;
                      if (!timestamp) return '';
                      
                      const date = new Date(timestamp);
                      return date.toLocaleString('tr-TR', {
                        timeZone: 'Europe/Istanbul'
                      });
                    })()}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
          {someoneTyping && (
            <Typography color="primary" fontSize={13} mt={1} mb={0.5}>
              {t('chatPanel.typing')}
            </Typography>
          )}
        </Box>
        <Divider />
        <Box display="flex" gap={1} mt={2} flexShrink={0}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('chatPanel.placeholder')}
            value={input}
            onChange={onInputChange}
            onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
            disabled={sending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fff',
              }
            }}
          />
          <Button 
            variant="contained" 
            onClick={onSend} 
            disabled={sending || !input.trim()}
            sx={{ borderRadius: 2, minWidth: 80 }}
          >
            {t('chatPanel.send')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPanel; 