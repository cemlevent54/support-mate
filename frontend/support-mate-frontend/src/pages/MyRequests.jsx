import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import { listTicketsForUser } from '../api/ticketApi';
import { useChatSocket } from '../hooks/useChatSocket';
import ChatPanel from '../components/ChatPanel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';


const MyRequests = ({ openCreateTicketModal }) => {
  const { t } = useTranslation();

const categoryLabels = {
    hardware: t('myRequests.categories.hardware'),
    software: t('myRequests.categories.software'),
    network: t('myRequests.categories.network'),
    other: t('myRequests.categories.other')
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #1976d2',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTicket, setChatTicket] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatTicket, setSelectedChatTicket] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const navigate = useNavigate();

  // Chat socket hook'unu kullan (modal için)
  const {
    messages,
    input,
    chatId,
    sending,
    someoneTyping,
    messagesEndRef,
    myUserId,
    myUserName,
    handleSend,
    handleInputChange,
    handleCloseChat: closeChatHook,
    setInput
  } = useChatSocket(selectedChatTicket, chatModalOpen);

  // fetchTickets fonksiyonunu burada tanımla
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listTicketsForUser();
      if (response.success && Array.isArray(response.data)) {
        const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRows(sorted.map((ticket, idx) => ({
          id: ticket._id || idx + 1,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          status: ticket.status || "-",
          createdAt: ticket.createdAt ? new Date(new Date(ticket.createdAt).getTime() + 3 * 60 * 60 * 1000).toLocaleString() : "-",
          files: ticket.attachments || [],
          chatId: ticket.chatId || ticket._id,
          customerId: ticket.customerId,
          assignedAgentId: ticket.assignedAgentId,
          raw: ticket
        })));
      } else {
        setRows([]);
        setError(response.message || t('myRequests.noTickets'));
      }
    } catch (err) {
      setError(t('myRequests.error'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [t]);

  // Ticket oluşturma modalı açıldığında tabloyu güncellemek için callback
  const handleTicketCreated = () => {
    fetchTickets();
  };

  const handleOpenChat = (ticket) => {
    console.log('MyRequests - handleOpenChat - ticket:', ticket);
    console.log('MyRequests - handleOpenChat - assignedAgentId:', ticket.raw?.assignedAgentId);
    
    setSelectedChatTicket({
      ...ticket.raw,
      chatId: ticket.raw.chatId || ticket.raw._id,
      ticketId: ticket.raw._id
    });
    setChatModalOpen(true);
  };
  const handleCloseChat = () => {
    setChatOpen(false);
    setChatTicket(null);
    closeChatHook();
  };
  const handleCloseChatModal = () => {
    setChatModalOpen(false);
    setSelectedChatTicket(null);
  };

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalOpen(true);
  };
  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  const columns = [
    { field: 'id', headerName: t('myRequests.table.id'), width: 70, hide: true },
    { field: 'title', headerName: t('myRequests.table.title'), width: 250, flex: 1 },
    { field: 'category', headerName: t('myRequests.table.category'), width: 120, flex: 0.5 },
    { field: 'status', headerName: t('myRequests.table.status'), width: 120, flex: 0.5 },
    { field: 'createdAt', headerName: t('myRequests.table.createdAt'), width: 180, flex: 0.8 },
    {
      field: 'actions',
      headerName: t('myRequests.table.actions'),
      width: 200,
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ChatIcon />}
            onClick={() => handleOpenChat(params.row)}
            sx={{ fontSize: '0.75rem', px: 1 }}
          >
            {t('myRequests.buttons.chat')}
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDetail(params.row)}
            sx={{ fontSize: '0.75rem', px: 1 }}
          >
            {t('myRequests.buttons.detail')}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Box maxWidth={1300} mx="auto" mt={6} display="flex" flexDirection="column" height="calc(100vh - 200px)" minHeight={0}>
        <Typography variant="h5" fontWeight={700} mb={3}>{t('myRequests.title')}</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box flex={1} display="flex" flexDirection="column" minHeight={0}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              disableSelectionOnClick
              sx={{
                flex: 1,
                minHeight: 0,
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #e0e0e0',
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: '#fff',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid #e0e0e0',
                  backgroundColor: '#f9f9f9',
                },
              }}
              columnVisibilityModel={{
                id: false
              }}
            />
          </Box>
        )}
        <Modal open={modalOpen} onClose={handleCloseDetail}>
          <Box sx={modalStyle}>
            <Typography variant="h6" mb={2}>{t('myRequests.modal.title')}</Typography>
            {selectedTicket && (
              <Box>
                <Typography><b>{t('myRequests.modal.titleLabel')}</b> {selectedTicket.title}</Typography>
                <Typography><b>{t('myRequests.modal.descriptionLabel')}</b> {selectedTicket.description}</Typography>
                <Typography><b>{t('myRequests.modal.categoryLabel')}</b> {categoryLabels[selectedTicket.category] || selectedTicket.category}</Typography>
                <Typography><b>{t('myRequests.modal.statusLabel')}</b> {selectedTicket.status}</Typography>
                <Typography><b>{t('myRequests.modal.createdAtLabel')}</b> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '-'}</Typography>
                <Typography><b>{t('myRequests.modal.customerIdLabel')}</b> {selectedTicket.customerId}</Typography>
                <Typography><b>{t('myRequests.modal.agentIdLabel')}</b> {selectedTicket.assignedAgentId}</Typography>
                <Typography><b>{t('myRequests.modal.attachmentsLabel')}</b></Typography>
                <ul>
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                    selectedTicket.attachments.map((file, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <a href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${file.url.split('uploads/')[1]}`} target="_blank" rel="noopener noreferrer">{file.name}</a>
                        {(file.type && (file.type.startsWith('image/') || file.type === 'application/pdf')) && (
                          <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => handlePreviewFile(file)}>
                            {t('myRequests.modal.preview')}
                          </Button>
                        )}
                        {file.type && !(file.type.startsWith('image/') || file.type === 'application/pdf') && (
                          <Button size="small" variant="outlined" sx={{ ml: 1 }} component="a" href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${file.url.split('uploads/')[1]}`} download>
                            {t('myRequests.modal.download')}
                          </Button>
                        )}
                      </li>
                    ))
                  ) : <li>{t('myRequests.modal.noAttachments')}</li>}
                </ul>
              </Box>
            )}
          </Box>
        </Modal>
      </Box>

      {/* Chat Modal */}
      <Modal 
        open={chatModalOpen} 
        onClose={handleCloseChatModal}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          p: 2
        }}
      >
        <Box sx={{ 
          width: 400, 
          maxHeight: '80vh',
          bgcolor: 'transparent',
          outline: 'none',
          mb: 8
        }}>
          <ChatPanel
            chatTicket={selectedChatTicket}
            messages={messages}
            input={input}
            sending={sending}
            someoneTyping={someoneTyping}
            messagesEndRef={messagesEndRef}
            onClose={handleCloseChatModal}
            onSend={handleSend}
            onInputChange={handleInputChange}
            isModal={true}
          />
        </Box>
      </Modal>

      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>{previewFile?.name}</DialogTitle>
        <DialogContent>
          {previewFile && previewFile.type && previewFile.type.startsWith('image/') && (
            <img src={`${process.env.REACT_APP_API_BASE_URL}/uploads/${previewFile.url.split('uploads/')[1]}`} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }} />
          )}
          {previewFile && previewFile.type === 'application/pdf' && (
            <iframe
              src={`${process.env.REACT_APP_API_BASE_URL}/uploads/${previewFile.url.split('uploads/')[1]}`}
              title={previewFile.name}
              width="100%"
              height="600px"
              style={{ border: 'none', display: 'block', margin: '0 auto' }}
            />
          )}
        </DialogContent>
      </Dialog>

    </>
  );
};

export default MyRequests; 