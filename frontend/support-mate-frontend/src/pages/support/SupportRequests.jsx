import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CustomTicketTable from '../../components/tickets/CustomTicketTable/CustomTicketTable';
import CustomTicketDetailModal from '../../components/tickets/CustomTicketDetailModal/CustomTicketDetailModal';
// CustomAssignLeaderModal kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak
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
  // Assign modal states kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak
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
            console.log('SupportRequests - processing ticket category:', ticket.category);
            let categoryName = "-";
            
            // Kategori ismini çıkarma mantığını düzelt
            if (ticket.category) {
              // Kategori bir obje ise
              if (typeof ticket.category === 'object') {
                // category_name_tr ve category_name_en alanları varsa
                if (ticket.category.category_name_tr || ticket.category.category_name_en) {
                  if (i18n.language === "tr") {
                    categoryName = ticket.category.category_name_tr || ticket.category.category_name_en || "-";
                  } else {
                    categoryName = ticket.category.category_name_en || ticket.category.category_name_tr || "-";
                  }
                }
                // categoryNameTr ve categoryNameEn alanları varsa
                else if (ticket.category.categoryNameTr || ticket.category.categoryNameEn) {
                  if (i18n.language === "tr") {
                    categoryName = ticket.category.categoryNameTr || ticket.category.categoryNameEn || "-";
                  } else {
                    categoryName = ticket.category.categoryNameEn || ticket.category.categoryNameTr || "-";
                  }
                }
                // Diğer olası alan adları
                else if (ticket.category.name_tr || ticket.category.name_en) {
                  if (i18n.language === "tr") {
                    categoryName = ticket.category.name_tr || ticket.category.name_en || "-";
                  } else {
                    categoryName = ticket.category.name_en || ticket.category.name_tr || "-";
                  }
                }
                // Kategori objesinin kendisi string ise
                else if (typeof ticket.category === 'string') {
                  categoryName = ticket.category;
                }
                // Kategori objesinin herhangi bir string alanı varsa
                else {
                  const categoryValues = Object.values(ticket.category).filter(val => typeof val === 'string' && val.trim() !== '');
                  if (categoryValues.length > 0) {
                    categoryName = categoryValues[0];
                  }
                }
              }
              // Kategori direkt string ise
              else if (typeof ticket.category === 'string') {
                categoryName = ticket.category;
              }
            }
            
            console.log('SupportRequests - extracted categoryName:', categoryName);
            
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

  // Assign handler'lar kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak

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
          {/* Assign butonu kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak */}
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
            shouldShowAssign: ['WAITING_FOR_CUSTOMER_APPROVE'].includes(params.row.status),
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
      />
      <CustomTicketDetailModal
        open={modalOpen}
        onClose={handleCloseDetail}
        ticket={selectedTicket}
        i18nNamespace="supportRequests"
        showChatButton={true}
        onChatClick={handleGoChat}
      />
      
      {/* CustomAssignLeaderModal kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak */}
      
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