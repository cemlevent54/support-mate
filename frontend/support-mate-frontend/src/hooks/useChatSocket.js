import { useState, useEffect, useRef } from 'react';
import { listMessagesByTicketId, sendMessage, createMessage } from '../api/messagesApi';
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

export const useChatSocket = (chatTicket, chatOpen) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(null);
  const [sending, setSending] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  
  const token = localStorage.getItem('jwt');
  const decoded = decodeJWT(token);
  const myUserId = decoded && (decoded.userId || decoded.id || decoded.sub) ? (decoded.userId || decoded.id || decoded.sub) : 'unknown';
  const myUserName = localStorage.getItem('userName') || 'Kullanıcı';

  // Chat mesajlarını çek
  useEffect(() => {
    if (!chatOpen || !chatTicket) return;
    console.log('[useChatSocket] Fetching messages for:', { chatOpen, chatTicket });
    
    const fetchMessages = async () => {
      setMessages([]);
      setChatId(null);
      try {
        let res;
        if (chatTicket.ticketId) {
          console.log('[useChatSocket] Fetching by ticketId:', chatTicket.ticketId);
          res = await listMessagesByTicketId(chatTicket.ticketId);
        } else if (chatTicket.chatId) {
          console.log('[useChatSocket] Fetching by chatId:', chatTicket.chatId);
          res = await listMessagesByTicketId(chatTicket.chatId); // fallback
        } else {
          console.log('[useChatSocket] No ticketId or chatId found');
          setMessages([]);
          setChatId(null);
          return;
        }
        
        console.log('[useChatSocket] API response:', res);
        
        if (res.success && res.data && Array.isArray(res.data.messages)) {
          console.log('[useChatSocket] Setting messages from data.messages:', res.data.messages);
          setMessages(res.data.messages);
          setChatId(res.data.chatId || null);
        } else if (res.success && Array.isArray(res.data)) {
          console.log('[useChatSocket] Setting messages from data:', res.data);
          setMessages(res.data);
          setChatId(chatTicket.chatId || null);
        } else {
          console.log('[useChatSocket] No valid messages found');
          setMessages([]);
          setChatId(null);
        }
      } catch (e) {
        console.error('[useChatSocket] Error fetching messages:', e);
        setMessages([]);
        setChatId(null);
      }
    };
    fetchMessages();
  }, [chatOpen, chatTicket]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      if (data.chatId === chatId && data.userId !== myUserId) {
        setMessages(prev => [
          ...prev,
          {
            _id: Math.random().toString(36),
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
  }, [chatOpen, chatId, myUserId]);

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
    if (!input.trim()) return;
    setSending(true);
    try {
      let currentChatId = chatId;
      let res;
      if (!currentChatId) {
        // İlk mesaj, chat yok. createMessage ile başlat.
        res = await createMessage({ text: input, userId: myUserId, receiverId: chatTicket?.receiverId, ticketId: chatTicket?.ticketId });
        if (res.success && res.data && res.data.chatId) {
          currentChatId = res.data.chatId;
          setChatId(currentChatId);
        } else {
          throw new Error('Chat başlatılamadı');
        }
      } else {
        // Var olan chat, sendMessage ile devam.
        res = await sendMessage({ chatId: currentChatId, userId: myUserId, text: input });
      }
      // Socket emit her iki durumda da yapılmalı
      socket.emit('send_message', { chatId: currentChatId, userId: myUserId, message: input });
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            _id: Math.random().toString(36),
            senderId: myUserId,
            text: input,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ]);
        setInput("");
        setSomeoneTyping(false);
        socket.emit('stop_typing', { chatId: currentChatId, userId: myUserId });
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

  // Chat'i kapat
  const handleCloseChat = () => {
    setMessages([]);
    setChatId(null);
    setInput("");
    setSomeoneTyping(false);
  };

  return {
    messages,
    input,
    chatId,
    sending,
    someoneTyping,
    messagesEndRef,
    myUserId,
    myUserName,
    handleSend,
    handleInputChange,
    handleCloseChat,
    setInput
  };
}; 