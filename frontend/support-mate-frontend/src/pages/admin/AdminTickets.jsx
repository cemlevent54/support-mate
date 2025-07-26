import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import CustomTicketTable from '../../components/tickets/CustomTicketTable/CustomTicketTable';
import CustomTicketDetailModal from '../../components/tickets/CustomTicketDetailModal/CustomTicketDetailModal';
import CustomChatMessagesModal from '../../components/common/CustomChatMessagesModal';
import CustomTaskDetailsModal from '../../components/common/CustomTaskDetailsModal';
import { listTicketsForAdmin } from '../../api/ticketApi';
import { getTask } from '../../api/taskApi';
import { useTranslation } from 'react-i18next';

// AdminTickets component with GradientCard Design System
const AdminTickets = () => {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'detail', 'chat', 'task'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listTicketsForAdmin();
        if (response.success && Array.isArray(response.data)) {
          const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRows(sorted.map((ticketData, idx) => {
            // Leader gibi yapı: tüm bilgiler aynı seviyede
            const customer = ticketData.customer || {};
            const agent = ticketData.agent || {};
            
            let categoryName = "";
            if (ticketData.category && ticketData.category.data) {
              if (i18n.language === "tr") {
                categoryName = ticketData.category.data.category_name_tr || ticketData.category.data.category_name_en || "-";
              } else {
                categoryName = ticketData.category.data.category_name_en || ticketData.category.data.category_name_tr || "-";
              }
            } else {
              categoryName = "-";
            }
            
            return {
              id: ticketData._id || ticketData.id || idx + 1,
              title: ticketData.title,
              description: ticketData.description,
              category: categoryName,
              status: ticketData.status || "-",
              createdAt: ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleString('tr-TR') : "-",
              files: ticketData.attachments || [],
              customer: customer,
              agent: agent,
              taskId: ticketData.taskId,
              chatId: ticketData.chatId,
              raw: ticketData // Tüm veriyi raw olarak sakla
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

  // Task detaylarını API'den çek
  const fetchTaskDetails = async (taskId) => {
    if (!taskId) return null;
    
    setTaskLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await getTask(taskId, token);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Task detayları çekilemedi:', error);
      return null;
    } finally {
      setTaskLoading(false);
    }
  };

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalType('detail');
    setModalOpen(true);
  };

  const handleOpenChat = (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalType('chat');
    setModalOpen(true);
  };

  const handleOpenTask = async (ticket) => {
    setSelectedTicket(ticket.raw || ticket);
    setModalType('task');
    setModalOpen(true);
    // Task detaylarını çek
    const ticketData = ticket.raw || ticket;
    const taskData = await fetchTaskDetails(ticketData.taskId);
    setTaskDetails(taskData);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedTicket(null);
    setTaskDetails(null);
  };

  // Admin için özel actions
  const renderAdminActions = (row) => {
    const ticketData = row.raw || row;
    const hasTaskId = ticketData.taskId !== null && ticketData.taskId !== undefined;

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {/* Task butonu - sadece taskId varsa göster */}
        {hasTaskId && (
          <button 
            className="custom-btn task" 
            onClick={() => handleOpenTask(row)}
          >
            {t('adminTickets.buttons.viewTask', 'TASK')}
          </button>
        )}
        {/* Chat butonu */}
        <button 
          className="custom-btn chat" 
          onClick={() => handleOpenChat(row)}
        >
          {t('adminTickets.buttons.chat', 'CHAT')}
        </button>
        {/* Detail butonu */}
        <button 
          className="custom-btn detail" 
          onClick={() => handleOpenDetail(row)}
        >
          {t('adminTickets.buttons.detail', 'DETAY')}
        </button>
      </div>
    );
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} mb={3}>{t('adminTickets.table.title')}</Typography>
      <CustomTicketTable
        rows={rows}
        loading={loading}
        error={error}
        onChat={handleOpenChat}
        onDetail={handleOpenDetail}
        i18nNamespace="adminTickets"
        renderActions={renderAdminActions}
      />

      {/* Custom Ticket Detail Modal */}
      <CustomTicketDetailModal
        open={modalType === 'detail' && modalOpen}
        onClose={handleCloseModal}
        ticket={selectedTicket}
        i18nNamespace="adminTickets"
        showChatButton={true}
        onChatClick={(ticket) => {
          setSelectedTicket(ticket);
          setModalType('chat');
          setModalOpen(true);
        }}
      />

      {/* Custom Chat Messages Modal */}
      <CustomChatMessagesModal
        open={modalType === 'chat' && modalOpen}
        onClose={handleCloseModal}
        messages={selectedTicket?.messages || []}
        i18nNamespace="adminTickets"
      />

      {/* Custom Task Details Modal */}
      <CustomTaskDetailsModal
        open={modalType === 'task' && modalOpen}
        onClose={handleCloseModal}
        task={taskDetails}
        loading={taskLoading}
      />
    </>
  );
};

export default AdminTickets; 