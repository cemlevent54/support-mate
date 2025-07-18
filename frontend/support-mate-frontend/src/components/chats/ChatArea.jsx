import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { MdSend } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import socket from '../../socket/socket';
import { listMessagesByTicketId } from '../../api/messagesApi';
import { getUserIdFromJWT } from '../../utils/jwt';

const userId = getUserIdFromJWT();
const userName = localStorage.getItem('userName') || 'Kullanıcı';

export default function ChatArea({ messages, input, setInput, handleSend, openTaskModal, ticketId, chatId, ticketTitle }) {
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [backendMessages, setBackendMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  // Eğer setInput gelmediyse local state kullan
  const [localInput, setLocalInput] = useState("");
  const effectiveInput = typeof input === "string" ? input : localInput;
  const effectiveSetInput = typeof setInput === "function" ? setInput : setLocalInput;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Her render'da logla
  useEffect(() => {
    console.log('ChatArea render: messages', messages);
    if (Array.isArray(messages)) {
      messages.forEach((msg, idx) => {
        console.log(`ChatArea - Gösterilecek mesaj[${idx}]:`, msg);
      });
    }
    console.log('ChatArea render: input', input);
  });

  useEffect(() => {
    // Yeni mesaj eventini dinle
    socket.on('new_message', (data) => {
      console.log('Yeni mesaj geldi:', data);
      // Burada üst componentten gelen bir setMessages fonksiyonu varsa onu çağırabilirsiniz
      // veya bir callback ile parent'a iletebilirsiniz
      // Örnek: setMessages(prev => [...prev, data]);
    });
    // Temizlik
    return () => {
      socket.off('new_message');
    };
  }, []);

  // Diğer kullanıcıdan gelen typing eventlerini dinle
  useEffect(() => {
    const handleTyping = (data) => {
      console.log('[DEBUG][ChatArea][TYPING] Event geldi:', data, 'chatId:', chatId, 'userId:', userId);
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

  // Kullanıcı inputa yazdıkça typing eventini gönder
  const handleInputChange = (e) => {
    effectiveSetInput(e.target.value);
    if (!chatId) return;
    if (e.target.value) {
      socket.emit('typing', { chatId, userId });
    } else {
      socket.emit('stop_typing', { chatId, userId });
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId, userId });
    }, 1000);
  };

  // Eğer ticketId varsa backendden mesajları çek
  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    listMessagesByTicketId(ticketId)
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setBackendMessages(res.data.map(msg => ({
            from: msg.senderRole === 'Customer Supporter' ? 'support' : 'user',
            text: msg.text,
            time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          })));
          console.log('res:', res);
        } else {
          setBackendMessages([]);
        }
      })
      .catch(() => setBackendMessages([]))
      .finally(() => setLoading(false));
  }, [ticketId]);

  // Odaya katıl/ayrıl (join_room/leave_room)
  useEffect(() => {
    if (!chatId) return;
    console.log('[ChatArea][SOCKET][JOIN_ROOM] Odaya katılıyor:', { chatId, userId });
    socket.emit('join_room', { chatId, userId });
    return () => {
      console.log('[ChatArea][SOCKET][LEAVE_ROOM] Odadan ayrılıyor:', { chatId, userId });
      socket.emit('leave_room', { chatId, userId });
    };
  }, [chatId, userId]);

  // new_message eventini dinle
  useEffect(() => {
    if (!chatId) return;
    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        setBackendMessages(prev => [
          ...prev,
          {
            from: data.user && data.user.role === 'agent' ? 'support' : 'user',
            text: data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [chatId]);

  useEffect(() => {
    const handleUserJoined = () => {};
    const handleUserOnline = () => {};
    socket.on('user_joined', handleUserJoined);
    socket.on('user_online', handleUserOnline);
    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('user_online', handleUserOnline);
    };
  }, []);

  // Mesaj gönderme fonksiyonu (optimistic update)
  const handleFormSend = (e) => {
    e.preventDefault();
    if (!chatId || !effectiveInput.trim()) return;
    // Optimistic update
    setBackendMessages(prev => [
      ...prev,
      {
        from: 'support',
        text: effectiveInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    socket.emit('send_message', {
      chatId,
      userId,
      message: effectiveInput,
    });
    effectiveSetInput("");
  };

  return (
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
                {msg.text}
                {msg.attachments && msg.attachments.length > 0 && (
                  <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {msg.attachments.map((file, i) => (
                      <li key={i}>
                        <a href={`/${file}`} target="_blank" rel="noopener noreferrer">{file}</a>
                      </li>
                    ))}
                  </ul>
                )}
                <Box fontSize={12} color="#888" textAlign="right" mt={0.5}>{msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Box>
              </Box>
            ))
          )
        ) : (
          (messages || []).map((msg, idx) => (
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
          ))
        )}
        <div ref={messagesEndRef} />
        {isTyping && (
          <Box fontSize={14} color="#888" mb={1}>
            Kullanıcı yazıyor...
          </Box>
        )}
      </Box>
      <Box p={2} borderTop="1px solid #eee" bgcolor="#fafafa">
        <form onSubmit={handleFormSend} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={effectiveInput}
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
  );
} 