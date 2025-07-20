import React, { useState, useEffect, useRef } from 'react';
import TaskCreateModal from './TaskCreateModal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { MdSend } from 'react-icons/md';
import { listMessagesByTicketId, sendMessage } from '../../api/messagesApi';
import { getUserIdFromJWT } from '../../utils/jwt';
import { useTranslation } from 'react-i18next';
import socket from '../../socket/socket';

export default function SupportChats({ ticketId, ticketTitle, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();
  const userId = getUserIdFromJWT();

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      setChatId(null);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await listMessagesByTicketId(ticketId);
        if (res && res.success && res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
          setChatId(res.data.chatId || null);
        } else {
          setMessages([]);
          setChatId(null);
        }
      } catch (e) {
        setMessages([]);
        setChatId(null);
      }
    };
    fetchMessages();
  }, [ticketId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    console.log('[SupportChats][SOCKET][JOIN_ROOM] Odaya katılıyor:', { chatId, userId });
    socket.emit('join_room', { chatId, userId, userRole: 'Support' });
    return () => {
      console.log('[SupportChats][SOCKET][LEAVE_ROOM] Odadan ayrılıyor:', { chatId, userId });
      socket.emit('leave_room', { chatId, userId });
    };
  }, [chatId, userId]);

  useEffect(() => {
    if (!chatId) return;
    const handleNewMessage = (data) => {
      if (data.chatId === chatId && data.userId !== userId) {
        setMessages(prev => [
          ...prev,
          {
            senderId: data.userId,
            text: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.timestamp || new Date().toISOString()
          }
        ]);
      }
    };
    socket.on('receive_chat_message', handleNewMessage);
    return () => socket.off('receive_chat_message', handleNewMessage);
  }, [chatId, userId]);

  useEffect(() => {
    const handleTyping = (data) => {
      console.log('[DEBUG][SupportChats][TYPING] Event geldi:', data, 'chatId:', chatId, 'userId:', userId);
      if (data && data.chatId === chatId && data.userId !== userId) {
        setIsTyping(true);
      }
    };
    const handleStopTyping = (data) => {
      if (data && data.chatId === chatId && data.userId !== userId) {
        setIsTyping(false);
      }
    };
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [chatId, userId]);

  useEffect(() => {
    const handleUserJoined = (payload) => {
      if (payload.chatId === chatId && payload.userId !== userId) {
        // window.alert('Karşı taraf odaya katıldı!'); // kaldırıldı
      }
    };
    const handleUserOnline = () => {};
    socket.on('user_joined', handleUserJoined);
    socket.on('user_online', handleUserOnline);
    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('user_online', handleUserOnline);
    };
  }, [chatId, userId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!chatId) return;
    let receiverId = null;
    if (messages && messages.length > 0 && messages[0].senderId && messages[0].senderId !== userId) {
      receiverId = messages[0].senderId;
    } else if (messages && messages.length > 0 && messages[0].customerId) {
      receiverId = messages[0].customerId;
    }
    if (e.target.value) {
      socket.emit('typing', { chatId, userId, receiverId, isTyping: true });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { chatId, userId, receiverId });
      }, 1000);
    } else {
      socket.emit('stop_typing', { chatId, userId, receiverId });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;
    
    // Optimistic update - mesajı hemen ekle
    const newMessage = {
      text: input,
      senderId: userId,
      senderRole: 'Support',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Socket'e gönder
    socket.emit('send_message', { chatId, userId, message: input });
    
    // API'ye gönder
    try {
      await sendMessage({ chatId, userId, text: input });
      // Mesaj gönderildikten sonra parent'a bildir
      if (onMessageSent) {
        onMessageSent(newMessage);
      }
    } catch (error) {
      // Hata durumunda mesajı geri al
      setMessages(prev => prev.filter(msg => msg !== newMessage));
      console.error('Mesaj gönderilemedi:', error);
    }
    
    setInput("");
  };

  const openTaskModal = () => setTaskModalOpen(true);
  const closeTaskModal = () => setTaskModalOpen(false);

  return (
    <Box display="flex" height="100%" boxShadow={2} borderRadius={2} bgcolor="#fff" overflow="hidden">
      <Box flex={1} display="flex" flexDirection="column" justifyContent="flex-end" height="100%">
        <Box flex={1} p={3} overflow="auto" display="flex" flexDirection="column">
          {chatId ? (
            loading ? (
              <div>Yükleniyor...</div>
            ) : (
              (messages || []).map((msg, idx) => (
                <Box
                  key={idx}
                  alignSelf={msg.senderRole === 'Customer Supporter' || msg.senderRole === 'Support' ? 'flex-end' : 'flex-start'}
                  bgcolor={msg.senderRole === 'Customer Supporter' || msg.senderRole === 'Support' ? '#e3f2fd' : '#f1f1f1'}
                  color="#222"
                  px={2} py={1.5} mb={1}
                  borderRadius={3}
                  boxShadow={1}
                  maxWidth="70%"
                >
                  {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                      {msg.attachments.map((file, i) => (
                        <li key={i}>
                          <a href={`/${file}`} target="_blank" rel="noopener noreferrer">{file}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Box fontSize={12} color="#888" textAlign="right" mt={0.5}>
                    {(() => {
                      const timestamp = msg.timestamp || msg.createdAt;
                      if (!timestamp) return '';
                      
                      const date = new Date(timestamp);
                      return date.toLocaleString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'Europe/Istanbul'
                      });
                    })()}
                  </Box>
                </Box>
              ))
            )
          ) : (
            <div>Chat başlatılmadı.</div>
          )}
          <div ref={messagesEndRef} />
          {isTyping && (
            <Box fontSize={14} color="#888" mb={1}>
              Kullanıcı yazıyor...
            </Box>
          )}
        </Box>
        <Box p={2} borderTop="1px solid #eee" bgcolor="#fafafa">
          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={input}
              onChange={handleInputChange}
              onBlur={() => {
                if (!chatId) return;
                socket.emit('stop_typing', { chatId, userId });
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
      <TaskCreateModal open={taskModalOpen} onClose={closeTaskModal} />
    </Box>
  );
} 