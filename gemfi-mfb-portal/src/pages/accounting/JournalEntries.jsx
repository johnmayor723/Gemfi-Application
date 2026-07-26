import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { Plus, Loader2, ArrowLeftRight, BookOpen, Scale, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/fineract/PageHeader';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import JournalEntryFilters from '@/components/fineract/accounting/JournalEntryFilters';
import JournalEntryPanel from '@/components/fineract/accounting/JournalEntryPanel';
import Pagination from '@/components/fineract/accounting/Pagination';
import SortableHeader from '@/components/fineract/accounting/SortableHeader';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 25;

export default function JournalEntries() {
  const [glAccounts, setGlAccounts] = useState([]);
  const [offices, setOffices] = useState([]);

  // Filters, pagination, sorting
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({ field: 'transactionId', direction: 'DESC' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Fetch journal entries with server-side pagination
  const { entries: pageEntries, totalRecords, loading: entriesLoading, error, refetch } = useJournalEntries(filters, page, PAGE_SIZE, sortConfig);

  useEffect(() => {
    fineractApi('/glaccounts').then((r) => setGlAccounts(Array.isArray(r) ? r : [])).catch(() => {});
    fineractApi('/offices').then(setOffices).catch(() => {});
  }, []);

  // Export columns
  const exportColumns = [
    { label: 'Transaction ID', key: 'transactionId' },
    { label: 'Date', key: 'transactionDate', render: (v) => v ? formatDate(v) : '' },
    { label: 'GL Code', key: 'glAccountCode' },
    { label: 'GL Account', key: 'glAccountName' },
    { label: 'Debit', key: 'amount', render: (v, row) => isDebitEntry(row) ? fmtMoney(v) : '' },
    { label: 'Credit', key: 'amount', render: (v, row) => !isDebitEntry(row) ? fmtMoney(v) : '' },
    { label: 'Currency', key: 'currency', render: (v) => v?.code || '' },
    { label: 'Office', key: 'officeName' },
    { label: 'Created By', key: 'createdByUserName' },
    { label: 'Notes', key: 'comments' },
  ];

  const isDebitEntry = (e) => {
    const et = e.entryType;
    if (!et) return false;
    if (typeof et === 'string') return et.toLowerCase() === 'debit';
    const val = String(et.value || et.code || '').toLowerCase();
    return val === 'debit';
  };
  const fmtMoney = (v) => v != null ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
  const totalDebit = pageEntries.reduce((s, e) => s + (isDebitEntry(e) ? (e.amount || 0) : 0), 0);
  const totalCredit = pageEntries.reduce((s, e) => s + (!isDebitEntry(e) ? (e.amount || 0) : 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Trial Balance"
        description="Journal entries with debit and credit totals"
        action={
          <div className="flex items-center gap-3">
            <ExportToolbar filename="journal_entries" title="Journal Entries" columns={exportColumns} data={pageEntries} />
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/accounting/operations/journal-entry"><Plus className="w-4 h-4 mr-2" /> New Entry</Link>
            </Button>
          </div>
        }
      />

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <QuickLink to="/accounting/dashboard" icon={BarChart3} label="Accounting Dashboard" />
        <QuickLink to="/accounting/general-ledger" icon={BookOpen} label="General Ledger" />
        <QuickLink to="/accounting/trial-balance" icon={Scale} label="Trial Balance" />
        <QuickLink to="/accounting/gl-accounts" icon={ArrowLeftRight} label="Chart of Accounts" />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <JournalEntryFilters
          filters={filters}
          setFilters={(f) => { setFilters(typeof f === 'function' ? f(filters) : f); setPage(0); }}
          offices={offices}
          glAccounts={glAccounts}
          storageKey="journal_entries_filters"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                <SortableHeader label="Transaction ID" field="transactionId" sortConfig={sortConfig} onSort={setSortConfig} />
                <SortableHeader label="Date" field="transactionDate" sortConfig={sortConfig} onSort={setSortConfig} />
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Code</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Account</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Debit</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Credit</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Currency</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Office</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created By</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {entriesLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-rose-400 text-sm">{error}</td>
                </tr>
              ) : pageEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-500 text-sm">No journal entries found</td>
                </tr>
              ) : (
                pageEntries.map((entry, idx) => (
                  <tr
                    key={entry.id || idx}
                    onClick={() => setSelectedTransaction(entry.transactionId)}
                    className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-emerald-400">{entry.transactionId || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-300 text-xs">{entry.transactionDate ? formatDate(entry.transactionDate) : '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{entry.glAccountCode || entry.glCode || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-200">{entry.glAccountName || entry.accountName || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400">{isDebitEntry(entry) ? fmtMoney(entry.amount) : ''}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-amber-400">{!isDebitEntry(entry) ? fmtMoney(entry.amount) : ''}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{entry.currency?.code || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-300 text-xs">{entry.officeName || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{entry.createdByUserName || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[200px] truncate">{entry.comments || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {!entriesLoading && !error && pageEntries.length > 0 && (
              <tfoot className="bg-slate-800/80 border-t-2 border-slate-600">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Totals</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-400">{fmtMoney(totalDebit)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-amber-400">{fmtMoney(totalCredit)}</td>
                  <td colSpan={4} className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <Pagination page={page} pageSize={PAGE_SIZE} totalRecords={totalRecords} onPageChange={setPage} />
      </div>

      {/* Side panel */}
      {selectedTransaction && <JournalEntryPanel transactionId={selectedTransaction} onClose={() => setSelectedTransaction(null)} onChanged={refetch} />}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800 hover:border-emerald-600/30 transition-colors group">
      <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-emerald-600/10 group-hover:text-emerald-400 text-slate-400 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-slate-300 group-hover:text-white">{label}</span>
    </Link>
  );
}

function formatDate(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return '—';
  const [y, m, d] = arr;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}