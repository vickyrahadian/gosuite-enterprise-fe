import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Download, Filter } from 'lucide-react';
import { recentActivityData } from '../data/mockData';

const statusStyles = {
  Active: 'bg-green-50 text-green-700 border border-green-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const ROWS_PER_PAGE = 5;

const RecentActivityTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = recentActivityData.filter(
    (row) =>
      row.user.toLowerCase().includes(search.toLowerCase()) ||
      row.action.toLowerCase().includes(search.toLowerCase()) ||
      row.status.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white  shadow-sm border border-gray-100">
      {/* Table header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} records found</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={handleSearch}
              aria-label="Search activity"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-40"
            />
          </div>
          {/* Filter button */}
          <button aria-label="Filter" className="btn-secondary py-1.5 px-3">
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
          </button>
          {/* Export button */}
          <button aria-label="Export CSV" className="btn-secondary py-1.5 px-3">
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Recent activity table">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Action</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  <Search size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm mt-1">Try adjusting your search terms</p>
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{row.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7  bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-700 text-[10px] font-bold">
                          {row.user.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{row.user}</p>
                        <p className="text-xs text-gray-400">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{row.action}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5  text-xs font-medium ${statusStyles[row.status] || ''}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell">{row.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filtered.length)}–
          {Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="p-1.5  text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`w-7 h-7  text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="p-1.5  text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivityTable;
