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

const CreateTicket = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    files: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      setForm((prev) => ({
        ...prev,
        files: files ? Array.from(files) : [],
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
    if (!form.title || !form.description || !form.category) {
      setError(t('pages.createTicket.validationError'));
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
        setChatOpen(true);
        setSuccess(t('pages.createTicket.success'));
        setForm({ title: "", description: "", category: "", files: [] });
      } else {
        setError(response.message || t('pages.createTicket.error'));
      }
    } catch (err) {
      setError(err?.response?.data?.message || t('pages.createTicket.error'));
    }
  };

  return (
    chatOpen ? (
      <ChatDialog ticket={ticketData} onBack={() => setChatOpen(false)} />
    ) : (
      <Box maxWidth={500} mx="auto" mt={10} p={4} bgcolor="#fff" borderRadius={2} boxShadow={3}>
        <Typography variant="h5" fontWeight={700} mb={3}>{t('pages.createTicket.title')}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label={t('pages.createTicket.form.title')}
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label={t('pages.createTicket.form.description')}
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            select
            label={t('pages.createTicket.form.category')}
            name="category"
            value={form.category}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          >
            <MenuItem value="">{t('pages.createTicket.form.select')}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {t(cat.labelKey)}
              </MenuItem>
            ))}
          </TextField>
          <Box mt={2} mb={2}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 1 }}
            >
              {t('pages.createTicket.form.file')}
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
                      <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(1)} KB</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleRemoveFile(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ py: 1.2, fontWeight: 600 }}
          >
            {t('pages.createTicket.form.submit')}
          </Button>
        </form>
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