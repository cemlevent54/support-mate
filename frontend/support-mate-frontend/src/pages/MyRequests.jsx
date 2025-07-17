import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import TicketChatDrawer from '../components/TicketChatDrawer';

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

const MyRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTicket, setChatTicket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listTicketsForUser();
        if (response.success && Array.isArray(response.data)) {
          setRows(response.data.map((ticket, idx) => ({
            id: ticket._id || idx + 1,
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            status: ticket.status || "-",
            createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-",
            files: ticket.attachments || [],
            chatId: ticket.chatId || ticket._id,
            customerId: ticket.customerId,
            assignedAgentId: ticket.assignedAgentId,
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

  const handleOpenChat = (ticket) => {
    setChatTicket({
      ...ticket.raw,
      chatId: ticket.raw.chatId || ticket.raw._id,
      ticketId: ticket.raw._id
    });
    setChatOpen(true);
  };
  const handleCloseChat = () => {
    setChatOpen(false);
    setChatTicket(null);
  };

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalOpen(true);
  };
  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'title', headerName: 'Başlık', width: chatOpen ? 200 : 200 },
    { field: 'category', headerName: 'Kategori', width: chatOpen ? 100 : 200 },
    { field: 'status', headerName: 'Durum', width: chatOpen ? 100 : 200 },
    { field: 'createdAt', headerName: 'Oluşturulma', width: chatOpen ? 150 : 200 },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: chatOpen ? 150 : 200,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ChatIcon />}
            onClick={() => handleOpenChat(params.row)}
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
    <Box maxWidth={1300} mx="auto" mt={6} display="flex" gap={3}>
      <Box flex={chatOpen ? 7 : 1} minWidth={chatOpen ? 700 : 0} maxWidth={chatOpen ? 800 : 1300} transition="all 0.3s">
        <Typography variant="h5" fontWeight={700} mb={3}>Taleplerim</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <div style={{ height: 400, width: '100%' }}>
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
                      <li key={i}><a href={`/${file.url}`} target="_blank" rel="noopener noreferrer">{file.name}</a></li>
                    ))
                  ) : <li>Yok</li>}
                </ul>
              </Box>
            )}
          </Box>
        </Modal>
      </Box>
      {chatOpen && (
        <Box flex={5} minWidth={400} maxWidth={600} ml={3}>
          <TicketChatDrawer ticket={chatTicket} onClose={handleCloseChat} useTicketIdForMessages={true} />
        </Box>
      )}
    </Box>
  );
};

export default MyRequests; 