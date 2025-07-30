import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomRadioButton from '../common/CustomRadioButton';
import CustomButton from '../common/CustomButton';
import { exportDashboardStatistics } from '../../api/statisticsApi';
// Snackbar ve Alert importlarını kaldır
// import Snackbar from '@mui/material/Snackbar';
// import Alert from '@mui/material/Alert';

const ExportDashboardModal = ({ open, onClose, onSnackbar }) => {
  const { t } = useTranslation();

  // State
  const [format, setFormat] = useState('');
  const [taskStats, setTaskStats] = useState(true);
  const [ticketStats, setTicketStats] = useState(true);
  const [userStats, setUserStats] = useState(true);
  const [chatStats, setChatStats] = useState(true);
  const [categoryStats, setCategoryStats] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  // Snackbar state kaldırıldı

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFormat('');
      setTaskStats(true);
      setTicketStats(true);
      setUserStats(true);
      setChatStats(true);
      setCategoryStats(true);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, [open]);

  // Validation
  const isValid = format;

  // Varsayılan: seçilmezse hepsi true kabul
  const taskStatsValue = typeof taskStats === 'boolean' ? taskStats : true;
  const ticketStatsValue = typeof ticketStats === 'boolean' ? ticketStats : true;
  const userStatsValue = typeof userStats === 'boolean' ? userStats : true;
  const chatStatsValue = typeof chatStats === 'boolean' ? chatStats : true;
  const categoryStatsValue = typeof categoryStats === 'boolean' ? categoryStats : true;

  // Export functions
  const handleExport = async (sendMail = false) => {
    if (!isValid) {
      setSubmitted(true);
      return;
    }

    setLoading(true);
    try {
      const exportData = {
        format,
        taskStats: taskStatsValue,
        ticketStats: ticketStatsValue,
        userStats: userStatsValue,
        chatStats: chatStatsValue,
        categoryStats: categoryStatsValue,
        sendMail
      };

      const response = await exportDashboardStatistics(exportData);
      
      if (sendMail) {
        if (onSnackbar) {
          onSnackbar(
            t('exportModal.mailSent', 'Export file has been sent to your email.'),
            'success'
          );
        }
      } else {
        if (response && response.data && response.data.file_buffer) {
          try {
            // Base64'ten binary'e çevir
            const binaryString = atob(response.data.file_buffer);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { 
              type: response.data.mime_type || 'application/octet-stream' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.data.file_name || `dashboard_export.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            if (onSnackbar) {
              onSnackbar(
                t('exportModal.downloadSuccess', 'File downloaded successfully.'),
                'success'
              );
            }
          } catch (error) {
            console.error('File download error:', error);
            if (onSnackbar) {
              onSnackbar(
                t('exportModal.error', 'An error occurred during export. Please try again.'),
                'error'
              );
            }
          }
        }
      }
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      if (onSnackbar) {
        onSnackbar(
          t('exportModal.error', 'An error occurred during export. Please try again.'),
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Snackbar close handler
  // const handleSnackbarClose = () => {
  //   setSnackbar(prev => ({ ...prev, open: false }));
  // };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true" role="dialog">
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-xl relative transition-all"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Kapatma Butonu */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label={t('exportModal.close', 'Close')}
        >
          &times;
        </button>

        {/* Başlık */}
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {t('exportModal.title', 'Export Dashboard')}
        </h2>

        {/* Açıklama */}
        <p className="mb-4 text-center text-gray-600">
          {t('exportModal.description', 'You can export dashboard statistics by selecting the file format below.')}
        </p>

        {/* Dosya Formatı */}
        <CustomRadioButton
          label={t('exportModal.format', 'Select file format')}
          name="format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          required
          showError={submitted}
          options={[
            { value: 'pdf', label: t('exportModal.pdf', 'PDF') },
            { value: 'excel', label: t('exportModal.excel', 'Excel') },
            { value: 'csv', label: t('exportModal.csv', 'CSV') },
          ]}
          row
        />

        {/* İstatistik Seçimleri */}
        <div className="mt-4 space-y-2">
          <CustomRadioButton
            label={t('exportModal.taskStats', 'Task Statistics')}
            name="taskStats"
            value={taskStats ? 'true' : 'false'}
            onChange={(e) => setTaskStats(e.target.value === 'true')}
            options={[
              { value: 'true', label: t('exportModal.yes', 'Yes') },
              { value: 'false', label: t('exportModal.no', 'No') },
            ]}
            row
          />
          <CustomRadioButton
            label={t('exportModal.ticketStats', 'Ticket Statistics')}
            name="ticketStats"
            value={ticketStats ? 'true' : 'false'}
            onChange={(e) => setTicketStats(e.target.value === 'true')}
            options={[
              { value: 'true', label: t('exportModal.yes', 'Yes') },
              { value: 'false', label: t('exportModal.no', 'No') },
            ]}
            row
          />
          <CustomRadioButton
            label={t('exportModal.userStats', 'User Statistics')}
            name="userStats"
            value={userStats ? 'true' : 'false'}
            onChange={(e) => setUserStats(e.target.value === 'true')}
            options={[
              { value: 'true', label: t('exportModal.yes', 'Yes') },
              { value: 'false', label: t('exportModal.no', 'No') },
            ]}
            row
          />
          <CustomRadioButton
            label={t('exportModal.chatStats', 'Chat Statistics')}
            name="chatStats"
            value={chatStats ? 'true' : 'false'}
            onChange={(e) => setChatStats(e.target.value === 'true')}
            options={[
              { value: 'true', label: t('exportModal.yes', 'Yes') },
              { value: 'false', label: t('exportModal.no', 'No') },
            ]}
            row
          />
          <CustomRadioButton
            label={t('exportModal.categoryStats', 'Category & Product Statistics')}
            name="categoryStats"
            value={categoryStats ? 'true' : 'false'}
            onChange={(e) => setCategoryStats(e.target.value === 'true')}
            options={[
              { value: 'true', label: t('exportModal.yes', 'Yes') },
              { value: 'false', label: t('exportModal.no', 'No') },
            ]}
            row
          />
        </div>

        {/* Butonlar */}
        <div className="flex justify-end gap-4 mt-8">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={() => handleExport(true)}
            disabled={!isValid || loading}
          >
            {loading ? t('exportModal.sending', 'Sending...') : t('exportModal.sendMail', 'Send Mail')}
          </CustomButton>
          <CustomButton
            type="button"
            variant="primary"
            onClick={() => handleExport(false)}
            disabled={!isValid || loading}
          >
            {loading ? t('exportModal.downloading', 'Downloading...') : t('exportModal.download', 'Download')}
          </CustomButton>
        </div>
      </div>
      
      {/* Snackbar for notifications */}
      {/* Snackbar ile ilgili kodları kaldır */}
    </div>

  );
};

export default ExportDashboardModal;