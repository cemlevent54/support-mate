import React, { useState, useMemo } from 'react';
import './CustomTicketTable.css';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50, 100];

const CustomTable = ({
  columns = [], // [{ key, label, minWidth, maxWidth, align }]
  rows = [],
  loading = false,
  error = null,
  actions = null, // (row) => ReactNode
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  initialPageSize = PAGE_SIZE_OPTIONS[0],
  i18n = {
    loading: 'Yükleniyor...',
    noData: 'Kayıt yok',
    total: 'Toplam',
    page: 'Sayfa',
    rowsPerPage: 'Kayıt / Sayfa',
  },
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  // Sütun genişliklerini en uzun içeriklere göre hesapla
  const columnWidths = useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '500 1rem Inter, Arial, sans-serif';
    const getTextWidth = (text) => ctx.measureText(String(text || '')).width;
    const minPx = 80;
    const maxPx = 420;
    return columns.map(col => {
      let max = getTextWidth(col.label);
      rows.forEach(row => {
        const val = row[col.key];
        if (val !== undefined && val !== null) {
          max = Math.max(max, getTextWidth(val));
        }
      });
      return Math.max(minPx, Math.min(max + 32, maxPx));
    });
  }, [columns, rows]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(0);
  };

  return (
    <div className="custom-ticket-table-wrapper">
      {loading ? (
        <div className="custom-ticket-table-loading"><CircularProgress size={28} sx={{ mr: 1 }} />{i18n.loading}</div>
      ) : error ? (
        <div className="custom-ticket-table-error">{error}</div>
      ) : (
        <>
          <div className="custom-ticket-table-scroll">
            <table className="custom-ticket-table">
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th
                      key={col.key}
                      className={col.key === 'actions' ? 'actions-cell' : ''}
                      style={{
                        width: col.key !== 'actions' && columnWidths[i] ? columnWidths[i] * 0.6 : undefined,
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr><td colSpan={columns.length} style={{ textAlign: 'center' }}>{i18n.noData}</td></tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id || idx}>
                      {columns.map((col, i) =>
                        col.key === 'actions' ? (
                          <td className="actions-cell" key={col.key}>
                            {actions ? actions(row) : null}
                          </td>
                        ) : (
                          <td
                            key={col.key}
                            style={{
                              width: col.key !== 'actions' && columnWidths[i] ? columnWidths[i] * 0.6 : undefined,
                              textAlign: col.align || 'left',
                            }}
                          >
                            {row[col.key]}
                          </td>
                        )
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Sayfalama */}
          <div className="custom-ticket-table-pagination">
            <span>{i18n.page}: </span>
            <Button onClick={() => handlePageChange(0)} disabled={page === 0}>{'<<'}</Button>
            <Button onClick={() => handlePageChange(page - 1)} disabled={page === 0}>{'<'}</Button>
            <span>{page + 1} / {totalPages || 1}</span>
            <Button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}>{'>'}</Button>
            <Button onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}>{'>>'}</Button>
            <span style={{ marginLeft: 16 }}>{i18n.rowsPerPage}: </span>
            <select value={pageSize} onChange={handlePageSizeChange} style={{ minWidth: 60 }}>
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span style={{ marginLeft: 16 }}>{i18n.total}: {rows.length}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomTable; 