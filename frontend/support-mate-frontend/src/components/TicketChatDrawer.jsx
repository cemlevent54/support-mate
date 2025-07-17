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
  const [currentChatId, setCurrentChatId] = useState(ticket?.chatId || null);
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
          setCurrentChatId(null);
          return;
        }
        if (res.success && res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
          setCurrentChatId(res.data.chatId);
        } else if (res.success && Array.isArray(res.data)) {
          setMessages(res.data);
          setCurrentChatId(ticket.chatId || null);
        } else {
          setMessages([]);
          setCurrentChatId(null);
        }
      } catch (e) {
        setMessages([]);
        setCurrentChatId(null);
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
    if (!ticket || !ticket.chatId) return;
    const user = { id: myUserId, name: myUserName };
    console.log('[SOCKET][JOIN_ROOM] Odaya katılıyor:', { chatId: ticket.chatId, user });
    socket.emit('join_room', { chatId: ticket.chatId, user });
    return () => {
      console.log('[SOCKET][LEAVE_ROOM] Odadan ayrılıyor:', { chatId: ticket.chatId, user });
      socket.emit('leave_room', { chatId: ticket.chatId, user });
    };
  }, [ticket?.chatId, myUserId, myUserName]);

  // new_message eventini dinle
  useEffect(() => {
    if (!ticket || !ticket.chatId) return;
    const handleNewMessage = (data) => {
      if (data.chatId === ticket.chatId) {
        console.log('[SOCKET][NEW_MESSAGE] Yeni mesaj alındı:', data);
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
  }, [ticket?.chatId]);

  // typing ve stop_typing eventlerini dinle (sadece başkası yazıyorsa göster)
  useEffect(() => {
    if (!ticket || !ticket.chatId) return;
    const handleTyping = (data) => {
      if (data.chatId === ticket.chatId && data.user?.id !== myUserId) {
        console.log('[SOCKET][TYPING] Başkası yazıyor:', data);
        setSomeoneTyping(true);
      }
    };
    const handleStopTyping = (data) => {
      if (data.chatId === ticket.chatId && data.user?.id !== myUserId) {
        console.log('[SOCKET][STOP_TYPING] Başkası yazmayı bıraktı:', data);
        setSomeoneTyping(false);
      }
    };
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [ticket?.chatId, myUserId]);

  // Mesaj gönder
  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;
    setSending(true);
    try {
      const payload = {
        chatId: currentChatId,
        text: input,
        senderId: myUserId,
      };
      console.log('[SOCKET][SEND_MESSAGE] Mesaj gönderiliyor:', payload);
      const res = await sendMessage(payload);
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setInput("");
        setSomeoneTyping(false);
        socket.emit('stop_typing', { chatId: currentChatId, user: { id: myUserId, name: myUserName } });
      }
    } catch (e) {
      console.error('[SOCKET][SEND_MESSAGE][HATA] Mesaj gönderilemedi:', e);
    } finally {
      setSending(false);
    }
  };

  // Kullanıcı yazarken typing eventini gönder
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!ticket || !ticket.chatId) return;
    const user = { id: myUserId, name: myUserName };
    if (e.target.value) {
      console.log('[SOCKET][TYPING] Yazıyor event gönderiliyor:', { chatId: ticket.chatId, user });
      socket.emit('typing', { chatId: ticket.chatId, user });
    } else {
      console.log('[SOCKET][STOP_TYPING] Yazmayı bıraktı event gönderiliyor:', { chatId: ticket.chatId, user });
      socket.emit('stop_typing', { chatId: ticket.chatId, user });
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