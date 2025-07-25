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
      console.log('[SOCKET][FRONTEND] unread_counts:', data);
      if (Array.isArray(data.counts)) {
        const map = {};
        data.counts.forEach(item => {
          map[String(item.chatId)] = item.count;
        });
        setUnreadCounts(map);
      }
    });
    return () => socket.off('unread_counts');
  }, [setUnreadCounts]);

  // Chat listesi çekme (agentChats)
  useEffect(() => {
    async function fetchAgentChats() {
      try {
        const token = localStorage.getItem('jwt');
        const res = await axios.get(BASE_URL2 + '/agent/messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setAgentChats(res.data.data);
        } else if (res.data && res.data.success && res.data.data && Array.isArray(res.data.data.chats)) {
          setAgentChats(res.data.data.chats);
        } else {
          // Fallback: data'nın kendisi chat listesi olabilir
          setAgentChats(res.data.data || []);
        }
      } catch (e) {
        console.error('[SupportLayout][fetchAgentChats] Hata:', e);
        setAgentChats([]);
      }
    }
    fetchAgentChats();
  }, [setAgentChats]);

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
                      <span style={{ position: 'relative', display: 'inline-block' }}>
                        {t(item.labelKey)}
                        {/* Realtime kırmızı badge */}
                        {totalUnread > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: 2,
                            right: -90,
                            background: 'red',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 700,
                            boxShadow: '0 0 0 2px #111',
                          }}>
                            {totalUnread}
                          </span>
                        )}
                      </span>
                    ) : t(item.labelKey)
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