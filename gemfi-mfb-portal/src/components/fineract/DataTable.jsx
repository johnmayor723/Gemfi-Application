import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DataTable({ columns, data, loading, emptyMessage = 'No data found', onRowClick }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            {columns.map(col => (
              <th key={col.key} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-800/50 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : ''
              }`}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-slate-300">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}