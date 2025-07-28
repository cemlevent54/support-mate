import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CustomTicketTable from '../../components/tickets/CustomTicketTable/CustomTicketTable';
import CustomTicketDetailModal from '../../components/tickets/CustomTicketDetailModal/CustomTicketDetailModal';
import CustomAssignLeaderModal from '../../components/tickets/CustomAssignLeaderModal/CustomAssignLeaderModal';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { listTicketsForAgent } from '../../api/ticketApi';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import isCustomerSupporter from '../../auth/isCustomerSupporter';


const SupportRequests = ({ onStartChat }) => {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState(null);
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
              if (ticket.category.data) {
                if (i18n.language === "tr") {
                  categoryName = ticket.category.data.category_name_tr || "-";
                } else {
                  categoryName = ticket.category.data.category_name_en || "-";
                }
              } else {
                if (i18n.language === "tr") {
                  categoryName = ticket.category.category_name_tr || ticket.category.categoryNameTr || "-";
                } else {
                  categoryName = ticket.category.category_name_en || ticket.category.categoryNameEn || "-";
                }
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
              raw: { ...ticket } // Orijinal kategori objesini koru
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
  }, [i18n.language]);

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalOpen(true);
  };
  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const handleGoChat = (ticket) => {
    console.log('[SupportRequests] handleGoChat called with ticket:', ticket);
    const chatId = ticket.chatId || ticket.raw?.chatId || ticket.raw?.id;
    console.log('[SupportRequests] Extracted chatId:', chatId);
    if (chatId) {
      console.log('[SupportRequests] Navigating to:', `/support/chats/${chatId}`);
      navigate(`/support/chats/${chatId}`);
    } else {
      console.error('[SupportRequests] No chatId found in ticket:', ticket);
    }
  };

  const handleAssign = (ticket) => {
    console.log('[SupportRequests] handleAssign called with ticket:', ticket);
    setAssignTicket(ticket.raw || ticket);
    setAssignModalOpen(true);
  };

  const handleAssignModalClose = () => {
    setAssignModalOpen(false);
    setAssignTicket(null);
  };

  const handleAssignSuccess = () => {
    // Refresh the tickets list after successful assignment
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
              if (ticket.category.data) {
                if (i18n.language === "tr") {
                  categoryName = ticket.category.data.category_name_tr || "-";
                } else {
                  categoryName = ticket.category.data.category_name_en || "-";
                }
              } else {
                if (i18n.language === "tr") {
                  categoryName = ticket.category.category_name_tr || ticket.category.categoryNameTr || "-";
                } else {
                  categoryName = ticket.category.category_name_en || ticket.category.categoryNameEn || "-";
                }
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
              raw: { ...ticket } // Orijinal kategori objesini koru
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
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Get user role from JWT
  const getUserRole = () => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.roleName;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const userRole = getUserRole();
  const isCustomerSupporterRole = isCustomerSupporter({ roleName: userRole });



  const columns = [
    { field: 'title', headerName: 'Başlık', width: 200 },
    { field: 'category', headerName: 'Kategori', width: 200 },
    { field: 'status', headerName: 'Durum', width: 200 },
    { field: 'createdAt', headerName: 'Oluşturulma', width: 200 },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 280,
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
          {isCustomerSupporterRole && ['OPEN', 'IN_REVIEW', 'WAITING_FOR_CUSTOMER_APPROVE'].includes(params.row.status) && (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<AssignmentIcon />}
              onClick={() => handleAssign(params.row)}
            >
              Assign
            </Button>
          )}
          {/* Debug: Status kontrolü */}
          {console.log('=== DEBUG INFO ===', {
            ticketId: params.row.id,
            status: params.row.status,
            statusType: typeof params.row.status,
            statusLength: params.row.status ? params.row.status.length : 0,
            statusTrimmed: params.row.status ? params.row.status.trim() : null,
            isCustomerSupporterRole,
            userRole,
            allowedStatuses: ['OPEN', 'IN_REVIEW', 'WAITING_FOR_CUSTOMER_APPROVE'],
            shouldShowAssign: ['OPEN', 'IN_REVIEW', 'WAITING_FOR_CUSTOMER_APPROVE'].includes(params.row.status),
            statusIncluded: ['OPEN', 'IN_REVIEW', 'WAITING_FOR_CUSTOMER_APPROVE'].includes(params.row.status),
            statusComparison: {
              'OPEN': params.row.status === 'OPEN',
              'IN_REVIEW': params.row.status === 'IN_REVIEW',
              'WAITING_FOR_CUSTOMER_APPROVE': params.row.status === 'WAITING_FOR_CUSTOMER_APPROVE'
            }
          })}
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
        onAssign={handleAssign}
      />
      <CustomTicketDetailModal
        open={modalOpen}
        onClose={handleCloseDetail}
        ticket={selectedTicket}
        i18nNamespace="supportRequests"
        showChatButton={true}
        onChatClick={handleGoChat}
      />
      
      <CustomAssignLeaderModal
        open={assignModalOpen}
        onClose={handleAssignModalClose}
        ticket={assignTicket}
        onSuccess={handleAssignSuccess}
      />
      
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