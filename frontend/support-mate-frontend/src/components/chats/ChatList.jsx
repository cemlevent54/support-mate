import React, { useState, useEffect } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslation } from 'react-i18next';
import { listTicketsForAgent } from '../../api/ticketApi';
import { listMessagesByTicketId } from '../../api/messagesApi';
import { getUserIdFromJWT } from '../../utils/jwt';
import { Box } from '@mui/material';
import socket from '../../socket/socket';
import CircularProgress from '@mui/material/CircularProgress';

export default function ChatList({ activeChatTicketId, onSelectChat, refreshTrigger }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [chatList, setChatList] = useState([]);
  const [newMessageChats, setNewMessageChats] = useState(new Set()); // Yeni mesaj gelen chat'leri takip et
  const [unreadCounts, setUnreadCounts] = useState({}); // Her chat için okunmamış mesaj sayısı
  const userId = getUserIdFromJWT();

  // Son mesajı olan chat'i bulup üste çıkaran fonksiyon
  const sortChatsByLastMessage = async (tickets) => {
    try {
      const chatsWithLastMessage = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            // Her ticket için mesajları çek
            const messagesResponse = await listMessagesByTicketId(ticket._id || ticket.id);
            let lastMessage = null;
            let lastMessageTime = ticket.createdAt; // Varsayılan olarak ticket oluşturulma zamanı

            if (messagesResponse.success && messagesResponse.data && messagesResponse.data.messages) {
              const messages = messagesResponse.data.messages;
              if (messages.length > 0) {
                // En son mesajı bul
                const sortedMessages = messages.sort((a, b) => {
                  const timeA = new Date(a.timestamp || a.createdAt || 0);
                  const timeB = new Date(b.timestamp || b.createdAt || 0);
                  return timeB - timeA; // En yeni mesaj önce
                });
                lastMessage = sortedMessages[0];
                // Backend'den gelen timestamp zaten TR timezone'da
                lastMessageTime = lastMessage.timestamp || lastMessage.createdAt || lastMessage.sentAt;
              }
            }

            return {
              id: ticket._id || ticket.id,
              name: ticket.title || 'Destek Talebi',
              last: lastMessage ? (lastMessage.text && lastMessage.text.length > 50 ? lastMessage.text.substring(0, 50) + '...' : lastMessage.text) : (ticket.description ? (ticket.description.length > 50 ? ticket.description.substring(0, 50) + '...' : ticket.description) : 'Mesaj yok'),
              timestamp: lastMessageTime || ticket.createdAt || ticket.updatedAt,
              status: ticket.status,
              category: ticket.category,
              customerId: ticket.customerId,
              assignedAgentId: ticket.assignedAgentId,
              lastMessageTime: lastMessageTime || ticket.createdAt || ticket.updatedAt // Sıralama için
            };
          } catch (error) {
            console.error(`Mesajlar çekilemedi (ticket: ${ticket._id}):`, error);
            return {
              id: ticket._id || ticket.id,
              name: ticket.title || 'Destek Talebi',
              last: ticket.description ? (ticket.description.length > 50 ? ticket.description.substring(0, 50) + '...' : ticket.description) : 'Mesaj yok',
              timestamp: ticket.createdAt || ticket.updatedAt,
              status: ticket.status,
              category: ticket.category,
              customerId: ticket.customerId,
              assignedAgentId: ticket.assignedAgentId,
              lastMessageTime: ticket.createdAt || ticket.updatedAt
            };
          }
        })
      );

      // Son mesaj zamanına göre sırala (en yeni üstte)
      const sortedChats = chatsWithLastMessage.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.timestamp || 0);
        const timeB = new Date(b.lastMessageTime || b.timestamp || 0);
        return timeB - timeA; // En yeni mesaj önce
      });

      return sortedChats;
    } catch (error) {
      console.error('Chat sıralama hatası:', error);
      return tickets.map(ticket => ({
        id: ticket._id || ticket.id,
        name: ticket.title || 'Destek Talebi',
        last: ticket.description ? (ticket.description.length > 50 ? ticket.description.substring(0, 50) + '...' : ticket.description) : 'Mesaj yok',
        timestamp: ticket.createdAt || ticket.updatedAt,
        status: ticket.status,
        category: ticket.category,
        customerId: ticket.customerId,
        assignedAgentId: ticket.assignedAgentId,
        lastMessageTime: ticket.createdAt || ticket.updatedAt
      }));
    }
  };

  // Chat listesini çek
  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const response = await listTicketsForAgent();
        if (response.success && response.data) {
          // Chat'leri son mesajına göre sırala
          const sortedChats = await sortChatsByLastMessage(response.data);
          setChatList(sortedChats);
        }
      } catch (error) {
        console.error('Chat listesi yüklenemedi:', error);
        setChatList([]);
      }
    };

    fetchChatList();
  }, [refreshTrigger]); // refreshTrigger değiştiğinde yeniden çek

  // Socket dinleyicisi - yeni mesaj geldiğinde chat list'i güncelle
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('[ChatList][SOCKET] Yeni mesaj geldi:', data);
      
      // Eğer bu mesaj bizim gönderdiğimiz değilse ve chat list'te varsa güncelle
      if (data.userId !== userId) {
        const chatId = data.chatId || data.ticketId;
        
        // Yeni mesaj göstergesini ekle (eğer aktif chat değilse)
        if (chatId !== activeChatTicketId) {
          setNewMessageChats(prev => new Set([...prev, chatId]));
          // Okunmamış mesaj sayısını artır
          setUnreadCounts(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1
          }));
        }
        
        setChatList(prevChats => {
          // Bu chat'i bul
          const chatIndex = prevChats.findIndex(chat => {
            // Chat ID'sini kontrol et (ticket ID olabilir)
            return chat.id === chatId;
          });
          
                      if (chatIndex !== -1) {
              // Chat'i buldum, güncelle
              const updatedChats = [...prevChats];
              const updatedChat = {
                ...updatedChats[chatIndex],
                last: data.message && data.message.length > 50 ? data.message.substring(0, 50) + '...' : data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                lastMessageTime: data.timestamp || new Date().toISOString(),
                isNewMessage: true // Yeni mesaj animasyonu için flag
              };
              
              // Chat'i en üste taşı
              updatedChats.splice(chatIndex, 1);
              updatedChats.unshift(updatedChat);
              
              // 2 saniye sonra animasyon flag'ini kaldır
              setTimeout(() => {
                setChatList(currentChats => 
                  currentChats.map(chat => 
                    chat.id === chatId ? { ...chat, isNewMessage: false } : chat
                  )
                );
              }, 2000);
              
              return updatedChats;
            }
          
          // Chat bulunamadıysa, tüm listeyi yeniden çek
          const refreshList = async () => {
            try {
              const response = await listTicketsForAgent();
              if (response.success && response.data) {
                const sortedChats = await sortChatsByLastMessage(response.data);
                setChatList(sortedChats);
              }
            } catch (error) {
              console.error('Chat listesi yenilenemedi:', error);
            }
          };
          refreshList();
          return prevChats;
        });
      }
    };

    // Socket event'lerini dinle
    socket.on('receive_chat_message', handleNewMessage);
    
    return () => {
      socket.off('receive_chat_message', handleNewMessage);
    };
  }, [userId, activeChatTicketId]);



  // Search fonksiyonu
  const filteredChatList = chatList.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.last.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatSelect = (chat) => {
    // Chat seçildiğinde yeni mesaj göstergesini kaldır
    setNewMessageChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(chat.id);
      return newSet;
    });
    // Okunmamış mesaj sayısını sıfırla
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[chat.id];
      return newCounts;
    });
    onSelectChat(chat.id, chat.name);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Backend'den gelen timestamp zaten TR timezone'da, manuel offset eklemeye gerek yok
    const date = new Date(timestamp);
    const now = new Date();
    
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // Bugün: Saat:Dakika formatında göster
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Dün';
    } else if (diffInHours < 168) { // 7 gün
      // Bu hafta: Gün adı
      return date.toLocaleDateString('tr-TR', { 
        weekday: 'short'
      });
    } else {
      // Daha eski: Gün/Ay formatında
      return date.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit'
      });
    }
  };

  return (
    <div style={{ width: 350, background: '#fff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', fontWeight: 700, fontSize: 18, color: '#222', background: '#fff' }}>
        {t('supportDashboard.chatsTitle')}
      </div>
      
      {/* Search Bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('supportDashboard.searchChat')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: '#f5f5f5',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: 14,
            },
          }}
        />
      </div>
      
      {/* Chat List */}
      <List sx={{ 
        height: '100%', 
        overflowY: 'auto', 
        flex: 1, 
        bgcolor: '#fff', 
        p: 0,
        '&::-webkit-scrollbar': {
          width: '0px',
          display: 'none',
        },
        '&::-webkit-scrollbar-track': {
          display: 'none',
        },
        '&::-webkit-scrollbar-thumb': {
          display: 'none',
        },
        '&::-webkit-scrollbar-corner': {
          display: 'none',
        },
        scrollbarWidth: 'none', // Firefox için
        msOverflowStyle: 'none', // IE ve Edge için
      }}>
        {filteredChatList.length === 0 ? (
          <ListItem>
            <Box display="flex" justifyContent="center" alignItems="center" width="100%" py={4}>
              <CircularProgress />
            </Box>
          </ListItem>
        ) : (
          filteredChatList.map((chat, index) => (
            <ListItem 
              key={chat.id} 
              disablePadding
              sx={{
                position: 'relative',
                animation: 'slideInFromBottom 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both',
                opacity: 0,
                transform: 'translateY(60px)',
                '@keyframes slideInFromBottom': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(60px) scale(0.9)',
                  },
                  '30%': {
                    opacity: 0.5,
                    transform: 'translateY(40px) scale(0.95)',
                  },
                  '60%': {
                    opacity: 0.8,
                    transform: 'translateY(20px) scale(0.98)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)',
                  },
                },
              }}
            >
              <ListItemButton
                selected={activeChatTicketId === chat.id}
                onClick={() => handleChatSelect(chat)}
                sx={{
                  color: '#222',
                  bgcolor: chat.isNewMessage ? '#fff3cd' : (activeChatTicketId === chat.id ? '#f0f8ff' : 'transparent'),
                  '&:hover': { 
                    bgcolor: '#f5f5f5',
                    transform: 'translateX(2px)',
                  },
                  py: 2,
                  px: 3,
                  borderBottom: index === filteredChatList.length - 1 ? 'none' : '1px solid #f0f0f0',
                  '&.Mui-selected': {
                    bgcolor: '#e3f2fd',
                    '&:hover': { bgcolor: '#e3f2fd' },
                    borderLeft: '4px solid #1976d2',
                  },
                  transition: 'all 0.3s ease-in-out',
                  transform: chat.isNewMessage ? 'translateX(4px)' : 'translateX(0)',
                  borderLeft: chat.isNewMessage ? '4px solid #ffc107' : 'none',
                  animation: chat.isNewMessage ? 'newMessagePulse 2s ease-in-out' : 'none',
                  '@keyframes newMessagePulse': {
                    '0%': {
                      backgroundColor: '#fff3cd',
                      transform: 'translateX(4px) scale(1.02)',
                    },
                    '50%': {
                      backgroundColor: '#fff3cd',
                      transform: 'translateX(4px) scale(1.01)',
                    },
                    '100%': {
                      backgroundColor: 'transparent',
                      transform: 'translateX(0) scale(1)',
                    },
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#1976d2', 
                      width: 48, 
                      height: 48,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
              <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
                      {chat.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: unreadCounts[chat.id] > 0 ? '#1976d2' : '#666', 
                          fontSize: 13, 
                          mb: 0.5,
                          fontWeight: unreadCounts[chat.id] > 0 ? 600 : 400
                        }}
                      >
                        {chat.last}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ color: '#999', fontSize: 11 }}>
                          {chat.category || 'Genel'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#999', fontSize: 11 }}>
                          {formatTime(chat.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ ml: 1 }}
              />
              {unreadCounts[chat.id] > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    minWidth: 20,
                    height: 20,
                    borderRadius: '10px',
                    bgcolor: '#1976d2',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    animation: 'bounce 1s infinite',
                    zIndex: 1,
                    '@keyframes bounce': {
                      '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                      '40%': { transform: 'translateY(-3px)' },
                      '60%': { transform: 'translateY(-2px)' },
                    },
                  }}
                >
                  {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                </Box>
              )}
            </ListItemButton>
          </ListItem>
          ))
        )}
      </List>
    </div>
  );
} 