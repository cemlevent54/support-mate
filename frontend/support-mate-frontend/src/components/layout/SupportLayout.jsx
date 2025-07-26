import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { logout as apiLogout } from '../../api/authApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import EmployeeKanbanBoard from '../../pages/support/EmployeeKanbanBoard';
import SupportKanbanBoard from '../../pages/support/SupportKanbanBoard';
import isEmployee from '../../auth/isEmployee';
import isCustomerSupporter from '../../auth/isCustomerSupporter';
import socket from '../../socket/socket';
import { useChatContext } from '../chats/ChatContext';
import { listMessagesByChatId , BASE_URL2 } from '../../api/messagesApi';
import axios from 'axios';
import Badge from '@mui/material/Badge';

const sidebarItems = [
  { key: 'requests', labelKey: 'supportDashboard.sidebar.requests', path: '/support/requests' },
  { key: 'chats', labelKey: 'supportDashboard.sidebar.chats', path: '/support/chats' },
  { key: 'kanban', labelKey: 'supportDashboard.sidebar.kanban', path: '/support/kanban' },
  { key: 'profile', labelKey: 'supportDashboard.sidebar.profile', path: '/support/profile' },
];

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' }
];

export default function SupportLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, onLanguageChange } = useLanguage();
  const { t } = useTranslation();
  const { unreadCounts, setUnreadCounts, agentChats, setAgentChats } = useChatContext();
  
  // Kullanıcı rolünü JWT'den al
  let roleName = null;
  const token = localStorage.getItem('jwt');
  let myUserId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      roleName = decoded.roleName;
      myUserId = decoded.userId || decoded.id || decoded.sub;
    } catch (e) {}
  }

  // Socket bağlantı durumunu kontrol et
  useEffect(() => {
    console.log('[SupportLayout] Socket bağlantı durumu:', socket.connected);
    console.log('[SupportLayout] Socket ID:', socket.id);
    
    // Test için basit bir event dinle
    const handleTestEvent = (data) => {
      console.log('[SupportLayout] Test event alındı:', data);
    };
    
    socket.on('test_event', handleTestEvent);
    
    // Test event'i emit et
    setTimeout(() => {
      console.log('[SupportLayout] Test event emit ediliyor');
      socket.emit('test_event', { message: 'Test from SupportLayout' });
    }, 2000);
    
    // Socket bağlantı event'lerini dinle
    socket.on('connect', () => {
      console.log('[SupportLayout] Socket bağlandı, ID:', socket.id);
      
      // Socket bağlandıktan sonra unread counts'u çek
      if (myUserId) {
        console.log('[SupportLayout] Socket bağlandı, unread counts çekiliyor...');
        socket.emit('get_unread_counts', { userId: myUserId });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('[SupportLayout] Socket bağlantısı kesildi');
    });
    
    return () => {
      socket.off('test_event', handleTestEvent);
    };
  }, [myUserId]);

  // Eğer employee ise support paneline erişimi engelle

  // Employee ise chats ve requests menüsünü gösterme
  const filteredSidebarItems = isEmployee({ roleName })
    ? sidebarItems.filter(item => item.key !== 'chats' && item.key !== 'requests')
    : sidebarItems;

  // Realtime unread count state
  const totalUnread = Object.values(unreadCounts).reduce((sum, val) => sum + val, 0);

  // agentChats propunu veya contextini burada alman gerekiyor. Örneğin:
  // const { agentChats } = useAgentChatsContext();
  // veya prop olarak geliyorsa: props.agentChats
  // Burada örnek olarak window.agentChats üzerinden gösteriyorum, kendi state'inden alman gerek.
  // const agentChats = window.agentChats || []; // Kaldırıldı, context'ten geliyor

  // Tüm chat odalarına otomatik join_room
  useEffect(() => {
    if (!Array.isArray(agentChats) || !myUserId) return;
    agentChats.forEach(chat => {
      const chatId = chat._id || chat.chatId || chat.id;
      if (chatId) {
        socket.emit('join_room', { chatId, userId: myUserId, userRole: 'Support' });
      }
    });
  }, [agentChats, myUserId]);

  // Socket.io ile yeni mesajları dinle
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('[SupportLayout][SOCKET] receive_chat_message:', data, 'pathname:', location.pathname);
      console.log('[SupportLayout][SOCKET] unreadCounts (on receive_chat_message):', unreadCounts);
      const totalUnread = Object.values(unreadCounts).reduce((sum, val) => sum + val, 0);
      console.log('[SupportLayout][SOCKET] totalUnread (on receive_chat_message):', totalUnread);
      // Eğer aktif chat sayfasında değilsek unreadCount'u artır
      if (!location.pathname.startsWith('/support/chats')) {
        // setUnreadCount(prev => prev + 1); // Kaldırıldı
      }
    };
    socket.on('receive_chat_message', handleNewMessage);
    return () => socket.off('receive_chat_message', handleNewMessage);
  }, [location.pathname, unreadCounts]);

  // Chat sayfası açıldığında unreadCount'u sıfırla
  useEffect(() => {
    if (location.pathname.startsWith('/support/chats')) {
      // setUnreadCount(0); // Kaldırıldı
    }
  }, [location.pathname]);

  useEffect(() => {
    socket.on('unread_count', (data) => {
      console.log('[SOCKET][FRONTEND] unread_count:', data);
      // setUnreadCount(data.count); // Kaldırıldı
    });
    return () => socket.off('unread_count');
  }, []);

  useEffect(() => {
    socket.on('unread_counts', (data) => {
      console.log('[SOCKET][FRONTEND] unread_counts event alındı:', data);
      console.log('[SOCKET][FRONTEND] data.counts:', data.counts);
      console.log('[SOCKET][FRONTEND] Array.isArray(data.counts):', Array.isArray(data.counts));
      
      if (Array.isArray(data.counts)) {
        const map = {};
        data.counts.forEach(item => {
          console.log('[SOCKET][FRONTEND] Processing item:', item);
          map[String(item.chatId)] = item.count;
        });
        console.log('[SOCKET][FRONTEND] Oluşturulan map:', map);
        console.log('[SOCKET][FRONTEND] Mevcut unreadCounts:', unreadCounts);
        setUnreadCounts(map);
        console.log('[SOCKET][FRONTEND] setUnreadCounts çağrıldı');
      } else {
        console.warn('[SOCKET][FRONTEND] data.counts array değil:', data.counts);
      }
    });
    return () => socket.off('unread_counts');
  }, [setUnreadCounts, unreadCounts]);

  // Yeni chat oluşturulduğunda dinle
  useEffect(() => {
    console.log('[SupportLayout] new_chat_created event listener kuruluyor, myUserId:', myUserId);
    
    const handleNewChatCreated = (data) => {
      console.log('[SupportLayout][SOCKET] new_chat_created event alındı:', data);
      console.log('[SupportLayout][SOCKET] myUserId:', myUserId, 'data.receiverId:', data.receiverId);
      
      // Yeni chat oluşturulduğunda agentChats'i güncelle
      if (data && data.chatId) {
        // Eğer receiverId benim userId'm ise, yeni chat'i listeye ekle
        if (data.receiverId === myUserId) {
          console.log('[SupportLayout] ReceiverId eşleşti, chat listeye ekleniyor');
          
          setAgentChats(prev => {
            // Duplicate kontrolü
            const exists = prev.some(chat => String(chat._id || chat.chatId || chat.id) === String(data.chatId));
            if (exists) {
              console.log('[SupportLayout] Chat zaten var, eklenmiyor');
              return prev;
            }
            
            const newChat = {
              _id: data.chatId,
              chatId: data.chatId,
              id: data.chatId,
              name: data.userId || '',
              messages: [
                {
                  senderId: data.userId,
                  text: typeof data.message === 'string' ? data.message : (data.message.text || ''),
                  timestamp: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                }
              ],
              lastMessage: typeof data.message === 'string' ? data.message : (data.message.text || ''),
              lastMessageTime: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              timestamp: new Date().toISOString(),
              ticket: { title: 'Yeni Sohbet' },
            };
            
            console.log('[SupportLayout] Yeni chat objesi oluşturuldu:', newChat);
            const updated = [newChat, ...prev];
            console.log('[SupportLayout] Güncellenmiş agentChats:', updated);
            return updated;
          });
        } else {
          console.log('[SupportLayout] ReceiverId eşleşmedi, chat eklenmiyor');
        }
      }
    };
    
    socket.on('new_chat_created', handleNewChatCreated);
    console.log('[SupportLayout] new_chat_created event listener kuruldu');
    
    return () => {
      socket.off('new_chat_created', handleNewChatCreated);
      console.log('[SupportLayout] new_chat_created event listener kaldırıldı');
    };
  }, [myUserId, setAgentChats]);

  // Chat listesi çekme (agentChats)
  

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('jwt');
      await apiLogout(token);
    } catch (e) {
      localStorage.removeItem('jwt');
    } finally {
      navigate('/login');
      setTimeout(() => { window.location.reload(); }, 100);
    }
  };

  // myUserId veya socket.connected değiştiğinde unread counts'u çek
  useEffect(() => {
    if (myUserId && socket.connected) {
      console.log('[SupportLayout] myUserId veya socket.connected değişti, unread counts çekiliyor...');
      socket.emit('get_unread_counts', { userId: myUserId });
    }
  }, [myUserId, socket.connected]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Paper elevation={3} style={{ width: 220, minHeight: '100vh', borderRadius: 0, padding: 16, display: 'flex', flexDirection: 'column', background: '#111', color: '#fff' }}>
        {/* Sidebar içeriği */}
        <Typography variant="h6" fontWeight={700} mb={1} textAlign="center" sx={{ color: '#fff' }}>
          {isEmployee({ roleName }) ? 'Employee Panel' : 'Support Panel'}
        </Typography>
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="language-select" style={{ color: '#fff', fontSize: 14, marginBottom: 4, display: 'block' }}>Dil Seçimi</label>
          <select
            id="language-select"
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #444', background: '#222', color: '#fff', fontSize: 14 }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>
        <List sx={{ flexGrow: 1 }}>
          {filteredSidebarItems.map(item => (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: '#fff',
                  ...(location.pathname === item.path && {
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#1976d2' },
                  }),
                  '&:hover': { bgcolor: '#222' },
                  position: 'relative',
                }}
              >
                <ListItemText
                  primary={
                    item.key === 'chats' ? (
                      <Badge
                        color="error"
                        badgeContent={totalUnread > 0 ? totalUnread : 0}
                        invisible={totalUnread === 0}
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: '#ff4444',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          },
                        }}
                      >
                        <span>{t(item.labelKey)}</span>
                      </Badge>
                    ) : (
                      t(item.labelKey)
                    )
                  }
                  sx={{ color: '#fff' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mt: 2, borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: '#222' } }}>
          Çıkış Yap
        </Button>
      </Paper>
      <div style={{ flex: 1 }}>
        {/* Dinamik kanban yönlendirme */}
        {location.pathname === '/support/kanban' ? (
          isEmployee({ roleName }) ? <EmployeeKanbanBoard /> : <SupportKanbanBoard />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
} 