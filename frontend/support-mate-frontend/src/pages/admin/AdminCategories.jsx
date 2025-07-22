import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CustomTable from '../../components/tickets/CustomTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useTranslation } from 'react-i18next';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../api/categoryApi';
import Snackbar from '@mui/material/Snackbar';

const AdminCategories = () => {
  const { t } = useTranslation();
  const columns = [
    { key: 'category_name_tr', label: t('adminCategories.table.nameTr') },
    { key: 'category_name_en', label: t('adminCategories.table.nameEn') },
    { key: 'actions', label: t('adminCategories.table.actions'), minWidth: 160 },
  ];
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ category_name_tr: '', category_name_en: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Kategori listesini backend'den çek
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCategories();
      setCategories((data.data || []).map(cat => ({ ...cat, id: cat.id || cat._id })));
    } catch (err) {
      setError(t('adminCategories.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  // Modal aç/kapat ve form yönetimi
  const handleOpenAdd = () => {
    setEditMode(false);
    setForm({ category_name_tr: '', category_name_en: '' });
    setModalOpen(true);
  };
  const handleOpenEdit = (cat) => {
    setEditMode(true);
    setSelectedCategory(cat);
    setForm({
      category_name_tr: cat.category_name_tr,
      category_name_en: cat.category_name_en,
    });
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setForm({ category_name_tr: '', category_name_en: '' });
  };
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    try {
      setLoading(true);
      let response;
      if (editMode && selectedCategory) {
        response = await updateCategory(selectedCategory.id || selectedCategory._id, form);
        // Optimistic update
        setCategories(prev => prev.map(cat => (cat.id === (selectedCategory.id || selectedCategory._id) ? { ...cat, ...form } : cat)));
      } else {
        response = await createCategory(form);
        // Optimistic add
        setCategories(prev => [
          ...prev,
          {
            id: response?.data?.id,
            category_name_tr: form.category_name_tr,
            category_name_en: form.category_name_en,
            createdAt: response?.data?.createdAt || new Date().toISOString(),
            isDeleted: false,
            deletedAt: null
          }
        ]);
      }
      handleCloseModal();
      fetchCategories();
      setSnackbar({ open: true, message: response?.message || t('adminCategories.saveSuccess'), severity: 'success' });
    } catch (err) {
      setError(t('adminCategories.saveError'));
      setSnackbar({ open: true, message: err?.response?.data?.message || t('adminCategories.saveError'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };
  // Silme işlemi
  const handleOpenDelete = (cat) => {
    setDeleteId(cat.id || cat._id);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      if (!deleteId) throw new Error('Category id is undefined!');
      const response = await deleteCategory(deleteId);
      // Optimistic delete
      setCategories(prev => prev.filter(cat => cat.id !== deleteId));
      setConfirmOpen(false);
      setDeleteId(null);
      fetchCategories();
      setSnackbar({ open: true, message: response?.message || t('adminCategories.deleteSuccess'), severity: 'success' });
    } catch (err) {
      setError(t('adminTickets.error'));
      setSnackbar({ open: true, message: err?.response?.data?.message || t('adminCategories.deleteError'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };
  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  return (
    <Box maxWidth={1100} mx="auto" mt={6}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{t('adminCategories.title')}</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenAdd}>
          {t('adminCategories.add')}
        </Button>
      </Box>
      <CustomTable
        columns={columns}
        rows={categories}
        loading={loading}
        error={error}
        actions={(row) => (
          <>
            <Button size="small" variant="outlined" sx={{ mr: 1, textTransform: 'none' }} onClick={() => handleOpenEdit(row)}>
              {t('adminCategories.edit')}
            </Button>
            <Button size="small" variant="outlined" color="error" sx={{ textTransform: 'none' }} onClick={() => handleOpenDelete(row)}>
              {t('adminCategories.delete')}
            </Button>
          </>
        )}
        i18n={{
          loading: t('adminTickets.loading'),
          noData: t('adminTickets.noTickets'),
          total: t('adminTickets.pagination.total'),
          page: t('adminTickets.pagination.page'),
          rowsPerPage: t('adminTickets.pagination.rowsPerPage'),
        }}
      />
      {/* Ekle/Düzenle Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle>{editMode ? t('adminCategories.edit') : t('adminCategories.add')}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            label={t('adminCategories.table.nameTr')}
            name="category_name_tr"
            value={form.category_name_tr}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label={t('adminCategories.table.nameEn')}
            name="category_name_en"
            value={form.category_name_en}
            onChange={handleFormChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="outlined">{t('adminCategories.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" color="primary">{t('adminCategories.save')}</Button>
        </DialogActions>
      </Dialog>
      {/* Silme Onay Modalı */}
      <ConfirmModal
        open={confirmOpen}
        translationKey={null}
        title={t('adminCategories.confirmDeleteTitle')}
        description={t('adminCategories.confirmDeleteDesc')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText={t('adminCategories.confirmDeleteYes')}
        cancelText={t('adminCategories.confirmDeleteNo')}
        confirmColor="error"
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdminCategories;
