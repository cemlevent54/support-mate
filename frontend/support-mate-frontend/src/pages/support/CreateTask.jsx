import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSingleLineTextArea from '../../components/common/CustomSingleLineTextArea';
import CustomMultilineTextArea from '../../components/common/CustomMultilineTextArea';
import CustomDropdown from '../../components/common/CustomDropdown';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';
import CustomButton from '../../components/common/CustomButton';
import { getUsersByRoleName } from '../../api/authApi';
import { getEmployeesByLeader } from '../../api/userApi';
import { createTask } from '../../api/taskApi';
import { jwtDecode } from 'jwt-decode';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const PRIORITIES = [
  { value: 'LOW', label: 'Düşük' , labelEn: 'Low' },
  { value: 'MEDIUM', label: 'Orta' , labelEn: 'Medium' },
  { value: 'HIGH', label: 'Yüksek' , labelEn: 'High' },
  { value: 'CRITICAL', label: 'Kritik' , labelEn: 'Critical' },
];

// USERS sabitini kaldırıyoruz, onun yerine state olacak
// const USERS = [ ... ];

export default function CreateTask({ open, onClose, ticketId = '123456', onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: '',
    assignee: '',
    dueDate: '',
    ticketId: ticketId || '',
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  React.useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      
      // JWT'den Leader ID'sini al
      const token = localStorage.getItem('jwt');
      if (!token) {
        setUsers([]);
        setLoadingUsers(false);
        return;
      }
      
      try {
        const decoded = jwtDecode(token);
        const leaderId = decoded.userId || decoded.id || decoded.sub;
        
        // Leader'ın altındaki çalışanları getir
        getEmployeesByLeader(leaderId)
          .then((data) => {
            // API'den dönen çalışan listesi data.data içinde
            const userOptions = (Array.isArray(data?.data) ? data.data : []).map(user => ({
              value: user.id,
              label: user.firstName + ' ' + user.lastName
            }));
            setUsers(userOptions);
          })
          .catch((error) => {
            console.error('Çalışanlar yüklenirken hata:', error);
            setUsers([]);
          })
          .finally(() => setLoadingUsers(false));
      } catch (error) {
        console.error('JWT decode hatası:', error);
        setUsers([]);
        setLoadingUsers(false);
      }
    }
  }, [open]);

  // ticketId prop'u değiştiğinde form.ticketId'yi güncelle
  React.useEffect(() => {
    setForm((prev) => ({ ...prev, ticketId: ticketId || '' }));
  }, [ticketId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Başlık validasyonu (1-50 karakter)
    if (!form.title || form.title.length < 1) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.required'), 
        severity: 'error' 
      });
      return;
    }
    
    if (form.title.length > 50) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.maxLength', { maxLength: 50 }), 
        severity: 'error' 
      });
      return;
    }
    
    // Açıklama validasyonu (1-500 karakter)
    if (!form.description || form.description.length < 1) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.required'), 
        severity: 'error' 
      });
      return;
    }
    
    if (form.description.length > 500) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.maxLength', { maxLength: 500 }), 
        severity: 'error' 
      });
      return;
    }
    
    // Due date validasyonu
    if (!form.dueDate) {
      setSnackbar({ 
        open: true, 
        message: t('leaderTickets.dueDateValidation.required'), 
        severity: 'error' 
      });
      return;
    }
    
    const selectedDate = new Date(form.dueDate);
    const currentDate = new Date();
    
    // Geçmiş tarih kontrolü
    if (selectedDate < currentDate) {
      setSnackbar({ 
        open: true, 
        message: t('leaderTickets.dueDateValidation.pastDate'), 
        severity: 'error' 
      });
      return;
    }
    
    // Çok uzak tarih kontrolü (1 yıl)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (selectedDate > maxDate) {
      setSnackbar({ 
        open: true, 
        message: t('leaderTickets.dueDateValidation.tooFar'), 
        severity: 'error' 
      });
      return;
    }
    
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('jwt');
      const decoded = jwtDecode(token);
      const createdBy = decoded.userId || decoded.id || decoded.sub;
      
      // API'ye uygun veri formatı
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority.toUpperCase(),
        assignedEmployeeId: form.assignee,
        deadline: form.dueDate,
        relatedTicketId: form.ticketId,
        createdBy: createdBy
      };
      const response = await createTask(payload, token);
      setSnackbar({ open: true, message: response.data?.message || t('leaderTickets.taskCreated'), severity: 'success' });
      setForm({
        title: '',
        description: '',
        priority: '',
        assignee: '',
        dueDate: '',
        ticketId: ticketId || '',
      });
      onClose();
      // Task başarıyla oluşturulduğunda onSuccess callback'ini çağır
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Backend'den gelen hata mesajını kontrol et
      let errorMessage = t('leaderTickets.taskValidation');
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div style={{ display: open ? 'block' : 'none', position: 'fixed', zIndex: 1300, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 24, borderRadius: 10, minWidth: 320, maxWidth: 480, width: '95vw', boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 18, fontWeight: 600, fontSize: 22 }}>{t('createTask.title', 'Görev Oluştur')}</h2>
        <form onSubmit={handleSubmit}>
          <CustomSingleLineTextArea
            label={t('createTask.form.title')}
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder={t('createTask.form.titlePlaceholder')}
            minLength={1}
            maxLength={50}
            showCharCounter={true}
          />
          <CustomMultilineTextArea
            label={t('createTask.form.description')}
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder={t('createTask.form.descriptionPlaceholder')}
            rows={3}
            minLength={1}
            maxLength={500}
            showCharCounter={true}
          />
          <div style={{ display: 'flex', gap: 12, flexDirection: window.innerWidth < 600 ? 'column' : 'row' }}>
            <CustomDropdown
              label={t('createTask.form.priority')}
              name="priority"
              value={form.priority}
              onChange={handleChange}
              required
              options={PRIORITIES.map(p => ({ ...p, label: t(`createTask.form.priority_${p.value}`, p.label) }))}
              placeholder={t('createTask.form.priorityPlaceholder')}
            />
            <CustomDropdown
              label={t('createTask.form.assignee')}
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              required
              options={users}
              placeholder={loadingUsers ? t('createTask.form.loadingAssignees', 'Yükleniyor...') : t('createTask.form.assigneePlaceholder', 'Çalışan seçin')}
              disabled={loadingUsers}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, flexDirection: window.innerWidth < 600 ? 'column' : 'row' }}>
            <CustomDateTimePicker
              label={t('createTask.form.dueDate')}
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 16)} // Geçmiş tarihleri engelle
              placeholder={t('leaderTickets.dueDateValidation.placeholder')}
              helperText={t('leaderTickets.dueDateValidation.helpText')}
            />
            <CustomSingleLineTextArea
              label={t('createTask.form.ticketId')}
              name="ticketId"
              value={form.ticketId}
              disabled
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <CustomButton type="button" variant="secondary" onClick={onClose}>{t('createTask.form.cancel', 'Kapat')}</CustomButton>
            <CustomButton type="submit" variant="primary">{t('createTask.form.save')}</CustomButton>
          </div>
        </form>
      </div>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
