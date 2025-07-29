import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CustomButton from './CustomButton';
import './CustomTable.css';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50, 100];

const CustomTable = ({
  rows = [],
  loading = false,
  error = null,
  columns,
  i18nNamespace = 'table',
  renderActions = null,
  onRowClick = null,
  emptyMessage = null,
}) => {
  const { t } = useTranslation();

  // Eğer columns verilmemişse i18n'den başlıkları al
  const tableColumns = columns || [
    { key: 'id', label: t(`${i18nNamespace}.id`) },
    { key: 'name', label: t(`${i18nNamespace}.name`) },
    { key: 'status', label: t(`${i18nNamespace}.status`) },
    { key: 'createdAt', label: t(`${i18nNamespace}.createdAt`) },
    { key: 'actions', label: t(`${i18nNamespace}.actions`) },
  ];

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]); // Default 10

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  // Sütun genişliklerini en uzun içeriklere göre hesapla
  const columnWidths = useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '500 1rem Inter, Arial, sans-serif';
    const getTextWidth = (text) => ctx.measureText(String(text || '')).width;
    const minPx = 80;
    const maxPx = 420;
    return tableColumns.map(col => {
      if (col.key === 'actions') return undefined;
      let max = getTextWidth(col.label);
      rows.forEach(row => {
        const val = row[col.key];
        if (val !== undefined && val !== null) {
          max = Math.max(max, getTextWidth(val));
        }
      });
      // px cinsinden, biraz padding ekle
      return Math.max(minPx, Math.min(max + 32, maxPx));
    });
  }, [tableColumns, rows]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(0);
  };

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="custom-table-wrapper">
      {loading ? (
        <div className="custom-table-loading">{t(`${i18nNamespace}.loading`, 'Yükleniyor...')}</div>
      ) : error ? (
        <div className="custom-table-error">{error}</div>
      ) : (
        <>
          <div className="custom-table-scroll">
            <table className="custom-table">
              <thead>
                <tr>
                  {tableColumns.map((col, i) => (
                    <th
                      key={col.key}
                      className={col.key === 'actions' ? 'actions-cell' : ''}
                      style={
                        col.key === 'createdAt'
                          ? { width: 140 }
                          : col.key !== 'actions' && columnWidths[i]
                            ? { width: columnWidths[i] * 0.6 }
                            : {}
                      }
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length} style={{ textAlign: 'center' }}>
                      {emptyMessage || t(`${i18nNamespace}.noData`, 'Kayıt yok')}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr 
                      key={row.id || idx}
                      onClick={() => handleRowClick(row)}
                      className={onRowClick ? 'clickable-row' : ''}
                    >
                      {tableColumns.map((col, i) =>
                        col.key === 'actions' ? (
                          <td className="actions-cell" key={col.key}>
                            {renderActions ? renderActions(row) : null}
                          </td>
                        ) : (
                          <td
                            key={col.key}
                            style={
                              col.key === 'createdAt'
                                ? { width: 140 }
                                : columnWidths[i]
                                  ? { width: columnWidths[i] * 0.6 }
                                  : {}
                            }
                          >
                            {col.render ? col.render(row) : 
                              (() => {
                                const value = row[col.key];
                                
                                // Kategori verisi obje ise string'e çevir
                                if (col.key === 'category' && typeof value === 'object') {
                                  return value?.category_name_tr || value?.category_name_en || value?.categoryNameTr || value?.categoryNameEn || value?.name_tr || value?.name_en || '-';
                                }
                                // Herhangi bir obje ise JSON string'e çevir
                                else if (typeof value === 'object') {
                                  return JSON.stringify(value);
                                }
                                // Normal değer
                                else {
                                  return value;
                                }
                              })()
                            }
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
          {rows.length > 0 && (
            <div className="custom-table-pagination">
              <span>{t(`${i18nNamespace}.pagination.page`, 'Sayfa')}: </span>
              <button onClick={() => handlePageChange(0)} disabled={page === 0}>{'<<'}</button>
              <button onClick={() => handlePageChange(page - 1)} disabled={page === 0}>{'<'}</button>
              <span>{page + 1} / {totalPages || 1}</span>
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}>{'>'}</button>
              <button onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}>{'>>'}</button>
              <span style={{ marginLeft: 16 }}>{t(`${i18nNamespace}.pagination.rowsPerPage`, 'Kayıt / Sayfa')}: </span>
              <select value={pageSize} onChange={handlePageSizeChange}>
                {PAGE_SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span style={{ marginLeft: 16 }}>{t(`${i18nNamespace}.pagination.total`, 'Toplam')}: {rows.length}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomTable; 