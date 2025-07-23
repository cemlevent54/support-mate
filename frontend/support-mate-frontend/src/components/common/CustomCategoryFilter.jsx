import React from 'react';

export default function CustomCategoryFilter({ categories = [], selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        className={`px-3 py-1 rounded-lg border text-sm font-medium transition-all duration-150 ${!selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
        onClick={() => onSelect('')}
      >
        Tümü
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          className={`px-3 py-1 rounded-lg border text-sm font-medium transition-all duration-150 ${selected === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
} 