import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

const Sidebar = ({ open, onClose, isAuth, onLogin, onSignup, onMyAccount, onLogout }) => {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
        sx={{ width: 270, p: 2, background: '#f5f5f5', height: '100%' }}
        role="presentation"
        onClick={onClose}
        onKeyDown={onClose}
      >
        <List>
          {!isAuth ? (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={onLogin}>
                  <ListItemText primary="Login" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={onSignup}>
                  <ListItemText primary="Signup" />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={onMyAccount}>
                  <ListItemText primary="My Account" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={onLogout}>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 