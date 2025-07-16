import React, { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { MdSend } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

export default function ChatArea({ messages, input, setInput, handleSend, openTaskModal }) {
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Her render'da logla
  useEffect(() => {
    console.log('ChatArea render: messages', messages);
    console.log('ChatArea render: input', input);
  });

  return (
    <Box flex={1} display="flex" flexDirection="column" justifyContent="flex-end" height="100%">
      <Box flex={1} p={3} overflow="auto" display="flex" flexDirection="column">
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            alignSelf={msg.from === 'support' ? 'flex-end' : 'flex-start'}
            bgcolor={msg.from === 'support' ? '#e3f2fd' : '#f1f1f1'}
            color="#222"
            px={2} py={1.5} mb={1}
            borderRadius={3}
            boxShadow={1}
            maxWidth="70%"
          >
            {msg.text}
            <Box fontSize={12} color="#888" textAlign="right" mt={0.5}>{msg.time}</Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box p={2} borderTop="1px solid #eee" bgcolor="#fafafa">
        <form onSubmit={e => { console.log('Form submit'); handleSend(e); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={input}
            onChange={e => {
              setInput(e.target.value);
              console.log('Input değişti:', e.target.value);
            }}
            placeholder={t('chatArea.placeholder')}
            style={{ flex: 1, border: '1px solid #ddd', borderRadius: 22, padding: '10px 16px', fontSize: 16, outline: 'none', background: '#fff', marginRight: 8 }}
          />
          <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: '50%', minWidth: 0, width: 44, height: 44, p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdSend size={22} />
          </Button>
          <Button variant="outlined" color="primary" sx={{ height: 44, borderRadius: 22, fontWeight: 600, px: 2.5 }} onClick={openTaskModal}>
            {t('chatArea.createTask')}
          </Button>
        </form>
      </Box>
    </Box>
  );
} 