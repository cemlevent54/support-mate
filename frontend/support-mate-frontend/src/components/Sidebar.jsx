import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageProvider';

const Sidebar = ({ open, onClose, isAuth, onLogin, onSignup, onMyAccount, onLogout, onHome, userRole }) => {
  const { t } = useTranslation();
  const { language, onLanguageChange } = useLanguage();

  let content;
  if (userRole === 'user' && isAuth) {
    content = (
      <>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary={t('components.navbar.requests')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary={t('components.navbar.liveChat')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onMyAccount}>
            <ListItemText primary={t('components.navbar.myAccount')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout}>
            <ListItemText primary={t('components.navbar.logout')} />
          </ListItemButton>
        </ListItem>
      </>
    );
  } else if (userRole === 'user' && !isAuth) {
    content = (
      <>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogin}>
            <ListItemText primary={t('components.navbar.login')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onSignup}>
            <ListItemText primary={t('components.navbar.signup')} />
          </ListItemButton>
        </ListItem>
      </>
    );
  } else if (!isAuth) {
    content = (
      <>
        <ListItem disablePadding>
          <ListItemButton onClick={onHome}>
            <ListItemText primary={t('components.navbar.home')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogin}>
            <ListItemText primary={t('components.navbar.login')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onSignup}>
            <ListItemText primary={t('components.navbar.signup')} />
          </ListItemButton>
        </ListItem>
      </>
    );
  } else {
    content = (
      <>
        <ListItem disablePadding>
          <ListItemButton onClick={onHome}>
            <ListItemText primary={t('components.navbar.home')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onMyAccount}>
            <ListItemText primary={t('components.navbar.myAccount')} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout}>
            <ListItemText primary={t('components.navbar.logout')} />
          </ListItemButton>
        </ListItem>
      </>
    );
  }

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
        sx={{ width: 270, p: 2, background: '#f5f5f5', height: '100%' }}
        role="presentation"
        onClick={onClose}
        onKeyDown={onClose}
      >
        <List>
          {content}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 