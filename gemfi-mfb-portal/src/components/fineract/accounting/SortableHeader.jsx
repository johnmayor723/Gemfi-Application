import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Sortable column header for table headers.
 */
export default function SortableHeader({ label, field, sortConfig, onSort, className = '' }) {
  const isActive = sortConfig?.field === field;
  const direction = isActive ? sortConfig.direction : null;

  const handleSort = () => {
    if (!isActive || direction === 'DESC') {
      onSort({ field, direction: 'ASC' });
    } else {
      onSort({ field, direction: 'DESC' });
    }
  };

  return (
    <th className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-200 ${className}`}>
      <button onClick={handleSort} className="flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'ASC' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-slate-600" />
        )}
      </button>
    </th>
  );
}