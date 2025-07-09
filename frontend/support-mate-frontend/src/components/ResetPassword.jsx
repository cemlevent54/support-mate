import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Burada şifre güncelleme işlemi yapılabilir
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
        <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center">
          Şifreyi Sıfırla
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={3}>
          Yeni şifrenizi girin ve onaylayın.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            required
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            required
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            size="small"
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 600, textTransform: 'none' }}>
            Gönder
          </Button>
        </form>
      </Paper>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        message="Şifreniz başarıyla değiştirildi."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 