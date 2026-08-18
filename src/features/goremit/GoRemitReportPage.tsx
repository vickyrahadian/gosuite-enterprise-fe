import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { goRemitService, type GoRemitFilters, type GoRemitReport } from './goRemitService';
import type { GoRemitRow } from './types';

export type GoRemitFilterField = { key: string; label: string; type?: 'text' | 'number' };
type Props = { report: GoRemitReport; title: string; filterFields: GoRemitFilterField[] };
type ReportFilter = { start: string; end: string } & GoRemitFilters;

const toDateInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getDefaultDates = (): ReportFilter => {
  const now = new Date();
  const today = toDateInput(now);
  return {
    start: today,
    end: today,
  };
};

const addOneDay = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return toDateInput(new Date(year, month - 1, day + 1));
};

const getErrorMessage = (error: unknown) => error instanceof ApiRequestError
  ? error.message
  : 'Unable to connect to the backend. Check the API address and server connection.';

const formatHeader = (key: string) => key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '\u2014';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const isSameMonth = (start: string, end: string) => start.slice(0, 7) === end.slice(0, 7);
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const downloadExcel = (title: string, rows: GoRemitRow[]) => {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const excelRow = (values: string[]) => `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join('')}</Row>`;
  const worksheet = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    `<Worksheet ss:Name="Report"><Table>${excelRow(keys.map(formatHeader))}${rows.map((row) => excelRow(keys.map((key) => displayValue(row[key])))).join('')}</Table></Worksheet></Workbook>`;
  const url = URL.createObjectURL(new Blob([worksheet], { type: 'application/vnd.ms-excel;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function GoRemitReportPage({ report, title, filterFields }: Props) {
  useDocumentTitle(`${title} | BNI`);
  const getDefaultFilters = useCallback((): ReportFilter => ({
    ...getDefaultDates(),
    ...Object.fromEntries(filterFields.map(({ key }) => [key, ''])),
  }), [filterFields]);
  const [form, setForm] = useState<ReportFilter>(getDefaultFilters);
  const [activeFilter, setActiveFilter] = useState<ReportFilter>(getDefaultFilters);
  const [rows, setRows] = useState<GoRemitRow[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await goRemitService.getReport(report, { ...activeFilter, end: addOneDay(activeFilter.end) }, signal);
      setRows(response.data);
      setCount(response.count);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [activeFilter, report]);

  useEffect(() => {
    const controller = new AbortController();
    void loadReport(controller.signal);
    return () => controller.abort();
  }, [loadReport]);

  const columns = useMemo<DataTableColumn<GoRemitRow>[]>(() => {
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    return keys.map((key) => ({ key, header: formatHeader(key), render: (row) => displayValue(row[key]) }));
  }, [rows]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.start || !form.end) { setError('From and To dates are required.'); return; }
    if (form.start > form.end) { setError('From date must be earlier than or equal to To date.'); return; }
    if (!isSameMonth(form.start, form.end)) { setError('From and To dates must be within the same month.'); return; }
    setActiveFilter(form);
    setError(null);
  };

  const reset = () => {
    const defaults = getDefaultFilters();
    setForm(defaults);
    setActiveFilter(defaults);
    setError(null);
  };

  return <div className="crud-page goremit-report-page">
    <header className="page-header"><p>GoRemit</p><h1>{title}</h1></header>
    <section className="management-card" aria-labelledby={`${report}-filter-title`}>
      <div className="section-heading"><h2 id={`${report}-filter-title`}>Filter Report</h2></div>
      <form className="goremit-filter-grid" onSubmit={submit}>
        <div className="form-field"><label htmlFor={`${report}-start`}>From</label><input id={`${report}-start`} type="date" required max={form.end || undefined} value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} /></div>
        <div className="form-field"><label htmlFor={`${report}-end`}>To</label><input id={`${report}-end`} type="date" required min={form.start || undefined} value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} /></div>
        {filterFields.map((field) => <div className="form-field" key={field.key}>
          <label htmlFor={`${report}-${field.key}`}>{field.label}</label>
          <input id={`${report}-${field.key}`} type={field.type ?? 'text'} step={field.type === 'number' ? 'any' : undefined} value={form[field.key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
        </div>)}
        <div className="goremit-filter-actions">
          <IconButton className="icon-button--primary search-form__icon-button" label="Apply report filters" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} />
          <IconButton className="search-form__icon-button" label="Reset report filters" type="button" onClick={reset} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4v6h6"/><path d="M5.5 15a8 8 0 1 0 .5-7l-2 2"/></svg>} />
        </div>
      </form>
    </section>
    <section className="management-card" aria-labelledby={`${report}-list-title`}>
      <div className="section-heading"><h2 id={`${report}-list-title`}>{title} List</h2><div className="section-heading__actions"><span>{count} {count === 1 ? 'record' : 'records'}</span><IconButton label={`Download ${title} as Excel`} type="button" onClick={() => downloadExcel(title, rows)} disabled={isLoading || rows.length === 0} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>} /><IconButton label={`Refresh ${title}`} type="button" onClick={() => void loadReport()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>} /></div></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <DataTable rows={rows} columns={columns.length ? columns : [{ key: 'empty', header: 'Data', render: () => '\u2014' }]} getRowKey={(row) => rows.indexOf(row)} ariaLabel={`${title} report`} isLoading={isLoading} loadingMessage={`Loading ${title}...`} emptyMessage="No records found for the selected date range." />
    </section>
  </div>;
}
