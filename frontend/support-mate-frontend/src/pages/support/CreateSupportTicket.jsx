import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslation } from 'react-i18next';
import { getCategories } from '../../api/categoryApi';
import { getProductsUser } from '../../api/productApi';
import { createTicket } from '../../api/ticketApi';
import { getUserIdFromJWT } from '../../utils/jwt';
import { getUsersByRoleName } from '../../api/authApi';

export default function CreateSupportTicket({ open, onClose, isModal = true, chat = null }) {
  const { t } = useTranslation();
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [leaderError, setLeaderError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);

  useEffect(() => {
    // Kategorileri API'den çek
    getCategories().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    }).catch(() => setCategories([]));
    // Ürünleri API'den çek (mount'ta bir kez)
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
      // DEBUG: Konsola yazdır
      console.log('Tüm ürünler:', products);
      console.log('Seçili kategori:', form.categoryId);
      console.log('Filtrelenen ürünler:', filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [form.categoryId, products]);

  useEffect(() => {
    if (open) {
      setLoadingLeaders(true);
      setLeaderError('');
      getUsersByRoleName('Leader')
        .then((data) => {
          const leaderOptions = (Array.isArray(data?.data) ? data.data : []).map(leader => ({
            value: leader.id,
            label: leader.firstName + ' ' + leader.lastName
          }));
          setLeaders(leaderOptions);
        })
        .catch(() => {
          setLeaders([]);
          setLeaderError('Leader listesi alınamadı.');
        })
        .finally(() => setLoadingLeaders(false));
    }
  }, [open]);

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
      const maxSize = 10 * 1024 * 1024; // 10MB
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
        setError(`${invalidFiles.join(', ')} dosyaları 10MB'dan büyük olduğu için yüklenemedi.`);
        return;
      }
  
      setForm((prev) => ({ ...prev, files: validFiles }));
    } else {
      // Kategori seçimi yapılırsa productId sıfırla
      if (name === 'categoryId') {
        setForm((prev) => ({
          ...prev,
          categoryId: value,
          productId: '', // kategori değişince ürün seçimi sıfırlanıyor
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
      // Diğer dosyalar için blob url ile indirme
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

  // CustomerId bulma fonksiyonu (chat ve agentId ile)
  function getCustomerIdFromParticipants(participants, agentId) {
    if (!Array.isArray(participants)) return null;
    const agentIdStr = String(agentId);
    const customer = participants.find(p => String(p.userId) !== agentIdStr);
    return customer ? customer.userId : null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!form.assignedLeaderId) {
      setError(t('pages.createTicket.form.leaderRequired') || 'Lider seçimi zorunludur.');
      setLoading(false);
      return;
    }
    try {
      // Eğer chat prop'u varsa customerId'yi otomatik bul
      let customerId = form.customerId;
      let chatId = null;
      if (chat) {
        const agentId = getUserIdFromJWT();
        // Debug loglar
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
        ...(form.assignedLeaderId ? { assignedLeaderId: form.assignedLeaderId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(chatId ? { chatId } : {})
      };
      const response = await createTicket(ticketPayload);
      if (response.success) {
        setSuccess('Talep başarıyla oluşturuldu!');
        setForm({ title: '', description: '', categoryId: '', productId: '', files: [] });
        if (onClose) onClose();
      } else {
        setError(response.message || 'Bir hata oluştu.');
      }
    } catch (err) {
      // Backend'den HTTPException ile gelen hata
      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Bir hata oluştu.');
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
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <form onSubmit={handleSubmit}>
              {/* Custom Title Input */}
              <div style={{ margin: '16px 0', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('pages.createTicket.form.title') || "Başlık"}
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={t('pages.createTicket.form.title') || "Başlık"}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: '0.2s ease-in-out',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
                  onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                />
              </div>

              {/* Custom Description Textarea */}
              <div style={{ margin: '16px 0', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('pages.createTicket.form.description') || "Açıklama"}
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder={t('pages.createTicket.form.description') || "Açıklama"}
                  required
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px',
                    transition: '0.2s ease-in-out',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
                  onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                ></textarea>
              </div>

              {/* Custom Category Dropdown */}
              <div style={{ margin: '16px 0', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('pages.createTicket.form.category') || "Kategori"}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      appearance: 'none',
                    }}
                    required
                  >
                    <option value="" disabled>{t('pages.createTicket.form.select') || "Seçiniz"}</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.category_name_tr || cat.category_name_en || cat.name || cat.label}
                      </option>
                    ))}
                  </select>
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    fontSize: '14px',
                    color: '#555',
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Product Dropdown */}
              {form.categoryId && (
                <div style={{ margin: '16px 0', width: '100%' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                    {t('pages.createTicket.form.product') || "Ürün"}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="productId"
                      value={form.productId}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        appearance: 'none',
                      }}
                      required={filteredProducts.length > 0}
                    >
                      <option value="" disabled>{t('pages.createTicket.form.selectProduct') || "Ürün Seçiniz"}</option>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((prod) => (
                          <option key={prod.id || prod._id} value={prod.id || prod._id}>
                            {prod.product_name_tr || prod.product_name_en || prod.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>{t('pages.createTicket.form.noProduct') || "Bu kategoriye ait ürün yok"}</option>
                      )}
                    </select>
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      fontSize: '14px',
                      color: '#555',
                    }}>
                      ▼
                    </span>
                  </div>
                </div>
              )}

              {/* Leader Dropdown */}
              <div style={{ margin: '16px 0', width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('pages.createTicket.form.leader') || 'Leader Seçin'}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    name="assignedLeaderId"
                    value={form.assignedLeaderId || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      appearance: 'none',
                    }}
                    disabled={loadingLeaders}
                    required
                  >
                                         <option value="" disabled>{t('pages.createTicket.form.select') || "Seçiniz"}</option>
                    {leaders.map((leader) => (
                      <option key={leader.value} value={leader.value}>
                        {leader.label}
                      </option>
                    ))}
                  </select>
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    fontSize: '14px',
                    color: '#555',
                  }}>
                    ▼
                  </span>
                </div>
                {loadingLeaders && <Typography variant="caption" color="text.secondary">Liderler yükleniyor...</Typography>}
                {leaderError && <Alert severity="error">{leaderError}</Alert>}
              </div>

              {/* File Upload */}
              <Box mt={2} mb={2}>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  sx={{ mb: 1, borderRadius: 2 }}
                >
                  Dosya Yükle (Max 10MB)
                  <input
                    type="file"
                    name="files"
                    hidden
                    multiple
                    onChange={handleChange}
                  />
                </Button>
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
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={loading}
              sx={{ borderRadius: 2, minWidth: 80, py: 1.2, fontWeight: 600 }}
            >
              {loading ? 'Gönderiliyor...' : 'Talep Oluştur'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={onClose}
              sx={{ borderRadius: 2, minWidth: 80, py: 1.2, fontWeight: 600 }}
            >
              İptal
            </Button>
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
      </Box>
    </Modal>
  );
}
