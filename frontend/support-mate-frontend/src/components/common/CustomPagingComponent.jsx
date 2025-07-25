import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

export default function CustomPagingComponent({ page, total, pageSize, setPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const arrowBtnStyle = (disabled) => ({
    border: 'none',
    background: '#fff',
    color: disabled ? '#bbb' : '#1976d2',
    borderRadius: '50%',
    width: 40,
    height: 40,
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s',
    margin: '0 12px',
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(25, 118, 210, 0.04)',
    outline: 'none',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: disabled ? '#eee' : '#e0e0e0',
  });
  const pageNumStyle = {
    fontSize: 16,
    fontWeight: 600,
    color: '#222',
    background: '#f5f5f5',
    borderRadius: 8,
    padding: '6px 18px',
    minWidth: 48,
    textAlign: 'center',
    letterSpacing: 1,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 12, borderTop: '1px solid #eee', background: '#fff' }}>
      <button
        style={arrowBtnStyle(page === 1)}
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        aria-label="Önceki Sayfa"
      >
        <MdChevronLeft size={28} />
      </button>
      <span style={pageNumStyle}>{page} / {totalPages}</span>
      <button
        style={arrowBtnStyle(page >= totalPages)}
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages}
        aria-label="Sonraki Sayfa"
      >
        <MdChevronRight size={28} />
      </button>
    </div>
  );
}
