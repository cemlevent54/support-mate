import React from 'react';
import { FaUser, FaPaperclip } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

const BASEPREVIEWURL = "http://localhost:9000"

export default function CustomKanbanDetailsModal({ open, onClose, task }) {
  const { t } = useTranslation();
  if (!open || !task) return null;
  // Tarih formatlama fonksiyonu
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[340px] max-w-lg w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>
        {/* Başlık ve kategori */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-blue-700">{task.title}</div>
          <div className="text-sm text-gray-500 mt-1">{task.category?.category_name_tr}</div>
        </div>
        {/* Detaylar */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">ID:</span>
            <span className="text-gray-600">{task.id}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.description')}:</span>
            <span className="text-gray-600">{task.description}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.priority')}:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold
              ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                task.priority === 'LOW' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.priority}
            </span>
            <span className="ml-4 font-semibold text-gray-700">{t('kanbanDetails.status')}:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold
              ${task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                task.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {task.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.deadline')}:</span>
            <span className="text-gray-600">{formatDate(task.deadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUser className="text-gray-400" />
            <span className="font-semibold text-gray-700">{t('kanbanDetails.assignedEmployee')}:</span>
            <span className="text-gray-600">{task.assignedEmployee ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}` : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUser className="text-gray-400" />
            <span className="font-semibold text-gray-700">{t('kanbanDetails.createdByCustomerSupporter')}:</span>
            <span className="text-gray-600">
              {task.createdByCustomerSupporter
                ? `${task.createdByCustomerSupporter.firstName} ${task.createdByCustomerSupporter.lastName}`
                : (task.ticket?.assignedAgent
                    ? `${task.ticket.assignedAgent.firstName} ${task.ticket.assignedAgent.lastName}`
                    : '-')}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.createdAt')}:</span>
            <span className="text-gray-600">{formatDate(task.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.ticket')}:</span>
            <span className="text-gray-600">{task.ticket?.title} ({task.ticket?._id})</span>
            {task.ticket?.createdAt && (
              <span className="ml-2 text-xs text-gray-500">{t('kanbanDetails.createdAt')}: {formatDate(task.ticket.createdAt)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.ticketCustomer')}:</span>
            <span className="text-gray-600">{task.ticket?.customer ? `${task.ticket.customer.firstName} ${task.ticket.customer.lastName}` : '-'}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.ticketAssignedAgent')}:</span>
            <span className="text-gray-600">{task.ticket?.assignedAgent ? `${task.ticket.assignedAgent.firstName} ${task.ticket.assignedAgent.lastName}` : '-'}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.product')}:</span>
            <span className="text-gray-600">{task.product?.product_name_tr}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-700">{t('kanbanDetails.isDeleted')}:</span>
            <span className="text-gray-600">{task.isDeleted ? 'Evet' : 'Hayır'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 flex items-center gap-2"><FaPaperclip />{t('kanbanDetails.attachments')}</span>
            <ul className="ml-2 mt-1 space-y-1">
              {task.ticket?.attachments?.map((att, i) => (
                <li key={i} className="flex items-center bg-gray-50 rounded px-2 py-1">
                  <FaPaperclip className="text-gray-400 mr-2 flex-shrink-0" />
                  <a
                    href={`${BASEPREVIEWURL}/${att.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline hover:text-blue-900 truncate flex-1"
                    style={{ maxWidth: 180 }}
                    title={att.name}
                  >
                    {att.name}
                  </a>
                  <button
                    className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-blue-100 border border-gray-200 text-blue-700 whitespace-nowrap"
                    onClick={() => window.open(`${BASEPREVIEWURL}/${att.url}`, '_blank', 'noopener,noreferrer')}
                  >
                    {t('kanbanDetails.preview')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
