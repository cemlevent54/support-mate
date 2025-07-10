import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { getAllUsers, updateUser, deleteUser } from '../../api/userApi';
import * as roleApi from '../../api/roleApi';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, userId: null });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    isActive: true
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      if (response.data && response.data.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      showSnackbar('Kullanıcılar yüklenirken hata oluştu', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const rolesData = await roleApi.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Roller yüklenirken hata:', error);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleEditUser = (user) => {
    console.log('handleEditUser çağrıldı:', user);
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role?.name || user.role || 'user',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    console.log('formData set edildi:', {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role?.name || user.role || 'user',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setOpenDialog(true);
  };

  const handleDeleteUser = (userId) => {
    console.log('handleDeleteUser çağrıldı, userId:', userId);
    console.log('confirmDelete state öncesi:', confirmDelete);
    setConfirmDelete({ open: true, userId });
    console.log('confirmDelete state sonrası:', { open: true, userId });
  };

  const handleConfirmDelete = async () => {
    console.log('handleConfirmDelete çağrıldı, confirmDelete state:', confirmDelete);
    const userId = confirmDelete.userId;
    console.log('handleConfirmDelete çağrıldı, userId:', userId);
    if (!userId) {
      console.log('userId bulunamadı');
      return;
    }
    try {
      console.log('deleteUser çağrılıyor:', userId);
      await deleteUser(userId);
      console.log('deleteUser başarılı');
      showSnackbar('Kullanıcı başarıyla silindi', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
      showSnackbar('Kullanıcı silinirken hata oluştu', 'error');
    } finally {
      setConfirmDelete({ open: false, userId: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false, userId: null });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    console.log('selectedUser:', selectedUser);
    console.log('formData:', formData);
    
    const userId = selectedUser?._id || selectedUser?.id;
    
    if (!selectedUser || !userId) {
      console.error('Kullanıcı ID bulunamadı:', { selectedUser, userId });
      showSnackbar('Kullanıcı bilgisi bulunamadı', 'error');
      return;
    }
    
    try {
      console.log('updateUser çağrılıyor:', { userId, formData });
      await updateUser(userId, formData);
      showSnackbar('Kullanıcı başarıyla güncellendi', 'success');
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Kullanıcı kaydedilirken hata:', error);
      showSnackbar('Kullanıcı kaydedilirken hata oluştu', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const userRoleName = user.role?.name || user.role;
    const matchesRole = roleFilter === 'all' || userRoleName === roleFilter;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getRoleColor = (role) => {
    const roleName = typeof role === 'object' ? role.name : role;
    switch (roleName) {
      case 'admin': return 'error';
      case 'support': return 'warning';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    const roleName = typeof role === 'object' ? role.name : role;
    switch (roleName) {
      case 'admin': return 'Admin';
      case 'support': return 'Destek';
      case 'user': return 'Kullanıcı';
      default: return roleName;
    }
  };

  const getStatusChip = (user) => {
    if (user.is_deleted) {
      return <Chip label="Silinmiş" color="default" size="small" sx={{ bgcolor: '#888', color: '#fff' }} />;
    }
    return <Chip label={user.isActive ? 'Aktif' : 'Pasif'} color={user.isActive ? 'success' : 'default'} size="small" />;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Kullanıcı Yönetimi
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Rol Filtresi</InputLabel>
            <Select
              value={roleFilter}
              label="Rol Filtresi"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id || role._id} value={role.name}>
                  {getRoleLabel(role.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Ad Soyad</strong></TableCell>
              <TableCell><strong>E-posta</strong></TableCell>
              <TableCell><strong>Rol</strong></TableCell>
              <TableCell><strong>Durum</strong></TableCell>
              <TableCell><strong>Kayıt Tarihi</strong></TableCell>
              <TableCell align="center"><strong>İşlemler</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>Yükleniyor...</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>Kullanıcı bulunamadı</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.id || user._id}</TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>
                      {user.firstName} {user.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(user.role)}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {getStatusChip(user)}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                      sx={{ color: '#1976d2' }}
                      disabled={user.is_deleted}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      sx={{ color: '#d32f2f' }}
                      disabled={user.is_deleted}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Sayfa başına kullanıcı:"
        />
      </TableContainer>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Kullanıcı Düzenle
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Ad"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Soyad"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
            />
            <TextField
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                label="Rol"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id || role._id} value={role.name}>
                    {getRoleLabel(role.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={formData.isActive}
                label="Durum"
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value })}
              >
                <MenuItem value={true}>Aktif</MenuItem>
                <MenuItem value={false}>Pasif</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSaveUser} variant="contained">
            Güncelle
          </Button>
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

      {/* ConfirmModal ile silme onayı */}
      <ConfirmModal
        open={confirmDelete.open}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Kullanıcıyı Sil"
        description="Bu kullanıcıyı silmek istediğinizden emin misiniz?"
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
      />
    </Box>
  );
}
