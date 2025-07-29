import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import { useTranslation } from 'react-i18next';
import CustomSingleLineTextArea from '../../components/common/CustomSingleLineTextArea';
import CustomMultilineTextArea from '../../components/common/CustomMultilineTextArea';
import CustomDropdown from '../../components/common/CustomDropdown';
import CustomButton from '../../components/common/CustomButton';
import { getCategories } from '../../api/categoryApi';
import { getProductsUser } from '../../api/productApi';
import { createTicket } from '../../api/ticketApi';
import { getUserIdFromJWT } from '../../utils/jwt';

export default function CreateSupportTicket({ open, onClose, isModal = true, chat = null }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    productId: '',
    files: [],
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'tr');

  useEffect(() => {
    getCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    }).catch(() => setCategories([]));
    
    const token = localStorage.getItem('jwt');
    if (token) {
      getProductsUser(token).then(res => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setProducts(res.data.data);
        }
      }).catch(() => setProducts([]));
    }
  }, []);

  useEffect(() => {
    if (form.categoryId) {
      const filtered = products.filter(
        (prod) => String(prod.product_category?.product_category_id) === String(form.categoryId)
      );
      setFilteredProducts(filtered);
      console.log('Tüm ürünler:', products);
      console.log('Seçili kategori:', form.categoryId);
      console.log('Filtrelenen ürünler:', filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [form.categoryId, products]);

  // Dil değişikliğini dinle
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

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
  
      setForm((prev) => ({ ...prev, files: validFiles }));
    } else {
      if (name === 'categoryId') {
        setForm((prev) => ({
          ...prev,
          categoryId: value,
          productId: '',
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
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

  function getCustomerIdFromParticipants(participants, agentId) {
    if (!Array.isArray(participants)) return null;
    const agentIdStr = String(agentId);
    const customer = participants.find(p => String(p.userId) !== agentIdStr);
    return customer ? customer.userId : null;
  }

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
      let customerId = form.customerId;
      let chatId = null;
      if (chat) {
        const agentId = getUserIdFromJWT();
        console.log('chat.participants:', chat.participants);
        console.log('agentId:', agentId);
        customerId = getCustomerIdFromParticipants(chat.participants, agentId);
        console.log('Bulunan customerId:', customerId);
        chatId = chat._id || chat.chatId || chat.id;
      }
      
      const ticketPayload = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        productId: form.productId,
        files: form.files || [],
        ...(customerId ? { customerId } : {}),
        ...(chatId ? { chatId } : {})
      };
      
      const response = await createTicket(ticketPayload);
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Talep başarıyla oluşturuldu!',
          severity: 'success'
        });
        setForm({ title: '', description: '', categoryId: '', productId: '', files: [] });
        if (onClose) onClose();
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Bir hata oluştu.',
          severity: 'error'
        });
      }
    } catch (err) {
      if (err?.response?.data?.detail) {
        setSnackbar({
          open: true,
          message: err.response.data.detail,
          severity: 'error'
        });
      } else if (err?.response?.data?.message) {
        setSnackbar({
          open: true,
          message: err.response.data.message,
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Bir hata oluştu.',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        bgcolor: 'background.paper', 
        borderRadius: 2, 
        boxShadow: 3,
        minWidth: 500, 
        maxWidth: 600,
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box 
          bgcolor="#f9f9f9" 
          borderRadius={2} 
          p={2} 
          display="flex" 
          flexDirection="column" 
          flex={1} 
          minHeight={0}
          height="100%"
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6">Create Ticket</Typography>
          </Box>
          
          <Box 
            flex={1} 
            my={2} 
            p={1} 
            minHeight={0}
            sx={{
              overflowY: 'auto',
              maxHeight: '60vh',
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
                label={t('pages.createTicket.form.title') || "Başlık"}
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder={t('pages.createTicket.form.title') || "Başlık"}
                minLength={1}
                maxLength={100}
                showCharCounter={true}
              />

              <CustomMultilineTextArea
                label={t('pages.createTicket.form.description') || "Açıklama"}
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder={t('pages.createTicket.form.description') || "Açıklama"}
                rows={4}
                minLength={1}
                maxLength={1000}
                showCharCounter={true}
              />

              <CustomDropdown
                label={t('pages.createTicket.form.category') || "Kategori"}
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                options={categories.map((cat) => {
                  const label = currentLanguage === 'tr' 
                    ? cat.category_name_tr 
                    : cat.category_name_en;
                  return {
                    value: cat.id || cat._id,
                    label: label || cat.name || cat.label
                  };
                })}
                placeholder={t('pages.createTicket.form.select') || "Seçiniz"}
              />

              {form.categoryId && filteredProducts.length > 0 && (
                <CustomDropdown
                  label={t('pages.createTicket.form.product') || "Ürün"}
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  options={filteredProducts.map((prod) => {
                    const label = currentLanguage === 'tr' 
                      ? prod.product_name_tr 
                      : prod.product_name_en;
                    return {
                      value: prod.id || prod._id,
                      label: label || prod.name
                    };
                  })}
                  placeholder={t('pages.createTicket.form.selectProduct') || "Ürün Seçiniz"}
                />
              )}

              {/* File Upload */}
              <Box mt={2} mb={2}>
                <input
                  id="file-upload"
                  type="file"
                  name="files"
                  style={{ display: 'none' }}
                  multiple
                  onChange={handleChange}
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                />
                <CustomButton
                  variant="secondary"
                  fullWidth
                  sx={{ mb: 1, borderRadius: 2, cursor: 'pointer' }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  Dosya Yükle (Max 10MB)
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

          {/* Action Buttons */}
          <Box display="flex" gap={1} mt={2} flexShrink={0}>
            <CustomButton
              type="submit"
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={loading}
              sx={{ borderRadius: 2, minWidth: 80, py: 1.2, fontWeight: 600 }}
            >
              {loading ? 'Gönderiliyor...' : 'Talep Oluştur'}
            </CustomButton>
            <CustomButton
              variant="secondary"
              fullWidth
              onClick={onClose}
              sx={{ borderRadius: 2, minWidth: 80, py: 1.2, fontWeight: 600 }}
            >
              İptal
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
    </Modal>
  );
}
