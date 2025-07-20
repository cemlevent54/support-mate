import React from 'react';
import Fab from '@mui/material/Fab';
import MessageIcon from '@mui/icons-material/Message';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const FloatingChatButton = ({ onClick, disabled = false, isOpen = false }) => {
  const { t } = useTranslation();

  return (
    <Fab
      color="primary"
      aria-label={isOpen ? t('floatingButton.close') : t('floatingButton.createTicket')}
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        }
      }}
    >
      {isOpen ? <CloseIcon /> : <MessageIcon />}
    </Fab>
  );
};

export default FloatingChatButton; 