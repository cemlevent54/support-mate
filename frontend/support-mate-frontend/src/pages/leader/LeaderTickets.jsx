import React, { useEffect, useState } from 'react';
import { listTicketsForLeader } from '../../api/ticketApi';
import CustomTicketTable from '../../components/tickets/CustomTicketTable/CustomTicketTable';
import CustomTicketDetailModal from '../../components/tickets/CustomTicketDetailModal/CustomTicketDetailModal';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const LeaderTickets = () => {
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'chat' veya 'detail'
  const [selectedTicket, setSelectedTicket] = useState(null);

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
      />
      {modalType === 'chat' ? (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {t('leaderTickets.chatModalTitle', 'Chat')}
          </DialogTitle>
          <DialogContent dividers>
            <div style={{ minHeight: 400, maxHeight: 500, overflow: 'auto' }}>
              {selectedTicket && selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: msg.senderRole === 'User' ? 'flex-start' : 'flex-end',
                        marginBottom: '8px'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          backgroundColor: msg.senderRole === 'User' ? '#f1f1f1' : '#e3f2fd',
                          color: '#222',
                          wordWrap: 'break-word'
                        }}
                      >
                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                          <strong>{msg.senderRole === 'User' ? 'Müşteri' : 'Destek Temsilcisi'}</strong>
                        </div>
                        <div style={{ fontSize: '16px' }}>{msg.text}</div>
                        <div style={{ fontSize: '12px', color: '#888', textAlign: 'right', marginTop: '4px' }}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleString('tr-TR') : 
                           msg.createdAt ? new Date(msg.createdAt).toLocaleString('tr-TR') : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                  {t('leaderTickets.noMessages', 'Henüz mesaj yok.')}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>{t('leaderTickets.close', 'Kapat')}</Button>
          </DialogActions>
        </Dialog>
      ) : (
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
      )}
    </div>
  );
};

export default LeaderTickets;
