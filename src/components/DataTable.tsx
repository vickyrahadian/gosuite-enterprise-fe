import { useEffect, useState, type ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  ariaLabel: string;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  disablePagination?: boolean;
  serverPagination?: {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
};

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const visiblePages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items: PageItem[] = [];

  visiblePages.forEach((page, index) => {
    const previousPage = visiblePages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push(previousPage === 1 ? 'ellipsis-left' : 'ellipsis-right');
    }
    items.push(page);
  });

  return items;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  ariaLabel,
  isLoading = false,
  loadingMessage = 'Loading data...',
  emptyMessage = 'No data found.',
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disablePagination = false,
  serverPagination,
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = serverPagination?.totalPages ?? Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = serverPagination?.currentPage ?? Math.min(currentPage, totalPages);
  const effectivePageSize = serverPagination?.pageSize ?? pageSize;
  const totalRows = serverPagination?.totalRows ?? rows.length;
  const pageStart = (safePage - 1) * effectivePageSize;
  const visibleRows = serverPagination || disablePagination ? rows : rows.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    if (serverPagination) return;
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage, serverPagination]);

  return (
    <div className="data-table">
      <div className="table-wrapper">
        <table aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th className={column.align === 'right' ? 'table-actions' : undefined} key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="table-message" colSpan={columns.length}>{loadingMessage}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="table-message" colSpan={columns.length}>{emptyMessage}</td></tr>
            ) : visibleRows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className={column.align === 'right' ? 'table-actions' : undefined} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disablePagination && !isLoading && totalRows > 0 && (
        <nav className="pagination" aria-label={`${ariaLabel} pagination`}>
          <div className="page-size-control">
            <label htmlFor={`${ariaLabel.replace(/\s+/g, '-').toLowerCase()}-page-size`}>Rows per page</label>
            <select
              id={`${ariaLabel.replace(/\s+/g, '-').toLowerCase()}-page-size`}
              value={effectivePageSize}
              onChange={(event) => {
                const nextSize = Number(event.target.value);
                if (serverPagination?.onPageSizeChange) {
                  serverPagination.onPageSizeChange(nextSize);
                } else {
                  setPageSize(nextSize);
                  setCurrentPage(1);
                }
              }}
            >
              {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <span>Showing {pageStart + 1}-{Math.min(pageStart + effectivePageSize, totalRows)} of {totalRows}</span>
          </div>
          <div className="pagination__controls">
            <button className="pagination__arrow" type="button" onClick={() => serverPagination?.onPageChange(safePage - 1) ?? setCurrentPage(safePage - 1)} disabled={safePage === 1}>
              Previous
            </button>
            <div className="pagination__pages" aria-label="Go to page">
              {getPageItems(safePage, totalPages).map((item) => item === 'ellipsis-left' || item === 'ellipsis-right' ? (
                <span className="pagination__ellipsis" key={item} aria-hidden="true">&hellip;</span>
              ) : (
                <button
                  className={`pagination__page${item === safePage ? ' active' : ''}`}
                  type="button"
                  key={item}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === safePage ? 'page' : undefined}
                  onClick={() => serverPagination?.onPageChange(item) ?? setCurrentPage(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button className="pagination__arrow" type="button" onClick={() => serverPagination?.onPageChange(safePage + 1) ?? setCurrentPage(safePage + 1)} disabled={safePage === totalPages}>
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
