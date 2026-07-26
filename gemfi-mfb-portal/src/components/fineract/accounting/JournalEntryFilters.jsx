import React, { useState, useEffect } from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

/**
 * Reusable filter bar for journal entries and general ledger.
 * Caches filter selections in localStorage (keyed by storageKey).
 */
export default function JournalEntryFilters({ filters, setFilters, offices, glAccounts, onApply, onReset, showEntryType = true, storageKey = 'journal_filters' }) {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState(filters.transactionId || '');

  // Load cached filters on mount
  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setFilters((prev) => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, [storageKey]);

  // Persist filters on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  // Debounced transaction ID search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.transactionId || '')) {
        setFilters((p) => ({ ...p, transactionId: search.trim() }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const update = (key, value) => setFilters((p) => ({ ...p, [key]: value }));

  const handleReset = () => {
    setSearch('');
    const cleared = {};
    setFilters(cleared);
    localStorage.removeItem(storageKey);
    onReset?.();
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" /> Filters
        </span>
        <div className="flex items-center gap-3">
          {Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '').length > 0 && (
            <span className="text-[10px] text-emerald-400 bg-emerald-600/10 px-2 py-0.5 rounded-full">
              {Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '').length} active
            </span>
          )}
          {expanded ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
          {/* Search row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
            <div className="md:col-span-2 lg:col-span-2">
              <label className="text-[11px] text-slate-400 block mb-1">Search Transaction ID / Reference</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter transaction ID..."
                  className={`${inputCls} w-full pl-8`}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Office</label>
              <select value={filters.officeId || ''} onChange={(e) => update('officeId', e.target.value)} className={`${inputCls} w-full`}>
                <option value="">All Offices</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">GL Account</label>
              <select value={filters.glAccountId || ''} onChange={(e) => update('glAccountId', e.target.value)} className={`${inputCls} w-full`}>
                <option value="">All Accounts</option>
                {glAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.glCode} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Date From</label>
              <input type="date" value={filters.fromDate || ''} onChange={(e) => update('fromDate', e.target.value)} className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Date To</label>
              <input type="date" value={filters.toDate || ''} onChange={(e) => update('toDate', e.target.value)} className={`${inputCls} w-full`} />
            </div>
            {showEntryType && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Entry Type</label>
                <select value={filters.entryType || ''} onChange={(e) => update('entryType', e.target.value)} className={`${inputCls} w-full`}>
                  <option value="">All Types</option>
                  <option value="1">Debit</option>
                  <option value="2">Credit</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Currency</label>
              <input type="text" value={filters.currencyCode || ''} onChange={(e) => update('currencyCode', e.target.value)} placeholder="e.g. NGN" className={`${inputCls} w-full`} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 h-9">
                <input
                  type="checkbox"
                  checked={filters.manualEntriesOnly || false}
                  onChange={(e) => update('manualEntriesOnly', e.target.checked ? true : undefined)}
                  className="rounded"
                />
                Manual Only
              </label>
            </div>
          </div>

          {/* Entity filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Loan ID</label>
              <input type="text" value={filters.loanId || ''} onChange={(e) => update('loanId', e.target.value)} placeholder="Filter by loan" className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Savings ID</label>
              <input type="text" value={filters.savingsAccountId || ''} onChange={(e) => update('savingsAccountId', e.target.value)} placeholder="Filter by savings" className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Client ID</label>
              <input type="text" value={filters.clientId || ''} onChange={(e) => update('clientId', e.target.value)} placeholder="Filter by client" className={`${inputCls} w-full`} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}