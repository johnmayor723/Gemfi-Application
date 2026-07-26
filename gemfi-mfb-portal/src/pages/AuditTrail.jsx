import React, { useState, useEffect, useCallback } from 'react';
import { fineractApi } from '@/lib/fineract';
import { fetchAudits, toFineractDate, parseAuditResponse } from '@/lib/auditApi';
import { RotateCcw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import AuditSummaryCards from '@/components/fineract/audit/AuditSummaryCards';
import AuditTable from '@/components/fineract/audit/AuditTable';
import { useToast } from '@/components/ui/use-toast';

const PAGE_SIZES = [10, 25, 50, 100];
const ENTITY_TYPES = ['CLIENT', 'LOAN', 'SAVINGS_ACCOUNT', 'GROUP', 'OFFICE', 'STAFF', 'USER', 'ROLE', 'CODE', 'GL_ACCOUNT', 'JOURNAL_ENTRY', 'LOAN_PRODUCT', 'SAVINGS_PRODUCT', 'CHARGE', 'FUND'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ACTIVATE', 'CLOSE', 'DISBURSE', 'WITHDRAW', 'UNDO'];

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

export default function AuditTrail() {
  const { toast } = useToast();
  const [audits, setAudits] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [offices, setOffices] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', entityName: '', actionName: '', maker: '', officeId: '', resourceId: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  useEffect(() => {
    fineractApi('/offices').then(r => setOffices(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const params = { offset: page * pageSize, limit: pageSize, ...appliedFilters };
      if (appliedFilters.startDate) params.startDate = toFineractDate(appliedFilters.startDate);
      if (appliedFilters.endDate) params.endDate = toFineractDate(appliedFilters.endDate);
      const res = await fetchAudits(params);
      const { items, total: t } = parseAuditResponse(res);
      setAudits(items);
      setTotal(t);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const applyFilters = () => { setPage(0); setAppliedFilters(filters); };
  const resetFilters = () => {
    setPage(0);
    setFilters({ startDate: '', endDate: '', entityName: '', actionName: '', maker: '', officeId: '', resourceId: '' });
    setAppliedFilters({});
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Audit Trail Management" description="System-wide audit events and change history" />
      <AuditSummaryCards />

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Entity Type</label>
            <select value={filters.entityName} onChange={e => setFilters(p => ({ ...p, entityName: e.target.value }))} className={`${inputCls} w-full`}>
              <option value="">All Entities</option>
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Action</label>
            <select value={filters.actionName} onChange={e => setFilters(p => ({ ...p, actionName: e.target.value }))} className={`${inputCls} w-full`}>
              <option value="">All Actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Username</label>
            <input type="text" value={filters.maker} onChange={e => setFilters(p => ({ ...p, maker: e.target.value }))} placeholder="Search…" className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Branch / Office</label>
            <select value={filters.officeId} onChange={e => setFilters(p => ({ ...p, officeId: e.target.value }))} className={`${inputCls} w-full`}>
              <option value="">All Offices</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Resource ID</label>
            <input type="text" value={filters.resourceId} onChange={e => setFilters(p => ({ ...p, resourceId: e.target.value }))} placeholder="Search…" className={`${inputCls} w-full`} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={applyFilters} className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-1.5 transition-colors">
              <Search className="w-3.5 h-3.5" /> Apply
            </button>
            <button onClick={resetFilters} className="h-9 px-3 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 text-sm flex items-center gap-1.5 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <AuditTable audits={audits} loading={loading} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{total} records</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }} className={`${inputCls} w-auto`}>
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 px-2">Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1 || loading} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}