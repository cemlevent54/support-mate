import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../api/authApi';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';
import ChatList from './chats/ChatList';
import SupportChats from './chats/SupportChats';
import SupportRequests from './SupportRequests';

const sidebarItems = [
  { key: 'requests', label: 'Requests' },
  { key: 'chats', label: 'Sohbetler' },
  { key: 'profile', label: 'Profil' },
];

export default function SupportDashboard() {
  const [selected, setSelected] = useState('requests');
  const [activeChatTicketId, setActiveChatTicketId] = useState(null);
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
    setActiveChatTicketId(ticketId);
    setActiveChatTicketTitle(title);
    setSelected('chats');
  };

  // ChatList'te bir chat seçilirse aktif chat güncellensin
  const handleSelectChat = (ticketId, title) => {
    setActiveChatTicketId(ticketId);
    setActiveChatTicketTitle(title);
  };

  // Mesaj gönderildikten sonra chat listesini güncelle
  const handleMessageSent = (message) => {
    // Chat listesini yeniden yüklemek için refreshTrigger'ı artır
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar */}
      <Paper elevation={3} sx={{ width: 220, minHeight: '100vh', borderRadius: 0, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: '#111', color: '#fff' }}>
        <div>
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" sx={{ color: '#fff' }}>Support Panel</Typography>
          <Select
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            size="small"
            sx={{ mb: 2, width: '100%', bgcolor: '#222', color: '#fff', '.MuiSvgIcon-root': { color: '#fff' } }}
          >
            <MenuItem value="tr">Türkçe</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
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
            activeChatTicketId={activeChatTicketId} 
            onSelectChat={handleSelectChat} 
            refreshTrigger={refreshTrigger}
          />
          <Box flex={1} height="100vh" bgcolor="#f5f5f5">
            {activeChatTicketId ? (
              <SupportChats 
                ticketId={activeChatTicketId} 
                ticketTitle={activeChatTicketTitle} 
                onMessageSent={handleMessageSent}
              />
            ) : (
              <Typography mt={4} ml={4} color="text.secondary">Bir talep seçin ve chat başlatın.</Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
} 