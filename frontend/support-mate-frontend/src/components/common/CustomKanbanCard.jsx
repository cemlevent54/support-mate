import React from 'react';

const statusBg = {
  PENDING: 'bg-red-50 border-red-200',
  IN_PROGRESS: 'bg-yellow-50 border-yellow-200',
  DONE: 'bg-green-50 border-green-200',
};

// Modern tarih formatı fonksiyonu
const formatDeadline = (deadline) => {
  if (!deadline) return '';
  
  try {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return deadline;
    
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Dil kontrolü
    const language = localStorage.getItem('language') || 'tr';
    
    // Bugün
    if (diffDays === 0) {
      return language === 'en' ? 'Today' : 'Bugün';
    }
    // Yarın
    else if (diffDays === 1) {
      return language === 'en' ? 'Tomorrow' : 'Yarın';
    }
    // Geçmiş
    else if (diffDays < 0) {
      return language === 'en' ? 'Overdue' : 'Gecikmiş';
    }
    // Gelecek (7 günden az)
    else if (diffDays <= 7) {
      return language === 'en' ? `${diffDays} days` : `${diffDays} gün`;
    }
    // Gelecek (7 günden fazla)
    else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  } catch (error) {
    return deadline;
  }
};

export default function CustomKanbanCard({ title, category, deadline, status = 'PENDING', children, className = '', style = {}, onClick }) {
  const formattedDeadline = formatDeadline(deadline);
  
  return (
    <div
      className={`w-full min-h-[100px] rounded-xl border shadow-md px-5 py-4 flex flex-col gap-2 transition-all duration-150 ${statusBg[status] || ''} ${className} hover:shadow-lg cursor-pointer`}
      style={style}
      onClick={onClick}
      tabIndex={0}
      role="button"
    >
      <div className="font-semibold text-base text-gray-800 mb-1 truncate">{title}</div>
      <div className="text-sm text-gray-600 flex-1">
        {children}
      </div>
      {(category || formattedDeadline) && (
        <div className="flex items-end justify-between mt-2 select-none">
          <div>
            {category && (
              <span className="inline-block bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded w-fit">{category}</span>
            )}
          </div>
          <div>
            {formattedDeadline && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                formattedDeadline === 'Gecikmiş' || formattedDeadline === 'Overdue'
                  ? 'bg-red-100 text-red-600' 
                  : formattedDeadline === 'Bugün' || formattedDeadline === 'Today'
                    ? 'bg-orange-100 text-orange-600'
                    : formattedDeadline === 'Yarın' || formattedDeadline === 'Tomorrow'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-600'
              }`}>
                {formattedDeadline}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 