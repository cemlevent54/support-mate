import React from 'react';

export default function CustomSearchBar({ value, onChange, placeholder = 'Ara...', className = '', style = {} }) {
  return (
    <div className={`flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm transition-all duration-150 focus-within:border-blue-400 focus-within:shadow-md ${className}`} style={style}>
      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="flex-1 bg-transparent outline-none border-none text-gray-800 placeholder-gray-400 text-base"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
