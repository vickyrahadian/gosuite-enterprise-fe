import { useEffect, useRef } from 'react';
import { CollapsibleMessageContent } from '../../components/CollapsibleMessageContent';
import type { ConversionFile, MessageConversionDetail, MessageConversionType } from './types';

type Props = { detail: MessageConversionDetail | null; isLoading: boolean; error: string | null; onClose: () => void };
const display = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '\u2014' : String(value);
const label = (value: string) => value.replaceAll('_', ' ');
const conversionMessageLabels: Record<MessageConversionType, { source: string; output: string }> = {
  PACS008_TO_MT103: { source: 'PACS.008', output: 'MT103' },
  PACS009_TO_MT202: { source: 'PACS.009', output: 'MT202' },
  PACS009_COV_TO_MT202_COV: { source: 'PACS.009 COV', output: 'MT202 COV' },
};
const formatDate = (value: string | null) => {
  if (!value) return '\u2014';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
};

function FileDetail({ title, file }: { title: string; file: ConversionFile | null }) {
  return <section className="conversion-file-detail" aria-label={title}>
    <h3>{title}</h3>
    {!file ? <p className="conversion-detail-message">The output file has not been created.</p> : <>
      <dl className="conversion-detail-grid">
        <div className="conversion-detail-grid__wide"><dt>File name</dt><dd>{file.fileName}</dd></div>
        <div><dt>Extension</dt><dd>{display(file.extension)}</dd></div><div><dt>Content type</dt><dd>{display(file.contentType)}</dd></div>
        <div><dt>Size</dt><dd>{file.size === null ? '\u2014' : `${file.size.toLocaleString()} bytes`}</dd></div><div><dt>Checksum</dt><dd className="conversion-code">{display(file.checksum)}</dd></div>
        <div><dt>Created at</dt><dd>{formatDate(file.createdAt)}</dd></div><div><dt>Modified at</dt><dd>{formatDate(file.modifiedAt)}</dd></div>
        <div className="conversion-detail-grid__wide"><dt>Input path</dt><dd className="conversion-code">{display(file.inputPath)}</dd></div>
        <div className="conversion-detail-grid__wide"><dt>Output path</dt><dd className="conversion-code">{display(file.outputPath)}</dd></div>
        <div className="conversion-detail-grid__wide"><dt>Archive path</dt><dd className="conversion-code">{display(file.archivePath)}</dd></div>
      </dl>
      <CollapsibleMessageContent value={file.content} emptyMessage="No file content available." />
    </>}
  </section>;
}

export function MessageConversionDetailModal({ detail, isLoading, error, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageLabels = detail ? conversionMessageLabels[detail.conversionType] : null;
  useEffect(() => { const dialog = dialogRef.current; if (dialog && !dialog.open) dialog.showModal(); return () => { if (dialog?.open) dialog.close(); }; }, []);
  return <dialog ref={dialogRef} className="conversion-detail-modal" aria-labelledby="conversion-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="form-modal__header"><h2 id="conversion-detail-title">MX/MT Conversion Detail</h2><button className="form-modal__close" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
    <div className="conversion-detail-modal__body">
      {isLoading && <p className="conversion-detail-message">Loading conversion detail...</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {detail && <>
        <dl className="conversion-detail-grid">
          <div><dt>Conversion ID</dt><dd>{detail.id}</dd></div><div><dt>Conversion type</dt><dd>{label(detail.conversionType)}</dd></div>
          <div><dt>Status</dt><dd><span className={`conversion-status conversion-status--${detail.status.toLowerCase().replaceAll('_', '-')}`}>{label(detail.status)}</span></dd></div>
          <div><dt>Transaction reference</dt><dd>{display(detail.transactionReference)}</dd></div>
          <div><dt>UETR</dt><dd className="conversion-code">{display(detail.uetr)}</dd></div><div><dt>Settlement date</dt><dd>{display(detail.settlementDate)}</dd></div>
          <div><dt>Currency</dt><dd>{display(detail.currency)}</dd></div><div><dt>Sender BIC</dt><dd>{display(detail.senderBic)}</dd></div>
          <div><dt>Receiver BIC</dt><dd>{display(detail.receiverBic)}</dd></div><div><dt>Started at</dt><dd>{formatDate(detail.startedAt)}</dd></div>
          <div><dt>Completed at</dt><dd>{formatDate(detail.completedAt)}</dd></div><div><dt>Created at</dt><dd>{formatDate(detail.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(detail.updatedAt)}</dd></div>
          {detail.errorMessage && <div className="conversion-detail-grid__wide conversion-error"><dt>Error</dt><dd>{detail.errorMessage}</dd></div>}
        </dl>
        <section className="conversion-comparison" aria-labelledby="conversion-comparison-title">
          <div className="conversion-comparison__heading"><h3 id="conversion-comparison-title">Message Comparison</h3><span>{messageLabels?.source ?? 'MX'} source &rarr; {messageLabels?.output ?? 'MT'} output</span></div>
          <div className="conversion-comparison__panels">
            <FileDetail title={`${messageLabels?.source ?? 'MX'} Source Message`} file={detail.sourceFile} />
            <FileDetail title={`${messageLabels?.output ?? 'MT'} Output Message`} file={detail.outputFile} />
          </div>
        </section>
      </>}
    </div>
    <div className="form-modal__actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
  </dialog>;
}
