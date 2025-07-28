import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import { getUsersByRoleName } from '../../../api/authApi';
import { assignLeaderToTicket } from '../../../api/ticketApi';

const CustomAssignLeaderModal = ({
  open,
  onClose,
  ticket,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLeaders, setFetchingLeaders] = useState(false);
  const [error, setError] = useState('');

  // Fetch leaders when modal opens
  useEffect(() => {
    if (open) {
      fetchLeaders();
      setSelectedLeaderId('');
      setError('');
    }
  }, [open]);

  const fetchLeaders = async () => {
    setFetchingLeaders(true);
    try {
      const response = await getUsersByRoleName('Leader');
      if (response.success && Array.isArray(response.data)) {
        setLeaders(response.data);
      } else {
        setError('Liderler yüklenemedi');
      }
    } catch (err) {
      console.error('Error fetching leaders:', err);
      setError('Liderler yüklenirken hata oluştu');
    } finally {
      setFetchingLeaders(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedLeaderId) {
      setError(t('assignLeaderModal.error.selectLeader', 'Lütfen bir lider seçin'));
      return;
    }

    setLoading(true);
    setError('');
    
    const ticketId = ticket._id || ticket.id;
    console.log('[CustomAssignLeaderModal] Ticket ID being used:', ticketId);
    console.log('[CustomAssignLeaderModal] Ticket object:', ticket);
    
    try {
      const response = await assignLeaderToTicket(ticketId, selectedLeaderId);
      
      if (response.success) {
        console.log('Leader assigned successfully');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.message || 'Lider atama başarısız');
      }
    } catch (err) {
      console.error('Error assigning leader:', err);
      setError('Lider atama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedLeaderId('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[500px] max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors duration-200"
          onClick={handleClose}
          aria-label="Kapat"
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {t('assignLeaderModal.title', 'Lider Ata')}
          </div>
          <div className="text-gray-600">
            Bu talebi bir lidere atayarak süreç yönetimini başlatın
          </div>
        </div>

        {/* Ticket Information */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            📋 {t('assignLeaderModal.ticketInfo', 'Talep Bilgileri')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">
                {t('assignLeaderModal.ticketId', 'Talep ID')}:
              </span>
              <span className="text-blue-900 font-mono text-sm">
                {ticket?._id || ticket?.id || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">
                {t('assignLeaderModal.ticketTitle', 'Talep Başlığı')}:
              </span>
              <span className="text-blue-900 font-semibold">
                {ticket?.title || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">
                {t('assignLeaderModal.category', 'Kategori')}:
              </span>
              <span className="text-blue-900 font-semibold">
                {(() => {
                  let categoryName = "-";
                  if (ticket?.category) {
                    if (typeof ticket.category === 'object') {
                      if (ticket.category.category_name_tr || ticket.category.category_name_en) {
                        categoryName = ticket.category.category_name_tr || ticket.category.category_name_en || '-';
                      } else if (ticket.category.categoryNameTr || ticket.category.categoryNameEn) {
                        categoryName = ticket.category.categoryNameTr || ticket.category.categoryNameEn || '-';
                      } else if (ticket.category.name_tr || ticket.category.name_en) {
                        categoryName = ticket.category.name_tr || ticket.category.name_en || '-';
                      } else {
                        const categoryValues = Object.values(ticket.category).filter(val => typeof val === 'string' && val.trim() !== '');
                        if (categoryValues.length > 0) {
                          categoryName = categoryValues[0];
                        }
                      }
                    } else if (typeof ticket.category === 'string') {
                      categoryName = ticket.category;
                    }
                  }
                  return categoryName;
                })()}
              </span>
            </div>
            {ticket?.status && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">
                  {t('assignLeaderModal.status', 'Durum')}:
                </span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  ticket.status === 'OPEN' ? 'bg-green-50 text-green-600 border border-green-200' :
                  ticket.status === 'IN_REVIEW' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                  ticket.status === 'CLOSED' ? 'bg-red-50 text-red-600 border border-red-200' :
                  'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {ticket.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Leader Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            👥 {t('assignLeaderModal.selectLeader', 'Lider Seçimi')}
          </h3>
          
          <FormControl fullWidth>
            <Select
              value={selectedLeaderId}
              onChange={(e) => setSelectedLeaderId(e.target.value)}
              displayEmpty
              disabled={fetchingLeaders}
              className="bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500 transition-colors duration-200"
              renderValue={(value) => {
                if (!value) {
                  return (
                    <span className="text-gray-500 italic">
                      {fetchingLeaders ? 'Liderler yükleniyor...' : 'Lider seçin'}
                    </span>
                  );
                }
                const selectedLeader = leaders.find(leader => leader.id === value);
                return selectedLeader ? selectedLeader.name || selectedLeader.email : '';
              }}
            >
              {fetchingLeaders ? (
                <MenuItem disabled>
                  <div className="flex items-center gap-3 py-2">
                    <CircularProgress size={16} />
                    <span className="text-gray-600">Liderler yükleniyor...</span>
                  </div>
                </MenuItem>
              ) : leaders.length === 0 ? (
                <MenuItem disabled>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-gray-500">Lider bulunamadı</span>
                  </div>
                </MenuItem>
              ) : (
                leaders.map((leader) => (
                  <MenuItem 
                    key={leader.id} 
                    value={leader.id}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col py-2">
                      <span className="font-semibold text-gray-800">
                        {leader.name || leader.fullName || leader.email}
                      </span>
                      {leader.email && (
                        <span className="text-sm text-gray-600">
                          {leader.email}
                        </span>
                      )}
                    </div>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 text-sm font-medium">
                ⚠️ {error}
              </span>
            </div>
          )}
        </div>

                 {/* Action Buttons */}
         <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
           <button
             onClick={handleClose}
             disabled={loading}
             className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
           >
             {t('assignLeaderModal.cancel', 'İptal')}
           </button>
           <button
             onClick={handleConfirm}
             disabled={loading || !selectedLeaderId || fetchingLeaders}
             className="px-6 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {loading ? (
               <div className="flex items-center gap-2">
                 <CircularProgress size={16} color="inherit" />
                 <span>{t('assignLeaderModal.assigning', 'Atanıyor...')}</span>
               </div>
             ) : (
               <span>{t('assignLeaderModal.assign', 'Ata')}</span>
             )}
           </button>
         </div>
      </div>
    </div>
  );
};

export default CustomAssignLeaderModal; 