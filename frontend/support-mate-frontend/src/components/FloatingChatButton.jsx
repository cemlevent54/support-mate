import React from 'react';
import Fab from '@mui/material/Fab';
import MessageIcon from '@mui/icons-material/Message';
import { useTranslation } from 'react-i18next';

const FloatingChatButton = ({ onClick, disabled = false }) => {
  const { t } = useTranslation();

  return (
    <Fab
      color="primary"
      aria-label={t('floatingButton.createTicket')}
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        }
      }}
    >
      <MessageIcon />
    </Fab>
  );
};

export default FloatingChatButton; 