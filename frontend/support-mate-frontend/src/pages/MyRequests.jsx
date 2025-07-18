import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import { listTicketsForUser } from '../api/ticketApi';
import { listMessagesByTicketId, sendMessage } from '../api/messagesApi';
import { getUserIdFromJWT } from '../utils/jwt';
import socket from '../socket/socket';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';

const categoryLabels = {
  hardware: "Donanım",
  software: "Yazılım",
  network: "Ağ",
  other: "Diğer"
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #1976d2',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

const MyRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTicket, setChatTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(null);
  const [sending, setSending] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('jwt');
  const decoded = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
  const myUserId = decoded && (decoded.userId || decoded.id || decoded.sub) ? (decoded.userId || decoded.id || decoded.sub) : 'unknown';
  const myUserName = localStorage.getItem('userName') || 'Kullanıcı';
  const navigate = useNavigate();
  const typingTimeout = useRef(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listTicketsForUser();
        if (response.success && Array.isArray(response.data)) {
          setRows(response.data.map((ticket, idx) => ({
            id: ticket._id || idx + 1,
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            status: ticket.status || "-",
            createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-",
            files: ticket.attachments || [],
            chatId: ticket.chatId || ticket._id,
            customerId: ticket.customerId,
            assignedAgentId: ticket.assignedAgentId,
            raw: ticket
          })));
        } else {
          setRows([]);
          setError(response.message || "Talepler alınamadı.");
        }
      } catch (err) {
        setError("Talepler alınırken bir hata oluştu.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Chat açıldığında mesajları çek
  useEffect(() => {
    if (!chatOpen || !chatTicket) return;
    const fetchMessages = async () => {
      setMessages([]);
      setChatId(null);
      try {
        let res;
        if (chatTicket.ticketId) {
          res = await listMessagesByTicketId(chatTicket.ticketId);
        } else if (chatTicket.chatId) {
          res = await listMessagesByTicketId(chatTicket.chatId); // fallback
        } else {
          setMessages([]);
          setChatId(null);
          return;
        }
        if (res.success && res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
          setChatId(res.data.chatId || null);
        } else if (res.success && Array.isArray(res.data)) {
          setMessages(res.data);
          setChatId(chatTicket.chatId || null);
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
  }, [chatOpen, chatTicket]);

  // Odaya katıl/ayrıl (join_room/leave_room)
  useEffect(() => {
    if (!chatOpen || !chatId) return;
    console.log('[MyRequests][SOCKET][JOIN_ROOM] Odaya katılıyor:', { chatId, userId: myUserId });
    socket.emit('join_room', { chatId, userId: myUserId, userRole: 'User' });
    return () => {
      console.log('[MyRequests][SOCKET][LEAVE_ROOM] Odadan ayrılıyor:', { chatId, userId: myUserId });
      socket.emit('leave_room', { chatId, userId: myUserId });
    };
  }, [chatOpen, chatId, myUserId]);

  // new_message eventini dinle
  useEffect(() => {
    if (!chatOpen || !chatId) return;
    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [
          ...prev,
          {
            _id: Math.random().toString(36),
            senderId: data.userId,
            text: data.message,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    };
    socket.on('receive_chat_message', handleNewMessage);
    return () => socket.off('receive_chat_message', handleNewMessage);
  }, [chatOpen, chatId]);

  // typing ve stop_typing eventlerini dinle (sadece başkası yazıyorsa göster)
  useEffect(() => {
    if (!chatOpen || !chatId) return;
    const handleTyping = (data) => {
      console.log('[DEBUG][MyRequests][TYPING] Event geldi:', data, 'chatId:', chatId, 'myUserId:', myUserId);
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
  }, [chatOpen, chatId, myUserId]);

  // Kullanıcıların odaya katılıp/çıkışını dinle
  useEffect(() => {
    if (!chatOpen || !chatId) return;
    const handleUserJoined = (payload) => {
      if (payload.chatId === chatId && payload.userId !== myUserId) {
        // window.alert('Karşı taraf odaya katıldı!'); // kaldırıldı
      }
      console.log('[MyRequests][SOCKET][USER_JOINED] Odaya biri katıldı:', payload);
    };
    const handleUserOnline = (payload) => {
      console.log('[MyRequests][SOCKET][USER_ONLINE] Odaya biri online oldu:', payload);
    };
    socket.on('user_joined', handleUserJoined);
    socket.on('user_online', handleUserOnline);
    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('user_online', handleUserOnline);
    };
  }, [chatOpen, chatId, myUserId]);

  // Mesaj gönder
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;
    setSending(true);
    try {
      socket.emit('send_message', { chatId, userId: myUserId, message: input });
      const res = await sendMessage({ chatId, userId: myUserId, text: input });
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            _id: Math.random().toString(36),
            senderId: myUserId,
            text: input,
            createdAt: new Date().toISOString()
          }
        ]);
        setInput("");
        setSomeoneTyping(false);
        socket.emit('stop_typing', { chatId, userId: myUserId });
      }
    } catch (e) {
      console.error('[MyRequests][SOCKET][SEND_MESSAGE][HATA] Mesaj gönderilemedi:', e);
    } finally {
      setSending(false);
    }
  };

  // Kullanıcı yazarken typing eventini gönder
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!chatId || !chatTicket) return;
    const receiverId = chatTicket.assignedAgentId;
    if (e.target.value) {
      console.log('[MyRequests][SOCKET][TYPING] Yazıyor event gönderiliyor:', { chatId, userId: myUserId, receiverId });
      socket.emit('typing', { chatId, userId: myUserId, receiverId, isTyping: true });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { chatId, userId: myUserId, receiverId });
      }, 1000);
    } else {
      console.log('[MyRequests][SOCKET][STOP_TYPING] Yazmayı bıraktı event gönderiliyor:', { chatId, userId: myUserId, receiverId });
      socket.emit('stop_typing', { chatId, userId: myUserId, receiverId });
    }
  };

  const handleOpenChat = (ticket) => {
    setChatTicket({
      ...ticket.raw,
      chatId: ticket.raw.chatId || ticket.raw._id,
      ticketId: ticket.raw._id
    });
    setChatOpen(true);
  };
  const handleCloseChat = () => {
    setChatOpen(false);
    setChatTicket(null);
    setMessages([]);
    setChatId(null);
    setInput("");
    setSomeoneTyping(false);
  };

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalOpen(true);
  };
  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'title', headerName: 'Başlık', width: chatOpen ? 200 : 200 },
    { field: 'category', headerName: 'Kategori', width: chatOpen ? 100 : 200 },
    { field: 'status', headerName: 'Durum', width: chatOpen ? 100 : 200 },
    { field: 'createdAt', headerName: 'Oluşturulma', width: chatOpen ? 150 : 200 },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: chatOpen ? 150 : 200,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ChatIcon />}
            onClick={() => handleOpenChat(params.row)}
          >
            Chat
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDetail(params.row)}
          >
            Detay
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box maxWidth={1300} mx="auto" mt={6} display="flex" gap={3}>
      <Box flex={chatOpen ? 7 : 1} minWidth={chatOpen ? 700 : 0} maxWidth={chatOpen ? 800 : 1300} transition="all 0.3s">
        <Typography variant="h5" fontWeight={700} mb={3}>Taleplerim</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              disableSelectionOnClick
              autoHeight
              columnVisibilityModel={{
                id: false
              }}
            />
          </div>
        )}
        <Modal open={modalOpen} onClose={handleCloseDetail}>
          <Box sx={modalStyle}>
            <Typography variant="h6" mb={2}>Talep Detayları</Typography>
            {selectedTicket && (
              <Box>
                <Typography><b>Başlık:</b> {selectedTicket.title}</Typography>
                <Typography><b>Açıklama:</b> {selectedTicket.description}</Typography>
                <Typography><b>Kategori:</b> {categoryLabels[selectedTicket.category] || selectedTicket.category}</Typography>
                <Typography><b>Durum:</b> {selectedTicket.status}</Typography>
                <Typography><b>Oluşturulma:</b> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '-'}</Typography>
                <Typography><b>Müşteri ID:</b> {selectedTicket.customerId}</Typography>
                <Typography><b>Agent ID:</b> {selectedTicket.assignedAgentId}</Typography>
                <Typography><b>Ekler:</b></Typography>
                <ul>
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                    selectedTicket.attachments.map((file, i) => (
                      <li key={i}><a href={`/${file.url}`} target="_blank" rel="noopener noreferrer">{file.name}</a></li>
                    ))
                  ) : <li>Yok</li>}
                </ul>
              </Box>
            )}
          </Box>
        </Modal>
      </Box>
      {chatOpen && (
        <Box flex={5} minWidth={400} maxWidth={600} ml={3} bgcolor="#f9f9f9" borderRadius={2} boxShadow={3} p={2} height="100%" display="flex" flexDirection="column">
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6">Chat: {chatTicket?.title}</Typography>
            <IconButton onClick={handleCloseChat}><CloseIcon /></IconButton>
          </Box>
          <Divider />
          <Box flex={1} my={2} p={1} bgcolor="#fff" borderRadius={1} boxShadow={1} style={{overflowY: 'auto', minHeight: 200}}>
            {messages.length === 0 ? (
              <Typography color="text.secondary" align="center" mt={2}>Henüz mesaj yok.</Typography>
            ) : (
              messages.map((msg, idx) => (
                <Box key={msg._id || idx} mb={1} display="flex" flexDirection="column" alignItems={msg.senderId === chatTicket?.customerId ? 'flex-end' : 'flex-start'}>
                  <Box px={2} py={1} bgcolor={msg.senderId === chatTicket?.customerId ? '#e3f2fd' : '#f1f1f1'} borderRadius={2} maxWidth="70%">
                    <Typography fontSize={15}>{typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}</Typography>
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
            <input
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 22, padding: '10px 16px', fontSize: 16, outline: 'none', background: '#fff', marginRight: 8 }}
              placeholder="Mesaj yaz..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              onBlur={() => {
                if (!chatId) return;
                socket.emit('stop_typing', { chatId, userId: myUserId });
              }}
              disabled={sending}
            />
            <Button variant="contained" onClick={handleSend} disabled={sending || !input.trim()}>Gönder</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MyRequests; 