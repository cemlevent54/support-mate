import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function MyAccount() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Bilgileri güncelleme işlemi
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Şifre güncelleme işlemi
  };

  const handleDeleteAccount = () => {
    // Hesap silme işlemi
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center" mt={6}>
        Hesabım
      </Typography>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} mt={2}>
        {/* Kullanıcı Bilgileri Card */}
        <Paper elevation={4} sx={{ flex: 1, p: 4, minWidth: 300, width: 400 }}>
          <form onSubmit={handleSave}>
            <Typography variant="h6" fontWeight={600} mb={2}>Kullanıcı Bilgileri</Typography>
            <Stack spacing={2}>
              <TextField label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} fullWidth size="small" />
              <TextField label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} fullWidth size="small" />
              <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth size="small" />
              <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} fullWidth size="small" />
              <Button type="submit" variant="contained" sx={{ mt: 1, fontWeight: 600, textTransform: 'none' }}>Kaydet</Button>
            </Stack>
          </form>
        </Paper>
        {/* Şifre Güncelleme Card */}
        <Paper elevation={4} sx={{ flex: 1, p: 4, minWidth: 300, width: 400 }}>
          <form onSubmit={handlePasswordUpdate}>
            <Typography variant="h6" fontWeight={600} mb={2}>Şifre Güncelle</Typography>
            <Stack spacing={2}>
              <TextField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth size="small" />
              <TextField label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} fullWidth size="small" />
              <Button type="submit" variant="outlined" sx={{ mt: 1, fontWeight: 600, textTransform: 'none' }}>Şifreyi Güncelle</Button>
            </Stack>
          </form>
        </Paper>
      </Box>
      <Box mt={6} textAlign="center">
        <Button variant="outlined" color="error" sx={{ fontWeight: 600, textTransform: 'none' }} onClick={handleDeleteAccount}>
          Hesabımı Sil
        </Button>
      </Box>
    </Box>
  );
} 