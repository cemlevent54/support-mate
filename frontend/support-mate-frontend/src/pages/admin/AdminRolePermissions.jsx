import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

const INITIAL_PERMISSIONS = [
  { id: 1, name: 'Kullanıcıları Görüntüle', code: 'user:read' },
  { id: 2, name: 'Kullanıcı Ekle', code: 'user:write' },
  { id: 3, name: 'Kullanıcı Sil', code: 'user:delete' },
  { id: 4, name: 'Rol Görüntüle', code: 'role:read' },
  { id: 5, name: 'Rol Ekle', code: 'role:write' },
  { id: 6, name: 'Rol Sil', code: 'role:delete' },
  { id: 7, name: 'Ticket Görüntüle', code: 'ticket:read' },
  { id: 8, name: 'Ticket Ekle', code: 'ticket:write' },
  { id: 9, name: 'Ticket Sil', code: 'ticket:delete' },
];

export default function AdminRolePermissions() {
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [modalPerm, setModalPerm] = useState({ id: '', name: '', code: '' });

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (type, perm = { id: '', name: '', code: '' }) => {
    setModalType(type);
    setModalPerm(perm);
    setOpenModal(true);
  };
  const handleCloseModal = () => setOpenModal(false);

  const handleSave = () => {
    if (modalType === 'add') {
      setPermissions([...permissions, { ...modalPerm, id: Date.now() }]);
    } else {
      setPermissions(permissions.map(p => p.id === modalPerm.id ? modalPerm : p));
    }
    setOpenModal(false);
  };

  const handleDelete = (id) => {
    setPermissions(permissions.filter(p => p.id !== id));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>Tüm İzinler</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal('add')}>İzin Ekle</Button>
      </Box>
      <Box mb={2}>
        <TextField
          placeholder="İzin adı veya kodu ara..."
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
              <TableCell><strong>İzin Adı</strong></TableCell>
              <TableCell><strong>Kod</strong></TableCell>
              <TableCell align="center"><strong>İşlemler</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPermissions.map(perm => (
              <TableRow key={perm.id}>
                <TableCell>{perm.id}</TableCell>
                <TableCell>{perm.name}</TableCell>
                <TableCell>{perm.code}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenModal('edit', perm)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(perm.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredPermissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">Kayıt bulunamadı</TableCell>
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
              label="İzin Adı"
              value={modalPerm.name}
              onChange={e => setModalPerm({ ...modalPerm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Kod"
              value={modalPerm.code}
              onChange={e => setModalPerm({ ...modalPerm, code: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>İptal</Button>
          <Button onClick={handleSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 