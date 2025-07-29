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
import { getLeaders, getEmployees, assignEmployeeToLeader, removeEmployeeFromLeader } from '../../api/userApi';
import * as roleApi from '../../api/roleApi';
import { getAdminCategories } from '../../api/categoryApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';

export default function AdminLeaders() {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState([]);
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { hasPermission, isAdmin, loading: permissionsLoading, userRole } = usePermissions();


  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Employee management modal states
  const [employeeModal, setEmployeeModal] = useState({ open: false, leader: null, action: 'add' });
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [confirmRemoveEmployee, setConfirmRemoveEmployee] = useState({ open: false, employeeId: null, employeeName: '' });

  // Category assignment modal states
  const [categoryModal, setCategoryModal] = useState({ open: false, leader: null });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryUpdateLoading, setCategoryUpdateLoading] = useState(false);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchLeaders = useCallback(async () => {
    try {
      setLoading(true);
      // Backend'deki getLeaders API'sini kullan
      const response = await getLeaders();
      console.log('getLeaders response:', response);
      if (response.data && Array.isArray(response.data)) {
        console.log('Leaders data:', response.data);
        setLeaders(response.data);
        if (response.message) {
          showSnackbar(response.message, 'success');
        }
      } else {
        console.log('No data or not array:', response.data);
        setLeaders([]);
      }
    } catch (error) {
      console.error('Leader\'lar yüklenirken hata:', error);
      showSnackbar(error.message || 'Leader\'lar yüklenirken hata oluştu', 'error');
      setLeaders([]);
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getAdminCategories();
      console.log('Categories response:', response);
      console.log('Categories data:', response.data);
      if (response.data && Array.isArray(response.data)) {
        console.log('Categories array:', response.data);
        response.data.forEach(category => {
          console.log('Category full object:', category);
          console.log('Category keys:', Object.keys(category));
          const currentLang = localStorage.getItem('language') || 'tr';
          const categoryName = currentLang === 'en' ? category.category_name_en : category.category_name_tr;
          console.log('Category:', { 
            id: category.id, 
            category_name_tr: category.category_name_tr,
            category_name_en: category.category_name_en,
            selectedName: categoryName,
            currentLang
          });
        });
        setCategories(response.data);
      } else {
        console.log('No categories data or not array:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      setCategories([]);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    console.log('fetchEmployees called');
    try {
      setEmployeesLoading(true);
      console.log('Calling getEmployees API with role=Employee...');
      const response = await getEmployees();
      console.log('getEmployees response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('All employees from API:', response.data);
        
        // Sadece leaderId null olan çalışanları filtrele
        const availableEmployees = response.data.filter(employee => {
          console.log('Processing employee:', {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            leaderId: employee.leaderId,
            leaderIdType: typeof employee.leaderId
          });
          
          // leaderId null, undefined veya boş string olan çalışanları göster
          const isAvailable = !employee.leaderId || employee.leaderId === null || employee.leaderId === undefined;
          console.log('Employee available for assignment:', isAvailable);
          return isAvailable;
        });
        
        console.log('Available employees (leaderId null/undefined):', availableEmployees);
        setEmployees(availableEmployees);
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        // Eğer response.data.users şeklinde geliyorsa
        console.log('All employees from API (users property):', response.data.users);
        
        const availableEmployees = response.data.users.filter(employee => {
          console.log('Processing employee:', {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            leaderId: employee.leaderId,
            leaderIdType: typeof employee.leaderId
          });
          
          const isAvailable = !employee.leaderId || employee.leaderId === null || employee.leaderId === undefined;
          console.log('Employee available for assignment:', isAvailable);
          return isAvailable;
        });
        
        console.log('Available employees (leaderId null/undefined):', availableEmployees);
        setEmployees(availableEmployees);
      } else {
        console.log('No data or not array:', response.data);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Çalışanlar yüklenirken hata:', error);
      showSnackbar(error.message || 'Çalışanlar yüklenirken hata oluştu', 'error');
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaders();
    fetchRoles();
    fetchCategories();
  }, [fetchLeaders, fetchRoles, fetchCategories]);

  // Category assignment functions
  const handleOpenCategoryModal = (leader) => {
    console.log('handleOpenCategoryModal called:', leader);
    setCategoryModal({ open: true, leader });
    
    // Leader'ın mevcut kategorilerini set et
    if (leader.categoryIds && Array.isArray(leader.categoryIds)) {
      setSelectedCategories(leader.categoryIds.map(id => id.toString()));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleCloseCategoryModal = () => {
    setCategoryModal({ open: false, leader: null });
    setSelectedCategories([]);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Kategori zaten seçiliyse kaldır
        return prev.filter(id => id !== categoryId);
      } else {
        // Kategori seçili değilse ekle
        return [...prev, categoryId];
      }
    });
  };

  const handleSaveCategories = async () => {
    if (!categoryModal.leader) return;
    
    setCategoryUpdateLoading(true);
    try {
      // updateUser API'sini kullanarak kategori güncellemesi yap
      const { updateUser } = await import('../../api/userApi');
      await updateUser(categoryModal.leader.id, { categoryIds: selectedCategories });
      
      showSnackbar('Kategoriler başarıyla güncellendi', 'success');
      handleCloseCategoryModal();
      fetchLeaders(); // Leader listesini yenile
    } catch (error) {
      console.error('Kategori güncellenirken hata:', error);
      showSnackbar(error.message || 'Kategori güncellenirken hata oluştu', 'error');
    } finally {
      setCategoryUpdateLoading(false);
    }
  };

  const filteredLeaders = leaders;

  // Her leader için debug logu
  filteredLeaders.forEach(leader => {
    console.log("leader:", leader, "isDeleted:", leader.isDeleted, "isAdmin:", isAdmin());
  });

  const getRoleColor = (role) => {
    const roleName = typeof role === 'object' ? role.name : role;
    switch (roleName) {
      case 'admin': return 'error';
      case 'leader': return 'warning';
      case 'support': return 'info';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    const roleName = typeof role === 'object' ? role.name : role;
    switch (roleName) {
      case 'admin': return 'Admin';
      case 'leader': return 'Leader';
      case 'support': return 'Support';
      case 'user': return 'User';
      default: return roleName;
    }
  };

  // API'den gelen role string'ini roleName'e çevir
  const getRoleFromResponse = (leader) => {
    return {
      name: leader.roleName || 'Leader'
    };
  };

  const getStatusChip = (leader) => {
    if (leader.is_deleted) {
      return <Chip label={t('adminLeaders.status.deleted')} color="default" size="small" sx={{ bgcolor: '#888', color: '#fff' }} />;
    }
    return <Chip label={leader.isActive ? t('adminLeaders.status.active') : t('adminLeaders.status.inactive')} color={leader.isActive ? 'success' : 'default'} size="small" />;
  };

  // Table columns definition
  const tableColumns = [
    { key: 'fullName', label: t('adminLeaders.table.fullName') },
    { key: 'email', label: t('adminLeaders.table.email') },
    { 
      key: 'categories', 
      label: 'Kategoriler',
      render: (row) => {
        if (!row.categories || row.categories.length === 0) {
          return <Typography variant="body2" color="text.secondary">Kategori yok</Typography>;
        }
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {row.categories.map((category, index) => {
              // Dile göre kategori ismini al
              const currentLang = localStorage.getItem('language') || 'tr';
              const categoryName = currentLang === 'en' ? category.category_name_en : category.category_name_tr;
              
              return (
                <Chip
                  key={category.id || category._id || index}
                  label={categoryName || 'Kategori'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        );
      }
    },
    { 
      key: 'employees', 
      label: t('adminLeaders.table.employees'),
      render: (row) => (
        <Chip
          label={`${row.employees} ${t('adminLeaders.table.employee')}`}
          color="info"
          size="small"
        />
      )
    },
    { key: 'createdAt', label: t('adminLeaders.table.createdAt') },
    { key: 'actions', label: t('adminLeaders.table.actions') },
  ];

  // Prepare table data
  const tableData = filteredLeaders.map(leader => {
    console.log('Processing leader:', leader);
    console.log('Leader employees:', leader.employees);
    console.log('Leader categoryIds:', leader.categoryIds);
    
    // Leader'ın kategorilerini bul
    const leaderCategories = leader.categoryIds ? 
      categories.filter(category => {
        const categoryId = category.id || category._id;
        const isMatch = leader.categoryIds.includes(categoryId);
        console.log('Category matching:', {
          categoryId,
          categoryName: category.name,
          leaderCategoryIds: leader.categoryIds,
          isMatch
        });
        return isMatch;
      }) : 
      [];
    
    console.log('Leader categories:', leaderCategories);
    
    return {
      fullName: `${leader.firstName} ${leader.lastName}`,
      email: leader.email,
      categories: leaderCategories,
      employees: leader.employees?.length || 0,
      createdAt: new Date(leader.createdAt).toLocaleDateString('tr-TR'),
      actions: leader,
    };
  });

  // Render actions for table
  const renderActions = (row) => (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      <CustomButton
        size="small"
        variant="primary"
        onClick={() => {
          console.log('Kategori Ata butonuna tıklandı:', row);
          handleOpenCategoryModal(row.actions);
        }}
        disabled={permissionsLoading || row.isDeleted || (!isAdmin() && !hasPermission('user:write'))}
        title={(!isAdmin() && !hasPermission('user:write')) ? 'Kategori atama yetkiniz yok' : ''}
        style={{ backgroundColor: '#4caf50', color: '#fff' }}
      >
        Kategori Ata
      </CustomButton>
      <CustomButton
        size="small"
        variant="danger"
        onClick={() => {
          console.log('Çalışan Ekle butonuna tıklandı:', row);
          // row.actions leader objesini içeriyor
          handleOpenEmployeeModal(row.actions, 'add');
        }}
        disabled={false} // Geçici olarak disabled kaldırıldı
        title="Çalışan Ekle"
        style={{ backgroundColor: '#ff0000', color: '#fff' }}
      >
        Çalışan Ekle
      </CustomButton>
      <CustomButton
        size="small"
        variant="secondary"
        onClick={() => {
          console.log('Çalışan Yönet butonuna tıklandı:', row);
          console.log('Leader employees:', row.employees);
          // row.actions leader objesini içeriyor
          handleOpenEmployeeModal(row.actions, 'manage');
        }}
        disabled={permissionsLoading || row.isDeleted || (!isAdmin() && !hasPermission('user:write'))}
        title={(!isAdmin() && !hasPermission('user:write')) ? 'Çalışan yönetimi yetkiniz yok' : ''}
      >
        Çalışan Yönet
      </CustomButton>

    </div>
  );

  // Employee management functions
  const handleOpenEmployeeModal = (leader, action = 'add') => {
    console.log('handleOpenEmployeeModal called:', { leader, action });
    console.log('Leader object:', leader);
    console.log('Leader employees:', leader?.employees);
    
    // Leader objesini doğru şekilde set et
    setEmployeeModal({ 
      open: true, 
      leader: {
        id: leader.id,
        firstName: leader.firstName,
        lastName: leader.lastName,
        employees: leader.employees || []
      }, 
      action 
    });
    
    if (action === 'add') {
      console.log('Fetching employees...');
      fetchEmployees();
    }
  };

  const handleCloseEmployeeModal = () => {
    setEmployeeModal({ open: false, leader: null, action: 'add' });
    setEmployees([]);
  };

  const handleAssignEmployee = async (employeeId) => {
    try {
      console.log('handleAssignEmployee called with employeeId:', employeeId);
      console.log('employeeModal.leader:', employeeModal.leader);
      const response = await assignEmployeeToLeader(employeeId, employeeModal.leader.id);
      showSnackbar(response.message, 'success');
      handleCloseEmployeeModal();
      fetchLeaders(); // Leader listesini yenile
    } catch (error) {
      console.error('Çalışan atanırken hata:', error);
      showSnackbar(error.message || 'Çalışan atanırken hata oluştu', 'error');
    }
  };

  const handleRemoveEmployee = async (employeeId) => {
    try {
      console.log('handleRemoveEmployee called with employeeId:', employeeId);
      const response = await removeEmployeeFromLeader(employeeId);
      showSnackbar(response.message, 'success');
      handleCloseEmployeeModal();
      fetchLeaders(); // Leader listesini yenile
    } catch (error) {
      console.error('Çalışan çıkarılırken hata:', error);
      showSnackbar(error.message || 'Çalışan çıkarılırken hata oluştu', 'error');
    }
  };

  const handleConfirmRemoveEmployee = async () => {
    const employeeId = confirmRemoveEmployee.employeeId;
    if (!employeeId) return;
    
    try {
      const response = await removeEmployeeFromLeader(employeeId);
      showSnackbar(response.message, 'success');
      setConfirmRemoveEmployee({ open: false, employeeId: null, employeeName: '' });
      handleCloseEmployeeModal(); // Çalışan yönetimi modalını kapat
      fetchLeaders(); // Leader listesini yenile
    } catch (error) {
      console.error('Çalışan çıkarılırken hata:', error);
      showSnackbar(error.message || 'Çalışan çıkarılırken hata oluştu', 'error');
    }
  };

  const handleCancelRemoveEmployee = () => {
    setConfirmRemoveEmployee({ open: false, employeeId: null, employeeName: '' });
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          {t('adminLeaders.title')}
        </Typography>
      </Box>

      {/* Leaders Table */}
      <CustomTable
        rows={tableData}
        columns={tableColumns}
        loading={loading}
        error={null}
        i18nNamespace="adminLeaders"
        renderActions={renderActions}
        emptyMessage={t('adminLeaders.noLeaders')}
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

      {/* Category Assignment Modal */}
      <Dialog open={categoryModal.open} onClose={handleCloseCategoryModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {categoryModal.leader ? 
            `${categoryModal.leader.firstName} ${categoryModal.leader.lastName} - Kategori Atama` : 
            'Kategori Atama'
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" mb={2}>
              Kategori Seçimi
            </Typography>
            {categoriesLoading ? (
              <Typography>Kategoriler yükleniyor...</Typography>
            ) : categories.length === 0 ? (
              <Typography>Kategori bulunamadı</Typography>
            ) : (
              <Box sx={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: '#f9fafb'
              }}>
                {categories.map(category => {
                  const currentLang = localStorage.getItem('language') || 'tr';
                  const categoryName = currentLang === 'en' ? category.category_name_en : category.category_name_tr;
                  
                  return (
                    <label key={category.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '8px 0',
                      fontSize: '14px',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id.toString())}
                        onChange={() => handleCategoryChange(category.id.toString())}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#1976d2'
                        }}
                      />
                      <span>{categoryName || category.name}</span>
                    </label>
                  );
                })}
              </Box>
            )}
            {selectedCategories.length > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                <Typography variant="body2" color="primary">
                  Seçili kategoriler: {selectedCategories.length}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <CustomButton onClick={handleCloseCategoryModal} variant="outline">
            İptal
          </CustomButton>
          <CustomButton 
            onClick={handleSaveCategories} 
            variant="primary"
            disabled={categoryUpdateLoading}
          >
            {categoryUpdateLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Employee Management Modal */}
      <Dialog open={employeeModal.open} onClose={handleCloseEmployeeModal} maxWidth="md" fullWidth>
        {console.log('Modal state:', employeeModal)}
        {console.log('Leader in modal:', employeeModal.leader)}
        <DialogTitle>
          {employeeModal.action === 'add' 
            ? `${employeeModal.leader?.firstName} ${employeeModal.leader?.lastName} - Çalışan Ekle`
            : `${employeeModal.leader?.firstName} ${employeeModal.leader?.lastName} - Çalışan Yönetimi`
          }
        </DialogTitle>
        <DialogContent>
          {employeeModal.action === 'add' ? (
            // Çalışan Ekleme Modal'ı
            <Box>
              <Typography variant="h6" mb={2}>
                Atanabilir Çalışanlar
              </Typography>
              {console.log('Modal content - employeesLoading:', employeesLoading, 'employees:', employees)}
              {employeesLoading ? (
                <Typography>Çalışanlar yükleniyor...</Typography>
              ) : employees.length === 0 ? (
                <Typography>Atanabilir çalışan bulunamadı</Typography>
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
                          label={employee.isActive ? 'Aktif' : 'Pasif'}
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
                        Ata
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
                Mevcut Çalışanlar
              </Typography>
              {console.log('Leader employees:', employeeModal.leader?.employees)}
              {!employeeModal.leader?.employees || employeeModal.leader.employees.length === 0 ? (
                <Typography>Bu leader'a atanmış çalışan bulunmuyor</Typography>
              ) : (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {employeeModal.leader.employees.map((employee, index) => (
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
                          label={employee.isActive ? 'Aktif' : 'Pasif'}
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
                        Çıkar
                      </CustomButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <CustomButton onClick={handleCloseEmployeeModal} variant="outline">Kapat</CustomButton>
        </DialogActions>
      </Dialog>

      {/* ConfirmModal ile çalışan çıkarma onayı */}
      <ConfirmModal
        open={confirmRemoveEmployee.open}
        onConfirm={handleConfirmRemoveEmployee}
        onCancel={handleCancelRemoveEmployee}
        title="Çalışanı Çıkar"
        description={`"${confirmRemoveEmployee.employeeName}" adlı çalışanı bu leader'dan çıkarmak istediğinizden emin misiniz?`}
        confirmText="Evet, Çıkar"
        cancelText="İptal"
        confirmColor="danger"
        zIndex={9999}
      />
    </Box>
  );
}
