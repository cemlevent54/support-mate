import React, { useState, useRef, useEffect } from "react";
import { MdSend } from "react-icons/md";
import "./ChatDialog.css";
import { useTranslation } from 'react-i18next';

const ChatDialog = ({ ticket, onBack }) => {
  const { t } = useTranslation();
  // ticket: { title, description, category, files: [{name, url, type}], ... }
  const [detailOpen, setDetailOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // {url, name, type}

  useEffect(() => {
    // İlk mesaj olarak talep bilgisi
    if (ticket) {
      setMessages([
        {
          type: 'ticket',
          title: ticket.title,
          description: ticket.description,
          category: ticket.categoryLabel || ticket.category,
          files: ticket.files || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [ticket]);

  useEffect(() => {
    // Her mesaj eklendiğinde en sona scroll
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        text: input,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInput("");
  };

  const handleFilePreview = (file) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setPreviewFile(file);
      setPreviewOpen(true);
    } else {
      // Diğer dosyalar için indirme
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!ticket) return null;

  return (
    <div className="chat-dialog-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => {
          // Sağda: ticket ve user, Solda: admin (ileride eklenirse)
          if (msg.type === 'ticket' || msg.type === 'user') {
            return (
              <div key={idx} className={`chat-bubble chat-bubble-right`}>
                {msg.type === 'ticket' ? (
                  <>
                    <div className="chat-title">{msg.title}</div>
                    <div className="chat-desc">{msg.description}</div>
                    <button className="chat-detail-btn" onClick={() => setDetailOpen(v => !v)}>
                      {detailOpen ? t('chatDialog.hideDetail') : t('chatDialog.detail')}
                    </button>
                    {detailOpen && (
                      <div className="chat-detail">
                        <div><b>{t('chatDialog.category')}:</b> {msg.category}</div>
                        {msg.files && msg.files.length > 0 && (
                          <div className="chat-files">
                            <b>{t('chatDialog.uploadedFiles')}:</b>
                            <ul>
                              {msg.files.map((file, fidx) => (
                                <li key={fidx}>
                                  <button
                                    type="button"
                                    className="chat-file-btn"
                                    onClick={() => handleFilePreview(file)}
                                  >
                                    {file.name}
                                  </button>
                                  <span className="chat-file-type">{file.type}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="chat-time">{msg.time}</div>
                  </>
                ) : (
                  <>
                    <div className="chat-text">{msg.text}</div>
                    <div className="chat-time">{msg.time}</div>
                  </>
                )}
              </div>
            );
          } else {
            // admin/karşı taraf mesajı (ileride)
            return (
              <div key={idx} className={`chat-bubble chat-bubble-left`}>
                <div className="chat-text">{msg.text}</div>
                <div className="chat-time">{msg.time}</div>
              </div>
            );
          }
        })}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('chatDialog.placeholder')}
          autoComplete="off"
        />
        <button className="chat-send-btn" type="submit"><MdSend size={22} /></button>
      </form>
      {previewOpen && previewFile && (
        <div className="chat-preview-modal" onClick={() => setPreviewOpen(false)}>
          <div className="chat-preview-content" onClick={e => e.stopPropagation()}>
            {previewFile.type.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            ) : previewFile.type === 'application/pdf' ? (
              <iframe src={previewFile.url} title={previewFile.name} width="100%" height="600px" style={{ border: 'none' }} />
            ) : null}
            <div className="chat-preview-name">{previewFile.name}</div>
            <button className="chat-preview-close" onClick={() => setPreviewOpen(false)}>{t('chatDialog.close')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDialog; 