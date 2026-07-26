import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Server-side pagination control.
 */
export default function Pagination({ page, pageSize, totalRecords, onPageChange }) {
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startRecord = totalRecords === 0 ? 0 : page * pageSize + 1;
  const endRecord = Math.min((page + 1) * pageSize, totalRecords);

  const goTo = (p) => {
    const clamped = Math.max(0, Math.min(p, totalPages - 1));
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-700/50">
      <div className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{startRecord}</span>–
        <span className="text-slate-300 font-medium">{endRecord}</span> of{' '}
        <span className="text-slate-300 font-medium">{totalRecords.toLocaleString()}</span> records
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => goTo(0)} disabled={page === 0} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button onClick={() => goTo(page - 1)} disabled={page === 0} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 text-xs text-slate-400">
          Page <span className="text-white font-medium">{page + 1}</span> of {totalPages}
        </span>

        <button onClick={() => goTo(page + 1)} disabled={page >= totalPages - 1} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => goTo(totalPages - 1)} disabled={page >= totalPages - 1} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}