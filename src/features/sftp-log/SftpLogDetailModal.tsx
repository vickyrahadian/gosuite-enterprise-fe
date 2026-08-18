import { useEffect, useRef } from 'react';
import type { SftpLogDetail, SftpTransferEndpoint } from './types';

type SftpLogDetailModalProps = {
  detail: SftpLogDetail | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
}

function formatEndpoint(endpoint: SftpTransferEndpoint) {
  const location = endpoint.type === 'SFTP' ? `${endpoint.host ?? '—'}${endpoint.port === null ? '' : `:${endpoint.port}`}` : 'Local filesystem';
  return <><strong>{endpoint.type}</strong><span>{location}</span><code>{endpoint.path}</code></>;
}

export function SftpLogDetailModal({ detail, isLoading, error, onClose }: SftpLogDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return <dialog ref={dialogRef} className="sftp-log-detail-modal" aria-labelledby="sftp-log-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="form-modal__header"><h2 id="sftp-log-detail-title">SFTP Transfer History</h2><button className="form-modal__close" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
    <div className="sftp-log-detail-modal__body">
      {isLoading && <p className="sftp-log-detail-message">Loading transfer history...</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {detail && <>
        <dl className="sftp-log-summary">
          <div><dt>File name</dt><dd>{detail.fileName}</dd></div>
          <div><dt>File hash</dt><dd className="sftp-log-hash">{detail.fileHash ?? '—'}</dd></div>
          <div><dt>Transfers</dt><dd>{detail.transfers.length}</dd></div>
          <div><dt>Master ID</dt><dd>{detail.masterId}</dd></div>
        </dl>
        <div className="sftp-transfer-timeline">
          {detail.transfers.map((transfer) => <article className={`sftp-transfer sftp-transfer--${transfer.status.toLowerCase()}`} key={transfer.id}>
            <div className="sftp-transfer__marker" aria-hidden="true" />
            <div className="sftp-transfer__content">
              <div className="sftp-transfer__heading">
                <div><span className={`sftp-log-status sftp-log-status--${transfer.status.toLowerCase()}`}>{transfer.status}</span><span className={`sftp-log-direction sftp-log-direction--${transfer.direction.toLowerCase()}`}>{transfer.direction}</span></div>
                <time>{formatDate(transfer.transferredAt)}</time>
              </div>
              <div className="sftp-transfer-route">
                <div className="sftp-transfer-endpoint">{formatEndpoint(transfer.source)}</div>
                <span className="sftp-transfer-route__arrow" aria-label="to">→</span>
                <div className="sftp-transfer-endpoint">{formatEndpoint(transfer.destination)}</div>
              </div>
              <dl className="sftp-transfer-meta">
                <div><dt>Configuration</dt><dd>{transfer.sftpConfig.name}</dd></div>
                <div><dt>Username</dt><dd>{transfer.sftpConfig.username}</dd></div>
                <div><dt>Batch ID</dt><dd>{transfer.batchId}</dd></div>
                <div><dt>Config status</dt><dd>{transfer.sftpConfig.isActive === 'Y' ? 'Active' : 'Inactive'}</dd></div>
              </dl>
              {transfer.errorMessage && <div className="sftp-transfer__message"><strong>{transfer.status === 'FAILED' ? 'Error' : 'Reason'}</strong><p>{transfer.errorMessage}</p></div>}
            </div>
          </article>)}
        </div>
      </>}
    </div>
    <div className="form-modal__actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
  </dialog>;
}
