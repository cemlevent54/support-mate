import React from 'react';
import { FaUser, FaCalendarAlt, FaClock, FaTag, FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

export default function CustomTaskDetailsModal({ open, onClose, task, loading }) {
  const { t } = useTranslation();
  
  if (!open) return null;

  // Tarih formatlama fonksiyonu
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('tr-TR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Priority renk ve icon belirleme
  const getPriorityConfig = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: FaExclamationTriangle };
      case 'MEDIUM':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: FaInfoCircle };
      case 'LOW':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: FaCheckCircle };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: FaInfoCircle };
    }
  };

  // Status renk belirleme
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'IN_PROGRESS':
        return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'DONE':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'COMPLETED':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'CANCELLED':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'REJECTED':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'APPROVED':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const priorityConfig = getPriorityConfig(task?.priority);
  const statusConfig = getStatusConfig(task?.status);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors duration-200"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">{t('taskDetails.loading', 'Yükleniyor...')}</span>
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-800 mb-2">{task.title}</div>
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border}`}>
                  <PriorityIcon className="w-4 h-4" />
                  {task.priority}
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                  <FaTag className="w-4 h-4" />
                  {task.status}
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-500" />
                  {t('taskDetails.description', 'Açıklama')}
                </h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Task Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Assigned Employee */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  {t('taskDetails.assignedEmployee', 'Atanan Kişi')}
                </h3>
                <p className="text-blue-900 font-medium">
                  {task.assignedEmployee 
                    ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`
                    : t('taskDetails.notAssigned', 'Atanmamış')}
                </p>
              </div>

              {/* Created By */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <FaUser className="text-green-600" />
                  {t('taskDetails.createdBy', 'Oluşturan')}
                </h3>
                <p className="text-green-900 font-medium">
                  {task.createdByUser 
                    ? `${task.createdByUser.firstName} ${task.createdByUser.lastName}`
                    : t('taskDetails.unknown', 'Bilinmiyor')}
                </p>
              </div>

              {/* Deadline */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
                <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <FaCalendarAlt className="text-orange-600" />
                  {t('taskDetails.deadline', 'Bitiş Tarihi')}
                </h3>
                <p className="text-orange-900 font-medium">
                  {task.deadline ? formatDate(task.deadline) : t('taskDetails.noDeadline', 'Belirlenmemiş')}
                </p>
              </div>

              {/* Created At */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <FaClock className="text-purple-600" />
                  {t('taskDetails.createdAt', 'Oluşturulma Tarihi')}
                </h3>
                <p className="text-purple-900 font-medium">
                  {task.createdAt ? formatDate(task.createdAt) : '-'}
                </p>
              </div>
            </div>

            {/* Related Ticket Information */}
            {task.ticket && (
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                  <FaInfoCircle className="text-indigo-600" />
                  {t('taskDetails.relatedTicket', 'İlgili Ticket')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-700">{t('taskDetails.ticketTitle', 'Başlık')}:</span>
                    <span className="text-indigo-900 font-semibold">{task.ticket.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-700">{t('taskDetails.ticketId', 'Ticket ID')}:</span>
                    <span className="text-indigo-900 font-mono text-sm">{task.ticket._id || task.ticket.id}</span>
                  </div>
                  {task.ticket.customer && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-indigo-700">{t('taskDetails.ticketCustomer', 'Müşteri')}:</span>
                      <span className="text-indigo-900">
                        {task.ticket.customer.firstName} {task.ticket.customer.lastName}
                      </span>
                    </div>
                  )}
                  {task.ticket.assignedAgent && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-indigo-700">{t('taskDetails.ticketAgent', 'Atanan Agent')}:</span>
                      <span className="text-indigo-900">
                        {task.ticket.assignedAgent.firstName} {task.ticket.assignedAgent.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{t('taskDetails.taskId', 'Task ID')}:</span>
                <span className="font-mono text-gray-900">{task.id}</span>
              </div>
              {task.product && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{t('taskDetails.product', 'Ürün')}:</span>
                  <span className="text-gray-900">{task.product.product_name_tr}</span>
                </div>
              )}
              {task.category && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{t('taskDetails.category', 'Kategori')}:</span>
                  <span className="text-gray-900">{task.category.category_name_tr}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{t('taskDetails.isDeleted', 'Silinmiş')}:</span>
                <span className={`font-medium ${task.isDeleted ? 'text-red-600' : 'text-green-600'}`}>
                  {task.isDeleted ? t('taskDetails.yes', 'Evet') : t('taskDetails.no', 'Hayır')}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {t('taskDetails.taskNotFound', 'Task Bulunamadı')}
            </h3>
            <p className="text-gray-500">
              {t('taskDetails.taskNotFoundDescription', 'Aradığınız task bulunamadı veya silinmiş olabilir.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 