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

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ mt: 6, p: 2.5, borderRadius: 3, width: '100%', maxWidth: 500 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
            Sign up
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            to enjoy all of our cool features ✌️
          </Typography>
        </Box>
        <Box component="form" noValidate>
          <Stack spacing={3.5} direction={{ xs: 'column', sm: 'row' }}>
            <TextField required fullWidth id="firstName" label="First Name" name="firstName" autoComplete="given-name" size="small" sx={{ minWidth: 0, flex: 1 }} />
            <TextField fullWidth id="lastName" label="Last Name" name="lastName" autoComplete="family-name" size="small" sx={{ minWidth: 0, flex: 1 }} />
          </Stack>
          <Stack spacing={3.5} mt={2}>
            <TextField required fullWidth id="email" label="Email Address" name="email" autoComplete="email" size="small" />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              size="small"
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
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword((show) => !show)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2.5, mb: 1.5, py: 1, fontWeight: 600 }}
          >
            Sign up
          </Button>
          <Box mt={1.5} textAlign="center">
            <Typography variant="body2">
              Already a user?{' '}
              <Link href="#" color="primary" underline="hover">
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 