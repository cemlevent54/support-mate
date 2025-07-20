import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import ChatDialog from './ChatDialog';
import { createTicket } from '../api/ticketApi';

// Örnek kategori verisi
const categories = [
  { value: "software", labelKey: "pages.createTicket.categories.software" },
  { value: "hardware", labelKey: "pages.createTicket.categories.hardware" },
  { value: "network", labelKey: "pages.createTicket.categories.network" },
  { value: "other", labelKey: "pages.createTicket.categories.other" },
];

const CreateTicket = ({ onClose, isModal = false, onTicketCreated = null }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    files: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("guest");
  const [previews, setPreviews] = useState([]); // [{url, name, type, size, file}]
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null); // {url, name, type, size}
  const [chatOpen, setChatOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
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
    // Dosya önizlemeleri oluştur
    if (form.files && form.files.length > 0) {
      const newPreviews = form.files.map(file => {
        return { url: URL.createObjectURL(file), name: file.name, type: file.type, size: file.size, file };
      });
      setPreviews(newPreviews);
      // Temizlik: component unmount olunca blob url'leri serbest bırak
      return () => {
        newPreviews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
      };
    } else {
      setPreviews([]);
    }
  }, [form.files]);

  // Sadece girişli ve User rolünde ise göster
  if (userRole !== "user") {
    return <Box mt={10}><Alert severity="error">{t('pages.createTicket.noPermission')}</Alert></Box>;
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'files') {
      // Dosya boyutu kontrolü (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
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
      
      setForm((prev) => ({
        ...prev,
        files: validFiles,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    if (!form.title || !form.description || !form.category) {
      setError(t('pages.createTicket.validationError'));
      setLoading(false);
      return;
    }
    
    try {
      // Dosya yükleme desteği için files alanı
      const ticketPayload = {
        title: form.title,
        description: form.description,
        category: form.category,
        files: form.files || []
      };
      const response = await createTicket(ticketPayload);
      
      if (response.success) {
        setTicketData(response.data);
        
        // assignedAgentId kontrolü
        if (response.data.assignedAgentId) {
        setSuccess(t('pages.createTicket.success'));
        } else {
          setSuccess(t('pages.createTicket.successNoAgent'));
        }
        
        setForm({ title: "", description: "", category: "", files: [] });
        
        // Modal modunda ise parent'a bilgi ver ve modal'ı hemen kapat
        if (isModal && onClose) {
          console.log('CreateTicket - Modal mode, calling onTicketCreated with:', response.data);
          if (onTicketCreated) {
            // Parent component'e ticket bilgisini gönder
            onTicketCreated(response.data);
          }
          // Modal'ı hemen kapat, chat paneli MyRequests sayfasında açılacak
          onClose();
        } else {
          // Standalone modda ChatDialog'a yönlendir
          setTimeout(() => {
            setChatOpen(true);
          }, 2000); // 2 saniye sonra chat ekranını aç
        }
      } else {
        setError(response.message || t('pages.createTicket.error'));
      }
    } catch (err) {
      console.error('CreateTicket Error:', err);
      
      // 401 hatası durumunda özel mesaj göster (login'e yönlendirme yok)
      if (err?.response?.status === 401) {
        setSuccess(t('pages.createTicket.successWithRelogin'));
        setForm({ title: "", description: "", category: "", files: [] });
        
        // Modal modunda ise modal'ı kapat
        if (isModal && onClose) {
          setTimeout(() => {
            onClose();
          }, 3000); // 3 saniye sonra kapat
        }
        
        // Login'e yönlendirme kaldırıldı - kullanıcı manuel olarak login olabilir
        return;
      }
      
      // Diğer hatalar için normal error mesajı
      setError(err?.response?.data?.message || t('pages.createTicket.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromChat = () => {
    setChatOpen(false);
    setTicketData(null);
    // Modal modunda ise modal'ı kapat
    if (isModal && onClose) {
      onClose();
    }
  };

  return (
    chatOpen ? (
      <ChatDialog ticket={ticketData} onBack={handleBackFromChat} />
    ) : (
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
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
        {/* Custom Title Input */}
        <div style={{ margin: '16px 0', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            {t('pages.createTicket.form.title')}
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder={t('pages.createTicket.form.title')}
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
            {t('pages.createTicket.form.description')}
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t('pages.createTicket.form.description')}
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

          
          {/* Custom Dropdown */}
          <div style={{ margin: '16px 0', width: '100%' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {t('pages.createTicket.form.category')}
            </label>
            <div style={{ position: 'relative' }}>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  appearance: 'none', // Native arrow gizler
                }}
                required
              >
                <option value="">{t('pages.createTicket.form.select')}</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
              {/* Custom Arrow */}
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
          <Box mt={2} mb={2}>
            <Button
              variant="contained"
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
              {loading ? t('pages.createTicket.form.submitting') : t('pages.createTicket.form.submit')}
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
    )
  );
};

export default CreateTicket; 