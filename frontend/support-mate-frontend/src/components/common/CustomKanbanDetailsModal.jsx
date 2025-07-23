import React from 'react';

export default function CustomKanbanDetailsModal({ open, onClose, title, category, description, assignee, priority, deadline }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-7 min-w-[320px] max-w-lg w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>
        <div className="mb-2 text-lg font-semibold text-gray-800">{title}</div>
        <div className="mb-4 text-sm text-gray-500">Kategori: {category}</div>
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-700">Açıklama:</span>
            <span className="ml-2 text-gray-600">{description || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Atanan Kişi:</span>
            <span className="ml-2 text-gray-600">{assignee || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Öncelik:</span>
            <span className="ml-2 text-gray-600">{priority || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Son Teslim Tarihi:</span>
            <span className="ml-2 text-gray-600">{deadline || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
