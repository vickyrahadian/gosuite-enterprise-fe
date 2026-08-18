import { useCallback, useEffect, useState } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { SftpLogDetailModal } from './SftpLogDetailModal';
import { sftpLogService } from './sftpLogService';
import type { SftpLogDetail, SftpLogMaster } from './types';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'SFTP_AUDIT_LOG_NOT_FOUND' || error.status === 404) return 'The SFTP transfer log is no longer available. Please refresh the data.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

export function SftpLogPage() {
  useDocumentTitle('SFTP Log | BNI');
  const [items, setItems] = useState<SftpLogMaster[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SftpLogDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    try {
      const result = await sftpLogService.getAll(page, size, signal);
      setItems(result.content); setPage(result.page); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(getErrorMessage(requestError));
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [page, size]);

  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const openDetail = async (id: number) => {
    setSelectedId(id); setDetail(null); setDetailError(null); setIsDetailLoading(true);
    try { setDetail(await sftpLogService.getById(id)); }
    catch (requestError) { setDetailError(getErrorMessage(requestError)); }
    finally { setIsDetailLoading(false); }
  };

  const columns: DataTableColumn<SftpLogMaster>[] = [
    { key: 'fileName', header: 'File Name', render: (item) => item.fileName },
    { key: 'fileHash', header: 'File Hash', render: (item) => <span className="sftp-log-hash" title={item.fileHash ?? undefined}>{item.fileHash ?? '—'}</span> },
    { key: 'direction', header: 'Latest Direction', render: (item) => <span className={`sftp-log-direction sftp-log-direction--${item.latestDirection.toLowerCase()}`}>{item.latestDirection}</span> },
    { key: 'status', header: 'Latest Status', render: (item) => <span className={`sftp-log-status sftp-log-status--${item.latestStatus.toLowerCase()}`}>{item.latestStatus}</span> },
    { key: 'transferredAt', header: 'Last Transferred', render: (item) => formatDate(item.latestTransferredAt) },
    { key: 'count', header: 'Transfers', align: 'right', render: (item) => item.transferCount.toLocaleString() },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <IconButton label={`View transfer history for ${item.fileName}`} type="button" onClick={() => void openDetail(item.id)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>} /> },
  ];

  return <div className="crud-page sftp-log-page">
    <header className="page-header"><p>SFTP</p><h1>SFTP Transfer Log</h1></header>
    <section className="management-card" aria-labelledby="sftp-log-list-title">
      <div className="section-heading"><h2 id="sftp-log-list-title">File Transfer History</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'file' : 'files'}</span><IconButton label="Refresh SFTP transfer logs" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>}/></div></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel="SFTP transfer log" isLoading={isLoading} loadingMessage="Loading SFTP transfer logs..." emptyMessage="No SFTP transfer logs found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }}/>
    </section>
    {selectedId !== null && <SftpLogDetailModal detail={detail} isLoading={isDetailLoading} error={detailError} onClose={() => { setSelectedId(null); setDetail(null); setDetailError(null); }}/>} 
  </div>;
}
