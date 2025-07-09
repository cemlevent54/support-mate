import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export default function Navbar({
  title = '',
  leftIcon,
  isAuth = false,
  mobileSidebar,
  onLogin,
  onSignup,
  onMyAccount,
  onLogout,
  onHome,
  userRole,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  let rightContent;
  if (userRole === 'user' && isAuth) {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }}>Taleplerim</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }}>Talep Oluştur</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }}>Canlı Chat</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }} onClick={onMyAccount}>My Account</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' } }} onClick={onLogout}>Logout</Button>
      </>
    );
  } else if (userRole === 'user' && !isAuth) {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }}>Talep Oluştur</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }} onClick={onLogin}>Login</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' } }} onClick={onSignup}>Signup</Button>
      </>
    );
  } else if (!isAuth) {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }} onClick={onHome}>HOME</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }} onClick={onLogin}>LOGIN</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' } }} onClick={onSignup}>SIGNUP</Button>
      </>
    );
  } else {
    rightContent = (
      <>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }} onClick={onHome}>HOME</Button>
        <Button color="inherit" sx={{ ml: 2, '&:hover': { background: '#1565c0' } }} onClick={onMyAccount}>MY ACCOUNT</Button>
        <Button color="inherit" sx={{ ml: 1, '&:hover': { background: '#1565c0' } }} onClick={onLogout}>LOGOUT</Button>
      </>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100vw', minHeight: '80px', background: 'transparent' }}>
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            width: { xs: '95vw', sm: '90vw', md: 1100 },
            maxWidth: 1100,
            borderRadius: 3,
            boxShadow: 6,
            overflow: 'hidden',
            transition: 'box-shadow 0.3s',
            pointerEvents: 'auto',
            background: 'transparent',
            '&:hover': {
              boxShadow: 12,
            },
          }}
        >
          <AppBar
            position="static"
            elevation={0}
            sx={{
              background: '#1976d2',
              borderRadius: 3,
              boxShadow: 'none',
              px: 2,
            }}
          >
            <Toolbar>
              {leftIcon && (
                <Box sx={{ mr: 2 }}>{leftIcon}</Box>
              )}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                {title}
              </Typography>
              {isMobile && mobileSidebar}
              {!isMobile && rightContent}
            </Toolbar>
          </AppBar>
        </Box>
      </Box>
    </Box>
  );
} 