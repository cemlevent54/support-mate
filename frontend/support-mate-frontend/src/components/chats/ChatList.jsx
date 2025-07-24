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
import { Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import socket from '../../socket/socket';
import { listMessagesByChatId } from '../../api/messagesApi';

// getLastMessage fonksiyonunu en başa taşıdım
const getLastMessage = (chat) => {
  const msgs = chat.chatMessages || chat.messages || [];
  if (Array.isArray(msgs) && msgs.length > 0) {
    return msgs[msgs.length - 1].text || '';
  }
  return 'Mesaj yok';
};

export default function ChatList({ activeChatTicketId, onSelectChat, agentChats, loading, onUserJoinedChat }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessageChats, setNewMessageChats] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});

  // Search fonksiyonu (filtrelenmiş chat listesi)
  const filteredChatList = (agentChats || []).filter(chat => {
    let name = chat.ticket && chat.ticket.title ? chat.ticket.title : chat.name || '';
    let last = getLastMessage(chat).toLowerCase();
    let category = '';
    if (chat.ticket && chat.ticket.category) {
      category = (
        chat.ticket.category.categoryNameTr ||
        chat.ticket.category.category_name_tr ||
        chat.ticket.category.categoryNameEn ||
        chat.ticket.category.category_name_en ||
        ''
      );
    } else if (typeof chat.category === 'object' && chat.category !== null) {
      category = chat.category.categoryNameTr || chat.category.category_name_tr || chat.category.categoryNameEn || chat.category.category_name_en || '';
    } else if (typeof chat.category === 'string') {
      category = chat.category;
    }
    const search = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(search) ||
      last.includes(search) ||
      category.toLowerCase().includes(search)
    );
  });

  // Son mesaj zamanına göre chatleri sırala (en yeni yukarıda)
  const sortedChatList = [...filteredChatList].sort((a, b) => {
    const msgsA = a.chatMessages || a.messages || [];
    const msgsB = b.chatMessages || b.messages || [];
    const lastA = msgsA.length > 0 ? new Date(msgsA[msgsA.length - 1].timestamp || msgsA[msgsA.length - 1].createdAt) : new Date(a.timestamp || a.createdAt || 0);
    const lastB = msgsB.length > 0 ? new Date(msgsB[msgsB.length - 1].timestamp || msgsB[msgsB.length - 1].createdAt) : new Date(b.timestamp || b.createdAt || 0);
    return lastB - lastA;
  });

  const handleChatSelect = (chat) => {
    const realChatId = chat._id || chat.chatId || chat.id;
    setNewMessageChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(realChatId);
      return newSet;
    });
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[realChatId];
      return newCounts;
    });
    onSelectChat(chat);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
      date = new Date(timestamp + 'Z');
    } else {
      date = new Date(timestamp);
    }
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Dün';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('tr-TR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getLastMessageTime = (chat) => {
    const msgs = chat.chatMessages || chat.messages || [];
    if (Array.isArray(msgs) && msgs.length > 0) {
      return formatTime(msgs[msgs.length - 1].timestamp || msgs[msgs.length - 1].createdAt);
    }
    return '';
  };

  // Chat başlığı: ticket varsa title, yoksa kullanıcı id veya name
  const getChatDisplayName = (chat) => {
    if (chat.ticket && chat.ticket.title) {
      return chat.ticket.title;
    }
  
    const lang = localStorage.getItem('language') || 'tr';
    if (lang === 'tr') {
      return chat.name || chat.userId || chat.customerId || 'Bilinmeyen Kullanıcı';
    } else {
      return chat.nameEn || chat.name || chat.userId || chat.customerId || 'Unknown User';
    }
  };
  

  const getChatCategoryName = (chat) => {
    const lang = localStorage.getItem('language') || 'tr';
    let name = null;
    if (chat.ticket && chat.ticket.category) {
      if (lang === 'tr') {
        name = chat.ticket.category.categoryNameTr || chat.ticket.category.category_name_tr;
      } else {
        name = chat.ticket.category.categoryNameEn || chat.ticket.category.category_name_en;
      }
    } else if (typeof chat.category === 'object' && chat.category !== null) {
      if (lang === 'tr') {
        name = chat.category.categoryNameTr || chat.category.category_name_tr;
      } else {
        name = chat.category.categoryNameEn || chat.category.category_name_en;
      }
    } else if (typeof chat.category === 'string') {
      name = chat.category;
    }
    if (!name) {
      return "";
    }
    return name;
  };

  useEffect(() => {
    const handleUserJoined = async (payload) => {
      console.log('[ChatList][SOCKET] user_joined:', payload);
      if (payload && payload.chatId) {
        // Eğer parent bir callback verdiyse ona ilet, yoksa burada API'den çek
        if (onUserJoinedChat) {
          onUserJoinedChat(payload.chatId);
        } else {
          try {
            const res = await listMessagesByChatId(payload.chatId);
            // Burada agentChats state'ini güncellemek için bir yolun olmalı (örn: context veya prop callback)
            // Şimdilik sadece logla
            console.log('[ChatList][SOCKET] user_joined ile chatId için mesajlar:', res);
          } catch (e) {
            console.error('[ChatList][SOCKET] user_joined chatId mesajları çekilemedi:', e);
          }
        }
      }
    };
    socket.on('user_joined', handleUserJoined);
    return () => socket.off('user_joined', handleUserJoined);
  }, [onUserJoinedChat]);

  if (loading) {
    return (
      <div style={{ width: 350, background: '#fff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    );
  }

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
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {sortedChatList.length === 0 ? (
          <></>
        ) : (
          sortedChatList.map((chat, index) => (
            <ListItem 
              key={chat._id || chat.chatId || chat.id} 
              disablePadding
              sx={{
                position: 'relative',
                animation: 'slideInFromBottom 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both',
                opacity: 0,
                transform: 'translateY(60px)',
                backgroundColor: 'transparent',
                '@keyframes slideInFromBottom': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(60px) scale(0.9)',
                    backgroundColor: 'transparent',
                  },
                  '30%': {
                    opacity: 0.5,
                    transform: 'translateY(40px) scale(0.95)',
                    backgroundColor: 'transparent',
                  },
                  '60%': {
                    opacity: 0.8,
                    transform: 'translateY(20px) scale(0.98)',
                    backgroundColor: 'transparent',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)',
                    backgroundColor: 'transparent',
                  },
                },
              }}
            >
              <ListItemButton
                selected={
                  !!activeChatTicketId &&
                  (String(activeChatTicketId) === String(chat._id || chat.chatId || chat.id))
                }
                onClick={() => handleChatSelect(chat)}
                sx={{
                  color: '#222',
                  bgcolor: chat.isNewMessage ? '#fff3cd' : (String(activeChatTicketId) === String(chat.id) ? '#f0f8ff' : 'transparent'),
                  '&:hover': { 
                    bgcolor: '#f5f5f5',
                    transform: 'translateX(2px)',
                  },
                  py: 2,
                  px: 3,
                  borderBottom: index === sortedChatList.length - 1 ? 'none' : '1px solid #f0f0f0',
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
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
                      {getChatDisplayName(chat)}
                    </span>
                  }
                  secondary={
                    <span>
                      <span style={{ color: unreadCounts[chat.id] > 0 ? '#1976d2' : '#666', fontSize: 13, fontWeight: unreadCounts[chat.id] > 0 ? 600 : 400 }}>
                        {getLastMessage(chat)}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#999', fontSize: 11 }}>{getChatCategoryName(chat)}</span>
                        <span style={{ color: '#999', fontSize: 11 }}>{getLastMessageTime(chat)}</span>
                      </div>
                    </span>
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