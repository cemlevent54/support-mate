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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
        showSnackbar('roleAdded', 'success');
      } else if (modalType === 'edit') {
        await roleApi.updateRole(modalRole.id, { name: modalRole.name, permissions: modalRole.permissions });
        showSnackbar('roleUpdated', 'success');
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Rol kaydedilirken hata:', error);
      showSnackbar('roleSaveError', 'error');
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
      showSnackbar('roleDeleted', 'success');
      setConfirmDelete({ open: false, roleId: null });
      fetchData();
    } catch (error) {
      console.error('Rol silinirken hata:', error);
      showSnackbar('roleDeleteError', 'error');
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false, roleId: null });
  };

  // Permissionları kaydet
  const handleSavePermissions = async () => {
    try {
      await roleApi.updateRolePermissions(permRole.id, permChecked);
      showSnackbar('permUpdate', 'success');
      setOpenPermModal(false);
      fetchData();
    } catch (error) {
      console.error('İzinler kaydedilirken hata:', error);
      showSnackbar('permUpdateError', 'error');
    }
  };

  // Permission checkbox değişimi
  const handlePermChange = (permCode) => {
    setPermChecked(prev => prev.includes(permCode) ? prev.filter(p => p !== permCode) : [...prev, permCode]);
  };

  // Yetki adını güzel gösterme
  const getPermissionDisplayName = (permObj) => {
    if (typeof permObj === 'object' && permObj !== null) {
      const displayName = permObj.name_tr || permObj.name_en || permObj.name || '';
      return `${displayName} (${permObj.code})`;
    }
    return permObj;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>{t('adminUserRoles.title')}</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => navigate('/admin/roles/permissions')}>
            {t('adminUserRoles.manageAllPermissions')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal('add')}>{t('adminUserRoles.addRole')}</Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>{t('adminUserRoles.table.id')}</strong></TableCell>
              <TableCell><strong>{t('adminUserRoles.table.name')}</strong></TableCell>
              <TableCell><strong>{t('adminUserRoles.table.permissions')}</strong></TableCell>
              <TableCell align="center"><strong>{t('adminUserRoles.table.actions')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>{t('adminUsers.loading')}</TableCell></TableRow>
            ) : roles.length === 0 ? (
              <TableRow><TableCell colSpan={4}>{t('adminUsers.noUsers')}</TableCell></TableRow>
            ) : (
              roles.map(role => (
                <TableRow key={role.id || role._id}>
                  <TableCell>{role.id || role._id}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" startIcon={<ListIcon />} onClick={() => handleOpenPermModal(role)}>
                      {t('adminUserRoles.permissions')} ({role.permissions?.length || 0})
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
        <DialogTitle>{modalType === 'add' ? t('adminUserRoles.addRole') : t('adminUserRoles.editRole')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t('adminUserRoles.roleName')}
              value={modalRole?.name || ''}
              onChange={e => setModalRole({ ...modalRole, name: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>{t('adminUserRoles.cancel')}</Button>
          <Button onClick={handleSaveRole} variant="contained">{t('adminUserRoles.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Permission Modal */}
      <Dialog open={openPermModal} onClose={handleClosePermModal} maxWidth="sm" fullWidth>
        <DialogTitle>{t('adminUserRoles.permissionModalTitle', { roleName: permRole?.name })}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={1}>
            {permissions.map(perm => (
              <Tooltip key={perm.code} title={`${t('adminUserRoles.category')}: ${perm.category || '-'}`} placement="right">
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
          <Button onClick={handleClosePermModal}>{t('adminUserRoles.cancel')}</Button>
          <Button onClick={handleSavePermissions} variant="contained">{t('adminUserRoles.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* ConfirmModal ile silme onayı */}
      <ConfirmModal
        open={confirmDelete.open}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={t('adminUserRoles.confirmDeleteTitle')}
        description={t('adminUserRoles.confirmDeleteDesc')}
        confirmText={t('adminUserRoles.confirmDeleteYes')}
        cancelText={t('adminUserRoles.confirmDeleteNo')}
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
          {t('adminUserRoles.snackbar.' + snackbar.message) || snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
