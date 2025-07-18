import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';

export default function ChatList({ chatList, activeChat, setActiveChat }) {
  const { t } = useTranslation();
  return (
    <div style={{ width: 270, background: '#f5f5f5', borderRight: '2px solid #e0e0e0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', fontWeight: 700, fontSize: 18, color: '#222', background: '#f5f5f5' }}>
        {t('supportDashboard.chatsTitle')}
      </div>
      <List sx={{ height: '100%', overflowY: 'auto', flex: 1, bgcolor: 'transparent' }}>
        {chatList.map((chat, idx) => (
          <ListItem key={chat.id} disablePadding>
            <ListItemButton
              selected={activeChat === idx}
              onClick={() => setActiveChat(idx)}
              sx={{
                color: '#222',
                bgcolor: activeChat === idx ? '#e0e0e0' : 'transparent',
                '&:hover': { bgcolor: '#e0e0e0' },
                alignItems: 'flex-start',
                py: 2,
                borderLeft: activeChat === idx ? '4px solid #1976d2' : '4px solid transparent',
                transition: 'background 0.2s',
              }}
            >
              <ListItemText
                primary={<span style={{ fontWeight: 600 }}>{chat.name}</span>}
                secondary={<span style={{ color: '#555', fontSize: 13 }}>{chat.last}</span>}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
} 