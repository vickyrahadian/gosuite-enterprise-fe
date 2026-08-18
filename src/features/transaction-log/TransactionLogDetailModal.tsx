import { useEffect, useRef } from 'react';
import type { TransactionTraceDetail } from './types';

type Props = { detail: TransactionTraceDetail | null; isLoading: boolean; error: string | null; onClose: () => void };

const display = (value: string | null | undefined) => value || '\u2014';
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
};
const label = (value: string) => value.replaceAll('_', ' ');

export function TransactionLogDetailModal({ detail, isLoading, error, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return <dialog ref={dialogRef} className="transaction-log-detail-modal" aria-labelledby="transaction-log-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="form-modal__header"><h2 id="transaction-log-detail-title">Transaction Timeline</h2><button className="form-modal__close" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
    <div className="transaction-log-detail-modal__body">
      {isLoading && <p className="transaction-log-detail-message">Loading transaction timeline...</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {detail && <>
        <dl className="transaction-log-summary">
          <div><dt>File name</dt><dd>{detail.transaction.fileName}</dd></div>
          <div><dt>Reference number</dt><dd>{display(detail.transaction.referenceNumber)}</dd></div>
          <div><dt>UETR</dt><dd className="transaction-log-code">{display(detail.transaction.uetr)}</dd></div>
          <div><dt>Message type</dt><dd>{display(detail.transaction.messageType)}</dd></div>
          <div><dt>Direction</dt><dd>{label(detail.transaction.direction)}</dd></div>
          <div><dt>Trace ID</dt><dd className="transaction-log-code">{detail.transaction.traceId}</dd></div>
          <div><dt>Status</dt><dd><span className={`transaction-log-status transaction-log-status--${detail.transaction.status.toLowerCase().replaceAll('_', '-')}`}>{label(detail.transaction.status)}</span></dd></div>
          <div><dt>Latest process</dt><dd>{label(detail.transaction.latestProcess)}</dd></div>
          <div><dt>Current position</dt><dd>{label(detail.transaction.currentPosition)}</dd></div>
          <div><dt>Current file location</dt><dd>{label(detail.transaction.currentFileLocation)}</dd></div>
          <div><dt>File existence status</dt><dd>{label(detail.transaction.fileExistenceStatus)}</dd></div>
          <div className="transaction-log-summary__wide"><dt>Current file path</dt><dd className="transaction-log-code">{display(detail.transaction.currentFilePath)}</dd></div>
          <div><dt>Received at</dt><dd>{formatDate(detail.transaction.receivedAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(detail.transaction.updatedAt)}</dd></div>
        </dl>
        <div className="transaction-timeline">
          {detail.timeline.length === 0 && <p className="transaction-log-detail-message">No processing events recorded.</p>}
          {detail.timeline.map((event) => <article className={`transaction-event transaction-event--${event.status.toLowerCase().replaceAll('_', '-')}`} key={event.id}>
            <div className="transaction-event__marker" aria-hidden="true" />
            <div className="transaction-event__content">
              <div className="transaction-event__heading"><div><strong>{label(event.process)}</strong><span>{label(event.stage)}</span></div><time>{formatDate(event.occurredAt)}</time></div>
              <span className="transaction-event__status">{label(event.status)}</span>
              <div className="transaction-event__route"><div><small>Position</small><span>{label(display(event.positionFrom))} &rarr; {label(display(event.positionTo))}</span></div><div><small>File location</small><span>{label(display(event.sourceFileLocation))} &rarr; {label(display(event.destinationFileLocation))}</span></div></div>
              {(event.sourceFilePath || event.destinationFilePath) && <div className="transaction-event__paths"><code>{display(event.sourceFilePath)}</code><span>&rarr;</span><code>{display(event.destinationFilePath)}</code></div>}
              {event.errorMessage && <div className="transaction-event__error"><strong>Error</strong><p>{event.errorMessage}</p></div>}
            </div>
          </article>)}
        </div>
      </>}
    </div>
    <div className="form-modal__actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
  </dialog>;
}
