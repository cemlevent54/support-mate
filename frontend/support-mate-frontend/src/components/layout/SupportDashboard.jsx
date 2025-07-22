import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { logout as apiLogout } from '../../api/authApi';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import ChatList from '../chats/ChatList';
import SupportChats from '../chats/SupportChats';
import SupportRequests from '../SupportRequests';

const sidebarItems = [
  { key: 'requests', label: 'Requests' },
  { key: 'chats', label: 'Sohbetler' },
  { key: 'profile', label: 'Profil' },
];

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' }
];

export default function SupportDashboard() {
  console.log('SupportDashboard render oldu');
  const { chatId } = useParams();
  const [selected, setSelected] = useState('requests');
  const [activeChatTicketTitle, setActiveChatTicketTitle] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();

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

  // Chat başlat callback'i
  const handleStartChat = (ticketId, title) => {
    setActiveChatTicketTitle(title);
    setSelected('chats');
    navigate(`/support/chats/${ticketId}`);
  };

  // ChatList'te bir chat seçilirse aktif chat güncellensin
  const handleSelectChat = (ticketId, title) => {
    setActiveChatTicketTitle(title);
    navigate(`/support/chats/${ticketId}`);
  };

  // Mesaj gönderildikten sonra chat listesini güncelle
  const handleMessageSent = (message) => {
    // Chat listesini yeniden yüklemek için refreshTrigger'ı artır
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar */}
      {console.log('Sidebar render ediliyor')}
      <Paper elevation={3} sx={{ width: 220, minHeight: '100vh', borderRadius: 0, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: '#111', color: '#fff' }}>
        <div>
          {console.log('Sidebar içeriği render ediliyor')}
          abc
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" sx={{ color: '#fff' }}>Support Panel</Typography>
          {/* Basit HTML select ile dil seçici */}
          <div style={{ marginBottom: 16 }}>
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
          <List>
            {sidebarItems.map(item => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  selected={selected === item.key}
                  onClick={() => setSelected(item.key)}
                  sx={{
                    color: '#fff',
                    ...(selected === item.key && {
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#1976d2' },
                    }),
                    '&:hover': { bgcolor: '#222' },
                  }}
                >
                  <ListItemText primary={
                    item.key === 'chats'
                      ? t('supportDashboard.chatsTitle')
                      : t(`supportDashboard.sidebar.${item.key}`)
                  } sx={{ color: '#fff' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </div>
        <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mt: 2, borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: '#222' } }}>
          Çıkış Yap
        </Button>
      </Paper>
      {/* İçerik */}
      {console.log('İçerik alanı render ediliyor, selected:', selected)}
      {selected === 'requests' && (
        <SupportRequests onStartChat={handleStartChat} />
      )}
      {selected === 'profile' && (
        <Box flex={1} p={4} height="100vh" bgcolor="#f5f5f5">
          <Typography variant="h5" fontWeight={600} mb={2}>{t('supportDashboard.profileTitle', 'Profil')}</Typography>
          <Typography>{t('supportDashboard.profileDesc', 'Profil bilgileri burada görünecek.')}</Typography>
        </Box>
      )}
      {selected === 'chats' && (
        <>
          <ChatList 
            activeChatTicketId={chatId} 
            onSelectChat={handleSelectChat} 
            refreshTrigger={refreshTrigger}
          />
          <Box flex={1} height="100vh" bgcolor="#f5f5f5">
            {chatId ? (
              <SupportChats 
                ticketId={chatId} 
                ticketTitle={activeChatTicketTitle} 
                onMessageSent={handleMessageSent}
              />
            ) : (
              <Typography mt={4} ml={4} color="text.secondary">{t('supportDashboard.noTicketChats')}</Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
} 