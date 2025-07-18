import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { listMessages, sendMessage, listMessagesByTicketId } from '../api/messagesApi';
import socket from '../socket/socket';

// JWT çözümleyici yardımcı fonksiyon
function decodeJWT(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (e) {
    return null;
  }
}

const TicketChatDrawer = ({ ticket, onClose, useTicketIdForMessages }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const [chatId, setChatId] = useState(ticket?.chatId || null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('jwt');
  const decoded = decodeJWT(token);
  const myUserId = decoded && (decoded.userId || decoded.id || decoded.sub) ? (decoded.userId || decoded.id || decoded.sub) : 'unknown';
  const myUserName = localStorage.getItem('userName') || 'Kullanıcı';

  // Chat mesajlarını çek
  useEffect(() => {
    const fetchMessages = async () => {
      if (!ticket) return;
      setLoading(true);
      try {
        let res;
        if (useTicketIdForMessages && ticket.ticketId) {
          res = await listMessagesByTicketId(ticket.ticketId);
        } else if (ticket.chatId) {
          res = await listMessages(ticket.chatId);
        } else {
          setMessages([]);
          setLoading(false);
          setChatId(null);
          return;
        }
        if (res.success && res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
          setChatId(res.data.chatId || null);
        } else if (res.success && Array.isArray(res.data)) {
          setMessages(res.data);
          setChatId(ticket.chatId || null);
        } else {
          setMessages([]);
          setChatId(null);
        }
      } catch (e) {
        setMessages([]);
        setChatId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [ticket?.chatId, ticket?.ticketId, useTicketIdForMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Odaya katıl/ayrıl (join_room/leave_room)
  useEffect(() => {
    if (!chatId) return;
    console.log('[SOCKET][JOIN_ROOM] Odaya katılıyor:', { chatId, userId: myUserId });
    socket.emit('join_room', { chatId, userId: myUserId });
    return () => {
      console.log('[SOCKET][LEAVE_ROOM] Odadan ayrılıyor:', { chatId, userId: myUserId });
      socket.emit('leave_room', { chatId, userId: myUserId });
    };
  }, [chatId, myUserId]);

  // new_message eventini dinle
  useEffect(() => {
    if (!chatId) return;
    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [
          ...prev,
          {
            _id: data._id || Math.random().toString(36),
            senderId: data.user?.id,
            text: data.message,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [chatId]);

  // typing ve stop_typing eventlerini dinle (sadece başkası yazıyorsa göster)
  useEffect(() => {
    if (!chatId) return;
    const handleTyping = (data) => {
      console.log('[DEBUG][TicketChatDrawer][TYPING] Event geldi:', data, 'chatId:', chatId, 'myUserId:', myUserId);
      if (data && data.chatId === chatId && data.userId !== myUserId) {
        setSomeoneTyping(true);
      }
    };
    const handleStopTyping = (data) => {
      if (data && data.chatId === chatId && data.userId !== myUserId) {
        setSomeoneTyping(false);
      }
    };
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [chatId, myUserId]);

  // Kullanıcıların odaya katılıp/çıkışını dinle
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

  // Mesaj gönder
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;
    setSending(true);
    // Optimistic update: Mesajı hemen ekle
    setMessages(prev => [
      ...prev,
      {
        _id: Math.random().toString(36),
        senderId: myUserId,
        senderRole: 'User',
        text: input,
        createdAt: new Date().toISOString()
      }
    ]);
    // Socket emit
    socket.emit('send_message', {
      chatId,
      userId: myUserId,
      message: input,
      senderId: myUserId,
      senderRole: 'User',
    });
    // API'ye de gönder (isteğe bağlı, backend ile uyumluysa)
    try {
      await sendMessage({
        chatId,
        userId: myUserId,
        message: input,
        senderId: myUserId,
        senderRole: 'User',
      });
      setInput("");
      setSomeoneTyping(false);
      socket.emit('stop_typing', { chatId, userId: myUserId });
    } catch (e) {
      // Hata durumunda kullanıcıya bildirim eklenebilir
    } finally {
      setSending(false);
    }
  };

  // Kullanıcı yazarken typing eventini gönder
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!chatId) return;
    if (e.target.value) {
      console.log('[SOCKET][TYPING] Yazıyor event gönderiliyor:', { chatId, userId: myUserId });
      socket.emit('typing', { chatId, userId: myUserId });
    } else {
      console.log('[SOCKET][STOP_TYPING] Yazmayı bıraktı event gönderiliyor:', { chatId, userId: myUserId });
      socket.emit('stop_typing', { chatId, userId: myUserId });
    }
  };

  return (
    <Box bgcolor="#f9f9f9" borderRadius={2} boxShadow={3} p={2} height="100%" display="flex" flexDirection="column">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Chat: {ticket?.title}</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>
      <Divider />
      <Box flex={1} my={2} p={1} bgcolor="#fff" borderRadius={1} boxShadow={1} style={{overflowY: 'auto', minHeight: 200}}>
        {loading ? (
          <Typography color="text.secondary" align="center" mt={2}>Yükleniyor...</Typography>
        ) : messages.length === 0 ? (
          <Typography color="text.secondary" align="center" mt={2}>Henüz mesaj yok.</Typography>
        ) : (
          messages.map((msg, idx) => (
            <Box key={msg._id || idx} mb={1} display="flex" flexDirection="column" alignItems={msg.senderId === ticket.customerId ? 'flex-end' : 'flex-start'}>
              <Box px={2} py={1} bgcolor={msg.senderId === ticket.customerId ? '#e3f2fd' : '#f1f1f1'} borderRadius={2} maxWidth="70%">
                <Typography fontSize={15}>{msg.text}</Typography>
                <Typography fontSize={11} color="#888" textAlign="right">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</Typography>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
        {someoneTyping && (
          <Typography color="primary" fontSize={13} mt={1} mb={0.5}>
            Yazıyor...
          </Typography>
        )}
      </Box>
      <Divider />
      <Box display="flex" gap={1} mt={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Mesaj yaz..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={sending}
        />
        <Button variant="contained" onClick={handleSend} disabled={sending || !input.trim()}>Gönder</Button>
      </Box>
    </Box>
  );
};

export default TicketChatDrawer; 