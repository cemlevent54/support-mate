import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import { listTicketsForUser } from '../../api/ticketApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import ChatPanel from '../../components/chats/ChatPanel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CustomTicketTable from '../../components/tickets/CustomTicketTable/CustomTicketTable';
import CustomTicketDetailModal from '../../components/tickets/CustomTicketDetailModal/CustomTicketDetailModal';


const MyRequests = ({ openCreateTicketModal, onTicketCreated }) => {
  const { t, i18n } = useTranslation();

const categoryLabels = {
    hardware: t('myRequests.categories.hardware'),
    software: t('myRequests.categories.software'),
    network: t('myRequests.categories.network'),
    other: t('myRequests.categories.other')
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
  const location = useLocation();

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
      console.log('MyRequests - fetchTickets - response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const mappedRows = sorted.map((ticket, idx) => {
          console.log('MyRequests - fetchTickets - processing ticket:', ticket);
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
          
          return {
            id: ticket._id || ticket.id || idx + 1,
            title: ticket.title,
            description: ticket.description,
            category: categoryName,
            status: ticket.status || "-",
            createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('tr-TR') : "-",
            files: ticket.attachments || [],
            chatId: ticket.chatId || ticket._id || ticket.id,
            customerId: ticket.customerId,
            assignedAgentId: ticket.assignedAgentId,
            raw: {
              ...ticket,
              _id: ticket._id || ticket.id,
              chatId: ticket.chatId || ticket._id || ticket.id,
              ticketId: ticket._id || ticket.id
            }
          };
        });
        console.log('MyRequests - fetchTickets - mapped rows:', mappedRows);
        setRows(mappedRows);
      } else {
        setRows([]);
        setError(response.message || t('myRequests.noTickets'));
      }
    } catch (err) {
      console.error('MyRequests - fetchTickets - error:', err);
      setError(t('myRequests.error'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [t]);



  // Ticket oluşturulduktan sonra chat panelini aç ve tabloyu güncelle
  useEffect(() => {
    console.log('MyRequests - location.state:', location.state);
    if (location.state?.showChatAfterCreate && location.state?.openChatForTicket) {
      const ticketData = location.state.openChatForTicket;
      console.log('MyRequests - Opening chat for ticket:', ticketData);
      
      // Tabloyu güncelle (yeni ticket eklendi)
      fetchTickets();
      
      // Yeni oluşturulan ticket'ı chat panelinde aç
      const chatTicketData = {
        ...ticketData,
        chatId: ticketData.chatId || ticketData._id || ticketData.id,
        ticketId: ticketData._id || ticketData.id
      };
      console.log('MyRequests - Setting selectedChatTicket:', chatTicketData);
      setSelectedChatTicket(chatTicketData);
      console.log('MyRequests - Setting chatModalOpen to true');
      setChatModalOpen(true);
      
      // State'i temizle (geri dönüşte tekrar açılmasın)
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Ticket oluşturma modalı açıldığında tabloyu güncellemek için callback
  const handleTicketCreated = (ticketData) => {
    console.log('MyRequests - handleTicketCreated called with:', ticketData);
    // Tabloyu güncelle
    fetchTickets();
    
    // Eğer global callback varsa onu da çağır
    if (onTicketCreated) {
      onTicketCreated(ticketData);
    }
  };

  const handleOpenChat = (ticket) => {
    console.log('MyRequests - handleOpenChat - ticket:', ticket);
    console.log('MyRequests - handleOpenChat - assignedAgentId:', ticket.raw?.assignedAgentId);
    console.log('MyRequests - handleOpenChat - ticketId:', ticket.raw._id);
    console.log('MyRequests - handleOpenChat - chatId:', ticket.raw.chatId);
    
    const chatTicketData = {
      ...ticket.raw,
      chatId: ticket.raw.chatId || ticket.raw._id,
      ticketId: ticket.raw._id || ticket.raw.id
    };
    console.log('MyRequests - handleOpenChat - chatTicketData:', chatTicketData);
    
    setSelectedChatTicket(chatTicketData);
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
    // CustomTicketDetailModal için veriyi uygun formata çevir
    const ticketData = ticket.raw || ticket;
    
    // Eğer ticket.raw varsa onu kullan, yoksa ticket'ı kullan
    const modalTicket = {
      ...ticketData,
      id: ticketData._id || ticketData.id,
      title: ticketData.title,
      description: ticketData.description,
      status: ticketData.status,
      createdAt: ticketData.createdAt,
      category: ticketData.category,
      product: ticketData.product,
      attachments: ticketData.attachments || ticketData.files || [],
      customer: ticketData.customer,
      agent: ticketData.agent,
      customerId: ticketData.customerId,
      assignedAgentId: ticketData.assignedAgentId,
      closedAt: ticketData.closedAt,
      deletedAt: ticketData.deletedAt
    };
    
    setSelectedTicket(modalTicket);
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

  // CustomTicketTable için renderActions fonksiyonu
  const renderActions = (row) => (
    <>
      <button className="custom-btn chat" onClick={() => handleOpenChat(row)}>
        {t('myRequests.buttons.chat')}
      </button>
      <button className="custom-btn detail" onClick={() => handleOpenDetail(row)}>
        {t('myRequests.buttons.detail')}
      </button>
    </>
  );

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
            <CustomTicketTable
              rows={rows}
              loading={loading}
              error={error}
              i18nNamespace="myRequests"
              onChat={handleOpenChat}
              onDetail={handleOpenDetail}
              renderActions={renderActions}
            />
          </Box>
        )}
        <CustomTicketDetailModal
          open={modalOpen}
          onClose={handleCloseDetail}
          ticket={selectedTicket}
          i18nNamespace="myRequests"
          showChatButton={true}
          onChatClick={handleOpenChat}
        />
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
            myUserId={myUserId}
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