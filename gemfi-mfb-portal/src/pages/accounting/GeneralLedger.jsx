import React, { useState, useEffect, useMemo } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Loader2, Search, RotateCcw, Filter, BookOpen } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { useToast } from '@/components/ui/use-toast';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

function getAccountTypeColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('asset')) return 'bg-emerald-600/10 text-emerald-400';
  if (t.includes('liab')) return 'bg-amber-600/10 text-amber-400';
  if (t.includes('equity')) return 'bg-blue-600/10 text-blue-400';
  if (t.includes('income')) return 'bg-purple-600/10 text-purple-400';
  if (t.includes('expense')) return 'bg-rose-600/10 text-rose-400';
  return 'bg-slate-600/10 text-slate-400';
}

export default function GeneralLedger() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', glCode: '', accountType: '' });

  // GL Accounts endpoint is the only data source for this screen
  useEffect(() => {
    fineractApi('/glaccounts')
      .then(r => setAccounts(Array.isArray(r) ? r : []))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      if (filters.name && !a.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.glCode && !a.glCode?.toLowerCase().includes(filters.glCode.toLowerCase())) return false;
      if (filters.accountType) {
        const type = (a.type?.value || '').toUpperCase();
        if (type !== filters.accountType.toUpperCase()) return false;
      }
      return true;
    });
  }, [accounts, filters]);

  const updateFilter = (key, value) => setFilters(p => ({ ...p, [key]: value }));
  const resetFilters = () => setFilters({ name: '', glCode: '', accountType: '' });

  const exportColumns = [
    { label: 'GL Code', key: 'glCode' },
    { label: 'Account Name', key: 'name' },
    { label: 'Account Type', key: 'type', render: (v) => v?.value || '' },
    { label: 'Usage', key: 'usage', render: (v) => v?.value || '' },
    { label: 'Manual Entries', key: 'manualEntriesAllowed', render: (v) => v ? 'Yes' : 'No' },
    { label: 'Description', key: 'description' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="General Ledger"
        description="All General Ledger accounts from the Chart of Accounts"
        action={<ExportToolbar filename="general_ledger" title="General Ledger" columns={exportColumns} data={filtered} />}
      />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Account Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" value={filters.name} onChange={e => updateFilter('name', e.target.value)} placeholder="Search by name…" className={`${inputCls} w-full pl-9`} />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">GL Code</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" value={filters.glCode} onChange={e => updateFilter('glCode', e.target.value)} placeholder="Search by code…" className={`${inputCls} w-full pl-9`} />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Account Type</label>
            <select value={filters.accountType} onChange={e => updateFilter('accountType', e.target.value)} className={`${inputCls} w-full`}>
              <option value="">All Types</option>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">No GL accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Usage</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Manual Entries</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{a.glCode}</td>
                    <td className="px-4 py-2.5 text-slate-200 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      {a.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getAccountTypeColor(a.type?.value)}`}>
                        {a.type?.value || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{a.usage?.value || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{a.manualEntriesAllowed ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{a.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && (
        <div className="text-xs text-slate-500 mt-3 text-right">
          {filtered.length} {filtered.length === 1 ? 'account' : 'accounts'}
        </div>
      )}
    </div>
  );
}