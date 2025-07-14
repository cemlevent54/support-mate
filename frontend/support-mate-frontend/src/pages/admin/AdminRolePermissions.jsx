import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, InputAdornment, Snackbar, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import * as roleApi from '../../api/roleApi';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';

export default function AdminRolePermissions() {
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [modalPerm, setModalPerm] = useState({ id: '', name_tr: '', name_en: '', code: '', category: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { isAdmin } = usePermissions();

  // Yetkileri API'den çek
  const fetchPermissions = async () => {
    try {
      const data = await roleApi.getAllPermissions();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setPermissions([]);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filteredPermissions = permissions.filter(p =>
    (p.name_tr?.toLowerCase().includes(search.toLowerCase()) ||
      p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (type, perm = { id: '', name_tr: '', name_en: '', code: '', category: '' }) => {
    setModalType(type);
    setModalPerm(perm);
    setOpenModal(true);
  };
  const handleCloseModal = () => setOpenModal(false);

  // Yetki ekle/güncelle
  const handleSave = async () => {
    try {
      if (modalType === 'add') {
        await axiosInstance.post('/api/auth/permissions', {
          name_tr: modalPerm.name_tr,
          name_en: modalPerm.name_en,
          code: modalPerm.code,
          category: modalPerm.category
        });
        setSnackbar({ open: true, message: 'Yetki başarıyla eklendi', severity: 'success' });
      } else {
        await axiosInstance.patch(`/api/auth/permissions/${modalPerm.id}`, {
          name_tr: modalPerm.name_tr,
          name_en: modalPerm.name_en,
          code: modalPerm.code,
          category: modalPerm.category
        });
        setSnackbar({ open: true, message: 'Yetki başarıyla güncellendi', severity: 'success' });
      }
      setOpenModal(false);
      fetchPermissions();
    } catch (error) {
      setSnackbar({ open: true, message: 'Yetki kaydedilirken hata oluştu', severity: 'error' });
    }
  };

  // Yetki sil
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/auth/permissions/${id}`);
      setSnackbar({ open: true, message: 'Yetki başarıyla silindi', severity: 'success' });
      fetchPermissions();
    } catch (error) {
      setSnackbar({ open: true, message: 'Yetki silinirken hata oluştu', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>Tüm İzinler</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal('add')}>İzin Ekle</Button>
      </Box>
      <Box mb={2}>
        <TextField
          placeholder="İzin adı, kodu, açıklama veya kategori ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
          }}
          sx={{ minWidth: 320 }}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>İzin Adı (TR)</strong></TableCell>
              <TableCell><strong>İzin Adı (EN)</strong></TableCell>
              <TableCell><strong>Kod</strong></TableCell>
              <TableCell><strong>Kategori</strong></TableCell>
              <TableCell align="center"><strong>İşlemler</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPermissions.map(perm => (
              <TableRow key={perm.id}>
                <TableCell>{perm.id}</TableCell>
                <TableCell>{perm.name_tr}</TableCell>
                <TableCell>{perm.name_en}</TableCell>
                <TableCell>{perm.code}</TableCell>
                <TableCell>{perm.category}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenModal('edit', perm)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(perm.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredPermissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">Kayıt bulunamadı</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ekle/Güncelle Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle>{modalType === 'add' ? 'İzin Ekle' : 'İzni Güncelle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="İzin Adı (TR)"
              value={modalPerm.name_tr}
              onChange={e => setModalPerm({ ...modalPerm, name_tr: e.target.value })}
              fullWidth
            />
            <TextField
              label="İzin Adı (EN)"
              value={modalPerm.name_en}
              onChange={e => setModalPerm({ ...modalPerm, name_en: e.target.value })}
              fullWidth
            />
            <TextField
              label="Kod"
              value={modalPerm.code}
              onChange={e => setModalPerm({ ...modalPerm, code: e.target.value })}
              fullWidth
            />
            <TextField
              label="Kategori"
              value={modalPerm.category}
              onChange={e => setModalPerm({ ...modalPerm, category: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>İptal</Button>
          <Button onClick={handleSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 