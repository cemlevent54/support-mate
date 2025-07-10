import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Stack
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, List as ListIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as roleApi from '../../api/roleApi';

const DUMMY_PERMISSIONS = [
  'user:read', 'user:write', 'user:delete',
  'role:read', 'role:write', 'role:delete',
  'ticket:read', 'ticket:write', 'ticket:delete'
];

export default function AdminUserRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [modalRole, setModalRole] = useState(null);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'add'
  const [openPermModal, setOpenPermModal] = useState(false);
  const [permRole, setPermRole] = useState(null);
  const [permChecked, setPermChecked] = useState([]);
  const navigate = useNavigate();

  // Rolleri API'den çek
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await roleApi.getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setRoles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
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
    setPermChecked(role.permissions);
    setOpenPermModal(true);
  };
  const handleClosePermModal = () => setOpenPermModal(false);

  // Role ekle/güncelle
  const handleSaveRole = async () => {
    if (modalType === 'add') {
      await roleApi.createRole({ name: modalRole.name, permissions: [] });
    } else if (modalType === 'edit') {
      await roleApi.updateRole(modalRole.id, { name: modalRole.name, permissions: modalRole.permissions });
    }
    setOpenModal(false);
    fetchRoles();
  };

  // Role sil
  const handleDeleteRole = async (id) => {
    await roleApi.deleteRole(id);
    fetchRoles();
  };

  // Permissionları kaydet
  const handleSavePermissions = async () => {
    await roleApi.updateRole(permRole.id, { ...permRole, permissions: permChecked });
    setOpenPermModal(false);
    fetchRoles();
  };

  // Permission checkbox değişimi
  const handlePermChange = (perm) => {
    setPermChecked(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
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
                      İzinleri Görüntüle
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
      <Dialog open={openPermModal} onClose={handleClosePermModal} maxWidth="xs" fullWidth>
        <DialogTitle>İzinler</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={1}>
            {DUMMY_PERMISSIONS.map(perm => (
              <FormControlLabel
                key={perm}
                control={
                  <Checkbox
                    checked={permChecked.includes(perm)}
                    onChange={() => handlePermChange(perm)}
                  />
                }
                label={perm}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermModal}>İptal</Button>
          <Button onClick={handleSavePermissions} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
