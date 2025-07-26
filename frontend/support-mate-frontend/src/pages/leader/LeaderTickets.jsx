import React, { useEffect, useState } from 'react';
import { listTicketsForLeader } from '../../api/ticketApi';
import { getTask } from '../../api/taskApi';
import CustomTicketTable from '../../components/tickets/CustomTicketTable/CustomTicketTable';
import CustomTicketDetailModal from '../../components/tickets/CustomTicketDetailModal/CustomTicketDetailModal';
import CustomTaskDetailsModal from '../../components/common/CustomTaskDetailsModal';
import CustomChatMessagesModal from '../../components/common/CustomChatMessagesModal';
import CreateTask from '../support/CreateTask';
import { useTranslation } from 'react-i18next';

import { jwtDecode } from 'jwt-decode';

const LeaderTickets = () => {
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'chat', 'detail', 'viewTasks'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // Get user role from JWT
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.roleName);
      } catch (e) {
        console.error('Error decoding JWT:', e);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listTicketsForLeader()
      .then((res) => {
        if (res.success) {
          setTickets(res.data || []);
        } else {
          setError(res.message || t('leaderTickets.error', 'Bir hata oluştu.'));
        }
      })
      .catch((err) => {
        setError(err?.message || t('leaderTickets.error', 'Bir hata oluştu.'));
      })
      .finally(() => setLoading(false));
  }, [i18n.language]);

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



  // Tablo kolonları: başlık, kategori, müşteri, agent, durum, oluşturulma tarihi, aksiyonlar
  const columns = [
    { key: 'title', label: t('leaderTickets.table.title', 'Başlık') },
    { key: 'category', label: t('leaderTickets.table.category', 'Kategori'),
      render: row => {
        // Yeni response: row.category?.data?.category_name_tr/en
        // Eski response: row.category?.category_name_tr/en veya row.category?.name
        const cat = row.category;
        if (!cat) return '-';
        if (cat.data) {
          return i18n.language === 'tr'
            ? cat.data.category_name_tr || cat.data.category_name_en || cat.data.name || '-'
            : cat.data.category_name_en || cat.data.category_name_tr || cat.data.name || '-';
        }
        return i18n.language === 'tr'
          ? cat.category_name_tr || cat.category_name_en || cat.name || '-'
          : cat.category_name_en || cat.category_name_tr || cat.name || '-';
      }
    },
    { key: 'customer', label: t('leaderTickets.table.customer', 'Müşteri'),
      render: row => row.customer?.firstName + ' ' + row.customer?.lastName || row.customer?.name || '-' },
    { key: 'agent', label: t('leaderTickets.table.agent', 'Agent'),
      render: row => row.agent?.firstName + ' ' + row.agent?.lastName || row.agent?.name || '-' },
    { key: 'status', label: t('leaderTickets.table.status', 'Durum') },
    { key: 'createdAt', label: t('leaderTickets.table.createdAt', 'Oluşturulma'),
      render: row => new Date(row.createdAt).toLocaleString() },
    { key: 'actions', label: t('leaderTickets.table.actions', 'Aksiyonlar') },
  ];

  // Custom actions for the table
  const renderActions = (row) => {
    const ticketId = row.id || row._id;
    // taskId null ise false, null değilse true döner
    const hasTaskId = row.taskId !== null && row.taskId !== undefined;

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {userRole === 'Leader' && (
          <>
            {/* taskId null ise create task butonu göster */}
            {!hasTaskId && (
              <button 
                className="custom-btn task" 
                onClick={() => {
                  setSelectedTicket(row);
                  setCreateTaskOpen(true);
                }}
              >
                {t('leaderTickets.buttons.createTask', 'TASK OLUŞTUR')}
              </button>
            )}
            {/* taskId null değilse view tasks butonu göster */}
            {hasTaskId && (
              <button 
                className="custom-btn view-tasks" 
                onClick={async () => {
                  setSelectedTicket(row);
                  setModalType('viewTasks');
                  setModalOpen(true);
                  // Task detaylarını çek
                  const taskData = await fetchTaskDetails(row.taskId);
                  setTaskDetails(taskData);
                }}
              >
                {t('leaderTickets.buttons.viewTasks')}
              </button>
            )}
          </>
        )}
        <button className="custom-btn chat" onClick={() => {
          setSelectedTicket(row);
          setModalType('chat');
          setModalOpen(true);
        }}>{t('leaderTickets.buttons.chat', 'CHAT')}</button>
        <button className="custom-btn detail" onClick={() => {
          setSelectedTicket(row);
          setModalType('detail');
          setModalOpen(true);
        }}>{t('leaderTickets.buttons.detail', 'DETAY')}</button>
      </div>
    );
  };

  // CustomTicketTable'a columns prop'u ile özel render fonksiyonları ilet
  return (
    <div style={{ padding: 24 }}>
      <h2>{t('leaderTickets.title', 'Atandığım Ticketlar')}</h2>
      <CustomTicketTable
        rows={tickets}
        columns={columns}
        loading={loading}
        error={error}
        i18nNamespace="leaderTickets"
        onDetail={row => {
          setSelectedTicket(row);
          setModalType('detail');
          setModalOpen(true);
        }}
        onChat={row => {
          setSelectedTicket(row);
          setModalType('chat');
          setModalOpen(true);
        }}
        renderActions={renderActions}
      />

      {/* CreateTask Component */}
      <CreateTask 
        open={createTaskOpen} 
        onClose={() => setCreateTaskOpen(false)}
        ticketId={selectedTicket?.id || selectedTicket?._id || ''}
      />

      {/* Custom Task Details Modal */}
      <CustomTaskDetailsModal
        open={modalType === 'viewTasks' && modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTaskDetails(null);
        }}
        task={taskDetails}
        loading={taskLoading}
      />

      {/* Chat Modal */}
      <CustomChatMessagesModal
        open={modalType === 'chat' && modalOpen}
        onClose={() => setModalOpen(false)}
        messages={selectedTicket?.messages || []}
        i18nNamespace="leaderTickets"
      />

      {/* Detail Modal */}
      {modalType === 'detail' ? (
        <CustomTicketDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          ticket={selectedTicket}
          i18nNamespace="leaderTickets"
          showChatButton={true}
          onChatClick={(ticket) => {
            setSelectedTicket(ticket);
            setModalType('chat');
            setModalOpen(true);
          }}
        />
      ) : null}
    </div>
  );
};

export default LeaderTickets;
