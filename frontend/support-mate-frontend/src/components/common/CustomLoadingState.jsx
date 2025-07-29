import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const CustomLoadingState = ({ 
  loading = true, 
  message = null, 
  size = 'medium',
  fullScreen = false,
  overlay = false,
  color = 'primary'
}) => {
  const { t } = useTranslation();

  // Size variants
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };

  const progressSize = sizeMap[size] || sizeMap.medium;

  // Default message
  const defaultMessage = t('common.loading', 'Yükleniyor...');
  const displayMessage = message || defaultMessage;

  // Full screen loading
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}
      >
        <CircularProgress 
          size={progressSize} 
          color={color}
          thickness={4}
        />
        {displayMessage && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ 
              mt: 2, 
              textAlign: 'center',
              maxWidth: '300px',
              lineHeight: 1.4
            }}
          >
            {displayMessage}
          </Typography>
        )}
      </Box>
    );
  }

  // Overlay loading
  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: 'inherit'
        }}
      >
        <CircularProgress 
          size={progressSize} 
          color={color}
          thickness={4}
        />
        {displayMessage && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ 
              mt: 1.5, 
              textAlign: 'center',
              maxWidth: '250px',
              lineHeight: 1.3
            }}
          >
            {displayMessage}
          </Typography>
        )}
      </Box>
    );
  }

  // Inline loading
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
        px: 2
      }}
    >
      <CircularProgress 
        size={progressSize} 
        color={color}
        thickness={4}
      />
      {displayMessage && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ 
            mt: 1.5, 
            textAlign: 'center',
            maxWidth: '200px',
            lineHeight: 1.3
          }}
        >
          {displayMessage}
        </Typography>
      )}
    </Box>
  );
};

export default CustomLoadingState; 