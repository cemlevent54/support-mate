import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(true);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 10, p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
        <Typography component="h1" variant="h5" fontWeight={700} gutterBottom textAlign="center">
          Şifremi Unuttum
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={3}>
          Şifrenizi sıfırlamak için e-posta adresinizi girin.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            size="small"
            value={email}
            onChange={e => setEmail(e.target.value)}
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
        onClose={() => setOpen(false)}
        message="Mail gönderildi"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 