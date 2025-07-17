import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { MdSend } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import socket from '../../socket/socket';
import { listMessagesByTicketId } from '../../api/messagesApi';

export default function ChatArea({ messages, input, setInput, handleSend, openTaskModal, ticketId, ticketTitle }) {
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
    socket.on('typing', (data) => {
      setIsTyping(true);
    });
    socket.on('stop_typing', (data) => {
      setIsTyping(false);
    });
    return () => {
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, []);

  // Kullanıcı inputa yazdıkça typing eventini gönder
  const handleInputChange = (e) => {
    effectiveSetInput(e.target.value);
    // Typing eventini gönder
    socket.emit('typing', {
      chatId: 'ornekChatId', // Gerçek chatId ile değiştirin
      user: { id: 'kullanici_id', name: 'Kullanıcı Adı' }, // Gerçek kullanıcı ile değiştirin
    });
    // Kullanıcı yazmayı bırakınca stop_typing eventini gönder (ör: 1 sn sonra)
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', {
        chatId: 'ornekChatId',
        user: { id: 'kullanici_id', name: 'Kullanıcı Adı' },
      });
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
            from: msg.senderRole === 'agent' ? 'support' : 'user',
            text: msg.text,
            time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          })));
        } else {
          setBackendMessages([]);
        }
      })
      .catch(() => setBackendMessages([]))
      .finally(() => setLoading(false));
  }, [ticketId]);

  // Odaya katıl/ayrıl (join_room/leave_room)
  useEffect(() => {
    if (!ticketId) return;
    const user = { id: localStorage.getItem('userId') || 'unknown', name: localStorage.getItem('userName') || 'Kullanıcı' };
    socket.emit('join_room', { chatId: ticketId, user });
    return () => {
      socket.emit('leave_room', { chatId: ticketId, user });
    };
  }, [ticketId]);

  // new_message eventini dinle
  useEffect(() => {
    if (!ticketId) return;
    const handleNewMessage = (data) => {
      if (data.chatId === ticketId) {
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
  }, [ticketId]);

  return (
    <Box flex={1} display="flex" flexDirection="column" justifyContent="flex-end" height="100%">
      <Box flex={1} p={3} overflow="auto" display="flex" flexDirection="column">
        {ticketId ? (
          loading ? (
            <div>Yükleniyor...</div>
          ) : (
            backendMessages.map((msg, idx) => (
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
          )
        ) : (
          messages.map((msg, idx) => (
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
        <form onSubmit={e => {
          e.preventDefault();
          // Socket ile mesaj gönderme örneği
          socket.emit('send_message', {
            chatId: 'ornekChatId', // Gerçek chatId ile değiştirin
            user: { id: 'kullanici_id', name: 'Kullanıcı Adı' }, // Gerçek kullanıcı ile değiştirin
            message: effectiveInput,
          });
          if (typeof handleSend === 'function') handleSend(e); // Mevcut prop fonksiyonunu da çağırmaya devam edin
        }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={effectiveInput}
            onChange={handleInputChange}
            onBlur={() => {
              socket.emit('stop_typing', {
                chatId: 'ornekChatId',
                user: { id: 'kullanici_id', name: 'Kullanıcı Adı' },
              });
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