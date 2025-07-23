import React from 'react';

const statusBg = {
  PENDING: 'bg-red-50 border-red-200',
  IN_PROGRESS: 'bg-yellow-50 border-yellow-200',
  DONE: 'bg-green-50 border-green-200',
};

export default function CustomKanbanCard({ title, category, deadline, status = 'PENDING', children, className = '', style = {}, onClick }) {
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
      {(category || deadline) && (
        <div className="flex items-end justify-between mt-2 select-none">
          <div>
            {category && (
              <span className="inline-block bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded w-fit">{category}</span>
            )}
          </div>
          <div>
            {deadline && (
              <span className="inline-block bg-gray-100 text-xs text-gray-400 px-2 py-0.5 rounded">{deadline}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 