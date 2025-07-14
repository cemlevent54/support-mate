import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Stack, Snackbar, Alert, Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, List as ListIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as roleApi from '../../api/roleApi';
import ConfirmModal from '../../components/ConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';

export default function AdminUserRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [modalRole, setModalRole] = useState(null);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'add'
  const [openPermModal, setOpenPermModal] = useState(false);
  const [permRole, setPermRole] = useState(null);
  const [permChecked, setPermChecked] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, roleId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  // Rolleri ve yetkileri API'den çek
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleApi.getRoles(),
        roleApi.getAllPermissions()
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (err) {
      setRoles([]);
      setPermissions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Role ekle/güncelle modalı aç
  const handleOpenModal = (type, role = null) => {
    setModalType(type);
    setModalRole(role ? { ...role } : { id: '', name: '', permissions: [] });
    setOpenModal(true);
  };
  const handleCloseModal = () => setOpenModal(false);

  // Permission modalı aç
  const handleOpenPermModal = (role) => {
    setPermRole(role);
    // Eğer role.permissions nesne ise, code array'e çevir
    const codes = (role.permissions || []).map(p => typeof p === 'string' ? p : p.code);
    setPermChecked(codes);
    setOpenPermModal(true);
  };
  const handleClosePermModal = () => setOpenPermModal(false);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Role ekle/güncelle
  const handleSaveRole = async () => {
    try {
      if (modalType === 'add') {
        await roleApi.createRole({ name: modalRole.name, permissions: [] });
        showSnackbar('Rol başarıyla eklendi', 'success');
      } else if (modalType === 'edit') {
        await roleApi.updateRole(modalRole.id, { name: modalRole.name, permissions: modalRole.permissions });
        showSnackbar('Rol başarıyla güncellendi', 'success');
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Rol kaydedilirken hata:', error);
      showSnackbar('Rol kaydedilirken hata oluştu', 'error');
    }
  };

  // ConfirmModal ile silme
  const handleDeleteRole = (id) => {
    setConfirmDelete({ open: true, roleId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.roleId) return;
    try {
      await roleApi.deleteRole(confirmDelete.roleId);
      showSnackbar('Rol başarıyla silindi', 'success');
      setConfirmDelete({ open: false, roleId: null });
      fetchData();
    } catch (error) {
      console.error('Rol silinirken hata:', error);
      showSnackbar('Rol silinirken hata oluştu', 'error');
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false, roleId: null });
  };

  // Permissionları kaydet
  const handleSavePermissions = async () => {
    try {
      await roleApi.updateRolePermissions(permRole.id, permChecked);
      showSnackbar('İzinler başarıyla güncellendi', 'success');
      setOpenPermModal(false);
      fetchData();
    } catch (error) {
      console.error('İzinler kaydedilirken hata:', error);
      showSnackbar('İzinler kaydedilirken hata oluştu', 'error');
    }
  };

  // Permission checkbox değişimi
  const handlePermChange = (permCode) => {
    setPermChecked(prev => prev.includes(permCode) ? prev.filter(p => p !== permCode) : [...prev, permCode]);
  };

  // Yetki adını güzel gösterme
  const getPermissionDisplayName = (permObj) => {
    // permObj bir nesne ise adı ve kodu birlikte göster
    if (typeof permObj === 'object' && permObj !== null) {
      // Öncelik: name_tr > name_en > name
      const displayName = permObj.name_tr || permObj.name_en || permObj.name || '';
      return `${displayName} (${permObj.code})`;
    }
    // string ise sadece kodu göster
    return permObj;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>Roller</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => navigate('/admin/roles/permissions')}>
            Tüm İzinleri Yönet
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal('add')}>Rol Ekle</Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Rol Adı</strong></TableCell>
              <TableCell><strong>İzinler</strong></TableCell>
              <TableCell align="center"><strong>İşlemler</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Yükleniyor...</TableCell></TableRow>
            ) : roles.length === 0 ? (
              <TableRow><TableCell colSpan={4}>Hiç rol bulunamadı.</TableCell></TableRow>
            ) : (
              roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>{role.id || role._id}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" startIcon={<ListIcon />} onClick={() => handleOpenPermModal(role)}>
                      İzinleri Görüntüle ({role.permissions?.length || 0})
                    </Button>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenModal('edit', role)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDeleteRole(role.id || role._id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rol Ekle/Güncelle Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle>{modalType === 'add' ? 'Rol Ekle' : 'Rolü Güncelle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Rol Adı"
              value={modalRole?.name || ''}
              onChange={e => setModalRole({ ...modalRole, name: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>İptal</Button>
          <Button onClick={handleSaveRole} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Permission Modal */}
      <Dialog open={openPermModal} onClose={handleClosePermModal} maxWidth="sm" fullWidth>
        <DialogTitle>İzinler - {permRole?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={1}>
            {permissions.map(perm => (
              <Tooltip key={perm.code} title={`Kategori: ${perm.category || '-'}`} placement="right">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permChecked.includes(perm.code)}
                      onChange={() => handlePermChange(perm.code)}
                    />
                  }
                  label={getPermissionDisplayName(perm)}
                />
              </Tooltip>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermModal}>İptal</Button>
          <Button onClick={handleSavePermissions} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* ConfirmModal ile silme onayı */}
      <ConfirmModal
        open={confirmDelete.open}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Rolü Sil"
        description="Bu rolü silmek istediğinizden emin misiniz?"
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
      />

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
