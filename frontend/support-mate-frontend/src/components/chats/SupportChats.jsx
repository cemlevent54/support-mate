import React, { useState, useEffect, useRef } from 'react';
import TaskCreateModal from './TaskCreateModal';
import CreateTask from '../../pages/support/CreateTask';
import CreateSupportTicket from '../../pages/support/CreateSupportTicket';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { MdSend } from 'react-icons/md';
import { listMessagesByChatId, sendMessage } from '../../api/messagesApi';
import axiosInstance from '../../api/axiosInstance';
import { getUserIdFromJWT } from '../../utils/jwt';
import { useTranslation } from 'react-i18next';
import socket from '../../socket/socket';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ArchiveIcon from '@mui/icons-material/Archive';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';

const BASE_URL = "http://localhost:9000" + "/api/tickets";

// CustomerId bulma fonksiyonu
function getCustomerIdFromParticipants(participants, agentId) {
  if (!Array.isArray(participants)) return null;
  const customer = participants.find(p => p.userId !== agentId);
  return customer ? customer.userId : null;
}

export default function SupportChats({ chat, myUserId, onChatCreated }) {
  const [messages, setMessages] = useState(chat?.messages || []);
  const [input, setInput] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();
  const userId = getUserIdFromJWT();
  const ticketId = chat?.ticketId || chat?.ticket?.id;

  // Dosya türünü belirleme fonksiyonu
  const getFileType = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return 'other';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return 'other';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (documentExtensions.includes(extension)) return 'document';
    if (archiveExtensions.includes(extension)) return 'archive';
    return 'other';
  };

  // Dosya URL'sini oluşturma fonksiyonu
  const getFileUrl = (file) => {
    if (!file || !file.url) {
      return '';
    }
    return `/${file.url}`;
  };

  // Dosya önizleme fonksiyonu
  const handleFilePreview = (file) => {
    if (!file || !file.name) {
      console.warn('Geçersiz dosya:', file);
      return;
    }
    
    // Eğer aynı dosya zaten açıksa, modal'ı kapat
    if (previewOpen && previewFile?.name === file.name) {
      handleClosePreview();
      return;
    }
    
    const fileType = getFileType(file.name);
    const fileUrl = getFileUrl(file);
    
    if (fileType === 'image' || fileType === 'video' || fileType === 'audio' || fileType === 'document') {
      setPreviewFile({ name: file.name, type: fileType, url: fileUrl });
      setPreviewOpen(true);
    } else {
      // Diğer dosyalar için indirme
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Dosya ikonu bileşeni
  const FileIcon = ({ file }) => {
    if (!file || !file.name) {
      return <DescriptionIcon fontSize="small" />;
    }
    
    const fileType = getFileType(file.name);
    
    switch (fileType) {
      case 'image':
        return <ImageIcon fontSize="small" />;
      case 'video':
        return <VideoFileIcon fontSize="small" />;
      case 'audio':
        return <AudioFileIcon fontSize="small" />;
      case 'document':
        return file.name.toLowerCase().endsWith('.pdf') ? 
          <PictureAsPdfIcon fontSize="small" /> : 
          <DescriptionIcon fontSize="small" />;
      case 'archive':
        return <ArchiveIcon fontSize="small" />;
      default:
        return <DescriptionIcon fontSize="small" />;
    }
  };

  useEffect(() => {
    setMessages(chat?.messages || []);
    setChatId(chat?._id || chat?.chatId || chat?.id || null);
  }, [chat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    console.log('[SupportChats][SOCKET][JOIN_ROOM] Odaya katılıyor:', { chatId, userId });
    socket.emit('join_room', { chatId, userId, userRole: 'Support' });
    return () => {
      console.log('[SupportChats][SOCKET][LEAVE_ROOM] Odadan ayrılıyor:', { chatId, userId });
      socket.emit('leave_room', { chatId, userId });
    };
  }, [chatId, userId]);

  useEffect(() => {
    if (!chatId) return;
    const handleNewMessage = (data) => {
      console.log('[SOCKET][AGENT] receive_chat_message:', data, 'chatId:', chatId, 'userId:', userId);
      if (data.chatId === chatId && data.userId !== userId) {
        setMessages(prev => [
          ...prev,
          {
            senderId: data.userId,
            text: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.timestamp || new Date().toISOString()
          }
        ]);
      }
    };
    socket.on('receive_chat_message', handleNewMessage);
    return () => socket.off('receive_chat_message', handleNewMessage);
  }, [chatId, userId]);

  useEffect(() => {
    const handleTyping = (data) => {
      console.log('[DEBUG][SupportChats][TYPING] Event geldi:', data, 'chatId:', chatId, 'userId:', userId);
      if (data && data.chatId === chatId && data.userId !== userId) {
        setIsTyping(true);
      }
    };
    const handleStopTyping = (data) => {
      if (data && data.chatId === chatId && data.userId !== userId) {
        setIsTyping(false);
      }
    };
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [chatId, userId]);

  useEffect(() => {
    const handleUserJoined = (payload) => {
      if (payload.chatId === chatId && payload.userId !== userId) {
        // window.alert('Karşı taraf odaya katıldı!'); // kaldırıldı
      }
    };
    const handleUserOnline = () => {};
    socket.on('user_joined', handleUserJoined);
    socket.on('user_online', handleUserOnline);
    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('user_online', handleUserOnline);
    };
  }, [chatId, userId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!chatId) return;
    let receiverId = null;
    if (messages && messages.length > 0 && messages[0].senderId && messages[0].senderId !== userId) {
      receiverId = messages[0].senderId;
    } else if (messages && messages.length > 0 && messages[0].customerId) {
      receiverId = messages[0].customerId;
    }
    if (e.target.value) {
      socket.emit('typing', { chatId, userId, receiverId, isTyping: true });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { chatId, userId, receiverId });
      }, 1000);
    } else {
      socket.emit('stop_typing', { chatId, userId, receiverId });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;
    
    // Optimistic update - mesajı hemen ekle
    const newMessage = {
      text: input,
      senderId: userId,
      senderRole: 'Support',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Socket'e gönder
    socket.emit('send_message', { chatId, userId, message: input });
    
    // API'ye gönder
    try {
      await sendMessage({ chatId, userId, text: input });
    } catch (error) {
      // Hata durumunda mesajı geri al
      setMessages(prev => prev.filter(msg => msg !== newMessage));
      console.error('Mesaj gönderilemedi:', error);
    }
    
    setInput("");
  };

  const openTaskModal = () => setCreateTaskModalOpen(true);
  const closeTaskModal = () => setCreateTaskModalOpen(false);
  const openTicketModal = () => setCreateTicketModalOpen(true);
  const closeTicketModal = () => setCreateTicketModalOpen(false);
  
  // Modal kapatma fonksiyonları
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // LOG EKLEMEK İÇİN
  console.log('[SupportChats][LOG] chat:', chat);
  console.log('[SupportChats][LOG] chatId:', chatId);
  console.log('[SupportChats][LOG] chat.messages:', chat?.messages);
  console.log('[SupportChats][LOG] ticketId:', ticketId);
  console.log('[SupportChats][LOG] Create Ticket butonu görünecek mi?', !ticketId);

  return (
    <Box display="flex" height="100%" boxShadow={2} borderRadius={2} bgcolor="#fff" overflow="hidden">
      <Box flex={1} display="flex" flexDirection="column" justifyContent="flex-end" height="100%">
        <Box flex={1} p={3} overflow="auto" display="flex" flexDirection="column">
          {chatId ? (
            loading ? (
              <div>Yükleniyor...</div>
            ) : (
              (messages || []).map((msg, idx) => (
                <Box
                  key={msg._id || msg.id || idx}
                  alignSelf={msg.senderId === myUserId ? 'flex-end' : 'flex-start'}
                  bgcolor={msg.senderId === myUserId ? '#e3f2fd' : '#f1f1f1'}
                  color="#222"
                  px={2} py={1.5} mb={1}
                  borderRadius={3}
                  boxShadow={1}
                  maxWidth="70%"
                >
                  {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                      {msg.attachments.map((file, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleFilePreview(file)}
                            sx={{ p: 0.5 }}
                          >
                            <FileIcon file={file} />
                          </IconButton>
                          <span style={{ fontSize: '12px', color: '#666' }}>{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{ fontSize: 12, color: '#888', textAlign: 'right', marginTop: 4 }}>
                    {(() => {
                      const timestamp = msg.timestamp || msg.createdAt;
                      if (!timestamp) return '';
                      let date;
                      if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
                        date = new Date(timestamp + 'Z');
                      } else {
                        date = new Date(timestamp);
                      }
                      return date.toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'Europe/Istanbul'
                      });
                    })()}
                  </div>
                </Box>
              ))
            )
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <CircularProgress />
            </Box>
          )}
          <div ref={messagesEndRef} />
          {isTyping && (
            <Box fontSize={14} color="#888" mb={1}>
              {t('chatArea.userTyping')}
            </Box>
          )}
        </Box>
        <Box p={2} borderTop="1px solid #eee" bgcolor="#fafafa">
          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={input}
              onChange={handleInputChange}
              onBlur={() => {
                if (!chatId) return;
                socket.emit('stop_typing', { chatId, userId });
              }}
              placeholder={t('chatArea.placeholder')}
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 22, padding: '10px 16px', fontSize: 16, outline: 'none', background: '#fff', marginRight: 8 }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: '50%', minWidth: 0, width: 44, height: 44, p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdSend size={22} />
            </Button>
            <Button variant="outlined" color="primary" sx={{ height: 44, borderRadius: 22, fontWeight: 600, px: 2.5 }} onClick={openTaskModal}>
              {t('chatArea.createTask')}
            </Button>
            {(!ticketId) && (
              <Button variant="outlined" color="secondary" sx={{ height: 44, borderRadius: 22, fontWeight: 600, px: 2.5 }} onClick={openTicketModal}>
                {t('chatArea.createTicket')}
              </Button>
            )}
          </form>
        </Box>
      </Box>
      <CreateTask open={createTaskModalOpen} onClose={closeTaskModal} ticketId={ticketId} />
      <CreateSupportTicket open={createTicketModalOpen} onClose={closeTicketModal} chat={chat} />
      <Modal
        open={previewOpen}
        onClose={handleClosePreview}
        disableEscapeKeyDown={true}
        disableBackdropClick={true}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'relative',
            width: '90%',
            maxWidth: '900px',
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 3,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: 24,
            outline: 'none'
          }}
        >
          <IconButton
            onClick={handleClosePreview}
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              bgcolor: 'rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            id="modal-title" 
            variant="h6" 
            component="h2"
            sx={{ 
              pr: 4, 
              mb: 2, 
              wordBreak: 'break-word',
              color: 'text.primary'
            }}
          >
            {previewFile?.name}
          </Typography>
          {previewFile?.type === 'image' && (
            <img src={previewFile.url || getFileUrl(previewFile.name)} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '80vh', marginTop: 20 }} />
          )}
          {previewFile?.type === 'video' && (
            <video src={previewFile.url || getFileUrl(previewFile.name)} controls style={{ maxWidth: '100%', maxHeight: '80vh', marginTop: 20 }} />
          )}
          {previewFile?.type === 'audio' && (
            <audio src={previewFile.url || getFileUrl(previewFile.name)} controls style={{ maxWidth: '100%', marginTop: 20 }} />
          )}
          {previewFile?.type === 'document' && (
            <Box sx={{ mt: 2 }}>
              {previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <Box sx={{ width: '100%', minHeight: '500px' }}>
                  {/* PDF Görüntüleme Seçenekleri */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => window.open(previewFile.url || getFileUrl(previewFile.name), '_blank')}
                      sx={{ minWidth: 120 }}
                    >
                      {t('chatArea.preview')}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      component="a"
                      href={previewFile.url || getFileUrl(previewFile.name)}
                      download
                      sx={{ minWidth: 120 }}
                    >
                      {t('chatArea.download')}
                    </Button>
                  </Box>
                  {/* PDF Önizleme */}
                  <Box sx={{ 
                    width: '100%', 
                    height: '500px', 
                    border: '1px solid #ddd', 
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <iframe
                      src={`${previewFile.url || getFileUrl(previewFile.name)}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                      title={previewFile.name}
                      width="100%"
                      height="100%"
                      style={{ 
                        border: 'none', 
                        display: 'block'
                      }}
                      onLoad={() => console.log('PDF yüklendi:', previewFile.name)}
                      onError={(e) => {
                        console.error('PDF yüklenemedi:', e);
                        const container = e.target.parentNode;
                        container.innerHTML = `
                          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
                            <span style="margin-bottom: 16px; color: #666; font-size: 18px; font-weight: 600;">PDF dosyası tarayıcıda görüntülenemiyor</span>
                            <span style="margin-bottom: 20px; color: #888; font-size: 14px;">Dosyayı görüntülemek için yukarıdaki \"Yeni Sekmede Aç\" butonunu kullanın veya indirin.</span>
                            <a 
                              href="${previewFile.url || getFileUrl(previewFile.name)}" 
                              download
                              style="text-decoration: none; display: inline-block; margin-top: 12px; padding: 8px 16px; background: #1976d2; color: #fff; border-radius: 4px; font-weight: 600;"
                            >
                              ${previewFile.name} dosyasını indir
                            </a>
                          </div>
                        `;
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Bu dosya türü tarayıcıda önizlenemez. İndirmek için aşağıdaki bağlantıyı kullanın:
                  </Typography>
                  <Button 
                    variant="contained" 
                    component="a" 
                    href={previewFile.url || getFileUrl(previewFile.name)} 
                    download
                    startIcon={<DownloadIcon />}
                    sx={{ textDecoration: 'none' }}
                  >
                    {previewFile.name} dosyasını indir
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
} 