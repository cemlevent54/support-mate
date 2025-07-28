import { useState, useEffect, useRef } from 'react';
import { listMessagesByTicketId, listMessagesByChatId, sendMessage } from '../api/messagesApi';
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
        if (chatTicket.chatId) {
          console.log('[useChatSocket] Fetching by chatId:', chatTicket.chatId);
          res = await listMessagesByChatId(chatTicket.chatId);
        } else if (chatTicket.ticketId) {
          console.log('[useChatSocket] Fetching by ticketId:', chatTicket.ticketId);
          res = await listMessagesByTicketId(chatTicket.ticketId);
        } else {
          console.log('[useChatSocket] No chatId or ticketId found');
          setMessages([]);
          setChatId(null);
          return;
        }
        
        console.log('[useChatSocket] API response:', res);
        
        if (res.success && res.data && Array.isArray(res.data.messages)) {
          console.log('[useChatSocket] Setting messages from data.messages:', res.data.messages);
          setMessages(res.data.messages);
          setChatId(res.data.chatId || chatTicket.chatId || null);
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
      
      // receiverId'yi doğru belirle
      let receiverId = null;
      if (chatTicket) {
        if (chatTicket.assignedAgentId && chatTicket.assignedAgentId !== myUserId) {
          receiverId = chatTicket.assignedAgentId;
        } else if (chatTicket.customerId && chatTicket.customerId !== myUserId) {
          receiverId = chatTicket.customerId;
        } else if (chatTicket.userId && chatTicket.userId !== myUserId) {
          receiverId = chatTicket.userId;
        }
      }

      // Artık tek endpoint kullanıyoruz - sendMessage
      const messageData = {
        text: input,
        userId: myUserId,
        receiverId
      };
      
      // Eğer chatId varsa ekle
      if (currentChatId) {
        messageData.chatId = currentChatId;
      }
      
      // Tek endpoint ile mesaj gönder
      console.log('[DEBUG][useChatSocket] Sending message:', messageData);
      res = await sendMessage(messageData);
      console.log('[DEBUG][useChatSocket] API response:', res);
      
      if (res.success && res.data) {
        // Eğer yeni chat oluşturulduysa chatId'yi güncelle
        const isNewChat = res.data.chatId && !currentChatId;
        console.log('[DEBUG][useChatSocket] isNewChat:', isNewChat, 'currentChatId:', currentChatId, 'res.data.chatId:', res.data.chatId);
        if (isNewChat) {
          currentChatId = res.data.chatId;
          setChatId(currentChatId);
        }
        
        // Socket emit - artık tek event kullanıyoruz
        const emitObj = {
          chatId: currentChatId,
          message: input,
          userId: myUserId,
          receiverId
        };
        console.log('[SOCKET][EMIT][send_message]', emitObj);
        socket.emit('send_message', emitObj);
        
        // Eğer yeni chat oluşturulduysa, new_chat_created event'ini de emit et
        if (isNewChat) {
          const newChatEmitObj = {
            chatId: currentChatId,
            message: input,
            userId: myUserId,
            receiverId
          };
          console.log('[SOCKET][EMIT][new_chat_created]', newChatEmitObj);
          socket.emit('new_chat_created', newChatEmitObj);
        }
        
        // Mesajı listeye ekle
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

  useEffect(() => {
    if (chatOpen && chatId && myUserId) {
      // Sadece başkasından okunmamış mesaj varsa okundu bildirimi gönder
      const hasUnreadFromOther = messages.some(
        msg => msg.senderId !== myUserId && !msg.isRead
      );
      if (hasUnreadFromOther) {
        console.log('[useChatSocket] mark_message_read emit ediliyor (başkasından okunmamış mesaj var):', { chatId, userId: myUserId });
        socket.emit('mark_message_read', { chatId, userId: myUserId });
      } else {
        console.log('[useChatSocket] mark_message_read emit edilmiyor (okunmamış başkasından mesaj yok)');
      }
    }
  }, [chatOpen, chatId, myUserId, messages]);

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