import React from 'react';
import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportToExcel, exportToCSV, exportToPDF, printTable } from '@/lib/exportUtils';

/**
 * Toolbar with Excel, PDF, and Print export buttons.
 */
export default function ExportToolbar({ filename, title, columns, data }) {
  const handleExcel = () => exportToExcel(filename, columns, data);
  const handleCSV = () => exportToCSV(filename, columns, data);
  const handlePDF = () => exportToPDF(filename, title, columns, data);
  const handlePrint = () => printTable(title, columns, data);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExcel}
        disabled={!data?.length}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
      </button>
      <button
        onClick={handleCSV}
        disabled={!data?.length}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600/20 border border-cyan-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
      </button>
      <button
        onClick={handlePDF}
        disabled={!data?.length}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 border border-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FileText className="w-3.5 h-3.5" /> PDF
      </button>
      <button
        onClick={handlePrint}
        disabled={!data?.length}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600/10 text-slate-400 hover:bg-slate-600/20 border border-slate-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Printer className="w-3.5 h-3.5" /> Print
      </button>
    </div>
  );
}