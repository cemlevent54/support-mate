import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

export default function LeaderPanel() {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#1976d2' }}>
          Leader Panel
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ color: '#666', mb: 3 }}>
          Hoş Geldiniz!
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          Bu panel sadece dil değişimi için kullanılabilir. 
          Diğer işlemler için lütfen yetkili personel ile iletişime geçin.
        </Typography>
        
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            💡 İpucu: Sol menüden dil seçimini değiştirebilirsiniz.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
} 