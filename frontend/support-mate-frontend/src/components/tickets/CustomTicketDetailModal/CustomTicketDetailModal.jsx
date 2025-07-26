import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { 
  MdAttachFile, 
  MdPerson, 
  MdSupportAgent, 
  MdCategory, 
  MdSchedule, 
  MdDescription, 
  MdPermIdentity 
} from 'react-icons/md';
import { FaTicketAlt } from 'react-icons/fa';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const CustomTicketDetailModal = ({ 
  open, 
  onClose, 
  ticket, 
  i18nNamespace = 'ticketDetail',
  showChatButton = false,
  onChatClick = null
}) => {
  const { t, i18n } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    console.log('Modal i18n language changed to:', i18n.language);
    setForceUpdate(prev => prev + 1);
  }, [i18n.language]);

  // Additional effect to monitor language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language change detected, current language:', i18n.language);
      setForceUpdate(prev => prev + 1);
    };

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Force re-render when modal opens/closes
  useEffect(() => {
    if (open) {
      console.log('Modal opened, current language:', i18n.language);
      setForceUpdate(prev => prev + 1);
    }
  }, [open, i18n.language]);

  // Memoize translations to force re-render when language changes
  const translations = useMemo(() => ({
    modalTitle: t(`${i18nNamespace}.modalTitle`, i18n.language === 'tr' ? 'Ticket Detayları' : 'Ticket Details'),
    description: t(`${i18nNamespace}.description`, i18n.language === 'tr' ? 'Açıklama' : 'Description'),
    noDescription: t(`${i18nNamespace}.noDescription`, i18n.language === 'tr' ? 'Açıklama bulunmuyor.' : 'No description available.'),
    category: t(`${i18nNamespace}.category`, i18n.language === 'tr' ? 'Kategori' : 'Category'),
    customerInfo: t(`${i18nNamespace}.customerInfo`, i18n.language === 'tr' ? 'Müşteri Bilgileri' : 'Customer Information'),
    fullName: t(`${i18nNamespace}.fullName`, i18n.language === 'tr' ? 'Ad Soyad' : 'Full Name'),
    email: t(`${i18nNamespace}.email`, i18n.language === 'tr' ? 'E-posta' : 'Email'),
    phone: t(`${i18nNamespace}.phone`, i18n.language === 'tr' ? 'Telefon' : 'Phone'),
    supportAgent: t(`${i18nNamespace}.supportAgent`, i18n.language === 'tr' ? 'Destek Temsilcisi' : 'Support Agent'),
    timeInfo: t(`${i18nNamespace}.timeInfo`, i18n.language === 'tr' ? 'Zaman Bilgileri' : 'Time Information'),
    createdAt: t(`${i18nNamespace}.createdAt`, i18n.language === 'tr' ? 'Oluşturulma' : 'Created At'),
    closedAt: t(`${i18nNamespace}.closedAt`, i18n.language === 'tr' ? 'Kapanma' : 'Closed At'),
    deletedAt: t(`${i18nNamespace}.deletedAt`, i18n.language === 'tr' ? 'Silinme' : 'Deleted At'),
    attachments: t(`${i18nNamespace}.attachments`, i18n.language === 'tr' ? 'Ekler' : 'Attachments'),
    noAttachments: t(`${i18nNamespace}.noAttachments`, i18n.language === 'tr' ? 'Ek dosya bulunmuyor.' : 'No attachments available.'),
    ticketId: t(`${i18nNamespace}.ticketId`, i18n.language === 'tr' ? 'Ticket ID' : 'Ticket ID'),
    chat: t(`${i18nNamespace}.chat`, i18n.language === 'tr' ? 'Chat' : 'Chat'),
    close: t(`${i18nNamespace}.close`, i18n.language === 'tr' ? 'Kapat' : 'Close'),
    categoryNotSpecified: t(`${i18nNamespace}.categoryNotSpecified`, i18n.language === 'tr' ? 'Kategori belirtilmemiş' : 'Category not specified'),
    unknown: t(`${i18nNamespace}.unknown`, i18n.language === 'tr' ? 'Bilinmeyen' : 'Unknown')
  }), [t, i18n.language, i18nNamespace]);

  const modalKey = `modal-${i18n.language}-${forceUpdate}-${open ? 'open' : 'closed'}-${Date.now()}`;

  if (!ticket) return null;

  const getCategoryName = (category) => {
    if (!category) return translations.categoryNotSpecified;
    
    if (category.data) {
      return i18n.language === 'tr'
        ? category.data.category_name_tr || category.data.category_name_en || category.data.name || translations.unknown
        : category.data.category_name_en || category.data.category_name_tr || category.data.name || translations.unknown;
    }
    
    return i18n.language === 'tr'
      ? category.category_name_tr || category.category_name_en || category.name || translations.unknown
      : category.category_name_en || category.category_name_tr || category.name || translations.unknown;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN':
        return i18n.language === 'tr' ? 'Açık' : 'Open';
      case 'IN_REVIEW':
        return i18n.language === 'tr' ? 'İncelemede' : 'In Review';
      case 'CLOSED':
        return i18n.language === 'tr' ? 'Kapalı' : 'Closed';
      case 'DELETED':
        return i18n.language === 'tr' ? 'Silinmiş' : 'Deleted';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'success';
      case 'IN_REVIEW':
        return 'warning';
      case 'CLOSED':
        return 'default';
      case 'DELETED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleFileDownload = (file) => {
    const fullUrl = `${BASE_URL}/${file.url}`;
    console.log('Downloading file:', fullUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };
  
  return (
    <Dialog 
      key={modalKey}
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh'
        },
        '& .MuiDialogContent-root': {
          padding: 0
        }
      }}
    >
      <DialogTitle>
        {translations.modalTitle}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          {/* Header Section */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 3, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white' 
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {ticket.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip 
                label={getStatusText(ticket.status)} 
                color={getStatusColor(ticket.status)}
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold' 
                }}
              />
            </Box>
          </Paper>

          {/* Main Content Grid */}
          <Grid container spacing={3}>
            {/* Left Column - Basic Info */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    marginBottom: 2
                  }}
                >
                  <MdDescription />
                  {translations.description}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    lineHeight: 1.6, 
                    color: '#666' 
                  }}
                >
                  {ticket.description || translations.noDescription}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    marginBottom: 2
                  }}
                >
                  <MdCategory />
                  {translations.category}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {getCategoryName(ticket.category)}
                </Typography>

                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    marginBottom: 2
                  }}
                >
                  <FaTicketAlt />
                  {translations.ticketId}:
                </Typography>
                <Typography 
                  variant="body1" 
                  fontWeight="medium" 
                  sx={{ 
                    fontFamily: 'Courier New, monospace',
                    fontWeight: 500
                  }}
                >
                  {ticket.id}
                </Typography>
              </Paper>
            </Grid>

            {/* Right Column - User & Agent Info */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
                {/* Customer Info */}
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    marginBottom: 2
                  }}
                >
                  <MdPerson />
                  {translations.customerInfo}
                </Typography>
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: '#f8f9fa', 
                  borderRadius: 2 
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666',
                      fontSize: '0.875rem',
                      marginBottom: 1
                    }}
                  >
                    {translations.fullName}:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 500,
                      marginBottom: 2
                    }}
                  >
                    {ticket.customer?.firstName} {ticket.customer?.lastName}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666',
                      fontSize: '0.875rem',
                      marginBottom: 1
                    }}
                  >
                    {translations.email}:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 500,
                      marginBottom: 2
                    }}
                  >
                    {ticket.customer?.email}
                  </Typography>
                  {ticket.customer?.phoneNumber && (
                    <>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '0.875rem',
                          marginBottom: 1
                        }}
                      >
                        {translations.phone}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          marginBottom: 2
                        }}
                      >
                        {ticket.customer.phoneNumber}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Agent Info */}
                {ticket.agent && (
                  <>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        marginBottom: 2
                      }}
                    >
                      <MdSupportAgent />
                      {translations.supportAgent}
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#e3f2fd', 
                      borderRadius: 2 
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '0.875rem',
                          marginBottom: 1
                        }}
                      >
                        {translations.fullName}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          marginBottom: 2
                        }}
                      >
                        {ticket.agent.firstName} {ticket.agent.lastName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '0.875rem',
                          marginBottom: 1
                        }}
                      >
                        {translations.email}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          marginBottom: 2
                        }}
                      >
                        {ticket.agent.email}
                      </Typography>
                      {ticket.agent.phoneNumber && (
                        <>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#666',
                              fontSize: '0.875rem',
                              marginBottom: 1
                            }}
                          >
                            {translations.phone}:
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              marginBottom: 2
                            }}
                          >
                            {ticket.agent.phoneNumber}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Bottom Row - Timestamps & Attachments */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    marginBottom: 2
                  }}
                >
                  <MdSchedule />
                  {translations.timeInfo}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.875rem',
                        marginBottom: 1
                      }}
                    >
                      {translations.createdAt}:
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500,
                        marginBottom: 2
                      }}
                    >
                      {new Date(ticket.createdAt).toLocaleString('tr-TR')}
                    </Typography>
                  </Grid>
                  {ticket.closedAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '0.875rem',
                          marginBottom: 1
                        }}
                      >
                        {translations.closedAt}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          marginBottom: 2
                        }}
                      >
                        {new Date(ticket.closedAt).toLocaleString('tr-TR')}
                      </Typography>
                    </Grid>
                  )}
                  {ticket.deletedAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontSize: '0.875rem',
                          marginBottom: 1
                        }}
                      >
                        {translations.deletedAt}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          marginBottom: 2,
                          color: 'error.main'
                        }}
                      >
                        {new Date(ticket.deletedAt).toLocaleString('tr-TR')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>

            {/* Attachments Section */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    marginBottom: 2
                  }}
                >
                  <MdAttachFile />
                  {translations.attachments} 
                  {ticket.attachments && ticket.attachments.length > 0 ? ` (${ticket.attachments.length})` : ''}
                </Typography>
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {ticket.attachments.map((file, index) => (
                      <Chip
                        key={index}
                        icon={<MdAttachFile />}
                        label={file.name}
                        variant="outlined"
                        onClick={() => handleFileDownload(file)}
                        sx={{ 
                          cursor: 'pointer', 
                          transition: 'background-color 0.2s ease',
                          '&:hover': { 
                            bgcolor: '#f5f5f5' 
                          } 
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontStyle: 'italic',
                      color: '#888'
                    }}
                  >
                    {translations.noAttachments}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        {showChatButton && onChatClick && (
          <Button 
            onClick={() => onChatClick(ticket)}
            variant="contained"
            color="primary"
          >
            {translations.chat}
          </Button>
        )}
        <Button onClick={onClose}>
          {translations.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomTicketDetailModal; 