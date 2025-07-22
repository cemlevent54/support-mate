import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const AppLogo = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <SupportAgentIcon fontSize="large" sx={{ color: 'white' }} />
    <Typography variant="h6" component="span" sx={{ color: 'white', fontWeight: 700 }}>
      SupportMate
    </Typography>
  </Box>
);

export default AppLogo; 