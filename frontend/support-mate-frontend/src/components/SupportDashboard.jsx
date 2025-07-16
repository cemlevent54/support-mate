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
import ChatArea from './chats/ChatArea';

const sidebarItems = [
  { key: 'requests', label: 'Destek Talepleri' },
  { key: 'chats', label: 'Sohbetler' },
  { key: 'profile', label: 'Profil' },
];

export default function SupportDashboard() {
  const [selected, setSelected] = useState('requests');
  const [activeChat, setActiveChat] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();

  // Örnek chat listesi ve mesajlar
  const chatList = [
    { id: 1, name: 'Kullanıcı 1', last: 'Merhaba, bir sorum var.' },
    { id: 2, name: 'Kullanıcı 2', last: 'Teşekkürler, iyi çalışmalar.' },
    { id: 3, name: 'Kullanıcı 3', last: 'Destek talebim var.' },
  ];
  const [chatMessages, setChatMessages] = useState([
    [
      { from: 'user', text: 'Merhaba, bir sorum var.', time: '10:00' },
      { from: 'support', text: 'Tabii, nasıl yardımcı olabilirim?', time: '10:01' },
    ],
    [
      { from: 'user', text: 'Teşekkürler, iyi çalışmalar.', time: '09:30' },
      { from: 'support', text: 'Size de iyi günler!', time: '09:31' },
    ],
    [
      { from: 'user', text: 'Destek talebim var.', time: '11:00' },
      { from: 'support', text: 'Talebinizi iletebilirsiniz.', time: '11:01' },
    ],
  ]);
  const [input, setInput] = useState("");
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev =>
      prev.map((arr, idx) =>
        idx === activeChat
          ? [...arr, { from: 'support', text: input, time }]
          : arr
      )
    );
    setInput("");
  };

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
        <Box flex={1} p={4} height="100vh" bgcolor="#f5f5f5">
          <Typography variant="h5" fontWeight={600} mb={2}>{t('supportDashboard.requestsTitle', 'Destek Talepleri')}</Typography>
          <Typography>{t('supportDashboard.requestsDesc', 'Destek talepleri burada görünecek.')}</Typography>
        </Box>
      )}
      {selected === 'profile' && (
        <Box flex={1} p={4} height="100vh" bgcolor="#f5f5f5">
          <Typography variant="h5" fontWeight={600} mb={2}>{t('supportDashboard.profileTitle', 'Profil')}</Typography>
          <Typography>{t('supportDashboard.profileDesc', 'Profil bilgileri burada görünecek.')}</Typography>
        </Box>
      )}
      {selected === 'chats' && (
        <>
          <ChatList chatList={chatList} activeChat={activeChat} setActiveChat={setActiveChat} />
          <Box flex={1} height="100vh" bgcolor="#f5f5f5">
            <ChatArea messages={chatMessages[activeChat] || []} input={input} setInput={setInput} handleSend={handleSend} />
          </Box>
          
        </>
      )}
    </Box>
  );
} 