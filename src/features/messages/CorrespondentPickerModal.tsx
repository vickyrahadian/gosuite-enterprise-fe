import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { correspondentService } from '../correspondents/correspondentService';
import type { BankCorrespondent } from '../correspondents/types';
import { ApiRequestError } from '../../services/api';

type CorrespondentPickerModalProps = {
  isOpen: boolean;
  title: string;
  onSelect: (bicCode: string) => void;
  onClose: () => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiRequestError
    ? error.message
    : 'Unable to connect to the backend. Check the API address and server connection.';
}

export function CorrespondentPickerModal({ isOpen, title, onSelect, onClose }: CorrespondentPickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<BankCorrespondent[]>([]);
  const [bic, setBic] = useState('');
  const [name, setName] = useState('');
  const [activeBic, setActiveBic] = useState('');
  const [activeName, setActiveName] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await correspondentService.getAll({ bic: activeBic, name: activeName, page, size, sort: 'bicCode,asc' }, signal);
      setItems(result.content);
      setPage(result.number);
      setSize(result.size);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [activeBic, activeName, isOpen, page, size]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => controller.abort();
  }, [isOpen, loadItems]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setActiveBic(bic.trim());
    setActiveName(name.trim());
  };

  const clearSearch = () => {
    setBic(''); setName(''); setPage(0); setActiveBic(''); setActiveName('');
  };

  const columns: DataTableColumn<BankCorrespondent>[] = [
    { key: 'bicCode', header: 'BIC Code', render: (item) => item.bicCode },
    { key: 'bicName', header: 'Bank Name', render: (item) => item.bicName || '—' },
    { key: 'city', header: 'City', render: (item) => item.city || '—' },
    { key: 'country', header: 'Country', render: (item) => item.country || '—' },
    { key: 'select', header: 'Select', align: 'right', render: (item) => <button className="button button--primary correspondent-picker__select" type="button" onClick={() => { onSelect(item.bicCode); onClose(); }}>Select</button> },
  ];

  return <dialog ref={dialogRef} className="correspondent-picker" aria-labelledby="correspondent-picker-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="form-modal__header"><h2 id="correspondent-picker-title">{title}</h2><button className="form-modal__close" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
    <div className="correspondent-picker__body">
      <form className="correspondent-picker__filters" onSubmit={search}>
        <div className="form-field"><label htmlFor="picker-bic">BIC code</label><input id="picker-bic" value={bic} onChange={(event) => setBic(event.target.value)} maxLength={11} placeholder="Search by BIC" /></div>
        <div className="form-field"><label htmlFor="picker-name">Bank name</label><input id="picker-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} placeholder="Search by name" /></div>
        <div className="correspondent-picker__filter-actions"><button className="button button--primary" type="submit" disabled={isLoading}>Search</button><button className="button button--secondary" type="button" onClick={clearSearch} disabled={isLoading}>Clear</button></div>
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel={`${title} correspondent list`} isLoading={isLoading} loadingMessage="Loading correspondents..." emptyMessage="No correspondents found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (nextPage) => setPage(nextPage - 1), onPageSizeChange: (nextSize) => { setSize(nextSize); setPage(0); } }} />
    </div>
    <div className="form-modal__actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
  </dialog>;
}
