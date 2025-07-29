import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import CustomSingleLineTextArea from '../../components/common/CustomSingleLineTextArea';
import CustomMultilineTextArea from '../../components/common/CustomMultilineTextArea';
import CustomDropdown from '../../components/common/CustomDropdown';
import CustomButton from '../../components/common/CustomButton';
import { createTicket } from '../../api/ticketApi';
import { getCategories } from '../../api/categoryApi';
import { getProductsUser } from "../../api/productApi";

const CreateTicket = ({ onClose, isModal = false, onTicketCreated = null }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    productId: "",
    files: [],
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userRole, setUserRole] = useState("guest");
  const [previews, setPreviews] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.roleName ? decoded.roleName.toLowerCase() : 'user');
      } catch (e) {
        setUserRole('user');
      }
    } else {
      setUserRole('guest');
    }
  }, []);

  useEffect(() => {
    if (form.files && form.files.length > 0) {
      const newPreviews = form.files.map(file => {
        return { url: URL.createObjectURL(file), name: file.name, type: file.type, size: file.size, file };
      });
      setPreviews(newPreviews);
      return () => {
        newPreviews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
      };
    } else {
      setPreviews([]);
    }
  }, [form.files]);

  useEffect(() => {
    getCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    }).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      getProductsUser(token)
        .then(res => {
          if (res.data && res.data.success && Array.isArray(res.data.data)) {
            setProducts(res.data.data);
          }
        })
        .catch(() => setProducts([]));
    }
  }, []);

  useEffect(() => {
    if (form.categoryId) {
      const filtered = products.filter(
        (prod) => String(prod.product_category?.product_category_id) === String(form.categoryId)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [form.categoryId, products]);

  if (userRole !== "user") {
    return <Box mt={10}><Alert severity="error">{t('pages.createTicket.noPermission')}</Alert></Box>;
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'files') {
      const maxSize = 10 * 1024 * 1024;
      const validFiles = [];
      const invalidFiles = [];
      
      if (files) {
        Array.from(files).forEach(file => {
          if (file.size <= maxSize) {
            validFiles.push(file);
          } else {
            invalidFiles.push(file.name);
          }
        });
      }
      
      if (invalidFiles.length > 0) {
        setSnackbar({
          open: true,
          message: `${invalidFiles.join(', ')} dosyaları 10MB'dan büyük olduğu için yüklenemedi.`,
          severity: 'error'
        });
        return;
      }
      
      setForm((prev) => ({
        ...prev,
        files: validFiles,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (name === "categoryId") {
        setForm((prev) => ({
          ...prev,
          productId: "",
        }));
      }
    }
  };

  const handleRemoveFile = (index) => {
    setForm((prev) => {
      const newFiles = prev.files.slice();
      newFiles.splice(index, 1);
      return { ...prev, files: newFiles };
    });
  };

  const handlePreview = (fileObj) => {
    if (fileObj.type.startsWith('image/') || fileObj.type === 'application/pdf') {
      setSelectedPreview(fileObj);
      setPreviewOpen(true);
    } else {
      const link = document.createElement('a');
      link.href = fileObj.url;
      link.download = fileObj.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validasyonlar
    if (!form.title || form.title.length < 1) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.required'), 
        severity: 'error' 
      });
      setLoading(false);
      return;
    }
    
    if (form.title.length > 100) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.maxLength', { maxLength: 100 }), 
        severity: 'error' 
      });
      setLoading(false);
      return;
    }
    
    if (!form.description || form.description.length < 1) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.required'), 
        severity: 'error' 
      });
      setLoading(false);
      return;
    }
    
    if (form.description.length > 1000) {
      setSnackbar({ 
        open: true, 
        message: t('components.customTextInput.validation.maxLength', { maxLength: 1000 }), 
        severity: 'error' 
      });
      setLoading(false);
      return;
    }
    
    if (!form.categoryId) {
      setSnackbar({ 
        open: true, 
        message: 'Kategori seçimi zorunludur.', 
        severity: 'error' 
      });
      setLoading(false);
      return;
    }
    
    try {
      const ticketPayload = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        productId: form.productId,
        files: form.files || []
      };
      const response = await createTicket(ticketPayload);
      
      if (response.success) {
        setTicketData(response.data);
        
        if (response.data.assignedAgentId) {
          setSnackbar({
            open: true,
            message: t('pages.createTicket.success'),
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: t('pages.createTicket.successNoAgent'),
            severity: 'success'
          });
        }
        
        setForm({ title: "", description: "", categoryId: "", files: [] });
        
        if (isModal && onClose) {
          console.log('CreateTicket - Modal mode, calling onTicketCreated with:', response.data);
          if (onTicketCreated) {
            onTicketCreated(response.data);
          }
          onClose();
        }
      } else {
        setSnackbar({
          open: true,
          message: response.message || t('pages.createTicket.error'),
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('CreateTicket Error:', err);
      
      if (err?.response?.status === 401) {
        setSnackbar({
          open: true,
          message: t('pages.createTicket.successWithRelogin'),
          severity: 'success'
        });
        setForm({ title: "", description: "", categoryId: "", files: [] });
        
        if (isModal && onClose) {
          setTimeout(() => {
            onClose();
          }, 3000);
        }
        return;
      }
      
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || t('pages.createTicket.error'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      flex={1} 
      minWidth={isModal ? 500 : 400} 
      maxWidth={isModal ? 500 : 600} 
      display="flex" 
      flexDirection="column" 
      minHeight={0}
      height="auto"
      maxHeight={isModal ? '85vh' : 'auto'}
    >
      <Box 
        bgcolor="#f9f9f9" 
        borderRadius={2} 
        boxShadow={3} 
        p={2} 
        display="flex" 
        flexDirection="column" 
        flex={1} 
        minHeight={0} 
        mt={isModal ? 0 : 6}
        height="100%"
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6">{t('pages.createTicket.title')}</Typography>
        </Box>
        
        <Box 
          flex={1} 
          my={2} 
          p={1} 
          minHeight={0}
          sx={{
            overflowY: 'auto',
            maxHeight: isModal ? '60vh' : 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}
        >
          <form onSubmit={handleSubmit}>
            <CustomSingleLineTextArea
              label={t('pages.createTicket.form.title')}
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder={t('pages.createTicket.form.title')}
              minLength={1}
              maxLength={100}
              showCharCounter={true}
            />

            <CustomMultilineTextArea
              label={t('pages.createTicket.form.description')}
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              placeholder={t('pages.createTicket.form.description')}
              rows={4}
              minLength={1}
              maxLength={1000}
              showCharCounter={true}
            />

            <CustomDropdown
              label={t('pages.createTicket.form.category')}
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
              options={categories.map((cat) => ({
                value: cat.id || cat._id,
                label: cat.category_name_tr || cat.category_name_en || cat.name || cat.label
              }))}
              placeholder={t('pages.createTicket.form.select')}
            />

            {form.categoryId && filteredProducts.length > 0 && (
              <CustomDropdown
                label={t('pages.createTicket.form.product')}
                name="productId"
                value={form.productId}
                onChange={handleChange}
                options={filteredProducts.map((prod) => ({
                  value: prod.id,
                  label: prod.product_name_tr || prod.product_name_en
                }))}
                placeholder={t('pages.createTicket.form.selectProduct')}
              />
            )}

            {/* File Upload */}
            <Box mt={2} mb={2}>
              <CustomButton
                variant="secondary"
                component="label"
                fullWidth
                sx={{ mb: 1, borderRadius: 2 }}
              >
                {t('pages.createTicket.form.file')} (Max 10MB)
                <input
                  type="file"
                  name="files"
                  hidden
                  multiple
                  onChange={handleChange}
                />
              </CustomButton>
              
              {previews.length > 0 && (
                <Box display="flex" flexDirection="column" gap={1}>
                  {previews.map((file, idx) => (
                    <Box key={idx} display="flex" alignItems="center" gap={2} p={1} border={1} borderColor="#eee" borderRadius={1}>
                      <Box
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handlePreview(file)}
                      >
                        {file.url && file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                        ) : file.type === 'application/pdf' ? (
                          <Box width={48} height={48} display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5" borderRadius={1}>
                            <Typography variant="caption" color="text.secondary">PDF</Typography>
                          </Box>
                        ) : (
                          <Box width={48} height={48} display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f5f5" borderRadius={1}>
                            <Typography variant="caption" color="text.secondary">{file.name.split('.').pop()?.toUpperCase()}</Typography>
                          </Box>
                        )}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="body2">{file.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {file.size > 1024 * 1024 
                            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                            : `${(file.size / 1024).toFixed(1)} KB`
                          }
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => handleRemoveFile(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </form>
        </Box>
        
        <Box display="flex" gap={1} mt={2} flexShrink={0}>
          <CustomButton
            type="submit"
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
            sx={{ borderRadius: 2, minWidth: 80, py: 1.2, fontWeight: 600 }}
          >
            {loading ? t('pages.createTicket.form.submitting') : t('pages.createTicket.form.submit')}
          </CustomButton>
        </Box>
      </Box>

      {/* Resim ve PDF önizleme Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>{selectedPreview?.name}</DialogTitle>
        <DialogContent>
          {selectedPreview && selectedPreview.type.startsWith('image/') && (
            <img src={selectedPreview.url} alt={selectedPreview.name} style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }} />
          )}
          {selectedPreview && selectedPreview.type === 'application/pdf' && (
            <iframe
              src={selectedPreview.url}
              title={selectedPreview.name}
              width="100%"
              height="600px"
              style={{ border: 'none', display: 'block', margin: '0 auto' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateTicket; 