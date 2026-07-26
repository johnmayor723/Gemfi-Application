import React, { useState, useEffect, useMemo } from 'react';
import { fineractApi } from '@/lib/fineract';
import { fetchAllJournalEntries, toISODate } from '@/hooks/useJournalEntries';
import { Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

function fmtMoney(v) { return (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(arr) { if (!Array.isArray(arr) || arr.length < 3) return '—'; return `${String(arr[2]).padStart(2, '0')}/${String(arr[1]).padStart(2, '0')}/${arr[0]}`; }
const isDebit = (e) => e.entryType?.value?.toLowerCase() === 'debit' || e.entryType?.id === 1;

export default function TrialBalance() {
  const { toast } = useToast();
  const [offices, setOffices] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [expandedTxns, setExpandedTxns] = useState({});
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', glAccountId: '', transactionId: '', officeId: '' });

  useEffect(() => {
    fineractApi('/offices').then(setOffices).catch(() => {});
    fineractApi('/glaccounts').then(r => setGlAccounts(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  // Build the Trial Balance directly from journal entries
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await fetchAllJournalEntries({}, (loaded, total) => setProgress({ loaded, total }));
        setAllEntries(all);
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
        setProgress(null);
      }
    };
    load();
  }, []);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(e => {
      const eDate = toISODate(e.transactionDate);
      if (filters.fromDate && eDate < filters.fromDate) return false;
      if (filters.toDate && eDate > filters.toDate) return false;
      if (filters.glAccountId && String(e.glAccountId) !== String(filters.glAccountId)) return false;
      if (filters.transactionId && !String(e.transactionId).includes(String(filters.transactionId).trim())) return false;
      if (filters.officeId && String(e.officeId) !== String(filters.officeId)) return false;
      return true;
    });
  }, [allEntries, filters]);

  // Group records logically by Transaction ID
  const groupedByTxn = useMemo(() => {
    const groups = {};
    filteredEntries.forEach(e => {
      const txnId = e.transactionId || '—';
      if (!groups[txnId]) {
        groups[txnId] = {
          transactionId: txnId,
          date: e.transactionDate,
          officeName: e.officeName || '—',
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      if (isDebit(e)) groups[txnId].totalDebit += e.amount || 0;
      else groups[txnId].totalCredit += e.amount || 0;
      groups[txnId].entries.push(e);
    });
    return Object.values(groups).sort((a, b) => {
      const da = a.date ? a.date.join('') : '';
      const db = b.date ? b.date.join('') : '';
      return db.localeCompare(da);
    });
  }, [filteredEntries]);

  const { totalDebit, totalCredit, isBalanced, difference } = useMemo(() => {
    const td = filteredEntries.reduce((s, e) => s + (isDebit(e) ? (e.amount || 0) : 0), 0);
    const tc = filteredEntries.reduce((s, e) => s + (!isDebit(e) ? (e.amount || 0) : 0), 0);
    return { totalDebit: td, totalCredit: tc, isBalanced: Math.abs(td - tc) < 0.01, difference: td - tc };
  }, [filteredEntries]);

  const updateFilter = (key, value) => setFilters(p => ({ ...p, [key]: value }));
  const toggleTxn = (txnId) => setExpandedTxns(p => ({ ...p, [txnId]: !p[txnId] }));

  const exportColumns = [
    { label: 'Transaction ID', key: 'transactionId' },
    { label: 'Date', key: 'transactionDate', render: (v) => fmtDate(v) },
    { label: 'GL Code', key: 'glAccountCode' },
    { label: 'GL Account', key: 'glAccountName' },
    { label: 'Dr/Cr', key: '_dc', render: (_, row) => isDebit(row) ? 'Dr' : 'Cr' },
    { label: 'Amount', key: 'amount', render: (v) => fmtMoney(v) },
    { label: 'Office', key: 'officeName' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Trial Balance"
        description="Built from journal entries — debit and credit per entry, grouped by transaction"
        action={filteredEntries.length > 0 && <ExportToolbar filename="trial_balance" title="Trial Balance" columns={exportColumns} data={filteredEntries} />}
      />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">From Date</label>
            <input type="date" value={filters.fromDate} onChange={e => updateFilter('fromDate', e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">To Date</label>
            <input type="date" value={filters.toDate} onChange={e => updateFilter('toDate', e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">GL Account</label>
            <select value={filters.glAccountId} onChange={e => updateFilter('glAccountId', e.target.value)} className={`${inputCls} w-full`}>
              <option value="">All Accounts</option>
              {glAccounts.map(a => <option key={a.id} value={a.id}>{a.glCode} — {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Transaction ID</label>
            <input type="text" value={filters.transactionId} onChange={e => updateFilter('transactionId', e.target.value)} placeholder="Enter transaction ID…" className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Office</label>
            <select value={filters.officeId} onChange={e => updateFilter('officeId', e.target.value)} className={`${inputCls} w-full`}>
              <option value="">All Offices</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!loading && filteredEntries.length > 0 && (
        <div className={`rounded-xl p-4 mb-4 flex items-center gap-3 ${isBalanced ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-rose-600/10 border border-rose-600/30'}`}>
          {isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <div className="flex-1">
            <span className="text-sm font-semibold text-white">Total Debit: {fmtMoney(totalDebit)}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="text-sm font-semibold text-white">Total Credit: {fmtMoney(totalCredit)}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className={`text-sm font-medium ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>{isBalanced ? 'Balanced' : `Out of balance by ${fmtMoney(Math.abs(difference))}`}</span>
          </div>
          <span className="text-xs text-slate-500">{groupedByTxn.length} transactions · {filteredEntries.length} entries</span>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-3" />
            {progress && <div className="text-xs text-slate-400">Loading journal entries: {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()}</div>}
          </div>
        ) : groupedByTxn.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">No journal entries found for the selected filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-10"></th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Transaction ID</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Code</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Account</th>
                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-14">Dr/Cr</th>
                  <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Office</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {groupedByTxn.map(group => {
                  const isExpanded = expandedTxns[group.transactionId] || group.entries.length <= 1;
                  const showHeader = group.entries.length > 1;
                  return (
                    <React.Fragment key={group.transactionId}>
                      {showHeader && (
                        <tr onClick={() => toggleTxn(group.transactionId)} className="cursor-pointer bg-slate-800/60 hover:bg-slate-700/40">
                          <td className="px-3 py-2.5">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-emerald-400">#{group.transactionId}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(group.date)}</td>
                          <td colSpan={4} className="px-3 py-2.5 text-xs text-slate-500 italic">{group.entries.length} entries · Dr {fmtMoney(group.totalDebit)} / Cr {fmtMoney(group.totalCredit)}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{group.officeName}</td>
                        </tr>
                      )}
                      {isExpanded && group.entries.map((e, idx) => (
                        <tr key={`${group.transactionId}-${idx}`} className={showHeader ? 'bg-slate-900/30' : ''}>
                          <td className="px-3 py-2.5"></td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{showHeader ? '' : `#${e.transactionId}`}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{showHeader ? '' : fmtDate(e.transactionDate)}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{e.glAccountCode || '—'}</td>
                          <td className="px-3 py-2.5 text-slate-200 text-xs">{e.glAccountName || e.accountName || '—'}</td>
                          <td className="px-3 py-2.5 text-center text-xs font-medium">
                            <span className={isDebit(e) ? 'text-emerald-400' : 'text-amber-400'}>{isDebit(e) ? 'Dr' : 'Cr'}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-200">{fmtMoney(e.amount)}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{showHeader ? '' : (e.officeName || '—')}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-800/80 border-t-2 border-slate-600">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Grand Total</td>
                  <td colSpan={2} className="px-3 py-3 text-right font-mono text-sm font-bold text-slate-300">Dr {fmtMoney(totalDebit)} · Cr {fmtMoney(totalCredit)}</td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}