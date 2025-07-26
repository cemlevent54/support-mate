import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import isCustomerSupporter from '../../../auth/isCustomerSupporter';
import './CustomTicketTable.css';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50, 100];

const CustomTicketTable = ({
  rows = [],
  onChat,
  onDetail,
  onAssign, // New prop for assign functionality
  loading = false,
  error = null,
  columns,
  i18nNamespace = 'myRequests',
  renderActions = null, // New prop for custom action rendering
}) => {
  const { t } = useTranslation();

  // Get user role from JWT
  const getUserRole = () => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.roleName;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const userRole = getUserRole();
  const isCustomerSupporterRole = isCustomerSupporter({ roleName: userRole });

  // Eğer columns verilmemişse i18n'den başlıkları al
  const tableColumns = columns || [
    { key: 'title', label: t(`${i18nNamespace}.table.title`) },
    { key: 'category', label: t(`${i18nNamespace}.table.category`) },
    { key: 'status', label: t(`${i18nNamespace}.table.status`) },
    { key: 'createdAt', label: t(`${i18nNamespace}.table.createdAt`) },
    { key: 'actions', label: t(`${i18nNamespace}.table.actions`) },
  ];

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

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

  return (
    <div className="custom-ticket-table-wrapper">
      {loading ? (
        <div className="custom-ticket-table-loading">{t(`${i18nNamespace}.loading`, 'Yükleniyor...')}</div>
      ) : error ? (
        <div className="custom-ticket-table-error">{error}</div>
      ) : (
        <>
          <div className="custom-ticket-table-scroll">
            <table className="custom-ticket-table">
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
                  <tr><td colSpan={tableColumns.length} style={{ textAlign: 'center' }}>{t(`${i18nNamespace}.noTickets`, 'Kayıt yok')}</td></tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id || idx}>
                      {tableColumns.map((col, i) =>
                        col.key === 'actions' ? (
                          <td className="actions-cell" key={col.key}>
                            {renderActions ? (
                              renderActions(row)
                            ) : (
                              <>
                                {i18nNamespace !== 'adminTickets' && (
                                  <button className="custom-btn chat" onClick={() => onChat && onChat(row)}>{t(`${i18nNamespace}.buttons.chat`, 'CHAT')}</button>
                                )}
                                <button className="custom-btn detail" onClick={() => onDetail && onDetail(row)}>{t(`${i18nNamespace}.buttons.detail`, 'DETAY')}</button>
                                {isCustomerSupporterRole && onAssign && !['IN_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'DONE'].includes(row.status) && (
                                  <button className="custom-btn assign" onClick={() => onAssign(row)}>{t(`${i18nNamespace}.buttons.assign`, 'ASSIGN')}</button>
                                )}
                              </>
                            )}
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
                            {col.render ? col.render(row) : row[col.key]}
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
        </>
      )}
    </div>
  );
};

export default CustomTicketTable;
