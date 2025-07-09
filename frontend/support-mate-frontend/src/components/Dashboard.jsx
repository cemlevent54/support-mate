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

const sidebarItems = [
  { key: 'users', label: 'Kullanıcılar' },
  { key: 'settings', label: 'Ayarlar' },
];

export default function Dashboard() {
  const [selected, setSelected] = useState('users');
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: '#f5f5f5' }}>
      {/* Sidebar */}
      <Paper elevation={3} sx={{ width: 220, minHeight: '100vh', borderRadius: 0, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: '#111', color: '#fff' }}>
        <div>
          <Typography variant="h6" fontWeight={700} mb={2} textAlign="center" sx={{ color: '#fff' }}>Admin Panel</Typography>
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
                  <ListItemText primary={item.label} sx={{ color: '#fff' }} />
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
      <Box flex={1} p={4}>
        {selected === 'users' && (
          <Box>
            <Typography variant="h5" fontWeight={600} mb={2}>Kullanıcılar</Typography>
            <Typography>Kullanıcı listesi burada görünecek.</Typography>
          </Box>
        )}
        {selected === 'settings' && (
          <Box>
            <Typography variant="h5" fontWeight={600} mb={2}>Ayarlar</Typography>
            <Typography>Admin ayarları burada görünecek.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
} 