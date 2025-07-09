import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';

export default function LoginCard({ onUserLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'admin@admin.com' && password === 'admin') {
      navigate('/admin');
    } else if (email === 'support@support.com' && password === 'support') {
      navigate('/support');
    } else if (email === 'employee@employee.com' && password === 'employee') {
      navigate('/employee');
    } else if (email === 'user@user.com' && password === 'user') {
      if (onUserLogin) onUserLogin('user');
      navigate('/');
    } else {
      setError('Geçersiz e-posta veya şifre');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 6, p: 2.5, borderRadius: 3, width: '100%', maxWidth: 500 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Welcome back! Please login to your account.
          </Typography>
        </Box>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Stack spacing={3.5}>
            <TextField required fullWidth id="email" label="Email Address" name="email" autoComplete="email" size="small" value={email} onChange={e => setEmail(e.target.value)} />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              size="small"
              value={password}
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
          
          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3.5, mb: 1.5, py: 1, fontWeight: 600 }}
          >
            Login
          </Button>
          <Box mt={1.5} textAlign="center">
            <Typography variant="body2">
              Hesabın yok mu?{' '}
              <Link href="#" color="primary" underline="hover">
                Kayıt ol
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Şifreni mi unuttun?{' '}
              <Link href="#" color="primary" underline="hover" onClick={() => navigate('/forgot-password')}>
                Şifremi sıfırla
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 