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
import { useChatContext } from './ChatContext';
import CustomPagingComponent from '../common/CustomPagingComponent';
import { listAgentChatsWithMessagesPaginated } from '../../api/messagesApi';
import Badge from '@mui/material/Badge';

// getLastMessage fonksiyonunu en başa taşıdım
const getLastMessage = (chat) => {
  const msgs = chat.chatMessages || chat.messages || [];
  if (Array.isArray(msgs) && msgs.length > 0) {
    return msgs[msgs.length - 1].text || '';
  }
  return 'Mesaj yok';
};

// formatTime fonksiyonunu yukarı taşı
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

// getLastMessageTime fonksiyonunu yukarı taşı
const getLastMessageTime = (chat) => {
  const msgs = chat.chatMessages || chat.messages || [];
  if (Array.isArray(msgs) && msgs.length > 0) {
    return formatTime(msgs[msgs.length - 1].timestamp || msgs[msgs.length - 1].createdAt);
  }
  return '';
};

// getChatDisplayName fonksiyonunu yukarı taşı
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

// getChatCategoryName fonksiyonunu yukarı taşı
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

function ChatListItems({ sortedChatList, loading, activeChatTicketId, handleChatSelect, unreadCounts, newMessageChatIds }) {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CircularProgress />
      </div>
    );
  }

  if (sortedChatList.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 200,
        flexDirection: 'column',
        color: '#666'
      }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t('supportDashboard.noChatsFound')}
        </Typography>
        <Typography variant="caption" sx={{ color: '#999' }}>
          {t('supportDashboard.noChatsFoundSubtitle')}
        </Typography>
      </div>
    );
  }

  return (
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
      {sortedChatList.map((chat, index) => {
        const chatId = String(chat._id || chat.chatId || chat.id);
        const unreadCount = unreadCounts && unreadCounts[String(chatId)];
        // Debug: unreadCounts key'leri ve chatId karşılaştır
        if (unreadCounts) {
          const unreadKeys = Object.keys(unreadCounts);
          if (!unreadKeys.includes(chatId)) {
            console.warn('[DEBUG][ChatList] chatId eşleşmiyor:', { chatId, unreadKeys, unreadCounts });
          } else {
            console.log('[DEBUG][ChatList] chatId eşleşiyor:', { chatId, unreadCount });
          }
        }
        const isNewMessage = newMessageChatIds.has(chatId);
        
        return (
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
                bgcolor: (() => {
                  // chatId ve unreadCount yukarıda tanımlı
                  if (unreadCount > 0) {
                    console.log('[ChatList] Kırmızı arka plan uygulanıyor:', chatId);
                    return '#ffcccc'; // kırmızımsı arka plan
                  } else if (String(activeChatTicketId) === String(chat._id || chat.chatId || chat.id)) {
                    return '#f0f8ff';
                  } else {
                    return 'transparent';
                  }
                })(),
                '&:hover': {
                  bgcolor: (() => {
                    const chatId = String(chat._id || chat.chatId || chat.id);
                    const unreadCount = unreadCounts && unreadCounts[chatId];
                    
                    if (unreadCount > 0) {
                      return '#ffb3b3'; // daha koyu kırmızı
                    } else {
                      return '#f5f5f5';
                    }
                  })(),
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
                <Badge
                  color="error"
                  badgeContent={unreadCount > 0 ? unreadCount : 0}
                  invisible={!unreadCount || unreadCount === 0}
                  overlap="circular"
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
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
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
                    {getChatDisplayName(chat)}
                  </span>
                }
                secondary={
                  <span style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>
                    {getLastMessage(chat)}
                    <br />
                    <span style={{ color: '#999', fontSize: 11 }}>{getChatCategoryName(chat)}</span>
                    {' • '}
                    <span style={{ color: '#999', fontSize: 11 }}>{getLastMessageTime(chat)}</span>
                  </span>
                }
                sx={{ ml: 1 }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default function ChatList({ activeChatTicketId, onSelectChat, loading: loadingProp, onUserJoinedChat, refreshTrigger }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessageChats, setNewMessageChats] = useState(new Set());
  const { unreadCounts, agentChats } = useChatContext();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(loadingProp || false);
  const [agentChatsPaginated, setAgentChatsPaginated] = useState([]);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [newMessageChatIds, setNewMessageChatIds] = useState(new Set());

  useEffect(() => {
    const handleNewChatCreated = (data) => {
      console.log('[DEBUG][ChatList] new_chat_created event payload:', data);
      const chatId = data && (data.chatId || data.id);
      
      // Daha güvenli duplicate kontrolü
      setAgentChatsPaginated(prev => {
        const exists = prev.some(chat => String(chat._id || chat.chatId || chat.id) === String(chatId));
        console.log('[DEBUG][ChatList] new_chat_created chatId:', chatId, 'exists:', exists);
        
        if (!exists && chatId) {
          // Socket ile anlık olarak chat objesini başa ekle
          const now = new Date().toISOString();
          const newChatObj = {
            _id: chatId,
            chatId: chatId,
            id: chatId,
            name: data.userId || '',
            messages: [
              {
                senderId: data.userId,
                text: typeof data.message === 'string' ? data.message : (data.message.text || ''),
                timestamp: now,
                createdAt: now
              }
            ],
            lastMessage: typeof data.message === 'string' ? data.message : (data.message.text || ''),
            lastMessageTime: now,
            createdAt: now,
            timestamp: now,
            ticket: { title: data.message && data.message.title ? data.message.title : 'Yeni Sohbet' },
          };
          console.log('[DEBUG][ChatList] new_chat_created agentChatsPaginated adding:', newChatObj);
          return [newChatObj, ...prev];
        }
        return prev; // Değişiklik yoksa aynı array'i döndür
      });
    };
    socket.on('new_chat_created', handleNewChatCreated);
    return () => socket.off('new_chat_created', handleNewChatCreated);
  }, []); // agentChatsPaginated dependency'sini kaldırdık

  // Yeni mesaj geldiğinde mevcut sohbetlerin son mesajlarını güncelle
  useEffect(() => {
    const handleReceiveChatMessage = (data) => {
      console.log('[DEBUG][ChatList] receive_chat_message event payload:', data);
      const { chatId, message, userId } = data;
      
      if (!chatId || !message) return;
      
      // Yeni mesaj animasyonu için chatId'yi ekle (sadece başka kullanıcılardan gelen mesajlar için)
      const token = localStorage.getItem('jwt');
      let myUserId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          myUserId = payload.userId || payload.id || payload.sub;
        } catch (e) {}
      }
      
      // Sadece başka kullanıcılardan gelen mesajlar için animasyon göster
      if (userId !== myUserId) {
        setNewMessageChatIds(prev => new Set([...prev, chatId]));
        
        // 3 saniye sonra animasyonu kaldır
        setTimeout(() => {
          setNewMessageChatIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(chatId);
            return newSet;
          });
        }, 3000);
      }
      
      setAgentChatsPaginated(prev => {
        const chatIndex = prev.findIndex(chat => 
          String(chat._id || chat.chatId || chat.id) === String(chatId)
        );
        
        if (chatIndex === -1) {
          console.log('[DEBUG][ChatList] receive_chat_message chat bulunamadı:', chatId);
          return prev;
        }
        
        const updatedChats = [...prev];
        const chat = { ...updatedChats[chatIndex] };
        
        // Yeni mesajı ekle
        const newMessage = {
          senderId: userId,
          text: typeof message === 'string' ? message : (message.text || ''),
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        // Mesajları güncelle
        const messages = chat.messages || chat.chatMessages || [];
        chat.messages = [...messages, newMessage];
        chat.chatMessages = chat.messages; // Her iki format için de güncelle
        
        // Son mesaj bilgilerini güncelle
        chat.lastMessage = newMessage.text;
        chat.lastMessageTime = newMessage.timestamp;
        chat.timestamp = newMessage.timestamp;
        
        // Chat'i listenin başına taşı (en son mesaj alan chat en üstte olsun)
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chat);
        
        console.log('[DEBUG][ChatList] receive_chat_message chat güncellendi:', chatId);
        return updatedChats;
      });
    };
    
    socket.on('receive_chat_message', handleReceiveChatMessage);
    return () => socket.off('receive_chat_message', handleReceiveChatMessage);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    listAgentChatsWithMessagesPaginated(page, pageSize)
      .then(res => {
        if (isMounted) {
          // Yeni eklenen chat objesini kaybetmemek için birleştir
          setAgentChatsPaginated(prev => {
            const fetched = res.data || [];
            // prev'deki, fetched'de olmayanları başa ekle (id ile)
            const prevNotInFetched = prev.filter(localChat => !fetched.some(fetchedChat => String(fetchedChat._id || fetchedChat.chatId || fetchedChat.id) === String(localChat._id || localChat.chatId || localChat.id)));
            return [...prevNotInFetched, ...fetched];
          });
          setTotal(res.total || 0);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAgentChatsPaginated([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [page, pageSize, refreshTrigger, internalRefresh]);

  // activeChatTicketId geldiğinde, bu chat'i bulup otomatik seç
  useEffect(() => {
    if (activeChatTicketId && agentChatsPaginated.length > 0) {
      const targetChat = agentChatsPaginated.find(chat => {
        const chatId = chat._id || chat.chatId || chat.id;
        return String(chatId) === String(activeChatTicketId);
      });
      
      if (targetChat && onSelectChat) {
        console.log('[ChatList] activeChatTicketId ile chat bulundu, seçiliyor:', targetChat);
        onSelectChat(targetChat);
      }
    }
  }, [activeChatTicketId, agentChatsPaginated, onSelectChat]);

  // Search fonksiyonu (filtrelenmiş chat listesi)
  const filteredChatList = (agentChatsPaginated || []).filter(chat => {
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
    onSelectChat(chat);

    // Ekstra: Okundu bildirimi anında gönder
    const token = localStorage.getItem('jwt');
    let myUserId = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        myUserId = payload.userId || payload.id || payload.sub;
      } catch (e) {}
    }
    if (realChatId && myUserId) {
      socket.emit('mark_message_read', { chatId: realChatId, userId: myUserId });
    }
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

  // Socket'tan unread_counts eventini dinle
  useEffect(() => {
    const handleUnreadCounts = (data) => {
      if (data && Array.isArray(data.counts)) {
        const map = {};
        data.counts.forEach(item => {
          map[String(item.chatId)] = item.count;
        });
        console.log('[DEBUG][handleUnreadCounts] Gelen chatId\'ler:', data.counts.map(i => i.chatId));
        console.log('[DEBUG][handleUnreadCounts] Oluşan map:', map);
        // setUnreadCounts(map); // Kaldırıldı
      }
    };
    socket.on('unread_counts', handleUnreadCounts);
    return () => socket.off('unread_counts', handleUnreadCounts);
  }, []);

  // agentChats'teki tüm chatKey'leri logla
  useEffect(() => {
    const allChatKeys = (agentChats || []).map(chat => String(chat._id || chat.chatId || chat.id));
    console.log('[DEBUG][ChatList] agentChats chatKey\'ler:', allChatKeys);
  }, [agentChats]);

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
      <ChatListItems
        sortedChatList={sortedChatList}
        loading={loading}
        activeChatTicketId={activeChatTicketId}
        handleChatSelect={handleChatSelect}
        unreadCounts={unreadCounts}
        newMessageChatIds={newMessageChatIds}
      />
      {/* Paging Component */}
      <CustomPagingComponent
        page={page}
        total={total}
        pageSize={pageSize}
        setPage={setPage}
      />
    </div>
  );
} 