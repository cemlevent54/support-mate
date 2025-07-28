import React from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import { FaComments, FaUser, FaUserTie, FaClock, FaTimes, FaPaperPlane, FaInfoCircle } from 'react-icons/fa';

const ChatPanel = ({ 
  chatTicket, 
  messages, 
  input, 
  sending, 
  someoneTyping, 
  messagesEndRef, 
  onClose, 
  onSend, 
  onInputChange,
  isModal = false,
  receiverId,
  myUserId
}) => {
  const { t, i18n } = useTranslation();
  
  // Debug için console.log
  console.log('ChatPanel - myUserId:', myUserId);
  console.log('ChatPanel - chatTicket:', chatTicket);
  console.log('ChatPanel - assignedAgentId:', chatTicket?.assignedAgentId);
  
  // Mesaj gönderme işlemi
  const handleSend = () => {
    if (onSend) onSend();
  };

  const formatDate = (timestamp, createdAt) => {
    if (timestamp) {
      return new Date(timestamp).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
    }
    if (createdAt) {
      return new Date(createdAt).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
    }
    return '';
  };

  const getSenderLabel = (senderRole, senderId) => {
    // Eğer senderRole undefined ise, senderId'ye göre rol belirle
    if (!senderRole) {
      if (senderId === myUserId) {
        // Benim mesajım - JWT'den rolümü al
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            senderRole = decoded.roleName || 'User';
          } catch (error) {
            console.error('JWT decode error:', error);
            senderRole = 'User';
          }
        } else {
          senderRole = 'User';
        }
      } else {
        // Karşı tarafın mesajı - assignedAgentId ile karşılaştır
        if (senderId === chatTicket?.assignedAgentId) {
          senderRole = 'Customer Supporter';
        } else {
          senderRole = 'User';
        }
      }
    }

    if (i18n.language === 'tr') {
      switch (senderRole) {
        case 'User':
          return 'Müşteri';
        case 'Customer Supporter':
          return 'Müşteri Temsilcisi';
        case 'Admin':
          return 'Yönetici';
        case 'Leader':
          return 'Lider';
        case 'Employee':
          return 'Çalışan';
        default:
          return 'Destek Temsilcisi';
      }
    } else {
      switch (senderRole) {
        case 'User':
          return 'Customer';
        case 'Customer Supporter':
          return 'Customer Supporter';
        case 'Admin':
          return 'Admin';
        case 'Leader':
          return 'Leader';
        case 'Employee':
          return 'Employee';
        default:
          return 'Support Representative';
      }
    }
  };

  const getSenderIcon = (senderRole, senderId) => {
    // Eğer senderRole undefined ise, senderId'ye göre rol belirle
    if (!senderRole) {
      if (senderId === myUserId) {
        // Benim mesajım - JWT'den rolümü al
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            senderRole = decoded.roleName || 'User';
          } catch (error) {
            console.error('JWT decode error:', error);
            senderRole = 'User';
          }
        } else {
          senderRole = 'User';
        }
      } else {
        // Karşı tarafın mesajı - assignedAgentId ile karşılaştır
        if (senderId === chatTicket?.assignedAgentId) {
          senderRole = 'Customer Supporter';
        } else {
          senderRole = 'User';
        }
      }
    }

    switch (senderRole) {
      case 'User':
        return FaUser;
      case 'Customer Supporter':
      case 'Admin':
      case 'Leader':
      case 'Employee':
      default:
        return FaUserTie;
    }
  };

  const getMessageStyle = (senderRole, senderId) => {
    // Eğer senderRole undefined ise, senderId'ye göre rol belirle
    if (!senderRole) {
      if (senderId === myUserId) {
        // Benim mesajım - JWT'den rolümü al
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            senderRole = decoded.roleName || 'User';
          } catch (error) {
            console.error('JWT decode error:', error);
            senderRole = 'User';
          }
        } else {
          senderRole = 'User';
        }
      } else {
        // Karşı tarafın mesajı - assignedAgentId ile karşılaştır
        if (senderId === chatTicket?.assignedAgentId) {
          senderRole = 'Customer Supporter';
        } else {
          senderRole = 'User';
        }
      }
    }

    if (senderRole === 'User') {
      return {
        backgroundColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        labelColor: 'text-blue-700',
        timeColor: 'text-blue-500'
      };
    } else {
      return {
        backgroundColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        labelColor: 'text-green-700',
        timeColor: 'text-green-500'
      };
    }
  };

  // 1. Yeni chat başlatma (hiç mesaj yok)
  if (!messages || messages.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-2xl p-4 min-w-[400px] max-w-3xl w-full relative ${isModal ? 'max-h-[85vh]' : 'max-h-[70vh]'} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <FaComments className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t('chatPanel.title', { title: chatTicket?.title })}
              </h2>
              <p className="text-xs text-gray-500">
                0 {t('chat.messageCount', 'mesaj')}
              </p>
            </div>
          </div>
          <button
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={onClose}
            aria-label="Kapat"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Agent durumu bildirimi */}
        {chatTicket && !chatTicket.assignedAgentId && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaInfoCircle className="text-blue-500 text-sm" />
              <span className="text-sm text-blue-700">
                {t('chatPanel.noAgentAssigned')}
              </span>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <FaComments className="text-gray-400 text-xl" />
            </div>
            <h3 className="text-base font-semibold text-gray-600 mb-1">
              {t('chat.noMessagesTitle', 'Henüz Mesaj Yok')}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {t('chatPanel.noMessages')}
            </p>
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <input
            type="text"
            placeholder={t('chatPanel.placeholder')}
            value={input}
            onChange={onInputChange}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            disabled={sending}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={handleSend} 
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaPaperPlane className="text-xs" />
            {t('chatPanel.send')}
          </button>
        </div>
      </div>
    );
  }

  // 2. Var olan chat (mesajlar varsa)
  return (
    <div className={`bg-white rounded-xl shadow-2xl p-4 min-w-[400px] max-w-3xl w-full relative ${isModal ? 'max-h-[85vh]' : 'max-h-[70vh]'} overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <FaComments className="text-white text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {t('chatPanel.title', { title: chatTicket?.title })}
            </h2>
            <p className="text-xs text-gray-500">
              {messages.length} {t('chat.messageCount', 'mesaj')}
            </p>
          </div>
        </div>
        <button
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
          onClick={onClose}
          aria-label="Kapat"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>

      {/* Agent durumu bildirimi */}
      {chatTicket && !chatTicket.assignedAgentId && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FaInfoCircle className="text-blue-500 text-sm" />
            <span className="text-sm text-blue-700">
              {t('chatPanel.noAgentAssigned')}
            </span>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
                {messages
          .sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0);
            const timeB = new Date(b.timestamp || b.createdAt || 0);
            return timeA - timeB;
          })
          .map((msg, idx) => {
            // Basit kontrol: senderId ile myUserId karşılaştır
            const isMyMessage = msg.senderId === myUserId;
            
                           const messageStyle = getMessageStyle(msg.senderRole, msg.senderId);
               const SenderIcon = getSenderIcon(msg.senderRole, msg.senderId);
            
            // Debug için console.log
            console.log('Message debug:', {
              msgId: msg._id,
              senderId: msg.senderId,
              senderRole: msg.senderRole,
              myUserId: myUserId,
              isMyMessage: isMyMessage,
              text: msg.text,
              senderLabel: getSenderLabel(msg.senderRole, msg.senderId)
            });

          return (
            <div
              key={msg._id || idx}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                <div className={`p-2.5 rounded-lg border ${messageStyle.backgroundColor} ${messageStyle.borderColor} shadow-sm`}>
                  {/* Message Header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`p-1 rounded-full ${isMyMessage ? 'bg-blue-100' : 'bg-green-100'}`}>
                      <SenderIcon className={`w-2.5 h-2.5 ${isMyMessage ? 'text-blue-600' : 'text-green-600'}`} />
                    </div>
                                             <span className={`text-xs font-medium ${messageStyle.labelColor}`}>
                           {getSenderLabel(msg.senderRole, msg.senderId)}
                         </span>
                  </div>
                  
                  {/* Message Content */}
                  <div className={`text-sm leading-relaxed ${messageStyle.textColor} mb-1.5`}>
                    {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                  </div>
                  
                  {/* Message Time */}
                  <div className={`text-xs ${messageStyle.timeColor} text-right flex items-center justify-end gap-1`}>
                    <FaClock className="w-2.5 h-2.5" />
                    {formatDate(msg.timestamp, msg.createdAt)}
                  </div>
                </div>
              </div>
              
              {/* Spacer for alignment */}
              <div className={`flex-1 ${isMyMessage ? 'order-1' : 'order-2'}`}></div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        {someoneTyping && (
          <div className="text-blue-500 text-xs mt-1 mb-0.5">
            {t('chatPanel.typing')}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          type="text"
          placeholder={t('chatPanel.placeholder')}
          value={input}
          onChange={onInputChange}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={sending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button 
          onClick={handleSend} 
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FaPaperPlane className="text-xs" />
          {t('chatPanel.send')}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel; 