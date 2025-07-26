import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaComments, FaUser, FaUserTie, FaClock, FaTimes } from 'react-icons/fa';

const CustomChatMessagesModal = ({ 
  open, 
  onClose, 
  messages = [], 
  title = 'Chat',
  i18nNamespace = 'common',
  emptyMessage = 'Henüz mesaj yok.',
  closeButtonText = 'Kapat'
}) => {
  const { t, i18n } = useTranslation();

  if (!open) return null;

  const formatDate = (timestamp, createdAt) => {
    if (timestamp) {
      return new Date(timestamp).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
    }
    if (createdAt) {
      return new Date(createdAt).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
    }
    return '';
  };

  const getSenderLabel = (senderRole) => {
    if (i18n.language === 'tr') {
      return senderRole === 'User' ? 'Müşteri' : 'Destek Temsilcisi';
    }
    return senderRole === 'User' ? 'Customer' : 'Support Representative';
  };

  const getSenderIcon = (senderRole) => {
    return senderRole === 'User' ? FaUser : FaUserTie;
  };

  const getMessageStyle = (senderRole) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-4 min-w-[400px] max-w-3xl w-full relative max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <FaComments className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t(`${i18nNamespace}.chatModalTitle`, title)}
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

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
          {messages && messages.length > 0 ? (
            messages.map((msg, idx) => {
              const messageStyle = getMessageStyle(msg.senderRole);
              const SenderIcon = getSenderIcon(msg.senderRole);
              const isUser = msg.senderRole === 'User';

              return (
                <div
                  key={msg._id || idx}
                  className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[75%] ${isUser ? 'order-1' : 'order-2'}`}>
                    <div className={`p-2.5 rounded-lg border ${messageStyle.backgroundColor} ${messageStyle.borderColor} shadow-sm`}>
                      {/* Message Header */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className={`p-1 rounded-full ${isUser ? 'bg-blue-100' : 'bg-green-100'}`}>
                          <SenderIcon className={`w-2.5 h-2.5 ${isUser ? 'text-blue-600' : 'text-green-600'}`} />
                        </div>
                        <span className={`text-xs font-medium ${messageStyle.labelColor}`}>
                          {getSenderLabel(msg.senderRole)}
                        </span>
                      </div>
                      
                      {/* Message Content */}
                      <div className={`text-sm leading-relaxed ${messageStyle.textColor} mb-1.5`}>
                        {msg.text}
                      </div>
                      
                      {/* Message Time */}
                      <div className={`text-xs ${messageStyle.timeColor} text-right flex items-center justify-end gap-1`}>
                        <FaClock className="w-2.5 h-2.5" />
                        {formatDate(msg.timestamp, msg.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Spacer for alignment */}
                  <div className={`flex-1 ${isUser ? 'order-2' : 'order-1'}`}></div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-3">
                <FaComments className="text-gray-400 text-xl" />
              </div>
              <h3 className="text-base font-semibold text-gray-600 mb-1">
                {t('chat.noMessagesTitle', 'Henüz Mesaj Yok')}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {t(`${i18nNamespace}.noMessages`, emptyMessage)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {t(`${i18nNamespace}.close`, closeButtonText)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomChatMessagesModal; 