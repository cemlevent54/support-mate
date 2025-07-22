import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CustomTicketTable from './CustomTicketTable';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { listTicketsForAgent } from '../api/ticketApi';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const categoryLabels = {
  hardware: "Donanım",
  software: "Yazılım",
  network: "Ağ",
  other: "Diğer"
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

const SupportRequests = ({ onStartChat }) => {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listTicketsForAgent();
        if (response.success && Array.isArray(response.data)) {
          const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRows(sorted.map((ticket, idx) => {
            let categoryName = "";
            if (ticket.category) {
              if (i18n.language === "tr") {
                categoryName = ticket.category.categoryNameTr || ticket.category.categoryNameEn || "-";
              } else {
                categoryName = ticket.category.categoryNameEn || ticket.category.categoryNameTr || "-";
              }
            } else {
              categoryName = "-";
            }
            return {
              id: ticket._id || idx + 1,
              title: ticket.title,
              description: ticket.description,
              category: categoryName,
              status: ticket.status || "-",
              createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('tr-TR') : "-",
              files: ticket.attachments || [],
              chatId: ticket.chatId,
              raw: { ...ticket, category: categoryName }
            };
          }));
        } else {
          setRows([]);
          setError(response.message || "Talepler alınamadı.");
        }
      } catch (err) {
        setError("Talepler alınırken bir hata oluştu.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalOpen(true);
  };
  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const handleGoChat = (ticket) => {
    const chatId = ticket.chatId || ticket.raw.chatId || ticket.raw.id;
    if (chatId) {
      navigate(`/support/chats/${chatId}`);
    }
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
    { field: 'title', headerName: 'Başlık', width: 200 },
    { field: 'category', headerName: 'Kategori', width: 200 },
    { field: 'status', headerName: 'Durum', width: 200 },
    { field: 'createdAt', headerName: 'Oluşturulma', width: 200 },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ChatIcon />}
            onClick={() => handleGoChat(params.row)}
          >
            Chat
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<InfoIcon />}
            onClick={() => handleOpenDetail(params.row)}
          >
            Detay
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" width="100%" pl={4} pr={4}>
      <Typography variant="h5" fontWeight={700} mb={3} mt={4}>
        {t('supportRequests.title')}
      </Typography>
      <CustomTicketTable
        rows={rows}
        loading={loading}
        error={error}
        onChat={handleGoChat}
        onDetail={handleOpenDetail}
      />
      <Modal open={modalOpen} onClose={handleCloseDetail}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>{t('supportRequests.modal.title')}</Typography>
          {selectedTicket && (
            <Box>
              <Typography><b>{t('supportRequests.modal.titleLabel')}</b> {selectedTicket.title}</Typography>
              <Typography><b>{t('supportRequests.modal.descriptionLabel')}</b> {selectedTicket.description}</Typography>
              <Typography><b>{t('supportRequests.modal.categoryLabel')}</b>{" "}
                {typeof selectedTicket.category === "object"
                  ? (i18n.language === "tr"
                      ? selectedTicket.category.categoryNameTr || selectedTicket.category.categoryNameEn || "-"
                      : selectedTicket.category.categoryNameEn || selectedTicket.category.categoryNameTr || "-")
                  : selectedTicket.category || "-"}
              </Typography>
              <Typography><b>{t('supportRequests.modal.statusLabel')}</b> {selectedTicket.status}</Typography>
              <Typography><b>{t('supportRequests.modal.createdAtLabel')}</b> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('tr-TR') : '-'}</Typography>
              <Typography><b>{t('supportRequests.modal.customerIdLabel')}</b> {selectedTicket.customerId}</Typography>
              <Typography><b>{t('supportRequests.modal.agentIdLabel')}</b> {selectedTicket.assignedAgentId}</Typography>
              <Typography><b>{t('supportRequests.modal.attachmentsLabel')}</b></Typography>
              <ul>
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                  selectedTicket.attachments.map((file, i) => (
                    <li key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 12 }}>
                      <a
                        href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${file.url.split('uploads/')[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 500, wordBreak: 'break-all' }}
                      >
                        {file.name}
                      </a>
                      {(file.type && (file.type.startsWith('image/') || file.type === 'application/pdf')) && (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1, textTransform: 'none' }}
                          onClick={() => handlePreviewFile(file)}
                        >
                          {t('supportRequests.modal.preview')}
                        </Button>
                      )}
                      {file.type && !(file.type.startsWith('image/') || file.type === 'application/pdf') && (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1, textTransform: 'none' }}
                          component="a"
                          href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${file.url.split('uploads/')[1]}`}
                          download
                        >
                          {t('supportRequests.modal.download')}
                        </Button>
                      )}
                    </li>
                  ))
                ) : <li>{t('supportRequests.modal.noAttachments')}</li>}
              </ul>
            </Box>
          )}
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
    </Box>
  );
};

export default SupportRequests; 