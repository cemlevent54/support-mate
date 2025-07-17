import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { listMessages, sendMessage, listMessagesByTicketId } from '../api/messagesApi';

const TicketChatDrawer = ({ ticket, onClose, useTicketIdForMessages }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

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
          return;
        }
        if (res.success && Array.isArray(res.data)) {
          setMessages(res.data);
        } else {
          setMessages([]);
        }
      } catch (e) {
        setMessages([]);
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

  // Mesaj gönder
  const handleSend = async () => {
    if (!input.trim() || !ticket || !ticket.chatId) return;
    setSending(true);
    try {
      const payload = {
        chatId: ticket.chatId,
        text: input,
        senderId: ticket.customerId, // veya login olan userId
        // senderRole: ...
      };
      const res = await sendMessage(payload);
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setInput("");
      }
    } catch (e) {
      // Hata yönetimi eklenebilir
    } finally {
      setSending(false);
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
      </Box>
      <Divider />
      <Box display="flex" gap={1} mt={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Mesaj yaz..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={sending}
        />
        <Button variant="contained" onClick={handleSend} disabled={sending || !input.trim()}>Gönder</Button>
      </Box>
    </Box>
  );
};

export default TicketChatDrawer; 