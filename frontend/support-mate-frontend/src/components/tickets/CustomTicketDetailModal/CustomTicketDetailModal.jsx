import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaTag, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTicketAlt,
  FaPaperclip,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const CustomTicketDetailModal = ({ 
  open, 
  onClose, 
  ticket, 
  i18nNamespace = 'ticketDetail',
  showChatButton = false,
  onChatClick = null
}) => {
  const { t, i18n } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Kullanıcı rolünü JWT'den al
  const getUserRole = () => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.roleName;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const userRole = getUserRole();
  const isUserRole = userRole === 'User';



  // Force re-render when language changes
  useEffect(() => {
    console.log('Modal i18n language changed to:', i18n.language);
    setForceUpdate(prev => prev + 1);
  }, [i18n.language]);

  // Additional effect to monitor language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language change detected, current language:', i18n.language);
      setForceUpdate(prev => prev + 1);
    };

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Force re-render when modal opens/closes
  useEffect(() => {
    if (open) {
      console.log('Modal opened, current language:', i18n.language);
      setForceUpdate(prev => prev + 1);
    }
  }, [open, i18n.language]);

  // Memoize translations to force re-render when language changes
  const translations = useMemo(() => ({
    modalTitle: t(`${i18nNamespace}.modalTitle`, i18n.language === 'tr' ? 'Ticket Detayları' : 'Ticket Details'),
    description: t(`${i18nNamespace}.description`, i18n.language === 'tr' ? 'Açıklama' : 'Description'),
    noDescription: t(`${i18nNamespace}.noDescription`, i18n.language === 'tr' ? 'Açıklama bulunmuyor.' : 'No description available.'),
    category: t(`${i18nNamespace}.category`, i18n.language === 'tr' ? 'Kategori' : 'Category'),
    customerInfo: t(`${i18nNamespace}.customerInfo`, i18n.language === 'tr' ? 'Müşteri Bilgileri' : 'Customer Information'),
    fullName: t(`${i18nNamespace}.fullName`, i18n.language === 'tr' ? 'Ad Soyad' : 'Full Name'),
    email: t(`${i18nNamespace}.email`, i18n.language === 'tr' ? 'E-posta' : 'Email'),
    phone: t(`${i18nNamespace}.phone`, i18n.language === 'tr' ? 'Telefon' : 'Phone'),
    supportAgent: t(`${i18nNamespace}.supportAgent`, i18n.language === 'tr' ? 'Destek Temsilcisi' : 'Support Agent'),
    timeInfo: t(`${i18nNamespace}.timeInfo`, i18n.language === 'tr' ? 'Zaman Bilgileri' : 'Time Information'),
    createdAt: t(`${i18nNamespace}.createdAt`, i18n.language === 'tr' ? 'Oluşturulma' : 'Created At'),
    closedAt: t(`${i18nNamespace}.closedAt`, i18n.language === 'tr' ? 'Kapanma' : 'Closed At'),
    deletedAt: t(`${i18nNamespace}.deletedAt`, i18n.language === 'tr' ? 'Silinme' : 'Deleted At'),
    attachments: t(`${i18nNamespace}.attachments`, i18n.language === 'tr' ? 'Ekler' : 'Attachments'),
    noAttachments: t(`${i18nNamespace}.noAttachments`, i18n.language === 'tr' ? 'Ek dosya bulunmuyor.' : 'No attachments available.'),
    ticketId: t(`${i18nNamespace}.ticketId`, i18n.language === 'tr' ? 'Ticket ID' : 'Ticket ID'),
    chat: t(`${i18nNamespace}.chat`, i18n.language === 'tr' ? 'Chat' : 'Chat'),
    close: t(`${i18nNamespace}.close`, i18n.language === 'tr' ? 'Kapat' : 'Close'),
    categoryNotSpecified: t(`${i18nNamespace}.categoryNotSpecified`, i18n.language === 'tr' ? 'Kategori belirtilmemiş' : 'Category not specified'),
    unknown: t(`${i18nNamespace}.unknown`, i18n.language === 'tr' ? 'Bilinmeyen' : 'Unknown'),
    productNotSpecified: t(`${i18nNamespace}.productNotSpecified`, i18n.language === 'tr' ? 'Ürün belirtilmemiş' : 'Product not specified'),
    product: t(`${i18nNamespace}.product`, i18n.language === 'tr' ? 'Ürün' : 'Product')
  }), [t, i18n.language, i18nNamespace]);

  const modalKey = `modal-${i18n.language}-${forceUpdate}-${open ? 'open' : 'closed'}-${Date.now()}`;

  if (!open) return null;
  if (!ticket) return null;

  const getCategoryName = (category) => {
    if (!category) return translations.categoryNotSpecified;
    
    if (category.data) {
      return i18n.language === 'tr'
        ? category.data.category_name_tr || category.data.category_name_en || category.data.name || translations.unknown
        : category.data.category_name_en || category.data.category_name_tr || category.data.name || translations.unknown;
    }
    
    return i18n.language === 'tr'
      ? category.category_name_tr || category.category_name_en || category.name || translations.unknown
      : category.category_name_en || category.category_name_tr || category.name || translations.unknown;
  };

  const getProductName = (product) => {
    if (!product) return translations.productNotSpecified || 'Ürün belirtilmemiş';
    
    if (product.data) {
      return i18n.language === 'tr'
        ? product.data.product_name_tr || product.data.product_name_en || product.data.name || translations.unknown
        : product.data.product_name_en || product.data.product_name_tr || product.data.name || translations.unknown;
    }
    
    return i18n.language === 'tr'
      ? product.product_name_tr || product.product_name_en || product.name || translations.unknown
      : product.product_name_en || product.product_name_tr || product.name || translations.unknown;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN':
        return i18n.language === 'tr' ? 'Açık' : 'Open';
      case 'IN_REVIEW':
        return i18n.language === 'tr' ? 'İncelemede' : 'In Review';
      case 'CLOSED':
        return i18n.language === 'tr' ? 'Kapalı' : 'Closed';
      case 'DELETED':
        return i18n.language === 'tr' ? 'Silinmiş' : 'Deleted';
      default:
        return status;
    }
  };

  // Status renk belirleme
  const getStatusConfig = (status) => {
    switch (status) {
      case 'OPEN':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'IN_REVIEW':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'CLOSED':
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
      case 'DELETED':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const handleFileDownload = (file) => {
    const fullUrl = `${BASE_URL}/${file.url}`;
    console.log('Downloading file:', fullUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const statusConfig = getStatusConfig(ticket?.status);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[600px] max-w-6xl w-full relative max-h-[75vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-3xl font-bold transition-colors duration-200 z-10"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>

        {ticket ? (
          <>
            {/* Header */}
            <div className="mb-8 pt-4">
              <div className="text-3xl font-bold text-gray-800 mb-3 pr-12">{ticket.title}</div>
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                  <FaTag className="w-4 h-4" />
                  {getStatusText(ticket.status)}
                </div>
              </div>
            </div>

            {/* Description */}
            {ticket.description && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-500" />
                  {translations.description}
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">{ticket.description}</p>
              </div>
            )}

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  {translations.customerInfo}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">{translations.fullName}:</span>
                    <span className="text-blue-900 font-medium">
                      {ticket.customer?.firstName} {ticket.customer?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">{translations.email}:</span>
                    <span className="text-blue-900 font-medium">{ticket.customer?.email}</span>
                  </div>
                  {ticket.customer?.phoneNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">{translations.phone}:</span>
                      <span className="text-blue-900 font-medium">{ticket.customer.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Info */}
              {ticket.agent && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <FaUser className="text-green-600" />
                    {translations.supportAgent}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">{translations.fullName}:</span>
                      <span className="text-green-900 font-medium">
                        {ticket.agent.firstName} {ticket.agent.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">{translations.email}:</span>
                      <span className="text-green-900 font-medium">{ticket.agent.email}</span>
                    </div>
                    {ticket.agent.phoneNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700">{translations.phone}:</span>
                        <span className="text-green-900 font-medium">{ticket.agent.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <FaClock className="text-purple-600" />
                  {translations.createdAt}
                </h3>
                <p className="text-purple-900 font-medium">
                  {new Date(ticket.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>

              {/* Category */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
                <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <FaTag className="text-orange-600" />
                  {translations.category}
                </h3>
                <p className="text-orange-900 font-medium">
                  {getCategoryName(ticket.category)}
                </p>
              </div>

              {/* Product */}
              {ticket.product && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <FaTag className="text-purple-600" />
                    {translations.product || 'Ürün'}
                  </h3>
                  <p className="text-purple-900 font-medium">
                    {getProductName(ticket.product)}
                  </p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{translations.ticketId}:</span>
                <span className="font-mono text-gray-900">{ticket.id}</span>
              </div>
              {ticket.closedAt && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{translations.closedAt}:</span>
                  <span className="text-gray-900">{new Date(ticket.closedAt).toLocaleString('tr-TR')}</span>
                </div>
              )}
              {ticket.deletedAt && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{translations.deletedAt}:</span>
                  <span className="text-red-600">{new Date(ticket.deletedAt).toLocaleString('tr-TR')}</span>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <FaPaperclip className="text-indigo-600" />
                {translations.attachments} 
                {ticket.attachments && ticket.attachments.length > 0 ? ` (${ticket.attachments.length})` : ''}
              </h3>
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="space-y-2">
                  {ticket.attachments.map((file, index) => (
                    <div key={index} className="flex items-center bg-white rounded px-3 py-2 border border-indigo-200">
                      <FaPaperclip className="text-indigo-400 mr-2 flex-shrink-0" />
                      <button
                        className="text-indigo-700 underline hover:text-indigo-900 truncate flex-1 text-left"
                        onClick={() => handleFileDownload(file)}
                        title={file.name}
                      >
                        {file.name}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-indigo-600 italic">
                  {translations.noAttachments}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {translations.ticketNotFound || 'Ticket Bulunamadı'}
            </h3>
            <p className="text-gray-500">
              {translations.ticketNotFoundDescription || 'Aradığınız ticket bulunamadı veya silinmiş olabilir.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {showChatButton && onChatClick && !isUserRole && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChatClick(ticket);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {translations.chat}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            {translations.close}
          </button>
        </div>
      </div>
    </div>


  );
};

export default CustomTicketDetailModal; 