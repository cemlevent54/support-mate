import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { listTicketsForAgent } from '../api/ticketApi';

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listTicketsForAgent();
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
            raw: ticket
          })));
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
    onStartChat && onStartChat(ticket.raw._id, ticket.raw.title);
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
    { field: 'id', headerName: 'ID', width: 70, hide: true },
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
    <Box maxWidth={1300} mx="auto" mt={6} p={3} bgcolor="#fff" borderRadius={2} boxShadow={2}>
      <Typography variant="h5" fontWeight={700} mb={3}>Atandığım Talepler</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <div style={{ height: 400, width: 1200 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            disableSelectionOnClick
            autoHeight
            columnVisibilityModel={{
                id: false
              }}
          />
        </div>
      )}
      <Modal open={modalOpen} onClose={handleCloseDetail}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>Talep Detayları</Typography>
          {selectedTicket && (
            <Box>
              <Typography><b>Başlık:</b> {selectedTicket.title}</Typography>
              <Typography><b>Açıklama:</b> {selectedTicket.description}</Typography>
              <Typography><b>Kategori:</b> {categoryLabels[selectedTicket.category] || selectedTicket.category}</Typography>
              <Typography><b>Durum:</b> {selectedTicket.status}</Typography>
              <Typography><b>Oluşturulma:</b> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '-'}</Typography>
              <Typography><b>Müşteri ID:</b> {selectedTicket.customerId}</Typography>
              <Typography><b>Agent ID:</b> {selectedTicket.assignedAgentId}</Typography>
              <Typography><b>Ekler:</b></Typography>
              <ul>
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                  selectedTicket.attachments.map((file, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${file.url.split('uploads/')[1]}`} target="_blank" rel="noopener noreferrer">{file.name}</a>
                      {(file.type && (file.type.startsWith('image/') || file.type === 'application/pdf')) && (
                        <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => handlePreviewFile(file)}>
                          Önizle
                        </Button>
                      )}
                      {file.type && !(file.type.startsWith('image/') || file.type === 'application/pdf') && (
                        <Button size="small" variant="outlined" sx={{ ml: 1 }} component="a" href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${file.url.split('uploads/')[1]}`} download>
                          İndir
                        </Button>
                      )}
                    </li>
                  ))
                ) : <li>Yok</li>}
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