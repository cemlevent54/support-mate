import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';

import CustomTable from '../../components/common/CustomTable';
import CustomButton from '../../components/common/CustomButton';
import { getEmployees, getEmployeesByLeader, assignEmployeeToLeader, removeEmployeeFromLeader } from '../../api/userApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';

export default function LeaderEmployees() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const { hasPermission, isLeader, loading: permissionsLoading, userRole } = usePermissions();

  // Fallback isLeader function
  const checkIsLeader = () => {
    try {
      const token = localStorage.getItem('jwt');
      if (token) {
        const decoded = jwtDecode(token);
        return decoded.roleName && decoded.roleName.toLowerCase() === 'leader';
      }
      return false;
    } catch (error) {
      console.error('JWT decode error:', error);
      return false;
    }
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Employee management modal states
  const [employeeModal, setEmployeeModal] = useState({ open: false, action: 'add' });
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [confirmRemoveEmployee, setConfirmRemoveEmployee] = useState({ open: false, employeeId: null, employeeName: '' });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Leader'ın employee'larını getir
  const fetchLeaderEmployees = useCallback(async () => {
    try {
      setLoading(true);
      // JWT'den leader ID'yi al
      const token = localStorage.getItem('jwt');
      if (!token) {
        console.error('JWT token bulunamadı');
        setEmployees([]);
        return;
      }

      const decoded = jwtDecode(token);
      const leaderId = decoded.userId || decoded.id || decoded.sub;
      
      if (!leaderId) {
        console.error('JWT\'den leader ID alınamadı');
        setEmployees([]);
        return;
      }

      console.log('Leader ID from JWT:', leaderId);
      
      const response = await getEmployeesByLeader(leaderId);
      console.log('getEmployeesByLeader response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Leader employees:', response.data);
        setEmployees(response.data);
      } else {
        console.log('No data or not array:', response.data);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Employee\'lar yüklenirken hata:', error);
      showSnackbar(error.message || t('leaderEmployees.errors.loadEmployeesError'), 'error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Atanabilir employee'ları getir
  const fetchAvailableEmployees = useCallback(async () => {
    console.log('fetchAvailableEmployees called');
    try {
      setEmployeesLoading(true);
      console.log('Calling getEmployees API...');
      const response = await getEmployees();
      console.log('getEmployees response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Available employees from API (already filtered):', response.data);
        setAvailableEmployees(response.data);
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        // Eğer response.data.users şeklinde geliyorsa
        console.log('Available employees from API (users property, already filtered):', response.data.users);
        setAvailableEmployees(response.data.users);
      } else {
        console.log('No data or not array:', response.data);
        setAvailableEmployees([]);
      }
      
      // Eğer response success false ise ve mesaj varsa göster
      if (response.success === false && response.message) {
        //showSnackbar(response.message, 'info');
      }
    } catch (error) {
      console.error('Çalışanlar yüklenirken hata:', error);
      showSnackbar(error.message || t('leaderEmployees.errors.loadAvailableEmployeesError'), 'error');
      setAvailableEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLeaderEmployees();
  }, [fetchLeaderEmployees]);

  // Employee management functions
  const handleOpenEmployeeModal = (action = 'add') => {
    console.log('handleOpenEmployeeModal called:', { action });
    
    setEmployeeModal({ 
      open: true, 
      action 
    });
    
    if (action === 'add') {
      console.log('Fetching available employees...');
      fetchAvailableEmployees();
    }
  };

  const handleCloseEmployeeModal = () => {
    setEmployeeModal({ open: false, action: 'add' });
    setAvailableEmployees([]);
  };

  const handleAssignEmployee = async (employeeId) => {
    try {
      console.log('handleAssignEmployee called with employeeId:', employeeId);
      
      // JWT'den leader ID'yi al
      const token = localStorage.getItem('jwt');
      if (!token) {
        console.error('JWT token bulunamadı');
        showSnackbar(t('leaderEmployees.errors.sessionNotFound'), 'error');
        return;
      }

      const decoded = jwtDecode(token);
      const leaderId = decoded.userId || decoded.id || decoded.sub;
      
      if (!leaderId) {
        console.error('JWT\'den leader ID alınamadı');
        showSnackbar(t('leaderEmployees.errors.userInfoNotFound'), 'error');
        return;
      }

      console.log('Leader ID from JWT:', leaderId);
      console.log('User role from JWT:', decoded.roleName);
      
      // Güvenlik kontrolü: Leader sadece kendine atama yapabilir
      if (decoded.roleName === 'Leader') {
        // Leader'ın kendi ID'sini kullanmasını zorla
        console.log('Assigning employee to leader (Leader role)');
        const response = await assignEmployeeToLeader(employeeId, leaderId);
        console.log('Assignment response:', response);
        showSnackbar(response.message, 'success');
        handleCloseEmployeeModal();
        fetchLeaderEmployees(); // Employee listesini yenile
      } else {
        // Admin için normal akış
        console.log('Assigning employee to leader (Admin role)');
        const response = await assignEmployeeToLeader(employeeId, leaderId);
        console.log('Assignment response:', response);
        showSnackbar(response.message, 'success');
        handleCloseEmployeeModal();
        fetchLeaderEmployees(); // Employee listesini yenile
      }
    } catch (error) {
      console.error('Çalışan atanırken hata:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      // Backend'den gelen hata mesajlarını kontrol et
      if (error.message && error.message.includes('You can only assign employees to yourself')) {
        showSnackbar(t('leaderEmployees.errors.onlySelfAssignment'), 'error');
      } else {
        showSnackbar(error.message || t('leaderEmployees.errors.assignEmployeeError'), 'error');
      }
    }
  };

  const handleRemoveEmployee = async (employeeId) => {
    try {
      console.log('handleRemoveEmployee called with employeeId:', employeeId);
      
      // JWT'den kullanıcı bilgilerini al
      const token = localStorage.getItem('jwt');
      if (!token) {
        console.error('JWT token bulunamadı');
        showSnackbar(t('leaderEmployees.errors.sessionNotFound'), 'error');
        return;
      }

      const decoded = jwtDecode(token);
      
      // Leader güvenlik kontrolü: Sadece kendi altındaki çalışanları çıkarabilir
      if (decoded.roleName === 'Leader') {
        // Employee'nin mevcut leader'ını kontrol et
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) {
          showSnackbar(t('leaderEmployees.errors.employeeNotFound'), 'error');
          return;
        }
        
        // Employee'nin leaderId'si varsa ve mevcut leader'dan farklıysa
        // Not: employees listesinde leaderId alanı olmayabilir, backend'e güvenelim
        console.log('Employee to remove:', employee);
        console.log('Current leader ID:', decoded.userId);
      }
      
      const response = await removeEmployeeFromLeader(employeeId);
      showSnackbar(response.message, 'success');
      handleCloseEmployeeModal();
      fetchLeaderEmployees(); // Employee listesini yenile
    } catch (error) {
      console.error('Çalışan çıkarılırken hata:', error);
      
      // Backend'den gelen hata mesajlarını kontrol et
      if (error.message && error.message.includes('You can only remove employees from your own team')) {
        showSnackbar(t('leaderEmployees.errors.onlyOwnTeamRemoval'), 'error');
      } else if (error.message && error.message.includes('Employee not found')) {
        showSnackbar(t('leaderEmployees.errors.employeeNotFound'), 'error');
      } else {
        showSnackbar(error.message || t('leaderEmployees.errors.removeEmployeeError'), 'error');
      }
    }
  };

  const handleConfirmRemoveEmployee = async () => {
    const employeeId = confirmRemoveEmployee.employeeId;
    if (!employeeId) return;
    
    try {
      // JWT'den kullanıcı bilgilerini al
      const token = localStorage.getItem('jwt');
      if (!token) {
        console.error('JWT token bulunamadı');
        showSnackbar(t('leaderEmployees.errors.sessionNotFound'), 'error');
        return;
      }

      const decoded = jwtDecode(token);
      
      // Leader güvenlik kontrolü: Sadece kendi altındaki çalışanları çıkarabilir
      if (decoded.roleName === 'Leader') {
        // Employee'nin mevcut leader'ını kontrol et
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) {
          showSnackbar(t('leaderEmployees.errors.employeeNotFound'), 'error');
          return;
        }
        
        // Employee'nin leaderId'si varsa ve mevcut leader'dan farklıysa
        // Not: employees listesinde leaderId alanı olmayabilir, backend'e güvenelim
        console.log('Employee to remove:', employee);
        console.log('Current leader ID:', decoded.userId);
      }
      
      const response = await removeEmployeeFromLeader(employeeId);
      showSnackbar(response.message, 'success');
      setConfirmRemoveEmployee({ open: false, employeeId: null, employeeName: '' });
      handleCloseEmployeeModal(); // Çalışan yönetimi modalını kapat
      fetchLeaderEmployees(); // Employee listesini yenile
    } catch (error) {
      console.error('Çalışan çıkarılırken hata:', error);
      
      // Backend'den gelen hata mesajlarını kontrol et
      if (error.message && error.message.includes('You can only remove employees from your own team')) {
        showSnackbar(t('leaderEmployees.errors.onlyOwnTeamRemoval'), 'error');
      } else if (error.message && error.message.includes('Employee not found')) {
        showSnackbar(t('leaderEmployees.errors.employeeNotFound'), 'error');
      } else {
        showSnackbar(error.message || t('leaderEmployees.errors.removeEmployeeError'), 'error');
      }
    }
  };

  const handleCancelRemoveEmployee = () => {
    setConfirmRemoveEmployee({ open: false, employeeId: null, employeeName: '' });
  };

  const getStatusChip = (employee) => {
    if (employee.isDeleted) {
      return <Chip label={t('leaderEmployees.status.deleted')} color="default" size="small" sx={{ bgcolor: '#888', color: '#fff' }} />;
    }
    return <Chip label={employee.isActive ? t('leaderEmployees.status.active') : t('leaderEmployees.status.inactive')} color={employee.isActive ? 'success' : 'default'} size="small" />;
  };

  // Table columns definition
  const tableColumns = [
    { key: 'fullName', label: t('leaderEmployees.table.fullName') },
    { key: 'email', label: t('leaderEmployees.table.email') },
    { 
      key: 'status', 
      label: t('leaderEmployees.table.status'),
      render: (row) => getStatusChip(row.actions)
    },
    { key: 'createdAt', label: t('leaderEmployees.table.createdAt') },
    { key: 'actions', label: t('leaderEmployees.table.actions') },
  ];

  // Prepare table data
  const tableData = employees.map(employee => {
    console.log('Processing employee:', employee);
    
    return {
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      status: employee.isDeleted ? t('leaderEmployees.status.deleted') : (employee.isActive ? t('leaderEmployees.status.active') : t('leaderEmployees.status.inactive')),
      createdAt: new Date(employee.createdAt).toLocaleDateString('tr-TR'),
      actions: employee,
    };
  });

  // Render actions for table
  const renderActions = (row) => (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      <CustomButton
        size="small"
        variant="danger"
        onClick={() => {
          console.log('Çalışan Yönet butonuna tıklandı:', row);
          handleOpenEmployeeModal('manage');
        }}
        disabled={permissionsLoading || row.isDeleted}
        title={t('leaderEmployees.actions.manageEmployee')}
        style={{ backgroundColor: '#ff9800', color: '#fff' }}
      >
        {t('leaderEmployees.actions.manageEmployee')}
      </CustomButton>
    </div>
  );

  return (
    <Box sx={{ p: 3, pt: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          {t('leaderEmployees.title')}
        </Typography>
        <CustomButton
          variant="primary"
          onClick={() => handleOpenEmployeeModal('add')}
          disabled={permissionsLoading || !(isLeader?.() || checkIsLeader())}
          title={!(isLeader?.() || checkIsLeader()) ? t('leaderEmployees.errors.onlyLeadersCanAddEmployees') : ''}
          style={{ backgroundColor: '#4caf50', color: '#fff' }}
        >
          {t('leaderEmployees.actions.addEmployee')}
        </CustomButton>
      </Box>

      {/* Employees Table */}
      <CustomTable
        rows={tableData}
        columns={tableColumns}
        loading={loading}
        error={null}
        i18nNamespace="leaderEmployees"
        renderActions={renderActions}
        emptyMessage={t('leaderEmployees.messages.noEmployeesAssigned')}
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

      {/* Employee Management Modal */}
      <Dialog open={employeeModal.open} onClose={handleCloseEmployeeModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {employeeModal.action === 'add' 
            ? t('leaderEmployees.modal.addEmployee.assignableEmployees')
            : t('leaderEmployees.modal.manageEmployee.title')
          }
        </DialogTitle>
        <DialogContent>
          {employeeModal.action === 'add' ? (
            // Çalışan Ekleme Modal'ı
            <Box>
              {employeesLoading ? (
                <Typography>{t('leaderEmployees.modal.addEmployee.loading')}</Typography>
              ) : availableEmployees.length === 0 ? (
                <Typography>{t('leaderEmployees.modal.addEmployee.noAvailableEmployees')}</Typography>
              ) : (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {availableEmployees.map((employee, index) => (
                    <Box
                      key={employee.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#fafafa',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                        <Chip
                          label={employee.isActive ? t('leaderEmployees.status.active') : t('leaderEmployees.status.inactive')}
                          color={employee.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <CustomButton
                        size="small"
                        variant="primary"
                        onClick={() => handleAssignEmployee(employee.id)}
                        sx={{ ml: 2 }}
                      >
                        {t('leaderEmployees.actions.assign')}
                      </CustomButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            // Çalışan Yönetimi Modal'ı
            <Box>
              <Typography variant="h6" mb={2}>
                {t('leaderEmployees.modal.manageEmployee.currentEmployees')}
              </Typography>
              {employees.length === 0 ? (
                <Typography>{t('leaderEmployees.messages.noEmployeesAssigned')}</Typography>
              ) : (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {employees.map((employee, index) => (
                    <Box
                      key={employee.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#fafafa',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                        <Chip
                          label={employee.isActive ? t('leaderEmployees.status.active') : t('leaderEmployees.status.inactive')}
                          color={employee.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <CustomButton
                        size="small"
                        variant="danger"
                        onClick={() => {
                          setConfirmRemoveEmployee({
                            open: true,
                            employeeId: employee.id,
                            employeeName: `${employee.firstName} ${employee.lastName}`
                          });
                        }}
                        sx={{ ml: 2 }}
                      >
                        {t('leaderEmployees.actions.remove')}
                      </CustomButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <CustomButton onClick={handleCloseEmployeeModal} variant="outline">{t('leaderEmployees.actions.close')}</CustomButton>
        </DialogActions>
      </Dialog>

      {/* ConfirmModal ile çalışan çıkarma onayı */}
      <ConfirmModal
        open={confirmRemoveEmployee.open}
        onConfirm={handleConfirmRemoveEmployee}
        onCancel={handleCancelRemoveEmployee}
        title={t('leaderEmployees.confirm.removeEmployee.title')}
        description={t('leaderEmployees.confirm.removeEmployee.description', { employeeName: confirmRemoveEmployee.employeeName })}
        confirmText={t('leaderEmployees.confirm.removeEmployee.confirmText')}
        cancelText={t('leaderEmployees.confirm.removeEmployee.cancelText')}
        confirmColor="danger"
        zIndex={9999}
      />
    </Box>
  );
} 