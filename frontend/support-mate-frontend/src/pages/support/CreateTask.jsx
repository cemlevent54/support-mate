import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSingleLineTextArea from '../../components/common/CustomSingleLineTextArea';
import CustomMultilineTextArea from '../../components/common/CustomMultilineTextArea';
import CustomDropdown from '../../components/common/CustomDropdown';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';
import CustomButton from '../../components/common/CustomButton';
import { getUsersByRoleName } from '../../api/authApi';

const PRIORITIES = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
];

// USERS sabitini kaldırıyoruz, onun yerine state olacak
// const USERS = [ ... ];

export default function CreateTask({ open, onClose, ticketId = '123456' }) {
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

  React.useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      getUsersByRoleName('Employee')
        .then((data) => {
          // API'den dönen kullanıcı listesi data.data içinde
          const userOptions = (Array.isArray(data?.data) ? data.data : []).map(user => ({
            value: user.id,
            label: user.firstName + ' ' + user.lastName
          }));
          setUsers(userOptions);
        })
        .catch(() => setUsers([]))
        .finally(() => setLoadingUsers(false));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Burada form submit işlemi yapılabilir
    onClose();
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
          />
          <CustomMultilineTextArea
            label={t('createTask.form.description')}
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder={t('createTask.form.descriptionPlaceholder')}
            rows={3}
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
              placeholder={loadingUsers ? t('createTask.form.loadingAssignees', 'Yükleniyor...') : t('createTask.form.assigneePlaceholder')}
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
    </div>
  );
}
